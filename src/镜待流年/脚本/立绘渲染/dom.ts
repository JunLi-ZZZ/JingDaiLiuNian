import type { PortraitReference } from '../../界面/shared/portrait-catalog';
import type { PortraitResolution } from './selection';
export type { Portrait } from '../../界面/shared/portrait-catalog';
export type PortraitRenderer = {
  resolve: (root: HTMLElement, reference: PortraitReference, occurrence: number) => PortraitResolution | undefined;
  fail: (selection: PortraitResolution) => void;
  retry: (key: string) => void;
  render: () => void;
};
const TEXT_MARKER = /<portrait\s+id\s*=\s*["']([^"']+)["']\s*\/?>(?:<\/portrait>)?|\[\[(portrait(?:-set)?)\s*:\s*([^\]\s]+)\s*\]\]/gi;
const EXCLUDED = 'script,style,pre,code,textarea,button,.jdnl-portrait,.jdnl-portrait-lightbox,.jdnl-portrait-marker';

function anchor(d: Document, id: string, kind: PortraitReference['kind'] = 'item') {
  const node = d.createElement('span');
  node.className = 'jdnl-portrait-marker'; node.dataset.portraitId = id; node.dataset.portraitKind = kind; node.hidden = true;
  return node;
}

function collectMarkers(d: Document, root: HTMLElement) {
  // Some Tavern markdown themes wrap a standalone marker in inline code.
  root.querySelectorAll<HTMLElement>('code').forEach(node => {
    if (node.closest('pre') || node.children.length) return;
    TEXT_MARKER.lastIndex = 0;
    const match = TEXT_MARKER.exec(node.textContent?.trim() || '');
    if (match && match[0] === node.textContent?.trim()) node.replaceWith(anchor(d, match[1] || match[3], match[2]?.toLowerCase() === 'portrait-set' ? 'set' : 'item'));
  });
  // Unknown HTML tags can contain the rest of the message. Move their children, never reparse them.
  root.querySelectorAll<HTMLElement>('portrait[id]').forEach(node => {
    if (node.closest(EXCLUDED)) return;
    node.replaceWith(anchor(d, node.getAttribute('id') || ''), ...Array.from(node.childNodes));
  });
  const walker = d.createTreeWalker(root, 4, {
    acceptNode: node => node.parentElement?.closest(EXCLUDED) ? 2 : 1,
  });
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const node of texts) {
    TEXT_MARKER.lastIndex = 0;
    const matches = Array.from(node.data.matchAll(TEXT_MARKER));
    if (!matches.length) continue;
    const fragment = d.createDocumentFragment(); let offset = 0;
    for (const match of matches) {
      fragment.append(d.createTextNode(node.data.slice(offset, match.index)), anchor(d, match[1] || match[3], match[2]?.toLowerCase() === 'portrait-set' ? 'set' : 'item'));
      offset = match.index! + match[0].length;
    }
    fragment.append(d.createTextNode(node.data.slice(offset))); node.replaceWith(fragment);
  }
}

export function renderPortraits(d: Document, renderer: PortraitRenderer, enabled: boolean) {
  if (!enabled) {
    d.querySelectorAll<HTMLElement>('.jdnl-portrait').forEach(figure => { figure.hidden = true; });
    return;
  }
  d.querySelectorAll<HTMLElement>('.mes_text, .mes-text, .jdnl-portrait-source').forEach(root => {
    collectMarkers(d, root);
    const occurrences = new Map<string, number>();
    root.querySelectorAll<HTMLElement>('.jdnl-portrait-marker').forEach(marker => {
      const next = marker.nextSibling as HTMLElement | null;
      let figure = next?.nodeType === 1 && next.classList.contains('jdnl-portrait') ? next : null;
      const reference: PortraitReference = { kind: marker.dataset.portraitKind === 'set' ? 'set' : 'item', id: marker.dataset.portraitId || '' };
      const occurrenceKey = JSON.stringify([reference.kind, reference.id]);
      const occurrence = occurrences.get(occurrenceKey) || 0;
      occurrences.set(occurrenceKey, occurrence + 1);
      const selection = renderer.resolve(root, reference, occurrence);
      if (!selection) { figure?.remove(); return; }
      const item = selection.item;
      if (!figure) {
        figure = d.createElement('figure'); figure.className = 'jdnl-portrait';
        const toggle = d.createElement('button'); toggle.type = 'button'; toggle.className = 'jdnl-portrait-toggle';
        const image = d.createElement('img'); image.loading = 'lazy';
        figure.append(toggle, image); marker.after(figure);
      }
      // 酒馆热更新后，父页面可能仍留有旧版的立绘节点。
      if (!figure.querySelector('.jdnl-portrait-status')) {
        const status = d.createElement('div'); status.className = 'jdnl-portrait-status'; status.setAttribute('role', 'status');
        const text = d.createElement('span'); text.textContent = '此类图片暂时无法加载';
        const retry = d.createElement('button'); retry.type = 'button'; retry.className = 'jdnl-portrait-retry'; retry.textContent = '重试加载';
        status.append(text, retry);
        figure.append(status);
      }
      if (figure.hidden === enabled) figure.hidden = !enabled;
      figure.dataset.portraitId = item?.id || '';
      figure.dataset.selectionKey = selection.key;
      const toggle = figure.querySelector<HTMLButtonElement>('button')!;
      const label = `${selection.label}⌃`;
      if (toggle.textContent !== label) toggle.textContent = label;
      toggle.title = figure.classList.contains('is-collapsed') ? '展开立绘' : '折叠立绘';
      toggle.setAttribute('aria-expanded', String(!figure.classList.contains('is-collapsed')));
      let image = figure.querySelector<HTMLImageElement>('img')!;
      // 每次换资源使用新 img，旧请求迟到的 error 不会淘汰新候选。
      if (item && (image.getAttribute('src') !== item.url || image.dataset.selectionKey !== selection.key)) {
        const replacement = d.createElement('img'); replacement.loading = 'lazy';
        image.replaceWith(replacement); image = replacement;
      }
      image.dataset.selectionKey = selection.key;
      image.hidden = !item;
      figure.querySelector<HTMLElement>('.jdnl-portrait-status')!.hidden = !selection.exhausted;
      figure.querySelector<HTMLButtonElement>('.jdnl-portrait-retry')!.onclick = () => {
        renderer.retry(selection.key);
        image.removeAttribute('src');
        renderer.render();
      };
      image.onerror = () => {
        if (!image.isConnected || figure?.querySelector('img') !== image) return;
        const current = renderer.resolve(root, reference, occurrence);
        if (current?.key !== selection.key || current.item?.id !== item?.id || current.item?.url !== item?.url) return;
        renderer.fail(selection); renderer.render();
      };
      if (item) {
        if (image.getAttribute('src') !== item.url) image.setAttribute('src', item.url);
        image.alt = item.caption || `${item.name} ${item.tag}`;
      } else if (image.hasAttribute('src')) image.removeAttribute('src');
      let caption = figure.querySelector('figcaption');
      if (!item?.caption) caption?.remove();
      else {
        if (!caption) { caption = d.createElement('figcaption'); figure.append(caption); }
        if (caption.textContent !== item.caption) caption.textContent = item.caption;
      }
    });
  });
}
