import { cleanGeneration, parseLiveResponse } from './liveReply';

export type CallLine = { id: string; name: string; text: string; status?: 'pending' | 'sent' | 'failed' };
export type VideoCall = {
  id: string; owner: string; contact: string; time: string; startedAt: number; endedAt?: number;
  status: 'calling' | 'active' | 'ended'; screen: string; memory: string; lines: CallLine[];
  initialChat?: string;
  pending?: string; error?: string; failedRaw?: string;
  request?: { kind: 'start' | 'message' | 'continue'; text: string; id: string };
};
export const CALL_SYNC = 'jdnl-video-call-updated';
const id = () => `call-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
export const callStorageKey = (scope: string) => `jdnl_video_calls:${encodeURIComponent(scope)}`;
function tasks(): Set<string> {
  const root = window.parent as Window & { jdnlVideoTasks?: Set<string> };
  return root.jdnlVideoTasks ||= new Set();
}
export function readCalls(key: string): VideoCall[] { return JSON.parse(localStorage.getItem(key) || '[]'); }
export function saveCall(key: string, call: VideoCall) {
  const calls = readCalls(key);
  const index = calls.findIndex(item => item.id === call.id);
  if (index < 0) calls.push(call); else calls[index] = call;
  localStorage.setItem(key, JSON.stringify(calls));
  window.parent.dispatchEvent(new CustomEvent(CALL_SYNC, { detail: key }));
}
export function createCall(key: string, owner: string, contact: string, time: string, initialChat = '') {
  const call: VideoCall = { id: id(), owner, contact, time, initialChat, startedAt: Date.now(), status: 'calling', screen: '', memory: '', lines: [] };
  saveCall(key, call); return call;
}
export function recoverCalls(key: string) {
  for (const call of readCalls(key)) {
    if (call.status === 'ended' || !call.pending || tasks().has(call.pending)) continue;
    call.pending = undefined; call.error = '上次生成已中断，可以重试';
    const line = call.lines.find(item => item.id === call.request?.id);
    if (line) line.status = 'failed';
    saveCall(key, call);
  }
}
export function endCall(key: string, callId: string) {
  const call = readCalls(key).find(item => item.id === callId);
  if (!call || call.status === 'ended') return;
  call.status = 'ended'; call.endedAt = Date.now(); call.pending = undefined;
  const line = call.lines.find(item => item.id === call.request?.id);
  if (line && line.status === 'pending') line.status = 'failed';
  call.request = undefined; call.error = ''; saveCall(key, call);
}
export function videoCallOptions(call: VideoCall) {
  const req = call.request!;
  return {
    should_silence: true, max_chat_history: 0,
    ordered_prompts: [
      { role: 'system', content: [
        `【微信·文字视频通话·静默生成】这是${call.owner}与${call.contact}的一对一视频通话，以文字呈现镜头画面与声音。本次只更新小手机内这场通话。你扮演${call.contact}，依据世界书人设、双方既有关系和已发生的交流自然回应。`,
        req.kind === 'start'
          ? `【首次接听】承接双方最近的微信交流，建立${call.contact}接听时的镜头位置、可见环境、正在做的事和初次回应，为后续互动留下自然接点。`
          : '【同场续聊】保持同一联系人、当前场景与前后动作连贯；依据上一版画面、累计记忆和按序通话记录推进本轮，已经回应的内容作为历史继续承接。',
        `【角色与输入】${call.owner}由玩家操控，本轮新输入是已经表达的言语或动作，对方据此回应，玩家下一步的发言、动作与决定留给玩家。点击继续表示本轮没有新输入，由对方与环境自然发展；较早的玩家消息按已发生的先后顺序理解。优先回应本轮实际提出的问题和点名，再承接记忆中尚未完成的事项。`,
        '【镜头与声音】screen写对方镜头里看得见的动作、神态、环境变化和通话中听得见的口头回应。画面与对白自然分段，动作过程与语气相互配合。远端回应以双方能看到、听到或已经知道的信息为依据，保持双方空间位置清晰。',
        '【交流节奏】根据当前输入的内容和情绪组织回应，保留联系人自己的关注点、说话习惯与正在进行的事情。每轮呈现有实际内容的变化，篇幅随这次互动需要调整，留下玩家能继续参与的时刻。',
        '【累计记忆】memory在旧摘要上整合本轮已发生事实，形成从接通至今的自包含摘要；保留重要早期交流、关系变化、约定、现场状态和未回应事项，压缩重复过程。摘要只记录已经发生的内容，并区分已完成与待继续的事情。',
        '【输出结构】只输出一个===VIDEOCALL===至===CALLEND===数据块。screen和memory为两个独立字段，各自从行首字段名开始；screen为本轮画面与口头回应，可自然换行，memory为更新后的整场摘要。字段名称和边界固定，内容自由组织，输出结束标记后停止。',
      ].join('\n\n') },
      'persona_description', 'char_description', 'world_info_before', 'world_info_after', 'user_input',
    ],
    user_input: [
      `通话双方：${call.owner}、${call.contact}`,
      call.initialChat ? `接通前的微信交流（较早到较新，仅作已发生的背景）：\n${call.initialChat}` : '',
      `此前累计摘要：${call.memory || '尚未通话'}\n上一版画面：${call.screen || '等待接通'}`,
      `已完成的通话记录（从早到晚）：\n${call.lines.filter(line => line.status === 'sent').slice(-30).map((line, i) => `${i + 1}. ${line.name}：${line.text}`).join('\n')}`,
      req.kind === 'start' ? `本轮操作：${call.owner}发起视频通话，呈现${call.contact}接听时的画面。` : req.kind === 'continue' ? '本轮玩家没有新发言或动作，承接通话继续对方的画面和回应。' : `本轮玩家新输入（仅此条）：${req.text}`,
      '按以下字段结构输出一个完整数据块，screen内可自然换行，memory整合本次与此前的重要内容：\n===VIDEOCALL===\nscreen:本轮对方画面与回应\nmemory:累计摘要\n===CALLEND===',
    ].filter(Boolean).join('\n\n'),
  };
}
export async function runVideoCall(key: string, callId: string, kind: 'start' | 'message' | 'continue', text: string, generate: (options: any) => Promise<string>, retry = false) {
  const call = readCalls(key).find(item => item.id === callId);
  if (!call || call.status === 'ended' || call.pending) return;
  if (call.error && !retry) throw new Error('请先重试或撤回未完成的消息');
  if (!retry) {
    call.request = { kind, text, id: id() };
    if (kind === 'message') call.lines.push({ id: call.request.id, name: call.owner, text, status: 'pending' });
  }
  if (!call.request) return;
  call.pending = id(); call.error = ''; const requestId = call.pending;
  const line = call.lines.find(line => line.id === call.request?.id);
  if (line) line.status = 'pending';
  tasks().add(requestId); saveCall(key, call);
  let raw = ''; let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    raw = await Promise.race([generate(videoCallOptions(call)), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('生成超时，请重试')), 300000); })]);
    const cleaned = cleanGeneration(raw).replace(/===VIDEOCALL===/gi, '===LIVECHAT===').replace(/===CALLEND===/gi, '===CHATEND===');
    const reply = parseLiveResponse(cleaned);
    if (!reply.screen) throw new Error('没有对方的通话画面，请重试');
    const latest = readCalls(key).find(item => item.id === callId);
    if (!latest || latest.status === 'ended' || latest.pending !== requestId) return;
    latest.screen = reply.screen;
    latest.memory = reply.memory || [latest.memory, latest.request?.text, reply.screen].filter(Boolean).join('\n');
    const sent = latest.lines.find(line => line.id === latest.request?.id);
    if (sent) sent.status = 'sent';
    latest.lines.push({ id: id(), name: latest.contact, text: reply.screen, status: 'sent' });
    latest.status = 'active'; latest.pending = undefined; latest.request = undefined; latest.failedRaw = '';
    saveCall(key, latest);
  } catch (e) {
    const latest = readCalls(key).find(item => item.id === callId);
    if (latest && latest.status !== 'ended' && latest.pending === requestId) {
      latest.pending = undefined; latest.error = e instanceof Error ? e.message : String(e); latest.failedRaw = raw;
      const failed = latest.lines.find(line => line.id === latest.request?.id);
      if (failed) failed.status = 'failed'; saveCall(key, latest);
    }
  } finally { clearTimeout(timer); tasks().delete(requestId); }
}
