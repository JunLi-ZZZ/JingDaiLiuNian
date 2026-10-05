/** 镜待流年立绘：图库只保存于当前浏览器，正文用固定 id 标记引用。 */
import { renderPortraits, type Portrait } from './dom';
type PortraitGroup = { id: string; name: string; items: Portrait[] };
const GROUPS_STORAGE = 'jdnl_portrait_groups_v1';
const ACTIVE_GROUP_STORAGE = 'jdnl_portrait_active_group_v1';
const LEGACY_STORAGE = 'jdnl_portrait_library_v1';
const DEFAULT_GROUP = 'default';
const ENABLED = 'jdnl_portrait_enabled_v1';
let uninject: (() => void) | undefined;

function parentDoc(): Document { return window.parent?.document || document; }
function storage(): Storage {
  return window.parent?.localStorage || localStorage;
}
function loadGroups(): PortraitGroup[] {
  try {
    const saved = JSON.parse(storage().getItem(GROUPS_STORAGE) || 'null');
    if (Array.isArray(saved) && saved.every(x => x && x.id && Array.isArray(x.items))) return saved;
    const legacy = JSON.parse(storage().getItem(LEGACY_STORAGE) || '[]');
    return [{ id: DEFAULT_GROUP, name: '默认组', items: Array.isArray(legacy) ? legacy : [] }];
  } catch { return [{ id: DEFAULT_GROUP, name: '默认组', items: [] }]; }
}
function load(): Portrait[] {
  const groups = loadGroups();
  const activeId = storage().getItem(ACTIVE_GROUP_STORAGE) || DEFAULT_GROUP;
  return (groups.find(group => group.id === activeId) || groups[0])?.items || [];
}
function isEnabled() { try { return storage().getItem(ENABLED) !== '0'; } catch { return true; } }
function catalogPrompt() {
  const items = load();
  if (!items.length) return '';
  const lines = items.map(x => `- id=${x.id}；角色=${x.name}；标签=${x.tag}`).join('\n');
  return `\n[镜待流年立绘引用]\n需要展示已登记的角色立绘时，将精确标记单独放在一行，并紧跟在对应正文段落之后：<portrait id="登记项id">（若当前输出链会改写 HTML，也可使用 [[portrait:登记项id]]）。不要把标记塞进句子或角色台词中。只能使用下列已有 id，不要编造图片地址；没有合适的登记项时不输出标记。标记只负责画面呈现，不替代正文叙事，也不要单独生成图片链接。\n可用立绘：\n${lines}`;
}
function refreshPrompt() {
  uninject?.(); uninject = undefined;
  if (!isEnabled()) return;
  const content = catalogPrompt();
  const inject = (window as any).injectPrompts || (window.parent as any)?.injectPrompts;
  if (!content || typeof inject !== 'function') return;
  uninject = inject([{ id: 'jdnl-portrait-catalog', position: 'in_chat', depth: 0, role: 'system', content, should_scan: false }]).uninject;
}
function render() {
  const d = parentDoc();
  renderPortraits(d, load(), isEnabled());
  if (!d.getElementById('jdnl-portrait-style')) {
    const style = d.createElement('style'); style.id = 'jdnl-portrait-style'; style.textContent = `.jdnl-portrait{margin:10px auto;padding:6px;max-width:min(100%,520px);border:1px solid rgba(177,137,72,.45);border-radius:8px;background:linear-gradient(135deg,rgba(255,248,230,.9),rgba(237,222,190,.55));box-shadow:0 5px 16px rgba(80,55,30,.16);text-align:center}.jdnl-portrait img{display:block;width:auto;max-width:100%;max-height:520px;margin:auto;border-radius:5px;object-fit:contain;cursor:zoom-in}.jdnl-portrait-toggle{display:block;width:100%;border:0;background:transparent;color:#765531;font-size:12px;text-align:left;cursor:pointer;padding:2px 3px 6px}.jdnl-portrait figcaption{padding:5px 2px 1px;color:#796c5b;font-size:12px}.jdnl-portrait.is-collapsed img,.jdnl-portrait.is-collapsed figcaption{display:none}.jdnl-portrait-lightbox{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;box-sizing:border-box;background:rgba(20,18,16,.88);cursor:zoom-out}.jdnl-portrait-lightbox img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,.45)}`; d.head.appendChild(style);
  }
}
function boot() {
  refreshPrompt(); render();
  const d = parentDoc();
  const closeLightbox = () => d.querySelectorAll('.jdnl-portrait-lightbox').forEach(node => node.remove());
  const click = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest?.('.jdnl-portrait-toggle') as HTMLButtonElement | null;
    if (button) {
      const collapsed = button.parentElement?.classList.toggle('is-collapsed');
      button.title = collapsed ? '展开立绘' : '折叠立绘'; button.setAttribute('aria-expanded', String(!collapsed)); return;
    }
    if (target.closest?.('.jdnl-portrait-lightbox')) { closeLightbox(); return; }
    const image = target.closest?.('.jdnl-portrait > img') as HTMLImageElement | null;
    if (image) {
      closeLightbox();
      const overlay = d.createElement('div'); overlay.className = 'jdnl-portrait-lightbox'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-label', '立绘大图');
      const enlarged = d.createElement('img'); enlarged.src = image.src; enlarged.alt = image.alt; overlay.append(enlarged); d.body.append(overlay);
    }
  };
  const keydown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
  d.addEventListener('click', click); d.addEventListener('keydown', keydown);
  let frame = 0;
  const observer = new MutationObserver(() => {
    if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; render(); });
  });
  observer.observe(d.body, { childList: true, characterData: true, subtree: true });
  const timer = window.setInterval(() => render(), 1400);
  const cleanup = () => {
    observer.disconnect(); window.clearInterval(timer); window.cancelAnimationFrame(frame); uninject?.();
    d.removeEventListener('click', click); d.removeEventListener('keydown', keydown); closeLightbox();
  };
  $(window).one('pagehide', cleanup);
  const eventApi = (window as any).eventOn || (window.parent as any).eventOn; const ev = (window as any).tavern_events || (window.parent as any).tavern_events;
  if (eventApi && ev?.CHAT_CHANGED) eventApi(ev.CHAT_CHANGED, refreshPrompt);
  window.addEventListener('storage', e => {
    if (e.key === ENABLED || e.key === GROUPS_STORAGE || e.key === ACTIVE_GROUP_STORAGE || e.key === LEGACY_STORAGE) {
      refreshPrompt(); render();
    }
  });
}
$(() => boot());
