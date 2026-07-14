// 手机消息渲染
// 正文里的 [美化]手机消息 正则只能吐出「卡片壳 + 隐藏数据」（正则无法循环），
// 由本脚本扫描卡片、解析隐藏的 .phone-data、把一次会话的多条消息渲染成微信多气泡。
// 样式由本脚本注入到父窗口 head（ST 消息净化器会剥掉消息内 <style>，故不能放正则输出里）。
// 幂等：已渲染的卡片打 data-rendered 跳过；酒馆重渲染会重建卡片壳，重新扫描即可。

const STYLE_ID = 'pm-render-style';

const CSS = `
.pm-card{display:block;max-width:400px;margin:14px auto;border-radius:14px;overflow:hidden;background:#ededed;box-shadow:0 8px 28px rgba(0,0,0,.3);border:1px solid rgba(0,0,0,.06);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}
.pm-head{display:flex;align-items:center;justify-content:center;padding:11px 40px;background:#ededed;border-bottom:1px solid rgba(0,0,0,.06);font-size:15px;font-weight:600;color:#0d0d0d;position:relative}
.pm-head .pm-wxlogo{position:absolute;left:14px;display:flex;align-items:center;color:#07c160}
.pm-head .pm-wxlogo svg{width:17px;height:17px}
.pm-head .pm-peer{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:72%}
.pm-bubbles{padding:16px 13px 18px;background:#ededed;display:flex;flex-direction:column;gap:16px}
.pm-time{align-self:center;font-size:11.5px;color:#fff;background:rgba(0,0,0,.12);padding:2px 8px;border-radius:4px}
.pm-b-row{display:flex;gap:9px;align-items:flex-start}
.pm-b-row.out{flex-direction:row-reverse}
.pm-b-av{width:36px;height:36px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:500;background:linear-gradient(135deg,#8fb0d6,#6a91bd)}
.pm-b-row.out .pm-b-av{background:linear-gradient(135deg,#63d383,#07c160)}
.pm-b-bub{position:relative;max-width:64%;padding:9px 13px;border-radius:6px;font-size:15px;line-height:1.5;color:#0d0d0d;background:#fff;word-break:break-word;white-space:pre-wrap;box-shadow:0 1px 1.5px rgba(0,0,0,.08)}
.pm-b-row.out .pm-b-bub{background:#95ec69}
.pm-b-bub::before{content:'';position:absolute;top:13px;width:0;height:0;border:6px solid transparent}
.pm-b-row.in .pm-b-bub::before{left:-11px;border-right-color:#fff}
.pm-b-row.out .pm-b-bub::before{right:-11px;border-left-color:#95ec69}
.pm-voice{display:flex;align-items:center;gap:9px;min-width:58px}
.pm-b-row.out .pm-voice{flex-direction:row-reverse}
.pm-wav{display:inline-flex;align-items:flex-end;gap:2px;height:16px}
.pm-wav i{display:inline-block;width:3px;background:#4a4a4a;border-radius:2px}
.pm-wav i:nth-child(1){height:6px}.pm-wav i:nth-child(2){height:11px}.pm-wav i:nth-child(3){height:16px}
.pm-vtext{display:block;font-size:12.5px;color:#666;border-top:1px solid rgba(0,0,0,.06);margin-top:6px;padding-top:5px}
.pm-media{width:158px;height:106px;border-radius:5px;background:linear-gradient(135deg,#d2d7dd,#b4bbc4);display:flex;align-items:center;justify-content:center}
.pm-media svg{width:40px;height:40px;color:#fff;opacity:.92}
.pm-media.vid{background:linear-gradient(135deg,#4b5563,#1f2937)}
.pm-cap{display:block;font-size:13px;color:#555;margin-top:5px}
.pm-b-bub.media{padding:6px}
.pm-b-bub.media::before{display:none}
.pm-b-bub.sticker{background:transparent!important;box-shadow:none;padding:2px;color:#576b95;font-size:15px}
.pm-b-bub.sticker::before{display:none}
`;

const IMG_SVG =
  '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 2v10.59l3.3-3.3l3 3l4-4L19 15V5zm3.5 2a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3"/></svg>';
const VID_SVG =
  '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20M10 8l6 4l-6 4z"/></svg>';

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

function injectStyle(): void {
  const d = pdoc();
  if (d.getElementById(STYLE_ID)) return;
  const el = d.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  d.head.appendChild(el);
}

function buildBubble(dir: string, type: string, text: string, contact: string): HTMLElement {
  const d = pdoc();
  const row = d.createElement('div');
  row.className = 'pm-b-row ' + (dir === '发出' ? 'out' : 'in');

  const av = d.createElement('div');
  av.className = 'pm-b-av';
  av.textContent = initial(dir === '发出' ? meName() : contact);

  const bub = d.createElement('div');
  bub.className = 'pm-b-bub';

  if (type === '语音') {
    const voi = d.createElement('span');
    voi.className = 'pm-voice';
    const wav = d.createElement('span');
    wav.className = 'pm-wav';
    wav.innerHTML = '<i></i><i></i><i></i>';
    const dur = d.createElement('span');
    dur.textContent = voiceLen(text) + '″';
    voi.appendChild(wav);
    voi.appendChild(dur);
    const tx = d.createElement('span');
    tx.className = 'pm-vtext';
    tx.textContent = text;
    bub.appendChild(voi);
    bub.appendChild(tx);
  } else if (type === '图片' || type === '视频') {
    bub.className = 'pm-b-bub media';
    const box = d.createElement('span');
    box.className = 'pm-media' + (type === '视频' ? ' vid' : '');
    box.innerHTML = type === '视频' ? VID_SVG : IMG_SVG;
    const cap = d.createElement('span');
    cap.className = 'pm-cap';
    cap.textContent = text;
    bub.appendChild(box);
    bub.appendChild(cap);
  } else if (type === '表情') {
    bub.className = 'pm-b-bub sticker';
    const m = text.match(/\[表情[：:]\s*(.*?)\]/);
    bub.textContent = m ? '[' + m[1].trim() + ']' : text;
  } else {
    bub.textContent = text;
  }

  row.appendChild(av);
  row.appendChild(bub);
  return row;
}

function renderCard(card: Element): void {
  const dataEl = card.querySelector('[class*="phone-data"]');
  const bubbles = card.querySelector('[class*="pm-bubbles"]');
  if (!dataEl || !bubbles) {
    card.setAttribute('data-rendered', '1');
    return;
  }
  const raw = (dataEl.textContent || '').trim();
  const head = raw.split('|||'); // 联系人|||时间|||体行blob
  if (head.length < 3) {
    card.setAttribute('data-rendered', '1');
    return;
  }
  const contact = head[0].trim();
  const time = head[1].trim();
  const blob = head.slice(2).join('|||');

  const d = pdoc();
  const frag = d.createDocumentFragment();
  if (time) {
    const t = d.createElement('div');
    t.className = 'pm-time';
    t.textContent = time;
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
    frag.appendChild(buildBubble(dir, type, text, contact));
  });

  bubbles.innerHTML = '';
  bubbles.appendChild(frag);
  card.setAttribute('data-rendered', '1');
}

function renderAll(): void {
  injectStyle();
  pdoc()
    .querySelectorAll('[class*="pm-card"]:not([data-rendered])')
    .forEach(renderCard);
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

  const timer = setInterval(renderAll, 1200);

  $(window).on('pagehide', () => {
    clearInterval(timer);
    const el = pdoc().getElementById(STYLE_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
});
