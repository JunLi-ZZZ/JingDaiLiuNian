import { liveCount, parseLiveResponse } from './liveReply';

export type HostInput = 'start' | 'action' | 'chat' | 'continue';
export type HostEvent = {
  id: string; kind: HostInput | 'audience' | 'gift' | 'join' | 'fan'; name: string; text: string;
  level?: number;
  status?: 'pending' | 'sent' | 'failed'; gift?: string; quantity?: number; replyTo?: string;
};
export type HostSession = {
  id: string; mode: 'normal' | 'r18'; creator: string; title: string; brief: string;
  visibility: 'public' | 'private'; referenceStory: boolean; style: string;
  startedAt: number; endedAt?: number; status: 'live' | 'ended'; screen: string; memory: string;
  events: HostEvent[]; audience: string[]; viewers: number; likes: number;
  pending?: string; error?: string; request?: { kind: HostInput; text: string; eventId: string };
  warning?: string; failedRaw?: string; fans?: Record<string, { exp: number; level: number }>;
};
export type Gift = { k: string; name: string; icon: string; price: number; exp: number };
export type Relation = { name: string; relationship: string };
export type HostGeneration = { generate: (options: any) => Promise<string>; relations?: Relation[]; gifts: Gift[]; storyPrompt: string; contextBatch?: number; style?: string };
export const fanLevel = (exp: number) => Math.max(0, Math.floor(Math.sqrt(exp / 50)));

export const hostId = () => `host-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
export const hostStorageKey = (scope: string, mode: string) => `jdnl_host_live:${encodeURIComponent(scope)}:${mode}`;
const SYNC = 'jdnl-host-live-updated';
type TaskWindow = Window & { jdnlHostTasks?: Map<string, number> };
function taskRegistry() {
  const root = window.parent as TaskWindow;
  return (root.jdnlHostTasks ||= new Map());
}
export function readHostSessions(key: string): HostSession[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('直播记录格式异常，原记录已保留');
  return data;
}
export function writeHostSession(key: string, room: HostSession) {
  const rooms = readHostSessions(key);
  const index = rooms.findIndex(item => item.id === room.id);
  if (index < 0) rooms.unshift(room); else rooms[index] = room;
  localStorage.setItem(key, JSON.stringify(rooms));
  window.parent.dispatchEvent(new CustomEvent(SYNC, { detail: key }));
}
export function subscribeHostSessions(listener: () => void) {
  window.parent.addEventListener(SYNC, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.parent.removeEventListener(SYNC, listener);
    window.removeEventListener('storage', listener);
  };
}
export function recoverHostSessions(key: string) {
  for (const room of readHostSessions(key)) {
    if (!room.pending || taskRegistry().has(room.pending)) continue;
    room.pending = undefined;
    room.error = '上次生成已中断，可以重试';
    const event = room.events.find(item => item.id === room.request?.eventId);
    if (event) event.status = 'failed';
    writeHostSession(key, room);
  }
}

export function hostGenerationOptions(room: HostSession, api: HostGeneration) {
  const request = room.request!;
  const isStart = request.kind === 'start';
  const useStory = isStart && room.referenceStory;
  const system = [
    `生成${room.mode === 'r18' ? '抖阴' : '抖音'}的主播端直播反馈。主播是玩家${room.creator}。你负责镜头可见的环境变化、其他在场角色与线上观众。`,
    '玩家提交的直播内容是本轮已发生的行为或说话；玩家发送的弹幕只是线上文字。只承接玩家明确提供的内容，保留其下一步行动与发言的决定权。线上观众与现场人物分开，观众只通过镜头、声音、聊天与既有认知获取信息。',
    room.mode === 'r18' && (api.style || room.style) ? `【内容风格】${api.style || room.style}` : '',
    room.visibility === 'private'
      ? '本场私密直播向所有已知亲密角色开放。结合世界书人设、用户设定与本场已确认关系选择适合入场的角色，沿用其姓名与性格。观看资格与实际入场分别处理，线上反馈由实际观看者发出；当前无人观看时允许弹幕为空。'
      : '本场公开直播，观众可包含已有角色和符合内容的普通网友。已有角色沿用身份与关系；入场人数与当前直播规模相称。',
    'memory是从开播至今的累计摘要：在既有摘要基础上整合新事实，保留重要早期事件、关系变化、约定与尚未回应的事项，压缩重复过程。不要只总结上一轮。screen是本轮更新后的直播画面，不重播旧消息。',
    isStart ? '【首次开播】依据直播内容建立镜头、现场与初次入场反馈，形成第一份本场记忆。' : '【同场续播】保持主播、场景和已发生事件连续。本轮承接上一版画面、累计记忆和按序互动，推进此刻的发展。',
    '【画面与弹幕】screen写镜头可见的现场动作、其他现场人物的口头回应及环境变化，以自然分段的文字代替视频画面。c行是线上观众打字发送的短消息，观众不能用弹幕在现场行动。主播提交动作或口播时承接其输入；主播发弹幕时只处理这条线上消息。玩家后续行为由玩家输入。',
    '【观众互动】观众依照自己的性格与关注点回应现场，发言保持先后顺序；加入粉丝团、送礼和定向回复随互动自然发生。粉丝等级来自已附带记录，送礼经验由程序计算。',
    '【输出结构】沿用直播数据块，字段名与分隔符固定，字段内自由创作。screen为本轮画面；memory为整场自包含累计摘要；viewers为当前人数，likes为累计点赞；audience用顿号分隔本轮实际在线姓名；c行只写本轮新增互动，普通消息省略后续可选字段。kind取audience（弹幕）、join（入场）、gift（送礼）、fan（加入粉丝团）；gift用礼物目录代码，quantity为数量，replyTo为回复对象。',
    '===LIVECHAT===\nscreen:本轮画面\nmemory:累计摘要\nviewers:当前人数\nlikes:累计点赞\naudience:实际在线姓名\nc1:粉丝等级|||昵称|||消息内容|||kind|||gift|||quantity|||replyTo\n===CHATEND===',
  ].filter(Boolean).join('\n');
  const currentInput = {
    start: `本次开播，初始直播内容：${request.text}`,
    action: `本轮主播新提交的直播内容：${request.text}`,
    chat: `本轮主播只发送一条弹幕：${request.text}`,
    continue: '本轮玩家没有新发言、动作或弹幕。承接当前直播画面，推进其他人物、环境与观众反馈；历史消息不是本次发送。',
  }[request.kind];
  return {
    should_silence: true,
    max_chat_history: useStory ? 2 : 0,
    user_input: [
      `主播：${room.creator}\n标题：${room.title}\n开播设定：${room.brief}\n可见范围：${room.visibility}`,
      api.relations?.length ? `已有关系补充（结合世界书理解）：${JSON.stringify(api.relations)}` : '',
      `粉丝团记录：${JSON.stringify(room.fans || {})}`,
      `礼物目录：${JSON.stringify(api.gifts.map(({ k, name }) => ({ k, name })))}`,
      `截至上一轮的累计摘要：${room.memory || '尚未开播'}\n上一条直播画面：${room.screen || '尚未生成'}\n累计点赞：${room.likes}`,
      `较早到较新的已完成互动：\n${room.events.filter(item => item.status !== 'pending' && item.status !== 'failed' && item.id !== request.eventId).slice(-(api.contextBatch || 50)).map((e, i) => `${i + 1}. ${e.name}｜${e.kind}｜${e.text}`).join('\n')}`,
      currentInput,
      useStory ? api.storyPrompt : '',
      '按本轮操作继续，输出一个完整 ===LIVECHAT=== 到 ===CHATEND=== 数据块，更新画面和累计摘要。',
    ].filter(Boolean).join('\n\n'),
    ordered_prompts: [
      { role: 'system', content: system }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
      ...(useStory ? ['chat_history'] : []), 'user_input',
    ],
  };
}

export function parseHostReply(raw: string, room: HostSession, api: HostGeneration) {
  const reply = parseLiveResponse(raw);
  const cleanName = (name: string) => name.replace(/^@/, '').trim();
  const messages: HostEvent[] = reply.messages.flatMap(msg => {
    if (cleanName(msg.name) === cleanName(room.creator)) return [];
    const gift = api.gifts.find(g => g.k === msg.gift || g.name === msg.gift || msg.text.includes(g.name));
    const kind = ['gift', 'join', 'fan'].includes(msg.kind) ? msg.kind as 'gift' | 'join' | 'fan' : 'audience';
    return [{ ...msg, name: cleanName(msg.name), kind, gift: kind === 'gift' ? gift?.k : undefined, id: hostId(), quantity: kind === 'gift' ? Math.min(99, Math.max(1, msg.quantity)) : undefined }];
  });
  if (!reply.screen && !messages.length) throw new Error('没有有效画面或观众互动，请重试本轮');
  const audience = [...new Set([...(reply.audience || room.audience), ...messages.map(m => m.name)].map(cleanName))].filter(name => name !== cleanName(room.creator));
  const memory = reply.memory || [room.memory, room.request?.text, reply.screen, ...messages.map(m => `${m.name}：${m.text}`)].filter(Boolean).join('\n');
  return { ...reply, screen: reply.screen || room.screen, memory, audience, messages, viewers: Math.max(liveCount(reply.viewers, room.viewers), audience.length), likes: Math.max(room.likes, liveCount(reply.likes, room.likes)) };
}

// Persist by captured chat/platform/session, not by whichever page is visible when a request finishes.
export async function generateHostTurn(key: string, roomId: string, kind: HostInput, text: string, api: HostGeneration, retry = false) {
  const room = readHostSessions(key).find(item => item.id === roomId);
  if (!room || room.status !== 'live' || room.pending) return;
  if (room.error && !retry) throw new Error('请先重试或撤回未完成的消息');
  if (!retry) {
    const eventId = hostId();
    room.request = { kind, text, eventId };
    room.events.push({ id: eventId, kind, name: room.creator, text, status: 'pending' });
  }
  if (!room.request) return;
  const requestId = hostId();
  room.pending = requestId;
  room.error = '';
  const input = room.events.find(item => item.id === room.request!.eventId);
  if (input) input.status = 'pending';
  taskRegistry().set(requestId, Date.now());
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let persisted = false;
  let raw = '';
  try {
    writeHostSession(key, room);
    persisted = true;
    raw = await Promise.race([
      api.generate(hostGenerationOptions(room, api)),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('生成超时，请重试')), 300000); }),
    ]);
    const parsed = parseHostReply(raw, room, api);
    const latest = readHostSessions(key).find(item => item.id === roomId);
    if (!latest || latest.status !== 'live' || latest.pending !== requestId) return;
    Object.assign(latest, { screen: parsed.screen, memory: parsed.memory, audience: parsed.audience, viewers: parsed.viewers, likes: parsed.likes, pending: undefined, error: '', failedRaw: '', warning: parsed.warning });
    latest.fans ||= {};
    for (const event of parsed.messages) {
      const fan = latest.fans[event.name];
      if (fan) event.level = fan.level;
      if (event.kind !== 'fan' && event.kind !== 'gift') continue;
      const gift = api.gifts.find(g => g.k === event.gift);
      if (event.kind === 'gift' && !gift) continue;
      const exp = (fan?.exp || 0) + (gift?.exp || 0) * (event.quantity || 1);
      latest.fans[event.name] = { exp, level: fanLevel(exp) };
      event.level = fanLevel(exp);
    }
    const sent = latest.events.find(item => item.id === latest.request?.eventId);
    if (sent) sent.status = 'sent';
    latest.events.push(...parsed.messages);
    latest.request = undefined;
    writeHostSession(key, latest);
  } catch (error) {
    if (!persisted) throw error;
    const latest = readHostSessions(key).find(item => item.id === roomId);
    if (latest?.pending === requestId && latest.status === 'live') {
      latest.pending = undefined;
      latest.error = error instanceof Error ? error.message : '生成失败';
      latest.failedRaw = raw;
      const failed = latest.events.find(item => item.id === latest.request?.eventId);
      if (failed) failed.status = 'failed';
      writeHostSession(key, latest);
    }
  } finally {
    clearTimeout(timeout);
    taskRegistry().delete(requestId);
  }
}
