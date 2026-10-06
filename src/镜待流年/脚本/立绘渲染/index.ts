/** 镜待流年立绘：本地图库分类投影，具体选图随消息回复保存。 */
import { renderPortraits } from './dom';
import { buildPortraitIndex, emptyPortraitIndex, portraitCatalogPrompt } from '../../界面/shared/portrait-catalog';
import { createPortraitRenderer, type PortraitChatContext } from './runtime';
import { loadPortraitGroups, portraitSettings, PORTRAIT_ACTIVE_GROUP, PORTRAIT_ENABLED, PORTRAIT_REVISION } from '../../界面/shared/portrait-storage';
let uninject: (() => void) | undefined;
let index = emptyPortraitIndex();
let selectedGroup = '';
let lastRevision: string | null = null;
let lastGroup: string | null = null;
let lastEnabled: boolean | null = null;
let refreshing = false;
let refreshAgain = false;
function chatContext(): PortraitChatContext | undefined {
  const tavern = (window as any).SillyTavern || (window.parent as any)?.SillyTavern;
  return tavern?.getContext?.();
}
const selection = createPortraitRenderer(chatContext, () => index, () => selectedGroup, render);

function parentDoc(): Document { try { return window.parent?.document || document; } catch { return document; } }
function isEnabled() { try { return portraitSettings().getItem(PORTRAIT_ENABLED) !== '0'; } catch { return true; } }
function refreshPrompt() {
  uninject?.(); uninject = undefined;
  if (!isEnabled()) return;
  const content = portraitCatalogPrompt(index);
  const inject = (window as any).injectPrompts || (window.parent as any)?.injectPrompts;
  if (!content || typeof inject !== 'function') return;
  uninject = inject([{ id: 'jdnl-portrait-catalog', position: 'in_chat', depth: 0, role: 'system', content, should_scan: false }]).uninject;
}
function render() {
  const d = parentDoc();
  renderPortraits(d, selection.renderer, isEnabled());
  let style = d.getElementById('jdnl-portrait-style');
  if (!style) { style = d.createElement('style'); style.id = 'jdnl-portrait-style'; d.head.appendChild(style); }
  const css = `.jdnl-portrait{margin:10px auto;padding:6px;max-width:min(100%,520px);border:1px solid rgba(177,137,72,.45);border-radius:8px;background:linear-gradient(135deg,rgba(255,248,230,.9),rgba(237,222,190,.55));box-shadow:0 5px 16px rgba(80,55,30,.16);text-align:center}.jdnl-portrait img{display:block;width:auto;max-width:100%;max-height:520px;margin:auto;border-radius:5px;object-fit:contain;cursor:zoom-in}.jdnl-portrait-toggle{display:block;width:100%;border:0;background:transparent;color:#765531;font-size:12px;text-align:left;cursor:pointer;padding:2px 3px 6px}.jdnl-portrait figcaption{padding:5px 2px 1px;color:#796c5b;font-size:12px}.jdnl-portrait [hidden]{display:none!important}.jdnl-portrait-status{padding:10px;color:#796c5b;font-size:12px}.jdnl-portrait-retry{margin-left:8px;border:1px solid #b18948;border-radius:4px;background:transparent;color:#765531;cursor:pointer}.jdnl-portrait.is-collapsed img,.jdnl-portrait.is-collapsed figcaption,.jdnl-portrait.is-collapsed .jdnl-portrait-status{display:none}.jdnl-portrait-lightbox{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;box-sizing:border-box;background:rgba(20,18,16,.88);cursor:zoom-out}.jdnl-portrait-lightbox img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,.45)}`;
  if (style.textContent !== css) style.textContent = css;
}
async function refreshLibrary(force = false) {
  if (refreshing) { refreshAgain ||= force; return; }
  const settings = portraitSettings();
  const revision = settings.getItem(PORTRAIT_REVISION);
  const group = settings.getItem(PORTRAIT_ACTIVE_GROUP);
  const enabled = isEnabled();
  if (!force && revision === lastRevision && group === lastGroup && enabled === lastEnabled) return;
  refreshing = true;
  try {
    const groups = await loadPortraitGroups();
    const active = groups.find(x => x.id === (group || 'default')) || groups[0];
    const next = await buildPortraitIndex(active?.items || []);
    index = next; selectedGroup = active?.id || '';
    lastRevision = revision;
    lastGroup = group; lastEnabled = enabled;
    refreshPrompt(); render();
  } catch (error) { console.error('立绘图库读取失败', error); }
  finally {
    refreshing = false;
    if (refreshAgain) { refreshAgain = false; void refreshLibrary(true); }
  }
}
function boot() {
  void refreshLibrary(true);
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
  const timer = window.setInterval(() => { void refreshLibrary(); render(); }, 1400);
  const cleanup = () => {
    observer.disconnect(); window.clearInterval(timer); window.cancelAnimationFrame(frame); uninject?.();
    selection.dispose();
    d.removeEventListener('click', click); d.removeEventListener('keydown', keydown); closeLightbox();
  };
  $(window).one('pagehide', cleanup);
  const eventApi = (window as any).eventOn || (window.parent as any).eventOn; const ev = (window as any).tavern_events || (window.parent as any).tavern_events;
  if (eventApi && ev?.CHAT_CHANGED) eventApi(ev.CHAT_CHANGED, () => { selection.clear(); void refreshLibrary(true); });
  if (eventApi && ev?.GENERATION_ENDED) eventApi(ev.GENERATION_ENDED, () => { render(); selection.flush(); });
  window.addEventListener('storage', e => {
    if (e.key === PORTRAIT_ENABLED || e.key === PORTRAIT_REVISION || e.key === PORTRAIT_ACTIVE_GROUP) {
      void refreshLibrary();
    }
  });
}
$(() => boot());
