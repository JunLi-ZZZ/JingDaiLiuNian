type LiveAction = { isMe?: boolean; isGift?: boolean; isLevelUp?: boolean; text?: string; sid?: string; status?: string };
type LiveRoom = { chatLog: LiveAction[]; responseBatch?: string[] };
type LiveTask = { token: string; frame: Element | null };
export const LIVE_TASK_SYNC = 'jdnl-live-task-sync';
function tasks() {
  const root = window.parent as Window & { jdnlWatchingTasks?: Map<string, LiveTask> };
  return root.jdnlWatchingTasks ||= new Map();
}
export function liveTaskActive(id: string) {
  const task = tasks().get(id);
  if (task?.frame && !task.frame.isConnected) { tasks().delete(id); return false; }
  return !!task;
}
export function claimLiveTask(id: string) {
  if (liveTaskActive(id)) return '';
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  tasks().set(id, { token, frame: window.frameElement });
  window.parent.dispatchEvent(new CustomEvent(LIVE_TASK_SYNC));
  return token;
}
export function ownsLiveTask(id: string, token: string) { return tasks().get(id)?.token === token; }
export function releaseLiveTask(id: string, token: string) {
  if (ownsLiveTask(id, token)) tasks().delete(id);
  window.parent.dispatchEvent(new CustomEvent(LIVE_TASK_SYNC));
}

export function beginLiveBatch(room: LiveRoom) {
  room.responseBatch ||= room.chatLog.filter(m => m.isMe && m.sid && ['queued', 'pending', 'failed'].includes(m.status || '')).map(m => m.sid!);
  const batch = room.chatLog.filter(m => m.sid && room.responseBatch!.includes(m.sid));
  batch.forEach(m => { m.status = 'pending'; });
  return batch;
}
export function finishLiveBatch(room: LiveRoom, success: boolean) {
  room.chatLog.filter(m => m.sid && room.responseBatch?.includes(m.sid)).forEach(m => { m.status = success ? 'sent' : 'failed'; });
  if (success) room.responseBatch = undefined;
}
export function liveBatchText(batch: LiveAction[]) {
  return batch.map((m, i) => `${i + 1}. ${m.isGift ? '送礼' : '消息'}：${m.text || ''}`).join('\n');
}
