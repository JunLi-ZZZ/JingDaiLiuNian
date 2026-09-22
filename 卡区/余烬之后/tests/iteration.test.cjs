const path = require('node:path');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const root = path.resolve(__dirname, '..');
const load = name => loadTs(path.join(root,'src',name+'.ts'));
const { createOpening } = require('./numerical-fixture.cjs');
const { acceptNarrativeUpdate } = load('mvu-policy');
const { applyRepairPatch, parseRepair } = load('variable-repair');
const { editArchive } = load('settlement');
const { readRuntime } = load('runtime-store');
const { projectPromptState } = load('prompt-view');
const { parseLibrary, saveLibrary, libraryWorldbookEntry } = load('library');
const { Schema, CharacterDossierSchema } = load('schema');
const { resolveDossierCard } = load('output-cards');
const { bindWorldbook } = require('../tools/worldbook.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const start = () => createOpening({ mode: '默认' }, 'iteration');
const short = (s, seconds, operations = []) => ({ ...clone(s), 叙事: { ...clone(s.叙事), 本轮时间: seconds, 本轮结算: operations } });
function failed() {
  const s = start();
  s.stat_data._时空.起源时刻秒 = 435;
  const input = short(s.stat_data, 15);
  input.叙事.本轮时间 = { 起算起源秒: 0, 经过本地秒: 15 };
  assert.throws(() => acceptNarrativeUpdate(s.stat_data, input), /本轮时间的起算值与当前存档不一致/);
  s.stat_data._更新错误 = '本轮时间的起算值与当前存档不一致';
  s.stat_data._待修复 = { 版本: 0, 输入: input, 原因: s.stat_data._更新错误 };
  return s;
}
const patch = [
  { op: 'replace', path: '/叙事/本轮时间', value: 15 },
  { op: 'replace', path: '/叙事/本轮结算', value: [] },
  { op: 'replace', path: '/叙事/场景描述', value: '交谈结束，潮镜重新亮起。' },
];

test('简写时间取权威存档，复现435秒错误后修复到450秒；候选不修改原件', () => {
  const s = failed(), before = clone(s);
  const repaired = applyRepairPatch(s, parseRepair('```json\n' + JSON.stringify(patch) + '\n```'));
  assert.equal(repaired.stat_data._时空.起源时刻秒, 450);
  assert.equal(repaired.stat_data._更新错误, '');
  assert.equal(repaired.stat_data._待修复, null);
  assert.equal(repaired.stat_data.叙事.场景描述, patch[2].value);
  assert.deepEqual(clone(s), before);
  assert.throws(() => applyRepairPatch(repaired, patch), /没有失败/);
});
test('同楼同页回执阻止重复结算；下一楼同样15秒仍推进，继承规范值不重算', () => {
  const before = start().stat_data;
  const first = acceptNarrativeUpdate(before, short(before, 15), undefined, undefined, '2:0:a');
  assert.equal(first._时空.起源时刻秒, 15);
  assert.deepEqual(clone(acceptNarrativeUpdate(first, short(first, 15), undefined, undefined, '2:0:a')), clone(first));
  const second = acceptNarrativeUpdate(first, short(first, 15), undefined, undefined, '4:0:a');
  assert.equal(second._时空.起源时刻秒, 30);
  assert.deepEqual(clone(acceptNarrativeUpdate(second, second)), clone(second));
});
test('简写动作仍验证资源、范围与顺序，任何错误都不部分保存', () => {
  const before = start().stat_data, unchanged = clone(before);
  assert.throws(() => acceptNarrativeUpdate(before, short(before, 15, [{ kind: 'channel', abilityId: 'missing', amount: 10, purpose: '打开门' }])));
  assert.throws(() => acceptNarrativeUpdate(before, short(before, -1)));
  assert.deepEqual(clone(before), unchanged);
});
test('修复补丁只写叙事域，原型路径/无效字段/删除必须字段失败', () => {
  const s = failed();
  for (const path of ['/_实体/player/生命/当前', '/叙事/__proto__/a', '/叙事/constructor/a', '叙事/天气'])
    assert.throws(() => applyRepairPatch(s, [{ op: 'replace', path, value: 1 }]));
  assert.throws(() => applyRepairPatch(s, [{ op: 'replace', path: '/叙事/天气', value: 42 }]));
  assert.throws(() => applyRepairPatch(s, [{ op: 'replace', path: '/叙事/未知', value: 'a' }]));
});
test('重新生成预览后换楼层、换消息页、状态变化均不保存', async () => {
  const s = failed(); let current = clone(s), writes = 0, selection = 'one', latest = 2;
  const port = { exclusive: async (key, fn) => fn(), context: () => ({ chatId: 'chat', latestMessageId: latest }), selection: () => selection, read: () => clone(current), write: async data => { current = clone(data); writes++; } };
  const target = { chatId: 'chat', messageId: 2, selection: 'one' };
  const edit = { kind: 'regenerate', patch, base: clone(s.stat_data) };
  latest = 3; await assert.rejects(editArchive(port, target, s.stat_data, edit));
  latest = 2; selection = 'two'; await assert.rejects(editArchive(port, target, s.stat_data, edit));
  selection = 'one'; current.stat_data.叙事.天气 = '雨'; await assert.rejects(editArchive(port, target, s.stat_data, edit));
  assert.equal(writes, 0); current = clone(s);
  await editArchive(port, target, s.stat_data, edit);
  assert.equal(writes, 1); assert.equal(current.stat_data._时空.起源时刻秒, 450);
  assert(readRuntime(current));
});
const entry = { id: 'glass', kind: 'plane', name: '琉潮群岛', aliases: ['玻璃海'], planeId: 'glass', summary: '潮汐凝成玻璃的群岛', content: '群岛的人们按潮汐出航。镜盐储存短暂光影，鸣砂港的灯塔正在熄灭。' };
test('生成档案校验纯文本、稳定ID与长度，世界书条目默认关闭', () => {
  const e = parseLibrary(JSON.stringify(entry)); const wb = libraryWorldbookEntry(e);
  assert.equal(wb.enabled, false); assert(wb.content.includes('位面ID：glass'));
  assert.throws(() => parseLibrary(JSON.stringify({ ...entry, content: '<% evil() %>' })));
  assert.throws(() => parseLibrary(JSON.stringify({ ...entry, name: '<% evil() %>' })));
  assert.throws(() => parseLibrary(JSON.stringify({ ...entry, id: '__proto__' })));
});
test('世界书保存可重复、保留他人条目、只登记保存成功的引用', async () => {
  const unrelated = { uid: 1, name: '私人条目', content: '保留' };
  let entries = [unrelated], refs = [], creates = 0;
  const port = { check() {}, book: async () => '本局档案', read: async () => clone(entries),
    update: async (book, fn) => { entries = fn(entries); }, create: async (book, e) => { entries.push({ ...clone(e), uid: 2 }); creates++; },
    persist: async ref => { refs.push(ref); return true; } };
  await saveLibrary(port, entry); await saveLibrary(port, { ...entry, content: entry.content + '海面折射着落日。' });
  assert.equal(creates, 1); assert.equal(entries.length, 2); assert.deepEqual(entries[0], unrelated);
  assert.equal(refs.at(-1).book, '本局档案'); assert(!Object.hasOwn(refs[0], 'content'));
  assert(entries[1].content.endsWith('海面折射着落日。'));
  await assert.rejects(saveLibrary({ ...port, persist: async () => false }, entry), /引用尚未保存/);
  assert.equal(creates, 1);
});
test('EJS按当前位面/提及人物跨书读取关闭条目，发布绑定不破坏双参数', async () => {
  const text = bindWorldbook(fs.readFileSync(path.join(root, '世界书/控制器/EJS资料库控制器.txt'), 'utf8'), '卡主世界书');
  const calls = [], output = [];
  const library = {
    glass: { ...entry, book: '聊天档案', entry: '玻璃条目' },
    person: { ...entry, id: 'person', kind: 'character', name: '闻潮', book: '另一书', entry: '闻潮档案' },
    other: { ...entry, id: 'other', name: '陌生世界', book: '聊天档案', entry: '不应加载' },
  };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('getvar','getChatMessages','getwi','print', text.slice(text.indexOf('<%')+2,text.lastIndexOf('%>')))(
    (key,opts) => key.endsWith('_资料库') ? library : key.endsWith('位面ID') ? 'glass' : opts.defaults,
    () => [{ mes: '我要问闻潮一件事<UpdateVariable>陌生世界</UpdateVariable>', data: { hidden: '陌生世界' } }], async (...args) => { calls.push(args); return args.join(':'); }, x => output.push(x));
  assert.deepEqual(calls, [['聊天档案','玻璃条目'],['另一书','闻潮档案']]);
});
test('千人资料保留本地，提示词仅发当前相关最多6份，角色卡只展示公开经历', () => {
  const s = start().stat_data;
  for(let i=0;i<1000;i++) s.叙事.人物档案['person-'+i]=CharacterDossierSchema.parse({名称:'过客'+i,位面ID:'main',在场:i<8,身份:'旅人',性格:'私密背景'});
  const view=projectPromptState(s,'');assert.equal(Object.keys(view.叙事.人物档案).length,6);
  assert.equal(Object.keys(Schema.parse(s).叙事.人物档案).length,1000);
  const card=resolveDossierCard(s,'character','person-0');assert(!JSON.stringify(card).includes('私密背景'));
  const gain=resolveDossierCard(s,'gain','origin-rebirth');assert(gain.kind.startsWith('能力获得'));assert(gain.detail.includes('来源'));
});
