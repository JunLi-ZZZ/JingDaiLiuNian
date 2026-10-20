/* Browser harness for actual production modules; no real Tavern data is read. */
const moduleApi = window.productionModules;
const catalogApi = moduleApi.require('portrait-catalog');
const storageApi = moduleApi.require('portrait-storage');
const workshopApi = moduleApi.require('portrait-workshop');
const stateKey = 'jdnl-production-qa-chat';
const events = new Map();
let current = { chatId: 'qa-chat', characterId: 'qa-character', chat: [] };
let saves = 0;
current.saveChat = async () => { saves++; localStorage.setItem(stateKey, JSON.stringify(current.chat)); };
window.SillyTavern = { getContext: () => current };
window.$ = value => typeof value === 'function' ? value() : { one: (_, fn) => window.addEventListener('pagehide', fn, { once: true }) };
window.injectPrompts = prompts => { document.querySelector('#prompt').textContent = prompts[0].content; return { uninject() { document.querySelector('#prompt').textContent = ''; } }; };
window.tavern_events = { CHAT_CHANGED: 'chat', GENERATION_ENDED: 'generated' };
window.eventOn = (event, fn) => events.set(event, fn);
moduleApi.require('index');
const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, timeout = 5000) { const start = Date.now(); while (!check()) { if (Date.now() - start > timeout) throw new Error('等待状态超时'); await tick(35); } }
function check(value, error = '断言失败') { if (!value) throw new Error(error); }
const id = 's_';
const results = [];
function result(name, pass, error) {
  results.push({ name, pass, error }); const li = document.createElement('li'); li.className = pass ? 'pass' : 'fail'; li.textContent = `${pass ? '✓' : '✗'} ${name}${error ? '：' + error : ''}`; document.querySelector('#results').append(li);
}
async function test(name, fn) { try { await fn(); result(name, true); } catch (error) { result(name, false, error.message); throw error; } }
const asset = name => location.origin + '/asset/' + name;
const pictures = () => [
  { id: 'author-z-91', name: '林澄', tag: '白裙 / 雨夜撑伞', url: asset('first') },
  { id: 'author-a-7', name: '林澄', tag: '白裙 / 雨夜撑伞', url: asset('second') },
  { id: 'bad-1', name: '叶遥', tag: '舞会礼服', url: asset('bad-1') },
  { id: 'good-1', name: '叶遥', tag: '舞会礼服', url: asset('good-1') },
  { id: 'recover-1', name: '宁栀', tag: '夜晚远眺', url: asset('recover-1') },
  { id: 'recover-2', name: '宁栀', tag: '夜晚远眺', url: asset('recover-2') },
];
let items = pictures();
let refs = {};
function mount() {
  const chat = document.querySelector('#chat'); chat.replaceChildren();
  current.chat.forEach((message, messageId) => {
    const block = document.createElement('article'); block.className = 'mes'; block.setAttribute('mesid', String(messageId)); block.setAttribute('swipeid', String(message.swipe_id || 0));
    const text = document.createElement('div'); text.className = 'mes_text';
    message.mes.split('\n').forEach(line => { const p = document.createElement('p'); p.textContent = line; text.append(p); });
    block.append(text); chat.append(block);
  });
}
const figure = n => document.querySelectorAll('.mes')[n]?.querySelector('.jdnl-portrait');
async function update(next) { items = next; await storageApi.savePortraitGroups([{ id: 'default', name: '测试组', items }]); events.get('chat')?.(); await tick(100); }
async function run() {
  document.querySelector('#results').replaceChildren(); results.length = 0; document.querySelector('#run').disabled = true;
  try {
    await fetch('/reset'); items = pictures();
    await test('大图与响应式数组经真实 IndexedDB 保存，无 localStorage 大图副本', async () => {
      const large = 'data:image/png;base64,' + 'A'.repeat(1_600_000);
      await storageApi.savePortraitGroups([{ id: 'default', name: '大图', items: [{ id: 'large', name: '大图', tag: '日常', url: large }] }]);
      check((await storageApi.loadPortraitGroups())[0].items[0].url.length === 1_600_022);
      check(localStorage.getItem(storageApi.PORTRAIT_GROUPS) === null);
      const wrappedItems = new Proxy([{ ...items[0], id: 'proxy' }], {
        get(target, key, receiver) {
          if (key === 'map') return callback => new Proxy(Array.prototype.map.call(target, callback), {});
          return Reflect.get(target, key, receiver);
        },
      });
      await storageApi.savePortraitGroups([{ id: 'default', name: '响应式', items: wrappedItems }]);
      check((await storageApi.loadPortraitGroups())[0].items[0].id === 'proxy');
    });
    await test('离线备份逐张下载并嵌入真实 PNG', async () => {
      const group = await workshopApi.portablePortraitGroup({ id: 'cloud', name: '云端', items: [{ id: 'cloud-1', name: '图片', tag: '日常', url: location.origin + '/asset.png' }] });
      check(group.items[0].url === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=');
    });
    refs = { rain: await catalogApi.portraitSetId('林澄', '白裙 / 雨夜撑伞'), party: await catalogApi.portraitSetId('叶遥', '舞会礼服'), missing: await catalogApi.portraitSetId('宁栀', '夜晚远眺') };
    current.chat = [
      { mes: `雨夜正文。\n[[portrait-set:${refs.rain}]]\n正文后段继续。`, extra: { unrelated: 42 }, swipe_id: 0, swipe_info: [{ extra: { unrelated: 42 } }] },
      { mes: '旧引用正文。\n[[portrait:author-z-91]]\n旧引用之后。' },
      { mes: `舞会正文。\n[[portrait-set:${refs.party}]]` },
      { mes: `远眺正文。\n[[portrait-set:${refs.missing}]]` },
    ];
    // 强制首候选缺图，测试真实 img error 的分类内回退。
    const selectionApi = moduleApi.require('selection');
    const saved = selectionApi.messagePortraitLedger(current.chat[2]).state;
    saved.choices[JSON.stringify(['default', 'set', refs.party, 0])] = 'bad-1';
    selectionApi.syncPortraitLedger(current.chat[2], saved);
    mount(); await update(items);
    await test('分类标记插入图且保留前后正文', async () => {
      await until(() => figure(0)?.querySelector('img')?.naturalWidth > 0);
      check(document.querySelectorAll('.mes')[0].textContent.includes('正文后段继续。'));
    });
    await test('目录按完整角色标签分类，不发送 URL 和逐图 ID', async () => {
      const prompt = document.querySelector('#prompt').textContent;
      check(prompt.includes(refs.rain) && prompt.includes('白裙 / 雨夜撑伞') && !prompt.includes('/asset/') && !prompt.includes('author-z-91'));
    });
    await test('旧精确登记 ID 引用继续渲染', async () => { await until(() => figure(1)?.querySelector('img')?.naturalWidth > 0); check(figure(1).dataset.portraitId === 'author-z-91'); });
    await test('旧版保留的立绘节点和样式在热更新后补齐', async () => {
      figure(1).querySelector('.jdnl-portrait-status').remove();
      document.querySelector('#jdnl-portrait-style').textContent = '.jdnl-portrait{color:red}';
      await until(() => figure(1)?.querySelector('.jdnl-portrait-status'));
      check(document.querySelector('#jdnl-portrait-style').textContent.includes('.jdnl-portrait-retry'));
      check(current.chat[1].extra === undefined);
    });
    await test('真实 404 自动回退到同类登记图', async () => { await until(() => figure(2)?.querySelector('img')?.naturalWidth > 0); check(figure(2).dataset.portraitId === 'good-1'); });
    await test('同类全失败停止请求并显示重试', async () => {
      await until(() => figure(3)?.querySelector('.jdnl-portrait-status')?.hidden === false);
      const before = await (await fetch('/counts')).json(); await tick(1550);
      const after = await (await fetch('/counts')).json();
      check(before['recover-1'] === 1 && before['recover-2'] === 1 && after['recover-1'] === 1 && after['recover-2'] === 1);
    });
    await test('网络恢复后明确重试可重新加载', async () => { await fetch('/recover'); figure(3).querySelector('.jdnl-portrait-retry').click(); await until(() => figure(3).querySelector('img')?.naturalWidth > 0); });
    const first = figure(0).dataset.portraitId;
    await test('重复重绘一百次保持选图', async () => { for (let i = 0; i < 100; i++) { mount(); await tick(18); } await until(() => figure(0)?.dataset.portraitId); check(figure(0).dataset.portraitId === first); });
    await test('追加同类图不改变已有选择', async () => { await update([...items, { ...items[0], id: 'new-301', url: asset('new') }]); check(figure(0).dataset.portraitId === first); });
    await test('切换立绘开关保持选择，关闭时不创建选图记录', async () => {
      localStorage.setItem(storageApi.PORTRAIT_ENABLED, '0'); window.dispatchEvent(new StorageEvent('storage', { key: storageApi.PORTRAIT_ENABLED })); await until(() => figure(0).hidden);
      current.chat.push({ mes: `关闭时正文。\n[[portrait-set:${refs.rain}]]` }); mount(); await tick(1600);
      check(current.chat.at(-1).extra === undefined);
      localStorage.setItem(storageApi.PORTRAIT_ENABLED, '1'); window.dispatchEvent(new StorageEvent('storage', { key: storageApi.PORTRAIT_ENABLED }));
      await until(() => figure(0)?.hidden === false); check(figure(0).dataset.portraitId === first);
      current.chat.pop(); mount(); await tick(80);
    });
    await test('swipe 副本获得独立回复身份，切回恢复原图', async () => {
      const message = current.chat[0], state = message.extra.jdnl_portraits_v1;
      const oldId = state.id;
      message.swipe_info.push({ extra: structuredClone(message.extra) }); message.swipe_id = 1; message.extra = structuredClone(message.swipe_info[1].extra); mount();
      await until(() => message.extra.jdnl_portraits_v1.id !== oldId);
      message.swipe_id = 0; message.extra = structuredClone(message.swipe_info[0].extra); mount();
      await until(() => figure(0)?.dataset.portraitId === first); check(message.extra.jdnl_portraits_v1.id === oldId && message.extra.unrelated === 42);
    });
    await test('插入楼层和编辑正文仍恢复消息自身选择', async () => {
      current.chat.unshift({ mes: '新插入的用户楼层。' }); current.chat[1].mes = current.chat[1].mes.replace('雨夜正文', '编辑后的雨夜正文'); mount();
      await until(() => figure(1)?.dataset.portraitId === first);
      current.chat.shift(); mount(); await tick(80);
    });
    await test('删除已选图仅在原分类内重新选', async () => {
      await update(items.filter(item => item.id !== first)); await until(() => figure(0)?.dataset.portraitId && figure(0).dataset.portraitId !== first);
      check(['author-z-91', 'author-a-7', 'new-301'].includes(figure(0).dataset.portraitId));
    });
    await test('未知分类不生成图也不删除正文', async () => {
      current.chat.push({ mes: `陌生正文。\n[[portrait-set:${id}0000000000000000]]\n继续。` }); mount(); await tick(100);
      check(!figure(4) && document.querySelectorAll('.mes')[4].textContent.includes('继续。')); current.chat.pop();
    });
    await test('旧 HTML 与单独 code 标记兼容，pre 例子不执行', async () => {
      mount(); const text = document.querySelectorAll('.mes_text')[1];
      text.innerHTML = '<p>兼容前文</p><portrait id="good-1">兼容后文</portrait><p><code>[[portrait:good-1]]</code></p><pre>[[portrait:good-1]]</pre>';
      await until(() => text.querySelectorAll('.jdnl-portrait').length === 2);
      check(text.textContent.includes('兼容后文') && text.querySelector('pre').textContent === '[[portrait:good-1]]');
    });
    await test('折叠和放大交互正常', async () => {
      const panel = figure(0); panel.querySelector('.jdnl-portrait-toggle').click(); check(panel.classList.contains('is-collapsed'));
      panel.querySelector('.jdnl-portrait-toggle').click(); panel.querySelector('img').click(); check(document.querySelector('.jdnl-portrait-lightbox')?.parentElement === document.body);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); check(!document.querySelector('.jdnl-portrait-lightbox'));
    });
    await test('重复渲染不触发持续保存', async () => { await tick(1600); const count = saves; await tick(1600); check(saves === count, '保存次数持续增长'); });
    mount(); await tick(550); await current.saveChat();
    const expected = current.chat.map((_, n) => figure(n)?.dataset.portraitId || '');
    localStorage.setItem('jdnl-production-qa-expected', JSON.stringify(expected));
    localStorage.setItem('jdnl-production-qa-results', JSON.stringify(results));
    document.querySelector('#summary').textContent = `${results.length}/${results.length} 项通过；可点击刷新验证持久化。`;
    window.productionQa = { results, saves, expected };
  } catch (error) { document.querySelector('#summary').textContent = '测试失败：' + error.message; window.productionQa = { results, error: error.message }; }
  finally { document.querySelector('#run').disabled = false; }
}
document.querySelector('#run').onclick = run;
document.querySelector('#reload').onclick = () => location.reload();
async function restore() {
  const saved = localStorage.getItem(stateKey), expected = JSON.parse(localStorage.getItem('jdnl-production-qa-expected') || 'null');
  if (!saved || !expected) return;
  current.chat = JSON.parse(saved); mount(); events.get('chat')?.();
  try {
    await until(() => figure(0)?.dataset.portraitId);
    for (const entry of JSON.parse(localStorage.getItem('jdnl-production-qa-results') || '[]')) result(entry.name, entry.pass, entry.error);
    const actual = current.chat.map((_, n) => figure(n)?.dataset.portraitId || '');
    check(JSON.stringify(actual) === JSON.stringify(expected), '刷新后选择发生变化');
    result('页面刷新从保存的消息 extra 恢复实际登记图', true);
    document.querySelector('#summary').textContent = `${results.length}/${results.length} 项通过；刷新恢复已验证。`;
    window.productionQa = { results, expected, actual, saves };
  } catch (error) { result('页面刷新恢复', false, error.message); document.querySelector('#summary').textContent = error.message; }
}
void restore();
