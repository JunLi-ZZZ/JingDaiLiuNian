import type { PortraitIndex } from '../../界面/shared/portrait-catalog';
import type { PortraitRenderer } from './dom';
import { messagePortraitLedger, PortraitPicker, syncPortraitLedger, type PortraitMessage } from './selection';

export type PortraitChatContext = {
  chat: PortraitMessage[];
  chatId?: string;
  characterId?: string;
  groupId?: string;
  streamingProcessor?: unknown;
  getCurrentChatId?: () => string;
  saveChat: () => Promise<void>;
};

/** 保存的是消息 extra 的选图 ID，不保存正文、目录或图片数据。 */
export function createPortraitRenderer(
  context: () => PortraitChatContext | undefined,
  index: () => PortraitIndex,
  group: () => string,
  render: () => void,
): { renderer: PortraitRenderer; flush: () => void; clear: () => void; dispose: () => void } {
  const picker = new PortraitPicker();
  const roots = new WeakMap<HTMLElement, string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: PortraitChatContext | undefined;
  let saving = false;
  let disposed = false;
  const scope = (ctx: PortraitChatContext) => JSON.stringify([ctx.groupId, ctx.characterId, ctx.getCurrentChatId?.() || ctx.chatId]);
  let pendingScope = '';

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = undefined; }
    if (!pending || disposed) return;
    const current = context();
    if (!current || scope(current) !== pendingScope || current.chat !== pending.chat) { pending = undefined; return; }
    // 酒馆保存流式回复时也会写 extra；完整回复后再补一次保存。
    if (saving || current.streamingProcessor) { timer = setTimeout(flush, 800); return; }
    pending = undefined; saving = true;
    void current.saveChat().catch(error => {
      console.error('立绘选图记录保存失败', error);
      if (context()?.chat === current.chat) { pending = current; pendingScope = scope(current); }
    }).finally(() => {
      saving = false;
      if (pending && !disposed) timer = setTimeout(flush, 1400);
    });
  };
  const dirty = (ctx: PortraitChatContext) => {
    pending = ctx; pendingScope = scope(ctx);
    if (!timer) timer = setTimeout(flush, 350);
  };
  const renderer: PortraitRenderer = {
    resolve(root, reference, occurrence) {
      const ctx = context();
      const library = index();
      if (reference.kind === 'item') {
        if (!roots.has(root)) roots.set(root, crypto.randomUUID());
        return picker.resolve(library, { version: 1, id: roots.get(root)!, slot: 0, choices: {} }, ctx ? scope(ctx) : '', group(), reference, occurrence, () => {});
      }
      const messageNode = root.closest<HTMLElement>('.mes[mesid]');
      const id = messageNode?.getAttribute('mesid');
      if (!ctx || !id || !/^\d+$/.test(id)) return undefined;
      const message = ctx.chat[Number(id)];
      if (!message) return undefined;
      const displayedSwipe = messageNode?.getAttribute('swipeid');
      if (displayedSwipe !== null && displayedSwipe !== undefined && Number(displayedSwipe) !== (message.swipe_id ?? 0)) return undefined;
      if (!library.sets.has(reference.id)) return undefined;
      const { state, changed } = messagePortraitLedger(message);
      if (changed) dirty(ctx);
      return picker.resolve(library, state, scope(ctx), group(), reference, occurrence, () => {
        syncPortraitLedger(message, state); dirty(ctx);
      });
    },
    fail: selection => picker.fail(selection),
    retry: key => picker.retry(key),
    render,
  };
  return {
    renderer, flush,
    clear() { picker.clear(); },
    dispose() { flush(); disposed = true; if (timer) clearTimeout(timer); pending = undefined; },
  };
}
