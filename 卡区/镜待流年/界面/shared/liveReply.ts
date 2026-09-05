import { z } from 'zod';

const Text = z.string().catch('');
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
      const content = line.replace(/^\s*c\d+\s*[:：]\s*/i, '').trim();
      if (content.includes('|||')) {
        const [level, name, body, kind, gift, quantity, replyTo] = content.split('|||').map(v => v.trim());
        messages.push({ name, text: body || '', kind: kind || 'audience', level, gift, quantity, replyTo });
        field = ''; continue;
      }
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
    if (!parsed.success || (!parsed.data.text && parsed.data.kind !== 'join' && parsed.data.kind !== 'fan')) return [];
    return [{ ...parsed.data, level: liveCount(parsed.data.level), quantity: liveCount(parsed.data.quantity, 1) }];
  }).slice(0, 50);
  if (!screen && !messages.length) throw new Error('没有画面或互动内容，请重试本轮');
  let audience = data.audience;
  if (typeof audience === 'string') {
    try { audience = JSON.parse(audience); } catch { audience = audience.split(/[、,，]/); }
  }
  return { screen, memory, messages, audience: Array.isArray(audience) ? audience.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()) : undefined, viewers: data.viewers, likes: data.likes, warning };
}
