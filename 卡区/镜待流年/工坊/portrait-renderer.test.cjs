const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../../src/镜待流年');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const run = vm.runInThisContext(`(function(exports, require) { ${source}\n})`, { filename: file });
  run(exports, name => load(path.resolve(path.dirname(file), name + '.ts')));
  return exports;
}
const catalog = load(path.join(root, '界面/shared/portrait-catalog.ts'));
const { messagePortraitLedger, syncPortraitLedger, PortraitPicker, PORTRAIT_MESSAGE_STATE } = load(path.join(root, '脚本/立绘渲染/selection.ts'));
const { createPortraitRenderer } = load(path.join(root, '脚本/立绘渲染/runtime.ts'));
const items = [
  { id: 'author-z-91', name: '林澄', tag: '白裙 / 雨夜撑伞', url: 'https://example.com/z.png' },
  { id: 'author-a-7', name: '林澄', tag: '白裙 / 雨夜撑伞', url: 'https://example.com/a.png' },
  { id: 'other-301', name: '林澄', tag: '黑裙 / 雨夜撑伞', url: 'https://example.com/b.png' },
  { id: 'different', name: '叶遥', tag: '白裙 / 雨夜撑伞', url: 'https://example.com/d.png' },
];
const state = () => ({ version: 1, id: crypto.randomUUID(), slot: 0, choices: {} });
const setRef = async () => ({ kind: 'set', id: await catalog.portraitSetId(items[0].name, items[0].tag) });
const resolve = (picker, index, saved, reference, occurrence = 0, group = 'default', scope = 'chat-1', change = () => {}) => picker.resolve(index, saved, scope, group, reference, occurrence, change);

test('生产分类 ID 与研究 SHA-256 一致，标签完整匹配，排除无效地址', async () => {
  const index = await catalog.buildPortraitIndex([...items, { ...items[0], id: 'unsafe', url: 'javascript:alert(1)' }]);
  const expected = 's_' + createHash('sha256').update(JSON.stringify([items[0].name, items[0].tag])).digest('hex').slice(0, 16);
  assert.equal((await setRef()).id, expected);
  assert.equal(index.sets.size, 3);
  assert.equal(index.items.size, 4);
  assert.deepEqual(index.sets.get(expected).items.map(x => x.id), ['author-z-91', 'author-a-7']);
  await assert.rejects(catalog.buildPortraitIndex([items[0], items[0]]), /重复/);
});

test('排序与新增无关作者不改变分类 ID；目录按角色压缩且转义换行', async () => {
  const before = await catalog.buildPortraitIndex(items);
  const after = await catalog.buildPortraitIndex([...items].reverse());
  assert.deepEqual([...before.sets.keys()].sort(), [...after.sets.keys()].sort());
  const prompt = catalog.portraitCatalogPrompt(before);
  assert(prompt.includes('[[portrait-set:分类id]]'));
  assert(!prompt.includes('example.com') && !prompt.includes('author-z-91'));
  const escaped = catalog.portraitCatalogPrompt(await catalog.buildPortraitIndex([{ ...items[0], name: '七号\n/旅人', tag: '笑\n脸' }]));
  assert(escaped.includes('七号\\n/旅人') && escaped.includes('笑\\n脸'));
});

test('随机只选真实候选，重绘和序列化重载保持选图，追加不改已选图', async () => {
  const picker = new PortraitPicker(() => 1), saved = state(), ref = await setRef();
  let writes = 0;
  const index = await catalog.buildPortraitIndex(items);
  assert.equal(resolve(picker, index, saved, ref, 0, 'default', 'chat-1', () => writes++).item.id, 'author-a-7');
  for (let i = 0; i < 100; i++) assert.equal(resolve(picker, index, saved, ref).item.id, 'author-a-7');
  assert.equal(writes, 1);
  const appended = await catalog.buildPortraitIndex([{ ...items[0], id: 'new-99' }, ...items].reverse());
  assert.equal(resolve(new PortraitPicker(() => 0), appended, JSON.parse(JSON.stringify(saved)), ref).item.id, 'author-a-7');
});

test('图库组与同类标记位置分别缓存，失败范围隔离于聊天与消息', async () => {
  const picker = new PortraitPicker(() => 0), saved = state(), index = await catalog.buildPortraitIndex(items), ref = await setRef();
  const first = resolve(picker, index, saved, ref);
  picker.fail(first);
  assert.equal(resolve(picker, index, saved, ref).item.id, 'author-a-7');
  assert.equal(resolve(picker, index, saved, ref, 1).item.id, 'author-z-91');
  assert.equal(resolve(picker, index, saved, ref, 0, 'other-group').item.id, 'author-z-91');
  assert.equal(resolve(picker, index, state(), ref).item.id, 'author-z-91');
  assert.equal(resolve(picker, index, saved, ref, 0, 'default', 'other-chat').exhausted, false);
  assert.equal(Object.keys(saved.choices).length, 3);
});

test('真实登记项依次回退、全失败停止；明确重试和更换 URL 可恢复', async () => {
  const picker = new PortraitPicker(() => 0), saved = state(), index = await catalog.buildPortraitIndex(items), ref = await setRef();
  const attempts = [];
  let selection = resolve(picker, index, saved, ref);
  while (selection.item) {
    attempts.push(selection.item.id); picker.fail(selection); selection = resolve(picker, index, saved, ref);
  }
  assert.deepEqual(attempts, ['author-z-91', 'author-a-7']);
  assert(selection.exhausted);
  for (let i = 0; i < 20; i++) assert(resolve(picker, index, saved, ref).exhausted);
  const replaced = await catalog.buildPortraitIndex(items.map(item => item.id === 'author-a-7' ? { ...item, url: 'https://example.com/repaired.png' } : item));
  assert.equal(resolve(picker, replaced, saved, ref).item.url, 'https://example.com/repaired.png');
  picker.retry(selection.key);
  assert.equal(resolve(picker, index, saved, ref).item.id, 'author-a-7');
});

test('删除已选项重新从原分类选，改角色或标签不能借用旧登记项', async () => {
  const picker = new PortraitPicker(() => 0), saved = state(), ref = await setRef();
  resolve(picker, await catalog.buildPortraitIndex(items), saved, ref);
  const remaining = await catalog.buildPortraitIndex(items.slice(1));
  assert.equal(resolve(picker, remaining, saved, ref).item.id, 'author-a-7');
  assert.equal(resolve(picker, await catalog.buildPortraitIndex(items.slice(2)), saved, ref), undefined);
  assert.equal(resolve(picker, remaining, saved, { kind: 'item', id: 'missing' }), undefined);
});

test('旧精确登记 ID 不随机换成同类；失败后重试原图', async () => {
  const picker = new PortraitPicker(() => 1), saved = state(), index = await catalog.buildPortraitIndex(items);
  const ref = { kind: 'item', id: items[0].id };
  const selection = resolve(picker, index, saved, ref);
  assert.equal(selection.item.id, items[0].id);
  picker.fail(selection);
  assert(resolve(picker, index, saved, ref).exhausted);
  assert.deepEqual(saved.choices, {});
  picker.retry(selection.key);
  assert.equal(resolve(picker, index, saved, ref).item.id, items[0].id);
});

test('编辑正文、消息移动、JSON 保存重载不改变回复身份，保留其他 extra', () => {
  const message = { mes: '原正文', extra: { other: { keep: true } }, swipe_id: 0, swipe_info: [{ extra: { kept: 42 } }] };
  const first = messagePortraitLedger(message);
  first.state.choices.a = 'author-z-91'; syncPortraitLedger(message, first.state);
  message.mes = '编辑正文';
  const moved = [{ mes: '插入楼层' }, JSON.parse(JSON.stringify(message))][1];
  const reloaded = messagePortraitLedger(moved);
  assert.equal(reloaded.state.id, first.state.id);
  assert.equal(reloaded.state.choices.a, 'author-z-91');
  assert.equal(reloaded.changed, false);
  assert.deepEqual(moved.extra.other, { keep: true });
  assert.equal(moved.swipe_info[0].extra.kept, 42);
});

test('新 swipe 复制旧 extra 时获得独立身份，切回保留原选择；删除前页后仍恢复', () => {
  const message = { mes: '原文', swipe_id: 0, swipe_info: [{ extra: {} }] };
  const first = messagePortraitLedger(message).state;
  first.choices.a = 'author-z-91'; syncPortraitLedger(message, first);
  message.swipe_info.push({ extra: JSON.parse(JSON.stringify(message.extra)) });
  message.swipe_id = 1; message.extra = JSON.parse(JSON.stringify(message.swipe_info[1].extra));
  const second = messagePortraitLedger(message).state;
  assert.notEqual(second.id, first.id); assert.deepEqual(second.choices, {});
  second.choices.a = 'author-a-7'; syncPortraitLedger(message, second);
  message.swipe_id = 0; message.extra = JSON.parse(JSON.stringify(message.swipe_info[0].extra));
  assert.equal(messagePortraitLedger(message).state.choices.a, 'author-z-91');
  message.swipe_info.splice(0, 1); message.extra = JSON.parse(JSON.stringify(message.swipe_info[0].extra));
  const shifted = messagePortraitLedger(message).state;
  assert.equal(shifted.id, second.id); assert.equal(shifted.slot, 0); assert.equal(shifted.choices.a, 'author-a-7');
});

test('无 swipe_info 的新回复不会继承另一页 extra 的选图', () => {
  const message = { mes: '原文', swipe_id: 0, swipe_info: [{ extra: {} }] };
  const first = messagePortraitLedger(message).state;
  first.choices.a = 'old'; syncPortraitLedger(message, first);
  message.swipe_id = 1;
  const second = messagePortraitLedger(message).state;
  assert.notEqual(second.id, first.id); assert.deepEqual(second.choices, {});
});

function fakeRoot(messageId = 0, swipe = 0) {
  return { closest: () => ({ getAttribute: name => name === 'mesid' ? String(messageId) : String(swipe) }) };
}
test('生产运行层批量保存消息 extra，重绘不重复保存，旧引用不修改聊天', async () => {
  const index = await catalog.buildPortraitIndex(items), ref = await setRef();
  let saves = 0;
  const ctx = { chatId: 'chat-1', characterId: 'char-1', chat: [{ mes: '正文' }], saveChat: async () => { saves++; } };
  const runtime = createPortraitRenderer(() => ctx, () => index, () => 'default', () => {});
  const root = fakeRoot();
  runtime.renderer.resolve(root, { kind: 'item', id: items[0].id }, 0);
  assert.equal(ctx.chat[0].extra, undefined);
  const selected = runtime.renderer.resolve(root, ref, 0);
  for (let i = 0; i < 100; i++) assert.equal(runtime.renderer.resolve(root, ref, 0).item.id, selected.item.id);
  runtime.flush(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saves, 1);
  runtime.renderer.resolve(root, ref, 0); runtime.flush();
  assert.equal(saves, 1);
  assert(ctx.chat[0].extra[PORTRAIT_MESSAGE_STATE]);
  runtime.dispose();
});

test('运行层拒绝旧 DOM swipe，流式期间暂缓保存，结束后保存一次', async () => {
  const index = await catalog.buildPortraitIndex(items), ref = await setRef();
  let saves = 0;
  const ctx = { chatId: 'chat-1', chat: [{ mes: '正文', swipe_id: 1 }], streamingProcessor: {}, saveChat: async () => { saves++; } };
  const runtime = createPortraitRenderer(() => ctx, () => index, () => 'default', () => {});
  assert.equal(runtime.renderer.resolve(fakeRoot(0, 0), ref, 0), undefined);
  runtime.renderer.resolve(fakeRoot(0, 1), ref, 0); runtime.flush();
  assert.equal(saves, 0);
  ctx.streamingProcessor = null; runtime.flush(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saves, 1); runtime.dispose();
});

test('待保存期间换聊天不保存到新聊天；分类无聊天上下文不随机', async () => {
  const index = await catalog.buildPortraitIndex(items), ref = await setRef();
  let saves = 0;
  let ctx = { chatId: 'chat-1', chat: [{ mes: '正文' }], saveChat: async () => { saves++; } };
  const runtime = createPortraitRenderer(() => ctx, () => index, () => 'default', () => {});
  runtime.renderer.resolve(fakeRoot(), ref, 0);
  ctx = { ...ctx, chatId: 'chat-2', chat: [{ mes: '新正文' }] };
  runtime.flush(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saves, 0); assert.equal(ctx.chat[0].extra, undefined);
  ctx = undefined;
  assert.equal(runtime.renderer.resolve(fakeRoot(), ref, 0), undefined);
  assert.equal(runtime.renderer.resolve(fakeRoot(), { kind: 'item', id: items[0].id }, 0).item.id, items[0].id);
  runtime.dispose();
});
