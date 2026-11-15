import type { Portrait, PortraitGroup } from './portrait-workshop';

/** Change array order only; IDs, image bytes and other groups stay intact. */
export function moveLibraryEntry<T extends { id: string }>(items: T[], id: string, position: number): T[] {
  const from = items.findIndex(item => item.id === id);
  if (from < 0) throw new Error('待移动的项目已不存在');
  if (!Number.isInteger(position) || position < 0 || position >= items.length) throw new Error('目标顺序无效');
  const next = [...items], [item] = next.splice(from, 1);
  next.splice(position, 0, item);
  return next;
}

export function sortLibraryItems(items: Portrait[], field: 'character' | 'tag'): Portrait[] {
  const compare = new Intl.Collator('zh-CN', { numeric: true }).compare;
  return [...items].sort((a, b) => field === 'character'
    ? compare(a.name, b.name) || compare(a.tag, b.tag)
    : compare(a.tag, b.tag) || compare(a.name, b.name));
}

export function editLibraryItem(groups: PortraitGroup[], groupId: string, itemId: string, fields: { name: string; tag: string; caption: string }): PortraitGroup[] {
  const source = groups.find(group => group.id === groupId);
  if (!source?.items.some(item => item.id === itemId)) throw new Error('待编辑的立绘已不存在');
  const name = fields.name.trim(), tag = fields.tag.trim(), caption = fields.caption.trim();
  if (!name || name.length > 80 || !tag || tag.length > 120 || caption.length > 1000) throw new Error('请填写角色名和标签，并检查文字长度');
  return groups.map(group => group.id === groupId ? { ...group, items: group.items.map(item => item.id === itemId ? { ...item, name, tag, caption } : item) } : group);
}

export function moveLibraryItem(groups: PortraitGroup[], sourceId: string, targetId: string, itemId: string): PortraitGroup[] {
  const source = groups.find(group => group.id === sourceId), target = groups.find(group => group.id === targetId);
  const item = source?.items.find(item => item.id === itemId);
  if (!source || !target || !item) throw new Error('立绘或分组已不存在');
  if (sourceId === targetId) return groups;
  if (target.items.some(candidate => candidate.id === itemId)) throw new Error('目标组已有相同登记 ID，未移动或覆盖任何图片');
  return groups.map(group => group.id === sourceId ? { ...group, items: group.items.filter(candidate => candidate.id !== itemId) }
    : group.id === targetId ? { ...group, items: [...group.items, item] } : group);
}
