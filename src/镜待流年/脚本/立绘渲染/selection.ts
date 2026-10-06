import type { Portrait, PortraitIndex, PortraitReference } from '../../界面/shared/portrait-catalog';

export const PORTRAIT_MESSAGE_STATE = 'jdnl_portraits_v1';
export type PortraitLedger = { version: 1; id: string; slot: number; choices: Record<string, string> };
export type PortraitMessage = {
  mes: string;
  extra?: Record<string, unknown>;
  swipe_id?: number;
  swipe_info?: { extra?: Record<string, unknown> }[];
};
export type PortraitResolution = {
  key: string;
  reference: PortraitReference;
  label: string;
  item?: Portrait;
  exhausted: boolean;
};

function ledger(value: unknown): PortraitLedger | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const state = value as PortraitLedger;
  return state.version === 1 && typeof state.id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(state.id)
    && Number.isInteger(state.slot) && state.slot >= 0
    && state.choices && typeof state.choices === 'object' && !Array.isArray(state.choices)
    && Object.values(state.choices).every(id => typeof id === 'string') ? state : undefined;
}

function newLedger(slot: number): PortraitLedger {
  return { version: 1, id: crypto.randomUUID(), slot, choices: {} };
}

/** extra 随消息移动，swipe_info.extra 随回复页移动；不以可变楼层号作为缓存身份。 */
export function messagePortraitLedger(message: PortraitMessage): { state: PortraitLedger; changed: boolean } {
  const slot = Number.isInteger(message.swipe_id) && message.swipe_id! >= 0 ? message.swipe_id! : 0;
  let changed = false;
  const slots = message.swipe_info || [];
  const duplicates = new Map<string, { index: number; state: PortraitLedger }[]>();
  slots.forEach((info, index) => {
    const state = ledger(info?.extra?.[PORTRAIT_MESSAGE_STATE]);
    if (!state) return;
    if (!duplicates.has(state.id)) duplicates.set(state.id, []);
    duplicates.get(state.id)!.push({ index, state });
  });
  // 酒馆可复制旧 extra 创建新 swipe；原页保留选择，新页获得独立身份。
  for (const copies of duplicates.values()) {
    if (copies.length < 2) continue;
    const original = copies.find(copy => copy.index === copy.state.slot) || copies[0];
    for (const copy of copies) {
      if (copy === original) continue;
      slots[copy.index].extra![PORTRAIT_MESSAGE_STATE] = newLedger(copy.index);
      changed = true;
    }
  }
  let state = ledger(slots[slot]?.extra?.[PORTRAIT_MESSAGE_STATE]) || ledger(message.extra?.[PORTRAIT_MESSAGE_STATE]);
  // 新页的 swipe_info 还未建好时，active extra 也可能是旧页副本。
  if (state && slots.some((info, index) => index !== slot && ledger(info?.extra?.[PORTRAIT_MESSAGE_STATE])?.id === state!.id)) state = undefined;
  if (!state) { state = newLedger(slot); changed = true; }
  if (state.slot !== slot) { state.slot = slot; changed = true; }
  message.extra ||= {};
  if (ledger(message.extra[PORTRAIT_MESSAGE_STATE])?.id !== state.id) changed = true;
  syncPortraitLedger(message, state);
  return { state, changed };
}

export function syncPortraitLedger(message: PortraitMessage, state: PortraitLedger): void {
  message.extra ||= {};
  message.extra[PORTRAIT_MESSAGE_STATE] = state;
  const info = message.swipe_info?.[message.swipe_id ?? 0];
  if (info) { info.extra ||= {}; info.extra[PORTRAIT_MESSAGE_STATE] = state; }
}

function randomIndex(length: number): number {
  const bytes = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / length) * length;
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
  return bytes[0] % length;
}

export class PortraitPicker {
  private failures = new Map<string, Map<string, string>>();
  constructor(private choose: (length: number) => number = randomIndex) {}

  resolve(index: PortraitIndex, state: PortraitLedger, scope: string, group: string, reference: PortraitReference, occurrence: number, changed: () => void): PortraitResolution | undefined {
    const set = reference.kind === 'set' ? index.sets.get(reference.id) : undefined;
    const exact = reference.kind === 'item' ? index.items.get(reference.id) : undefined;
    if (!set && !exact) return undefined;
    const cacheKey = JSON.stringify([group, reference.kind, reference.id, occurrence]);
    const key = JSON.stringify([scope, state.id, cacheKey]);
    const candidates = set?.items || [exact!];
    const failed = this.failures.get(key);
    const available = candidates.filter(item => failed?.get(item.id) !== item.url);
    const saved = reference.kind === 'set' ? state.choices[cacheKey] : reference.id;
    let item = available.find(candidate => candidate.id === saved);
    if (!item && available.length) item = available[this.choose(available.length)];
    if (item && reference.kind === 'set' && item.id !== saved) {
      state.choices[cacheKey] = item.id;
      changed();
    }
    return { key, reference, label: `${set?.name || exact!.name} · ${set?.tag || exact!.tag}`, item, exhausted: !available.length };
  }

  fail(selection: PortraitResolution): void {
    if (!selection.item) return;
    if (!this.failures.has(selection.key)) this.failures.set(selection.key, new Map());
    this.failures.get(selection.key)!.set(selection.item.id, selection.item.url);
  }

  retry(key: string): void { this.failures.delete(key); }
  clear(): void { this.failures.clear(); }
}
