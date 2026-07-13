// 手机消息渲染
// 正文里的 [美化]手机消息 正则只能吐出「卡片壳 + 隐藏数据」（正则无法循环），
// 由本脚本扫描卡片、解析隐藏的 .phone-data、把一次会话的多条消息渲染成微信多气泡。
// 样式随卡片壳的 <style> 一并注入（见 正则/手机消息.txt），本脚本只负责生成气泡 DOM。
// 幂等：已渲染的卡片打 data-rendered 跳过；酒馆重渲染会重建卡片壳，重新扫描即可。

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
    voi.className = 'pm-b-voi';
    voi.innerHTML = '<i></i><i></i><i></i>';
    bub.appendChild(voi);
    bub.appendChild(d.createTextNode(' ' + text));
  } else if (type === '图片' || type === '视频') {
    const tag = d.createElement('span');
    tag.className = 'pm-b-tag';
    tag.textContent = '[' + type + ']';
    bub.appendChild(tag);
    bub.appendChild(d.createTextNode(text));
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
  const blob = head.slice(2).join('|||');

  const d = pdoc();
  const frag = d.createDocumentFragment();
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
  });
});
