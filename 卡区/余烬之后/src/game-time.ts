import { localTime } from './engine';
import type { Schema } from './schema';

export type Calendar = NonNullable<Schema['_时空']['位面目录'][string]['时钟']['历法']>;
// 纯游戏历法，不读取 Date、电脑时区、系统时间或计时器。
export function formatGameTime(state: Schema, planeId: string): { date: string; time: string; label: string } {
  const seconds = Math.floor(localTime(state, planeId));
  const calendar = state._时空.位面目录[planeId].时钟.历法;
  if (!calendar) return { date: `历时 ${seconds} 秒`, time: '尚未设置历法', label: '游戏世界时间' };
  const units = [calendar.元年, calendar.每天小时, calendar.每小时分钟, calendar.每分钟秒, ...calendar.每月天数];
  if (!calendar.每月天数.length || units.some(n => !Number.isSafeInteger(n) || n <= 0)) throw Error('游戏历法参数无效');
  const hourSeconds = calendar.每小时分钟 * calendar.每分钟秒;
  const daySeconds = calendar.每天小时 * hourSeconds;
  const yearDays = calendar.每月天数.reduce((a, b) => a + b, 0);
  if (![seconds, daySeconds, yearDays, yearDays * daySeconds].every(Number.isSafeInteger))
    throw Error('游戏时间超出精确范围');
  const dayIndex = Math.floor(seconds / daySeconds);
  const year = calendar.元年 + Math.floor(dayIndex / yearDays);
  let day = dayIndex % yearDays;
  let month = 0;
  while (day >= calendar.每月天数[month]) day -= calendar.每月天数[month++];
  const remainder = seconds % daySeconds;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${calendar.名称} ${year}年${month + 1}月${day + 1}日`,
    time: `${pad(Math.floor(remainder / hourSeconds))}:${pad(Math.floor((remainder % hourSeconds) / calendar.每分钟秒))}:${pad(remainder % calendar.每分钟秒)}`,
    label: '游戏世界时间',
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) throw Error('无效时长');
  const value = Math.ceil(seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return [hours ? `${hours}时` : '', minutes ? `${minutes}分` : '', value % 60 || !value ? `${value % 60}秒` : '']
    .filter(Boolean)
    .join('');
}

export function revivalRemaining(state: Schema): string {
  const end = state._复苏?.完成起源秒;
  if (end === null || end === undefined) return '重构时间未确定';
  const plane = state._时空.位面目录[state._时空.当前地点.位面ID];
  const rate = plane?.时钟.本地每起源秒;
  if (rate === null || rate === undefined || !Number.isFinite(rate) || rate <= 0) return '当地时间倍率未确定';
  return formatDuration(Math.max(0, end - state._时空.起源时刻秒) * rate);
}
