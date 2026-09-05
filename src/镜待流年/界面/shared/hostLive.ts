import { z } from 'zod';

export type HostInput = 'start' | 'action' | 'chat' | 'continue';
export type HostEvent = {
  id: string; kind: HostInput | 'audience' | 'gift' | 'join'; name: string; text: string;
  status?: 'pending' | 'sent' | 'failed'; gift?: string; quantity?: number; replyTo?: string;
};
export type HostSession = {
  id: string; mode: 'normal' | 'r18'; creator: string; title: string; brief: string;
  visibility: 'public' | 'private'; referenceStory: boolean; style: string;
  startedAt: number; endedAt?: number; status: 'live' | 'ended'; screen: string; memory: string;
  events: HostEvent[]; audience: string[]; viewers: number; likes: number;
  pending?: string; error?: string; request?: { kind: HostInput; text: string; eventId: string };
};
export type Gift = { k: string; name: string; icon: string; price: number; exp: number };
export type Relation = { name: string; relationship: string };
export type HostGeneration = { generate: (options: any) => Promise<string>; relations: Relation[]; gifts: Gift[]; storyPrompt: string };

const Reply = z.object({
  screen: z.string().trim().min(1), memory: z.string().trim().min(1),
  viewers: z.number().int().min(0), likes: z.number().int().min(0),
  audience: z.array(z.string().trim().min(1)),
  messages: z.array(z.object({
    name: z.string().trim().min(1), text: z.string().trim().min(1),
    kind: z.enum(['audience', 'gift', 'join']).default('audience'),
    gift: z.string().optional(), quantity: z.number().int().min(1).max(99).optional(), replyTo: z.string().optional(),
  })).max(30),
});

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
    room.mode === 'r18' && room.style ? `【内容风格】${room.style}` : '',
    room.visibility === 'private'
      ? '本场私密直播默认向所有已知亲密角色开放。依据附带的关系记录确认亲密关系；有观看资格不等于已经入场，只选择此刻实际观看的人。audience只能列出关系记录中已确认亲密的角色姓名，昵称也使用该姓名。未确认亲密的角色和陌生人不进入、不知道内容。'
      : '本场公开直播，观众可包含已有角色和符合内容的普通网友。已有角色沿用身份与关系；入场人数与当前直播规模相称。',
    'memory是从开播至今的累计摘要：在既有摘要基础上整合新事实，保留重要早期事件、关系变化、约定与尚未回应的事项，压缩重复过程。不要只总结上一轮。screen是本轮更新后的直播画面，不重播旧消息。',
    '只返回JSON对象。字段：screen（画面文字）、memory（累计摘要）、viewers（当前在线人数）、likes（本场累计点赞数）、audience（本轮实际在线观众姓名数组）、messages（本轮新增消息数组）。每条消息含name、text、kind；kind为audience/gift/join。送礼时另含gift（礼物目录的k）、quantity（整数）；定向回复可含replyTo。消息按发生顺序排列，数量随情节自然变化。礼物由人物动机决定，允许没有礼物；不要伪造主播消息。',
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
      `已知角色与关系：${JSON.stringify(api.relations)}`,
      `礼物目录：${JSON.stringify(api.gifts.map(({ k, name }) => ({ k, name })))}`,
      `截至上一轮的累计摘要：${room.memory || '尚未开播'}\n上一条直播画面：${room.screen || '尚未生成'}\n累计点赞：${room.likes}`,
      `较早到较新的已完成互动：${JSON.stringify(room.events.filter(item => item.status !== 'pending' && item.status !== 'failed' && item.id !== request.eventId).slice(-50))}`,
      currentInput,
      useStory ? api.storyPrompt : '',
      '保持时间顺序，回复本轮输入；输出完整JSON并更新累计摘要。',
    ].filter(Boolean).join('\n\n'),
    ordered_prompts: [
      { role: 'system', content: system }, 'persona_description', 'char_description', 'world_info_before', 'world_info_after',
      ...(useStory ? ['chat_history'] : []), 'user_input',
    ],
  };
}

export function parseHostReply(raw: string, room: HostSession, api: HostGeneration) {
  const reply = Reply.parse(JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')));
  const known = new Set(api.relations.map(item => item.name));
  const audience = [...new Set(reply.audience)].filter(name => name !== room.creator && (room.visibility !== 'private' || known.has(name)));
  const messages: HostEvent[] = reply.messages.flatMap(msg => {
    if (msg.name === room.creator || (room.visibility === 'private' && !audience.includes(msg.name))) return [];
    if (msg.kind === 'gift' && !api.gifts.some(gift => gift.k === msg.gift)) return [];
    return [{ ...msg, id: hostId(), quantity: msg.kind === 'gift' ? (msg.quantity || 1) : undefined }];
  });
  return { ...reply, audience, messages, viewers: room.visibility === 'private' ? audience.length : Math.max(reply.viewers, audience.length), likes: Math.max(room.likes, reply.likes) };
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
  try {
    writeHostSession(key, room);
    persisted = true;
    const raw = await Promise.race([
      api.generate(hostGenerationOptions(room, api)),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('生成超时，请重试')), 300000); }),
    ]);
    const parsed = parseHostReply(raw, room, api);
    const latest = readHostSessions(key).find(item => item.id === roomId);
    if (!latest || latest.status !== 'live' || latest.pending !== requestId) return;
    Object.assign(latest, { screen: parsed.screen, memory: parsed.memory, audience: parsed.audience, viewers: parsed.viewers, likes: parsed.likes, pending: undefined, error: '' });
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
      const failed = latest.events.find(item => item.id === latest.request?.eventId);
      if (failed) failed.status = 'failed';
      writeHostSession(key, latest);
    }
  } finally {
    clearTimeout(timeout);
    taskRegistry().delete(requestId);
  }
}
