export const LORE_CATEGORIES = { character: '角色', plane: '位面', other: '其他' } as const;
export type LoreCategory = keyof typeof LORE_CATEGORIES;
export type LoreSettings = {
  category: LoreCategory | 'auto'; activation: 'selective' | 'constant'; order: number | 'auto';
  position: 'before_character_definition' | 'after_character_definition' | 'before_example_messages' | 'after_example_messages' | 'before_author_note' | 'after_author_note' | 'at_depth';
  role: 'system' | 'user' | 'assistant'; depth: number; scan_depth: 'same_as_global' | number; probability: number;
  secondary_logic: 'and_any' | 'and_all' | 'not_any' | 'not_all'; secondary_keys: string[];
  prevent_incoming: boolean; prevent_outgoing: boolean; delay_until: number | null;
  sticky: number | null; cooldown: number | null; delay: number | null;
};
export const CATEGORY_ORDER: Record<LoreCategory, number> = { plane: 10000, character: 11000, other: 12000 };
export function defaultLoreSettings(): LoreSettings {
  return { category: 'auto', activation: 'selective', order: 'auto', position: 'before_character_definition', role: 'system', depth: 0,
    scan_depth: 'same_as_global', probability: 100, secondary_logic: 'and_any', secondary_keys: [],
    prevent_incoming: true, prevent_outgoing: true, delay_until: null, sticky: null, cooldown: null, delay: null };
}
export function parseLoreCategory(value: unknown): LoreCategory {
  if (value === undefined) return 'character';
  if (typeof value === 'string' && Object.hasOwn(LORE_CATEGORIES, value)) return value as LoreCategory;
  throw new Error('设定分类需要为角色、位面或其他');
}
export function parseLoreSettings(value: unknown): LoreSettings {
  const result = defaultLoreSettings(); if (value === undefined) return result;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('世界书配置无效');
  const raw = value as Record<string, unknown>;
  const choices = { category: ['auto', ...Object.keys(LORE_CATEGORIES)], activation: ['selective', 'constant'],
    position: ['before_character_definition', 'after_character_definition', 'before_example_messages', 'after_example_messages', 'before_author_note', 'after_author_note', 'at_depth'],
    role: ['system', 'user', 'assistant'], secondary_logic: ['and_any', 'and_all', 'not_any', 'not_all'] };
  for (const [key, allowed] of Object.entries(choices)) if (raw[key] !== undefined) {
    if (typeof raw[key] !== 'string' || !allowed.includes(raw[key] as string)) throw new Error('世界书配置选项无效：' + key);
    Object.assign(result, { [key]: raw[key] });
  }
  for (const [key, min, max] of [['order', 0, 999999], ['depth', 0, 1000], ['scan_depth', 0, 1000], ['probability', 0, 100], ['delay_until', 1, 1000], ['sticky', 1, 1000], ['cooldown', 1, 1000], ['delay', 1, 1000]] as const) {
    const input = raw[key]; if (input === undefined) continue;
    if ((key === 'order' && input === 'auto') || (key === 'scan_depth' && input === 'same_as_global')) continue;
    if (['delay_until', 'sticky', 'cooldown', 'delay'].includes(key) && input === null) continue;
    if (typeof input !== 'number' || !Number.isInteger(input) || input < min || input > max) throw new Error('世界书数值无效：' + key);
    Object.assign(result, { [key]: input });
  }
  for (const key of ['prevent_incoming', 'prevent_outgoing'] as const) if (raw[key] !== undefined) {
    if (typeof raw[key] !== 'boolean') throw new Error('递归开关无效'); result[key] = raw[key];
  }
  if (raw.secondary_keys !== undefined) {
    if (!Array.isArray(raw.secondary_keys) || raw.secondary_keys.length > 20 || !raw.secondary_keys.every(key => typeof key === 'string' && key.trim() && key.length <= 80 && !/<%|\{\{|<\s*script/i.test(key))) throw new Error('次要关键词无效');
    result.secondary_keys = [...new Set((raw.secondary_keys as string[]).map(key => key.trim()))];
  }
  return result;
}
