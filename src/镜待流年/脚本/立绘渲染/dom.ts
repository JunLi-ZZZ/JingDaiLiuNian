export type Portrait = { id: string; name: string; tag: string; url: string; caption?: string };
const TEXT_MARKER = /<portrait\s+id\s*=\s*["']([^"']+)["']\s*\/?>(?:<\/portrait>)?|\[\[portrait\s*:\s*([^\]\s]+)\s*\]\]/gi;
const EXCLUDED = 'script,style,pre,code,textarea,button,.jdnl-portrait,.jdnl-portrait-lightbox,.jdnl-portrait-marker';

function anchor(d: Document, id: string) {
  const node = d.createElement('span');
  node.className = 'jdnl-portrait-marker'; node.dataset.portraitId = id; node.hidden = true;
  return node;
}

function collectMarkers(d: Document, root: HTMLElement) {
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
      fragment.append(d.createTextNode(node.data.slice(offset, match.index)), anchor(d, match[1] || match[2]));
      offset = match.index! + match[0].length;
    }
    fragment.append(d.createTextNode(node.data.slice(offset))); node.replaceWith(fragment);
  }
}

function validUrl(value: string): boolean {
  if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}

export function renderPortraits(d: Document, items: Portrait[], enabled: boolean) {
  const catalog = new Map(items.filter(item => validUrl(item.url)).map(item => [item.id, item]));
  d.querySelectorAll<HTMLElement>('.mes_text, .jdnl-portrait-source').forEach(root => {
    collectMarkers(d, root);
    root.querySelectorAll<HTMLElement>('.jdnl-portrait-marker').forEach(marker => {
      const next = marker.nextSibling as HTMLElement | null;
      let figure = next?.nodeType === 1 && next.classList.contains('jdnl-portrait') ? next : null;
      const item = catalog.get(marker.dataset.portraitId || '');
      if (!item) { figure?.remove(); return; }
      if (!figure) {
        if (!enabled) return;
        figure = d.createElement('figure'); figure.className = 'jdnl-portrait';
        const toggle = d.createElement('button'); toggle.type = 'button'; toggle.className = 'jdnl-portrait-toggle';
        const image = d.createElement('img'); image.loading = 'lazy';
        figure.append(toggle, image); marker.after(figure);
      }
      if (figure.hidden === enabled) figure.hidden = !enabled;
      figure.dataset.portraitId = item.id;
      const toggle = figure.querySelector<HTMLButtonElement>('button')!;
      const label = `${item.name} · ${item.tag}⌃`;
      if (toggle.textContent !== label) toggle.textContent = label;
      toggle.title = figure.classList.contains('is-collapsed') ? '展开立绘' : '折叠立绘';
      toggle.setAttribute('aria-expanded', String(!figure.classList.contains('is-collapsed')));
      const image = figure.querySelector<HTMLImageElement>('img')!;
      if (image.getAttribute('src') !== item.url) image.setAttribute('src', item.url);
      image.alt = item.caption || `${item.name} ${item.tag}`;
      let caption = figure.querySelector('figcaption');
      if (!item.caption) caption?.remove();
      else {
        if (!caption) { caption = d.createElement('figcaption'); figure.append(caption); }
        if (caption.textContent !== item.caption) caption.textContent = item.caption;
      }
    });
  });
}
