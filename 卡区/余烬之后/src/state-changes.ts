import type { Schema } from './schema';
import { formatGameTime } from './game-time';

export type StateChange = { label: string; before: string; after: string };
const names: Record<string, string> = {
  _开局: '角色',
  _时空: '时空',
  _实体: '实体',
  _能力: '能力',
  _物品: '物品',
  _任务: '事项',
  _锚点: '复苏锚点',
  _死亡记录: '死亡记录',
  _复苏: '复苏',
  叙事: '叙事',
  待审提案: '待确认',
};
function display(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
export function stateChanges(previous: Schema | null, current: Schema): StateChange[] {
  if (!previous) return [];
  const rows: StateChange[] = [];
  const visit = (a: unknown, b: unknown, label: string) => {
    if (_.isEqual(a, b)) return;
    if (['叙事 · 本轮时间', '叙事 · 本轮结算', '叙事 · 首次资料完成'].includes(label)) return;
    if (label === '时空 · 起源时刻秒') {
      try {
        const planeId = current._时空.当前地点.位面ID;
        const before = formatGameTime(previous, planeId), after = formatGameTime(current, planeId);
        rows.push({ label: '游戏时间', before: `${before.date} ${before.time}`, after: `${after.date} ${after.time}` });
        return;
      } catch { /* 未定标位面保留原始刻度供核对。 */ }
    }
    if (_.isPlainObject(a) && _.isPlainObject(b)) {
      const left = a as Record<string, unknown>,
        right = b as Record<string, unknown>;
      for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
        const entityName = current._实体[key]?.名称 ?? current._能力[key]?.名称 ?? current._物品[key]?.名称;
        visit(left[key], right[key], `${label} · ${entityName || key}`);
      }
    } else rows.push({ label, before: display(a), after: display(b) });
  };
  for (const [key, label] of Object.entries(names))
    visit(previous[key as keyof Schema], current[key as keyof Schema], label);
  return rows;
}
