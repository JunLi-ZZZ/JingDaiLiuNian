import { createApp, h, reactive, type App } from 'vue';
import LenticularCard from '../../界面/shared/LenticularCard.vue';
import {
  findLenticularEntry,
  LENTICULAR_CATALOG,
  type LenticularCategory,
  type LenticularEntry,
} from '../../界面/shared/lenticular-catalog';

const shellTypes = [
  { category: 'item', card: '.it-card', data: '.it-data', inner: '.it-inner', body: '.it-bd', name: 0, grade: 1 },
  { category: 'bio', card: '.bio-card', data: '.bio-data', inner: '.bio-inner', body: '.bio-bd', name: 0, grade: 3 },
  {
    category: 'skill',
    card: '.skill-card',
    data: '.skill-data',
    inner: '.skill-inner',
    body: '.skill-bd',
    name: 1,
    grade: 3,
  },
] as const;
// 酒馆在消息 HTML 中为角色卡样式名添加 custom-，独立界面保留原名。
const dossierSelector = (selector: string) => `:is(${selector}, .custom-${selector.slice(1)})`;
const shells = shellTypes.map(shell => ({
  ...shell,
  card: dossierSelector(shell.card),
  data: dossierSelector(shell.data),
  inner: dossierSelector(shell.inner),
  body: dossierSelector(shell.body),
}));
const MESSAGE_ROOT = '.mes_text, .mes-text';
const MOUNT = '.jdnl-lenticular-mount';
type Mount = { host: HTMLElement; app: App; props: { entry: LenticularEntry; grade: string }; body: Element };

/** 只增补命中登记表的资料卡；不改原消息文本、不替换原 DOM、不注入模型提示。 */
export function createLenticularRenderer(doc: Document, catalog = LENTICULAR_CATALOG) {
  const mounts = new Map<Element, Mount>();
  const win = doc.defaultView ?? window;
  let frame = 0,
    disposed = false;
  function remove(card: Element) {
    const mounted = mounts.get(card);
    if (!mounted) return;
    mounted.app.unmount();
    mounted.host.remove();
    mounts.delete(card);
  }
  function refresh() {
    if (disposed) return;
    const seen = new Set<Element>();
    for (const root of doc.querySelectorAll(MESSAGE_ROOT))
      for (const shell of shells) {
        for (const card of root.querySelectorAll(shell.card)) {
          const data = card
            .querySelector(`:scope > ${shell.data}`)
            ?.textContent?.split('|||')
            .map(part => part.trim());
          const entry =
            data && findLenticularEntry(shell.category as LenticularCategory, data[shell.name] || '', catalog);
          const inner = card.querySelector(`:scope > ${shell.inner}`);
          const body = inner?.querySelector(`:scope > ${shell.body}`);
          if (!entry || !inner || !body) continue;
          seen.add(card);
          let mounted = mounts.get(card);
          if (
            mounted &&
            (!mounted.host.isConnected ||
              mounted.host.parentElement !== inner ||
              mounted.body !== body ||
              mounted.props.entry.id !== entry.id)
          ) {
            remove(card);
            mounted = undefined;
          }
          const grade = data?.[shell.grade] || '';
          if (mounted) {
            if (mounted.props.grade !== grade) mounted.props.grade = grade;
            continue;
          }
          // 热重载遗留挂载由旧实例清理；此处也清理没有所有者的占位。
          inner.querySelectorAll(`:scope > ${MOUNT}`).forEach(node => node.remove());
          const host = doc.createElement('div');
          host.className = MOUNT.slice(1);
          host.dataset.lenticularId = entry.id;
          host.style.cssText = 'box-sizing:border-box;width:100%;padding:2px 6px 0;';
          inner.insertBefore(host, body);
          const props = reactive({ entry, grade });
          const app = createApp({ render: () => h(LenticularCard, { ...props, autoStart: false }) });
          try {
            app.mount(host);
            mounts.set(card, { host, app, props, body });
          } catch (error) {
            host.remove();
            console.warn('[镜待流年] 光栅卡挂载失败', error);
          }
        }
      }
    for (const card of mounts.keys()) if (!seen.has(card)) remove(card);
  }
  function schedule() {
    if (!disposed && !frame)
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        refresh();
      });
  }
  const observer = new MutationObserver(records => {
    const relevant = records.some(record => {
      const target = record.target.nodeType === 1 ? (record.target as Element) : record.target.parentElement;
      if (target?.closest(MOUNT)) return false;
      if (target?.closest(MESSAGE_ROOT)) return true;
      return [...record.addedNodes, ...record.removedNodes].some(
        node =>
          node.nodeType === 1 &&
          ((node as Element).matches(MESSAGE_ROOT) || (node as Element).querySelector(MESSAGE_ROOT)),
      );
    });
    if (relevant) schedule();
  });
  observer.observe(doc.body, { childList: true, characterData: true, subtree: true });
  refresh();
  return {
    refresh,
    schedule,
    dispose() {
      disposed = true;
      observer.disconnect();
      win.cancelAnimationFrame(frame);
      for (const card of mounts.keys()) remove(card);
    },
  };
}
