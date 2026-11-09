export type Portrait = { id: string; name: string; tag: string; url: string; caption?: string };
export type PortraitSet = { id: string; name: string; tag: string; items: Portrait[] };
export type PortraitIndex = { items: Map<string, Portrait>; sets: Map<string, PortraitSet>; aliases: Map<string, string> };
export type PortraitReference = { kind: 'item' | 'set'; id: string };

export function portraitImageUrl(value: string): boolean {
  if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function emptyPortraitIndex(): PortraitIndex { return { items: new Map(), sets: new Map(), aliases: new Map() }; }

export function getPortraitSet(index: PortraitIndex, id: string): PortraitSet | undefined {
  return index.sets.get(id) || index.sets.get(index.aliases.get(id) || '');
}

export async function portraitSetId(name: string, tag: string): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([name, tag]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return 's_' + Array.from(new Uint8Array(digest).slice(0, 8), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** 分类只合并完全相同的角色名和完整标签；登记 ID、URL 仍指向原图。 */
export async function buildPortraitIndex(items: Portrait[], registry: Record<string, string> = {}): Promise<PortraitIndex> {
  const index = emptyPortraitIndex();
  const registered = new Set<string>();
  const pairs = new Map<string, Portrait[]>();
  for (const item of items) {
    if (registered.has(item.id)) throw new Error(`立绘登记 ID 重复：${item.id}`);
    registered.add(item.id);
    if (!portraitImageUrl(item.url)) continue;
    index.items.set(item.id, item);
    const pair = JSON.stringify([item.name, item.tag]);
    if (!pairs.has(pair)) pairs.set(pair, []);
    pairs.get(pair)!.push(item);
  }
  const sets = await Promise.all(Array.from(pairs.values(), async candidates => ({
    id: await portraitSetId(candidates[0].name, candidates[0].tag),
    name: candidates[0].name, tag: candidates[0].tag, items: candidates,
  })));
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) throw new Error('立绘短编号记录无效');
  const reserved = new Set<string>();
  let next = 1;
  for (const value of Object.values(registry)) {
    if (!/^[1-9]\d{0,8}$/.test(value) || reserved.has(value)) throw new Error('立绘短编号记录无效或重复');
    reserved.add(value); next = Math.max(next, Number(value) + 1);
  }
  for (const set of sets) {
    if (index.sets.has(set.id)) throw new Error('立绘分类 ID 冲突');
    index.sets.set(set.id, set);
    if (!Object.hasOwn(registry, set.id)) registry[set.id] = String(next++);
    index.aliases.set(registry[set.id], set.id);
  }
  return index;
}

export function portraitCatalogPrompt(index: PortraitIndex): string {
  if (!index.sets.size) return '';
  const actors = new Map<string, string[]>();
  const references = new Map(Array.from(index.aliases, ([short, id]) => [id, short]));
  for (const set of index.sets.values()) {
    if (!actors.has(set.name)) actors.set(set.name, []);
    actors.get(set.name)!.push(`${references.get(set.id) || set.id}=${JSON.stringify(set.tag)}`);
  }
  const lines = Array.from(actors, ([name, sets]) => `- ${JSON.stringify(name)}：${sets.join('；')}`).join('\n');
  return `\n[立绘引用目录]\n角色与完整标签符合当前画面时，在对应段落后单独输出 [[portrait-set:分类id]]，将“分类id”替换为下列短编号，如 [[portrait-set:1]]。每个画面最多一类，无匹配不输出；不编造编号，不替代正文。同类具体图片由图库随机选择。\n角色：短编号=完整标签\n${lines}`;
}
