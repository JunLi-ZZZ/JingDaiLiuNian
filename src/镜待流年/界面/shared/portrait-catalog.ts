export type Portrait = { id: string; name: string; tag: string; url: string; caption?: string };
export type PortraitSet = { id: string; name: string; tag: string; items: Portrait[] };
export type PortraitIndex = { items: Map<string, Portrait>; sets: Map<string, PortraitSet> };
export type PortraitReference = { kind: 'item' | 'set'; id: string };

export function portraitImageUrl(value: string): boolean {
  if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function emptyPortraitIndex(): PortraitIndex { return { items: new Map(), sets: new Map() }; }

export async function portraitSetId(name: string, tag: string): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([name, tag]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return 's_' + Array.from(new Uint8Array(digest).slice(0, 8), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** 分类只合并完全相同的角色名和完整标签；登记 ID、URL 仍指向原图。 */
export async function buildPortraitIndex(items: Portrait[]): Promise<PortraitIndex> {
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
  for (const set of sets) {
    if (index.sets.has(set.id)) throw new Error('立绘分类 ID 冲突');
    index.sets.set(set.id, set);
  }
  return index;
}

export function portraitCatalogPrompt(index: PortraitIndex): string {
  if (!index.sets.size) return '';
  const actors = new Map<string, string[]>();
  for (const set of index.sets.values()) {
    if (!actors.has(set.name)) actors.set(set.name, []);
    actors.get(set.name)!.push(`${set.id}=${JSON.stringify(set.tag)}`);
  }
  const lines = Array.from(actors, ([name, sets]) => `- ${JSON.stringify(name)}：${sets.join('；')}`).join('\n');
  return `\n[立绘引用目录]\n正文呈现目录中的角色，且画面与某项完整标签贴合时，在对应段落之后单独输出 [[portrait-set:分类id]]，把“分类id”换成下列目录中的准确 id。每个画面只选最贴合的一类；没有贴合项时继续正文，不输出标记。立绘不替代正文叙事，不编造目录外的 id。同类中的具体图片由图库选择。\n可用立绘分类（按角色列出，标签保留完整原文）：\n${lines}`;
}
