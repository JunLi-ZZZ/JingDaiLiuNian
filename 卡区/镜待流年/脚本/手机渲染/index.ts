// 手机消息渲染
// 正文里的 [美化]手机消息 正则只吐「卡片壳 + 隐藏数据」（正则无法循环），
// 由本脚本扫描卡片、解析隐藏的 .phone-data、把一次会话的多条消息渲染成微信多气泡。
// 全部用内联 style：ST 消息净化器会剥掉 <style>，也可能没加载到样式表，内联样式最稳（.phone-data 就靠内联藏住）。
// 幂等：已渲染的卡片打 data-rendered 跳过；酒馆重渲染会重建卡片壳，重新扫描即可。

const IMG_SVG =
  '<svg viewBox="0 0 24 24" style="width:40px;height:40px;color:#fff;opacity:.92"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 2v10.59l3.3-3.3l3 3l4-4L19 15V5zm3.5 2a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3"/></svg>';
const VID_SVG =
  '<svg viewBox="0 0 24 24" style="width:40px;height:40px;color:#fff;opacity:.92"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20M10 8l6 4l-6 4z"/></svg>';

function pdoc(): Document {
  return (window.parent && window.parent.document) || document;
}

function meName(): string {
  try {
    return (window.parent as any).SillyTavern.getContext().name1 || '我';
  } catch (e) {
    return '我';
  }
}

function initial(n: string): string {
  return (n || '?').trim().slice(0, 1) || '?';
}

function voiceLen(t: string): number {
  return Math.min(60, Math.max(1, Math.round((t || '').length / 3)));
}

interface PT { y: number | null; mo: number | null; d: number | null; h: number | null; mi: number | null; raw: string }
function pad2(n: number): string { return (n < 10 ? '0' : '') + n; }
function parseTime(s: string): PT | null {
  if (!s) return null;
  s = String(s).trim();
  let y: number | null = null, mo: number | null = null, d: number | null = null, h: number | null = null, mi: number | null = null;
  const dm = s.match(/(\d{2,4})\s*[年\/\-]\s*(\d{1,2})\s*[月\/\-]\s*(\d{1,2})/);
  if (dm) { y = +dm[1]; mo = +dm[2]; d = +dm[3]; }
  const tm = s.match(/(\d{1,2})\s*[:：]\s*(\d{2})/);
  if (tm) { h = +tm[1]; mi = +tm[2]; }
  if (y === null && h === null) return null;
  return { y, mo, d, h, mi, raw: s };
}
function hm(t: PT): string { return t.h != null ? pad2(t.h) + ':' + pad2(t.mi as number) : ''; }
function dayNum(t: PT): number | null { return t.y != null ? Date.UTC(t.y, (t.mo || 1) - 1, t.d || 1) : null; }
function fmtWeChat(t: PT | null, now: PT | null): string {
  if (!t) return '';
  if (t.y == null) return hm(t) || t.raw;
  const md = dayNum(t) as number, h = hm(t);
  if (now && now.y != null) {
    const days = Math.round(((dayNum(now) as number) - md) / 86400000);
    if (days <= 0) return h || (t.mo + '月' + t.d + '日');
    if (days === 1) return '昨天' + (h ? ' ' + h : '');
    if (days < 7) return '周' + '日一二三四五六'[new Date(md).getUTCDay()] + (h ? ' ' + h : '');
    if (t.y === now.y) return t.mo + '月' + t.d + '日';
    return t.y + '年' + t.mo + '月' + t.d + '日';
  }
  return t.mo + '月' + t.d + '日' + (h ? ' ' + h : '');
}
function storyNow(): PT | null {
  try {
    const w = window.parent as any;
    if (w && w.Mvu && w.Mvu.getMvuData) {
      const v = w.Mvu.getMvuData({ type: 'chat' });
      const t = v && v.stat_data && v.stat_data.世界 && v.stat_data.世界.当前时间;
      if (t) return parseTime(String(t));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function buildBubble(dir: string, type: string, text: string, contact: string, owner: string): HTMLElement {
  const d = pdoc();
  const out = dir === '发出';
  const row = d.createElement('div');
  row.style.cssText = 'display:flex;gap:9px;align-items:flex-start;flex-direction:' + (out ? 'row-reverse' : 'row');

  const av = d.createElement('div');
  av.style.cssText =
    'width:36px;height:36px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:500;background:' +
    (out ? 'linear-gradient(135deg,#63d383,#07c160)' : 'linear-gradient(135deg,#8fb0d6,#6a91bd)');
  av.textContent = initial(out ? owner : contact);   // 发出=机主，收到=联系人

  const bub = d.createElement('div');
  const isSticker = type === '表情';
  const isPacket = type === '红包';
  const bg = isSticker ? 'transparent' : isPacket ? '' : out ? '#95ec69' : '#fff';
  if (isPacket) {
    bub.style.cssText =
      'position:relative;width:210px;border-radius:6px;overflow:hidden;background:linear-gradient(160deg,#f6ad55,#e8503a);box-shadow:0 1px 2px rgba(0,0,0,.12)';
  } else {
    bub.style.cssText =
      'position:relative;max-width:66%;padding:' +
      (isSticker ? '2px' : '9px 13px') +
      ';border-radius:6px;font-size:15px;line-height:1.5;color:' +
      (isSticker ? '#576b95' : '#1a1a1a') +
      ';background:' +
      bg +
      ';word-break:break-word;white-space:pre-wrap;' +
      (isSticker ? '' : 'box-shadow:0 1px 1.5px rgba(0,0,0,.08)');
  }

  // 小尾巴（表情/红包气泡无尾巴）
  if (!isSticker && !isPacket) {
    const tail = d.createElement('span');
    tail.style.cssText = out
      ? 'position:absolute;top:12px;right:-10px;width:0;height:0;border:5px solid transparent;border-left-color:#95ec69'
      : 'position:absolute;top:12px;left:-10px;width:0;height:0;border:5px solid transparent;border-right-color:#fff';
    bub.appendChild(tail);
  }

  if (type === '语音') {
    const voi = d.createElement('span');
    voi.style.cssText = 'display:inline-flex;align-items:center;gap:9px;min-width:58px;' + (out ? 'flex-direction:row-reverse' : '');
    const wav = d.createElement('span');
    wav.style.cssText = 'display:inline-flex;align-items:flex-end;gap:2px;height:16px';
    wav.innerHTML =
      '<i style="display:inline-block;width:3px;height:6px;background:#4a4a4a;border-radius:2px"></i>' +
      '<i style="display:inline-block;width:3px;height:11px;background:#4a4a4a;border-radius:2px"></i>' +
      '<i style="display:inline-block;width:3px;height:16px;background:#4a4a4a;border-radius:2px"></i>';
    const dur = d.createElement('span');
    dur.textContent = voiceLen(text) + '″';
    voi.appendChild(wav);
    voi.appendChild(dur);
    const tx = d.createElement('span');
    tx.style.cssText = 'display:block;font-size:12.5px;color:#666;border-top:1px solid rgba(0,0,0,.06);margin-top:6px;padding-top:5px';
    tx.textContent = text;
    bub.appendChild(voi);
    bub.appendChild(tx);
  } else if (type === '图片' || type === '视频') {
    bub.style.padding = '6px';
    const box = d.createElement('span');
    box.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:158px;height:106px;border-radius:5px;background:' +
      (type === '视频' ? 'linear-gradient(135deg,#4b5563,#1f2937)' : 'linear-gradient(135deg,#d2d7dd,#b4bbc4)');
    box.innerHTML = type === '视频' ? VID_SVG : IMG_SVG;
    const cap = d.createElement('span');
    cap.style.cssText = 'display:block;font-size:13px;color:#555;margin-top:5px';
    cap.textContent = text;
    bub.appendChild(box);
    bub.appendChild(cap);
  } else if (type === '红包') {
    bub.style.padding = '0';
    const top = d.createElement('span');
    top.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px 14px 11px';
    const coin = d.createElement('span');
    coin.style.cssText = 'width:30px;height:30px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:5px;background:#fbe0b6';
    coin.innerHTML = '<svg viewBox="0 0 24 24" style="width:20px;height:20px"><path fill="#f5c164" d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20"/><path fill="#e8a838" d="M12 5.5c.4 0 .7.2.9.6l.9 2h1.9c.9 0 1.2 1 .5 1.5l-1.6 1.2l.6 2c.3.9-.7 1.5-1.4 1l-1.8-1.2l-1.8 1.2c-.7.5-1.7-.1-1.4-1l.6-2l-1.6-1.2c-.7-.5-.4-1.5.5-1.5h1.9l.9-2c.2-.4.5-.6.9-.6"/></svg>';
    const cap = d.createElement('span');
    cap.style.cssText = 'font-size:14.5px;color:#fff;line-height:1.35;word-break:break-word';
    cap.textContent = text || '恭喜发财，大吉大利';
    top.appendChild(coin);
    top.appendChild(cap);
    const foot = d.createElement('span');
    foot.style.cssText = 'display:block;font-size:11px;color:rgba(255,255,255,.7);padding:5px 14px;border-top:1px solid rgba(255,255,255,.18)';
    foot.textContent = '微信红包';
    bub.appendChild(top);
    bub.appendChild(foot);
  } else if (isSticker) {
    const m = text.match(/\[表情[：:]\s*(.*?)\]/);
    bub.appendChild(d.createTextNode(m ? '[' + m[1].trim() + ']' : text));
  } else {
    bub.appendChild(d.createTextNode(text));
  }

  row.appendChild(av);
  row.appendChild(bub);
  return row;
}

function renderCard(card: Element, now: PT | null): void {
  const dataEl = card.querySelector('[class*="phone-data"]');
  const bubbles = card.querySelector('[class*="pm-bubbles"]') as HTMLElement | null;
  if (!dataEl || !bubbles) {
    card.setAttribute('data-rendered', '1');
    return;
  }
  const raw = (dataEl.textContent || '').trim();
  const head = raw.split('|||');
  let owner: string, contact: string, time: string, blob: string;
  if (head.length >= 4) {                 // 新格式 机主|||联系人|||时间|||blob（机主空=自己）
    owner = head[0].trim() || meName();
    contact = head[1].trim();
    time = head[2].trim();
    blob = head.slice(3).join('|||');
  } else if (head.length === 3) {         // 旧格式 联系人|||时间|||blob（隐含机主=自己）
    owner = meName();
    contact = head[0].trim();
    time = head[1].trim();
    blob = head.slice(2).join('|||');
  } else {
    card.setAttribute('data-rendered', '1');
    return;
  }

  // 卡片头永远显示机主：「机主的微信 · 联系人」（机主是本人也照显）
  const peer = card.querySelector('[class*="pm-peer"]') as HTMLElement | null;
  if (peer) peer.textContent = (owner || meName()) + '的微信 · ' + contact;

  const d = pdoc();
  const frag = d.createDocumentFragment();
  if (time) {
    const t = d.createElement('div');
    t.style.cssText = 'align-self:center;font-size:11.5px;color:#fff;background:rgba(0,0,0,.12);padding:2px 8px;border-radius:4px';
    t.textContent = fmtWeChat(parseTime(time), now) || time;
    frag.appendChild(t);
  }
  // 在每个「发出|」「收到|」前断开：换行若被 markdown 吃成 <br>（textContent 丢换行）也能切对
  blob.split(/(?=(?:发出|收到)\|)/).forEach(line => {
    const ln = line.trim();
    if (!ln) return;
    const f = ln.split('|'); // 方向|类型|内容
    if (f.length < 3) return;
    const dir = f[0].trim();
    const type = (f[1] || '文字').trim() || '文字';
    const text = f.slice(2).join('|').trim();
    if (!text) return;
    frag.appendChild(buildBubble(dir, type, text, contact, owner));
  });

  bubbles.innerHTML = '';
  bubbles.appendChild(frag);
  card.setAttribute('data-rendered', '1');
}

function renderAll(): void {
  const now = storyNow();
  pdoc()
    .querySelectorAll('[class*="pm-card"]:not([data-rendered])')
    .forEach(c => renderCard(c, now));
}

// 收集页面上所有卡片的参与者（机主+联系人），用于确认谁该拥有手机
function collectParticipants(): string[] {
  const set = new Set<string>();
  pdoc()
    .querySelectorAll('[class*="phone-data"]')
    .forEach(el => {
      const head = (el.textContent || '').trim().split('|||');
      let owner = '', contact = '';
      if (head.length >= 4) { owner = head[0].trim() || meName(); contact = head[1].trim(); }
      else if (head.length === 3) { owner = meName(); contact = head[0].trim(); }
      if (owner) set.add(owner);
      if (contact) set.add(contact);
    });
  return Array.from(set);
}

// 点2c-A：参与过手机往来的角色，把「手机」补进其随身物品（幂等）。
// 铁律：只对主角 + 已在名录的角色补写；绝不为不在名录的角色新建条目（远程只在电话那头的人就跳过）。
function ensurePhones(): void {
  try {
    const w = window.parent as any;
    if (!w || !w.Mvu || !w.Mvu.getMvuData || !w.Mvu.replaceMvuData || !w._) return;
    const ctx = w.SillyTavern && w.SillyTavern.getContext();
    if (!ctx || !ctx.chat || !ctx.chat.length) return;
    const parts = collectParticipants();
    if (!parts.length) return;
    const mid = ctx.chat.length - 1;
    const vars = w.Mvu.getMvuData({ type: 'message', message_id: mid });
    if (!vars || !vars.stat_data) return;
    const sd = vars.stat_data;
    const me = meName();
    const hasPhone = (items: any) => Object.keys(items || {}).some(k => /手机|手环|电话|通讯/.test(k));
    const phoneItem = { 描述: '可收发消息的随身通讯设备', 数量: 1, 品阶: '凡品', 能力: '即时通讯' };
    let changed = false;
    parts.forEach(name => {
      if (name === me) {
        if (sd.主角 && !hasPhone(sd.主角.随身物品)) {
          w._.set(vars, 'stat_data.主角.随身物品.手机', phoneItem);
          changed = true;
        }
      } else {
        const rec = sd.角色名录 && sd.角色名录[name];   // 只补已在名录者，不新建
        if (rec && !hasPhone(rec.随身物品)) {
          w._.set(vars, 'stat_data.角色名录.' + name + '.随身物品.手机', phoneItem);
          changed = true;
        }
      }
    });
    if (changed) w.Mvu.replaceMvuData(vars, { type: 'message', message_id: mid });
  } catch (e) { /* ignore */ }
}

$(() => {
  renderAll();

  const events = [
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    tavern_events.USER_MESSAGE_RENDERED,
    tavern_events.MESSAGE_UPDATED,
    tavern_events.MESSAGE_SWIPED,
    tavern_events.MORE_MESSAGES_LOADED,
    tavern_events.CHAT_CHANGED,
  ];
  events.forEach(e => {
    try {
      eventOn(e, () => setTimeout(renderAll, 30));
    } catch (err) {
      /* ignore */
    }
  });

  // 生成结束后，给参与手机对话的「主角+已在名录者」补写手机进随身物品（幂等，绝不新建名录条目）
  try {
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => setTimeout(ensurePhones, 400));
  } catch (err) {
    /* ignore */
  }

  const timer = setInterval(renderAll, 1200);

  $(window).on('pagehide', () => {
    clearInterval(timer);
  });
});
