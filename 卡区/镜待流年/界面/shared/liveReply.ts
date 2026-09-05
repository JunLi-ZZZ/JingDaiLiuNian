import { z } from 'zod';

const Text = z.string().catch('');
export function liveOptional(value: unknown): string {
  const text = Text.parse(value).trim();
  return /^(?:无|暂无|无对象|none|null|undefined|n\/a|[-—]+)$/i.test(text) ? '' : text;
}
export function liveQuantity(value: unknown, ...fallbacks: unknown[]): number {
  const explicit = liveOptional(typeof value === 'number' ? String(value) : value).replace(/^[x×*]\s*/i, '');
  const embedded = fallbacks.map(v => String(v ?? '').match(/[×x*]\s*(\d+)/i)?.[1]).find(Boolean);
  return Math.min(9999, Math.max(1, liveCount(explicit, liveCount(embedded, 1))));
}
export function normalizeLiveMessage<T extends { kind?: string; text?: string; gift?: string; replyTo?: string; quantity?: unknown }>(msg: T) {
  const tag = liveOptional(msg.kind).toLowerCase().replace(/[（(].*$/, '').trim();
  const aliases: Record<string, string> = { '入场': 'join', '加入直播间': 'join', '送礼': 'gift', '弹幕': 'audience', '加入粉丝团': 'fan' };
  const kind = aliases[tag] || tag || 'audience';
  return { ...msg, kind, text: Text.parse(msg.text).trim(), gift: liveOptional(msg.gift), replyTo: liveOptional(liveOptional(msg.replyTo).replace(/^@/, '')), quantity: liveQuantity(msg.quantity, msg.gift, msg.text) };
}
export function normalizeLiveGift<T extends { text: string; gift?: string; quantity?: unknown }>(msg: T, gifts: { k: string; name: string }[]) {
  const giftName = liveOptional(msg.gift).replace(/\s*[×x*]\s*\d+\s*$/i, '').trim();
  const gift = gifts.find(g => g.k === giftName || g.name === giftName)
    || (!giftName ? gifts.find(g => msg.text.includes(g.name)) : undefined);
  const quantity = liveQuantity(msg.quantity, msg.gift, msg.text);
  let text = msg.text;
  if (gift) {
    const escaped = gift.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove only a receipt prefix; preserve any accompanying comment.
    text = text.replace(new RegExp(`^(?:送出(?:了)?|赠送(?:了)?|送来(?:了)?)?\\s*(?:礼物[：:]?\\s*)?${escaped}(?:\\s*[×x*]\\s*\\d+)?[。！!，,：:\\s]*`), '').trim();
  }
  return { ...msg, text: liveOptional(text), gift: gift?.k, quantity };
}
const Message = z.object({
  name: z.string().trim().min(1), text: Text, kind: z.string().catch('audience'),
  level: z.unknown().optional(), gift: Text.optional(), quantity: z.unknown().optional(), replyTo: Text.optional(),
});
export function liveCount(value: unknown, fallback = 0): number {
  const match = String(value ?? '').replace(/[,，\s]/g, '').match(/^(?:Lv\.?|等级)?(\d+(?:\.\d+)?)\s*([万亿kKmM]?)/i);
  if (!match) return fallback;
  const scale: Record<string, number> = { '万': 1e4, '亿': 1e8, k: 1e3, m: 1e6 };
  return Math.min(1e9, Math.max(0, Math.floor(Number(match[1]) * (scale[match[2].toLowerCase()] || 1))));
}
export function cleanGeneration(raw: string): string {
  return String(raw || '').replace(/<(think|thinking|analysis)>[\s\S]*?<\/\1>/gi, '').replace(/^```[^\n]*\n|\n```\s*$/g, '').trim();
}
// Both live surfaces use the existing line protocol; JSON remains a compatibility input.
export function parseLiveResponse(raw: string) {
  let text = cleanGeneration(raw);
  if (!text) throw new Error('模型返回为空，请重试本轮');
  let data: Record<string, any> = {};
  let warning = '';
  const jsonStart = text.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const candidate = JSON.parse(text.slice(jsonStart, text.lastIndexOf('}') + 1));
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) data = candidate;
    } catch { /* A tagged block may legitimately contain braces in its scene. */ }
  }
  if (!Object.keys(data).length) {
    text = text.replace(/^[\s\S]*?===LIVECHAT===/i, '').replace(/===(?:CHATEND|END)===\s*[\s\S]*$/i, '').trim();
    const messages: any[] = [];
    let field = '';
    for (const line of text.split(/\r?\n/)) {
      const key = line.match(/^\s*(screen|memory|viewers|likes|audience|画面|记忆|观众|点赞)\s*[:：]\s*(.*)$/i);
      if (key) {
        const alias: Record<string, string> = { '画面': 'screen', '记忆': 'memory', '观众': 'audience', '点赞': 'likes' };
        field = alias[key[1]] || key[1].toLowerCase(); data[field] = key[2]; continue;
      }
      const isMessage = /^\s*c\d+\s*[:：]/i.test(line);
      const content = line.replace(/^\s*c\d+\s*[:：]\s*/i, '').trim();
      if (content.includes('|||')) {
        const [level, name, body, kind, gift, quantity, replyTo] = content.split('|||').map(v => v.trim());
        messages.push({ name, text: body || '', kind: kind || 'audience', level, gift, quantity, replyTo });
        field = ''; continue;
      }
      if (isMessage) { field = ''; warning = '部分互动字段未识别，已保留可解析内容'; continue; }
      if (field === 'screen' || field === 'memory') data[field] += '\n' + line;
    }
    if (Object.keys(data).length || messages.length) data.messages = messages;
    else {
      if (/^(?:\{|\[)|===|^\s*(?:screen|memory)\s*[:：]/i.test(text) || !text) throw new Error('没有解析到有效直播内容，请重试本轮');
      data = { screen: text }; warning = '本轮按文字画面保留；未提供的统计沿用上一轮';
    }
  }
  const screen = Text.parse(data.screen ?? data.content ?? data.画面).trim();
  const memory = Text.parse(data.memory ?? data.记忆).trim();
  const source = data.messages ?? data.chat ?? data.chatLog ?? [];
  const messages = (Array.isArray(source) ? source : []).flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const parsed = Message.safeParse({ ...item, name: item.name ?? item.user, kind: item.kind ?? (item.isGift ? 'gift' : item.isJoin ? 'join' : 'audience') });
    if (!parsed.success) { warning = '部分互动字段未识别，已保留可解析内容'; return []; }
    const msg = normalizeLiveMessage(parsed.data);
    if (!liveOptional(msg.name)) return [];
    if (!msg.text && !['join', 'fan'].includes(msg.kind) && !(msg.kind === 'gift' && msg.gift)) return [];
    return [{ ...msg, level: liveCount(msg.level) }];
  }).slice(0, 50);
  if (!screen && !messages.length) throw new Error('没有画面或互动内容，请重试本轮');
  let audience = data.audience;
  if (typeof audience === 'string') {
    try { audience = JSON.parse(audience); } catch { audience = audience.split(/[、,，]/); }
  }
  return { screen, memory, messages, audience: Array.isArray(audience) ? audience.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()) : undefined, viewers: data.viewers, likes: data.likes, warning };
}
