import { WORKSHOP_URL, parsePortraitGroup, type PortraitGroup } from './portrait-workshop';
import { CATEGORY_ORDER, LORE_CATEGORIES, parseLoreCategory, parseLoreSettings, type LoreCategory, type LoreSettings } from './lore-settings';

export type CharacterLore = { id: string; name: string; keywords: string[]; content: string; settings: LoreSettings };
export type CharacterPackage = {
  format: 'jdnl-character-package'; version: 1;
  character: { name: string; description: string; category: LoreCategory; entries: CharacterLore[]; portrait_group_id: string | null };
};
export type CharacterListing = {
  id: string; family_id: string; name: string; description: string; author_name: string;
  status: string; category?: LoreCategory; entry_count: number; portrait_group_id: string | null; download_count: number;
  published_at: string | null; content_hash?: string;
};
export type CharacterDetail = { package: CharacterListing; content: CharacterPackage; portrait: { id: string; name: string } | null };
export const CHARACTER_META = 'jdnl_character_workshop_v1';

export function parseCharacterPackage(value: unknown): CharacterPackage {
  const invalid = (): never => { throw new Error('角色包格式无效，需要 jdnl-character-package v1'); };
  if (!value || typeof value !== 'object') return invalid();
  const wrapper = value as Record<string, unknown>;
  if (wrapper.format !== 'jdnl-character-package' || wrapper.version !== 1 || !wrapper.character || typeof wrapper.character !== 'object') return invalid();
  const c = wrapper.character as Record<string, unknown>;
  const field = (value: unknown, max: number, required = true): string => {
    if (!required && value === undefined) return '';
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) return invalid();
    if (/<%|%>|<\s*\/?\s*(?:script|iframe|object|embed)\b|\{\{(?!\s*(?:user|char)\s*\}\})|@@(?:preprocessing|generate)/i.test(value)) throw new Error('角色包仅接受设定文本，不接受脚本、EJS 或可执行宏');
    return value.trim();
  };
  const name = field(c.name, 80), description = field(c.description, 1000, false);
  const category = parseLoreCategory(c.category);
  if (!Array.isArray(c.entries) || !c.entries.length || c.entries.length > 32) return invalid();
  const ids = new Set<string>();
  const entries = c.entries.map((entry: unknown): CharacterLore => {
    if (!entry || typeof entry !== 'object') return invalid();
    const e = entry as Record<string, unknown>, id = field(e.id, 80);
    if (!/^[\p{L}\p{N}_-]+$/u.test(id) || ids.has(id)) return invalid();
    ids.add(id);
    if (e.keywords !== undefined && (!Array.isArray(e.keywords) || e.keywords.length > 20)) return invalid();
    const keywords = (e.keywords as unknown[] | undefined)?.map(key => field(key, 80)) || [];
    return { id, name: field(e.name, 100), keywords: [...new Set(keywords.length ? keywords : [name])], content: field(e.content, 30000), settings: parseLoreSettings(e.settings) };
  });
  const portraitId = c.portrait_group_id || null;
  if (portraitId !== null && (typeof portraitId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(portraitId))) return invalid();
  const result: CharacterPackage = { format: 'jdnl-character-package', version: 1, character: { name, description, category, entries, portrait_group_id: portraitId as string | null } };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > 262144) throw new Error('角色包超过 256 KiB');
  return result;
}

const requests = new Map<string, { expires: number; data: unknown }>();
export async function characterRequest(path: string, refresh = false): Promise<unknown> {
  const cached = requests.get(path);
  if (!refresh && cached && cached.expires > Date.now()) return cached.data;
  const response = await fetch(WORKSHOP_URL + path, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok) throw new Error(response.status === 404 ? '该角色包已撤回、不存在，或云端尚未升级角色工坊' : `角色工坊暂时不可用（${response.status}）`);
  const data: unknown = await response.json();
  if (!path.includes('intent=download')) {
    if (requests.size >= 40) requests.delete(requests.keys().next().value!);
    requests.set(path, { data, expires: Date.now() + 120000 });
  }
  return data;
}

export async function characterHash(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}

function entrySignature(entry: WorldbookEntry, legacy = false) {
  const basic = { name: entry.name, content: entry.content, strategy: entry.strategy };
  return legacy ? basic : { ...basic, position: entry.position, probability: entry.probability, recursion: entry.recursion, effect: entry.effect };
}

export async function planCharacterImport(worldbook: WorldbookEntry[], payload: CharacterPackage, source: Pick<CharacterListing, 'id' | 'family_id' | 'author_name'>, overwriteModified = false) {
  const owned = worldbook.filter(entry => entry.extra?.[CHARACTER_META]?.familyId === source.family_id);
  const modified: string[] = [];
  for (const entry of owned) if (await characterHash(entrySignature(entry, entry.extra?.[CHARACTER_META]?.signatureVersion !== 2)) !== entry.extra?.[CHARACTER_META]?.hash) modified.push(entry.name);
  if (modified.length && !overwriteModified) throw new Error(`这些条目已有本地修改：${modified.join('、')}。勾选覆盖本地改动后才能更新`);
  let uid = Math.max(0, ...worldbook.map(entry => entry.uid)) + 1;
  const next: WorldbookEntry[] = [];
  const occupied = new Set(worldbook.filter(entry => !owned.includes(entry)).map(entry => `${entry.position?.type}:${entry.position?.order}`));
  for (const lore of payload.character.entries) if (lore.settings.order !== 'auto') occupied.add(`${lore.settings.position}:${lore.settings.order}`);
  const anchors = worldbook.filter(entry => entry.extra?.[CHARACTER_META]?.kind === 'category-anchor');
  const addedAnchors: WorldbookEntry[] = [];
  for (const lore of payload.character.entries) {
    const previous = owned.find(entry => entry.extra?.[CHARACTER_META]?.entryId === lore.id);
    const settings = parseLoreSettings(lore.settings), category = settings.category === 'auto' ? payload.character.category : settings.category;
    const base = CATEGORY_ORDER[category];
    let order = settings.order;
    if (order === 'auto') {
      const old = previous?.extra?.[CHARACTER_META];
      const oldOrder = previous?.position.order;
      order = old?.category === category && old.orderMode === 'auto' && previous?.position.type === settings.position && oldOrder !== undefined ? oldOrder : base + 1;
      while (occupied.has(`${settings.position}:${order}`)) order++;
      if (order >= base + 1000) throw new Error('此分类的自动顺序区间已满，请手动指定顺序');
    }
    occupied.add(`${settings.position}:${order}`);
    if (!anchors.some(entry => entry.extra?.[CHARACTER_META]?.category === category) && !addedAnchors.some(entry => entry.extra?.[CHARACTER_META]?.category === category)) {
      addedAnchors.push({ uid: uid++, name: `【云端工坊·${LORE_CATEGORIES[category]}】`, enabled: false,
        strategy: { type: 'constant', keys: [], keys_secondary: { logic: 'and_any', keys: [] }, scan_depth: 'same_as_global' },
        position: { type: 'before_character_definition', role: 'system', depth: 0, order: base }, content: '', probability: 100,
        recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null }, effect: { sticky: null, cooldown: null, delay: null },
        extra: { [CHARACTER_META]: { kind: 'category-anchor', category } } });
    }
    const entry: WorldbookEntry = {
      uid: previous?.uid ?? uid++, name: `[云端${LORE_CATEGORIES[category]}] ${payload.character.name} · ${lore.name}`, enabled: previous?.enabled ?? true,
      strategy: { type: settings.activation, keys: lore.keywords, keys_secondary: { logic: settings.secondary_logic, keys: settings.secondary_keys }, scan_depth: settings.scan_depth },
      position: { type: settings.position, role: settings.role, depth: settings.depth, order },
      content: lore.content, probability: settings.probability,
      recursion: { prevent_incoming: settings.prevent_incoming, prevent_outgoing: settings.prevent_outgoing, delay_until: settings.delay_until },
      effect: { sticky: settings.sticky, cooldown: settings.cooldown, delay: settings.delay },
      extra: { ...previous?.extra, [CHARACTER_META]: { familyId: source.family_id, packageId: source.id, entryId: lore.id, author: source.author_name, category, orderMode: settings.order, signatureVersion: 2, hash: '' } },
    };
    entry.extra![CHARACTER_META].hash = await characterHash(entrySignature(entry));
    next.push(entry);
  }
  const kept = worldbook.filter(entry => !owned.includes(entry));
  const unrelated = kept.filter(entry => !entry.extra?.[CHARACTER_META]);
  const managed = [...kept.filter(entry => entry.extra?.[CHARACTER_META]), ...addedAnchors, ...next].sort((a, b) =>
    (CATEGORY_ORDER[a.extra?.[CHARACTER_META]?.category as LoreCategory] || 13000) - (CATEGORY_ORDER[b.extra?.[CHARACTER_META]?.category as LoreCategory] || 13000) || a.position.order - b.position.order || a.uid - b.uid);
  const entries = [...unrelated, ...managed];
  return { entries, added: next.filter(entry => !owned.some(old => old.uid === entry.uid)).length, replaced: next.filter(entry => owned.some(old => old.uid === entry.uid)).length,
    removed: owned.filter(entry => !next.some(item => item.uid === entry.uid)).length, changed: JSON.stringify(worldbook) !== JSON.stringify(entries), preview: next.map(entry => ({ name: entry.name, category: entry.extra![CHARACTER_META].category as LoreCategory, order: entry.position.order, position: entry.position.type, activation: entry.strategy.type })) };
}

export async function importCharacterWorldbook(payload: CharacterPackage, source: Pick<CharacterListing, 'id' | 'family_id' | 'author_name'>, target: string, overwriteModified = false) {
  // The updater receives the latest contents; never apply a stale preview snapshot.
  const name = target || await getOrCreateChatWorldbook('current');
  let result = { added: 0, replaced: 0, removed: 0 };
  await updateWorldbookWith(name, async current => {
    const plan = await planCharacterImport(current, payload, source, overwriteModified);
    result = { added: plan.added, replaced: plan.replaced, removed: plan.removed };
    return plan.entries;
  }, { render: 'immediate' });
  return { name, ...result };
}

export async function loadCharacterPortraits(groupId: string): Promise<PortraitGroup> {
  const response = await fetch(`${WORKSHOP_URL}/groups/${encodeURIComponent(groupId)}/export?intent=preview`, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('配套立绘已撤回或暂不可用');
  const group = parsePortraitGroup(await response.json());
  if (group.id !== groupId) throw new Error('配套立绘组 ID 不匹配');
  for (const item of group.items) {
    const url = new URL(item.url);
    if (url.origin !== WORKSHOP_URL || !/^\/assets\/[A-Za-z0-9_-]{1,80}$/.test(url.pathname)) throw new Error('配套立绘资源地址无效');
  }
  return group;
}
