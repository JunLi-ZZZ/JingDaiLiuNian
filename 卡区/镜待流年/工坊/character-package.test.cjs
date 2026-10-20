const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename); if (cache.has(filename)) return cache.get(filename);
  const exports = {}; cache.set(filename, exports);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext(`(function(exports,require){${source}\n})`, { filename })(exports, name => load(path.resolve(path.dirname(filename), name + '.ts')));
  return exports;
}
const { parseCharacterPackage, planCharacterImport, CHARACTER_META, characterHash } = load(path.resolve(__dirname, '../../../src/镜待流年/界面/shared/character-workshop.ts'));
const data = () => ({ format: 'jdnl-character-package', version: 1, character: { name: '测试角色', description: '设定包测试', portrait_group_id: null,
  entries: [{ id: 'basic', name: '基础设定', keywords: ['测试角色'], content: '角色资料与 {{user}} 的称呼规则。' }] } });
const source = { id: 'package-v1', family_id: 'family-1', author_name: '测试作者' };
const loreEntries = plan => plan.entries.filter(entry => entry.extra?.[CHARACTER_META]?.familyId);
test('character parser accepts plain text and standard names, strips arbitrary fields and rejects executable templates', () => {
  const raw = data(); raw.character.entries[0].extra = { script: 'ignore' }; raw.character.entries[0].keywords.push('测试角色');
  const parsed = parseCharacterPackage(raw); assert.equal('extra' in parsed.character.entries[0], false); assert.equal(parsed.character.entries[0].keywords.length, 1);
  for (const text of ['<% code %>', '{{getvar::secret}}', '<iframe src="/">', '@@preprocessing']) {
    const invalid = data(); invalid.character.entries[0].content = text; assert.throws(() => parseCharacterPackage(invalid));
  }
  for (const mutate of [raw => { raw.version = 2; }, raw => { raw.character.entries[0].keywords = ['']; }, raw => { raw.character.entries.push(raw.character.entries[0]); }]) {
    const invalid = data(); mutate(invalid); assert.throws(() => parseCharacterPackage(invalid));
  }
});
test('worldbook import preserves unrelated entries and assigns unique IDs with selective activation', async () => {
  const unrelated = { uid: 7, name: '原有规则', content: '不可改动', extra: { custom: true } };
  const plan = await planCharacterImport([unrelated], parseCharacterPackage(data()), source);
  const entry = loreEntries(plan)[0];
  assert.strictEqual(plan.entries[0], unrelated); assert.equal(plan.added, 1); assert.ok(entry.uid > 7);
  assert.equal(entry.strategy.type, 'selective'); assert.equal(entry.recursion.prevent_outgoing, true);
  assert.equal(entry.extra[CHARACTER_META].familyId, 'family-1');
});
test('repeat imports are idempotent; revisions replace managed entries and retain local enable state', async () => {
  const initial = await planCharacterImport([], parseCharacterPackage(data()), source);
  const repeat = await planCharacterImport(initial.entries, parseCharacterPackage(data()), source);
  assert.equal(loreEntries(repeat).length, 1); assert.equal(repeat.added, 0); assert.equal(repeat.changed, false);
  loreEntries(initial)[0].enabled = false; const revision = data(); revision.character.name = '更新后的名称'; revision.character.entries[0].content = '新版设定';
  const next = await planCharacterImport(initial.entries, parseCharacterPackage(revision), { ...source, id: 'package-v2' });
  assert.equal(loreEntries(next)[0].uid, loreEntries(initial)[0].uid); assert.equal(loreEntries(next)[0].enabled, false); assert.equal(loreEntries(next)[0].content, '新版设定');
  assert.equal(loreEntries(next)[0].extra[CHARACTER_META].packageId, 'package-v2');
});
test('local content and key edits block overwrites until explicitly allowed, including deleted upstream entries', async () => {
  const raw = data(); raw.character.entries.push({ id: 'other', name: '经历', keywords: ['经历'], content: '旧经历' });
  const initial = await planCharacterImport([], parseCharacterPackage(raw), source); loreEntries(initial)[1].content = '玩家自己修改的经历';
  await assert.rejects(planCharacterImport(initial.entries, parseCharacterPackage(data()), source), /本地修改/);
  const forced = await planCharacterImport(initial.entries, parseCharacterPackage(data()), source, true); assert.equal(forced.removed, 1); assert.equal(loreEntries(forced).length, 1);
  loreEntries(initial)[0].strategy.keys.push('本地关键词'); await assert.rejects(planCharacterImport(initial.entries, parseCharacterPackage(raw), source), /本地修改/);
});
test('two authors using the same character and entry names remain independent', async () => {
  const one = await planCharacterImport([], parseCharacterPackage(data()), source);
  const two = await planCharacterImport(one.entries, parseCharacterPackage(data()), { id: 'author-two', family_id: 'family-2', author_name: '另一作者' });
  assert.equal(loreEntries(two).length, 2); assert.notEqual(loreEntries(two)[0].uid, loreEntries(two)[1].uid);
  assert.equal(loreEntries(two)[0].extra[CHARACTER_META].familyId, 'family-1');
});
test('large multibyte character packages cannot bypass the byte limit', () => {
  const raw = data(); raw.character.entries = Array.from({ length: 8 }, (_, n) => ({ id: String(n), name: '条目', keywords: ['角色'], content: '界'.repeat(20000) }));
  assert.throws(() => parseCharacterPackage(raw), /256 KiB/);
});
test('local importing uses the latest worldbook contents and reports persistent results', async () => {
  const originals = { getOrCreateChatWorldbook: global.getOrCreateChatWorldbook, updateWorldbookWith: global.updateWorldbookWith };
  const unrelated = { uid: 200, name: '预览后新增的规则', content: '保留', extra: {} }; let saved;
  global.getOrCreateChatWorldbook = async () => '测试聊天世界书';
  global.updateWorldbookWith = async (name, update) => { assert.equal(name, '测试聊天世界书'); saved = await update([unrelated]); return saved; };
  try {
    const result = await load(path.resolve(__dirname, '../../../src/镜待流年/界面/shared/character-workshop.ts')).importCharacterWorldbook(parseCharacterPackage(data()), source, '');
    assert.equal(result.added, 1); assert.strictEqual(saved[0], unrelated); assert.ok(saved.find(entry => entry.extra?.[CHARACTER_META]?.familyId).uid > 200);
    assert.match(await characterHash(data()), /^[a-f0-9]{64}$/);
  } finally { Object.assign(global, originals); }
});

test('legacy packages receive automatic category, keywords and settings without executing templates', () => {
  const raw = data(); raw.character.entries[0].keywords = [];
  const parsed = parseCharacterPackage(raw);
  assert.equal(parsed.character.category, 'character'); assert.deepEqual(parsed.character.entries[0].keywords, ['测试角色']);
  assert.equal(parsed.character.entries[0].settings.order, 'auto');
  assert.equal(parsed.character.entries[0].settings.scan_depth, 'same_as_global');
});
test('category groups are created once and automatic orders avoid manual and existing slots', async () => {
  const raw = data(); raw.character.category = 'plane';
  raw.character.entries.push({ id: 'manual', name: '指定顺序', keywords: ['测试'], content: '手工顺序', settings: { order: 10001 } });
  const parsed = parseCharacterPackage(raw), first = await planCharacterImport([], parsed, source);
  assert.equal(loreEntries(first)[0].position.order, 10001); assert.deepEqual(first.preview.map(row => row.order), [10002, 10001]);
  const anchors = first.entries.filter(entry => entry.extra?.[CHARACTER_META]?.kind === 'category-anchor'); assert.equal(anchors.length, 1); assert.equal(anchors[0].enabled, false);
  const repeat = await planCharacterImport(first.entries, parsed, source); assert.deepEqual(repeat.entries, first.entries);
  const nextRaw = data(); nextRaw.character.category = 'plane';
  const next = await planCharacterImport(first.entries, parseCharacterPackage(nextRaw), { ...source, family_id: 'family-2' });
  assert.equal(next.preview[0].order, 10003); assert.equal(next.entries.filter(entry => entry.extra?.[CHARACTER_META]?.kind === 'category-anchor').length, 1);
});
test('mixed categories and explicit activation, insertion, recursion and timed settings survive import', async () => {
  const raw = data(); raw.character.category = 'plane'; raw.character.entries[0].settings = { category: 'other', activation: 'constant', position: 'at_depth', role: 'user', depth: 4, order: 12345,
    scan_depth: 6, probability: 75, secondary_logic: 'not_any', secondary_keys: ['战斗'], prevent_incoming: false, prevent_outgoing: false, delay_until: 2, sticky: 3, cooldown: 5, delay: 4 };
  const entry = loreEntries(await planCharacterImport([], parseCharacterPackage(raw), source))[0];
  assert.equal(entry.extra[CHARACTER_META].category, 'other'); assert.equal(entry.strategy.type, 'constant'); assert.equal(entry.position.order, 12345);
  assert.equal(entry.position.role, 'user'); assert.equal(entry.position.depth, 4); assert.equal(entry.strategy.scan_depth, 6);
  assert.equal(entry.recursion.prevent_outgoing, false); assert.equal(entry.recursion.delay_until, 2); assert.equal(entry.probability, 75);
  assert.deepEqual(entry.effect, { sticky: 3, cooldown: 5, delay: 4 });
});
test('invalid configuration is rejected and local order/recursion modifications are protected', async () => {
  for (const settings of [{ order: -1 }, { probability: 101 }, { scan_depth: 1.5 }, { sticky: 0 }, { prevent_outgoing: 'false' }, { position: 'script' }, { secondary_keys: ['{{run::x}}'] }]) {
    const raw = data(); raw.character.entries[0].settings = settings; assert.throws(() => parseCharacterPackage(raw));
  }
  const initial = await planCharacterImport([], parseCharacterPackage(data()), source); loreEntries(initial)[0].position.order = 13579;
  await assert.rejects(planCharacterImport(initial.entries, parseCharacterPackage(data()), source), /本地修改/);
});
