const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { test } = require('node:test'), ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../../src/镜待流年/界面/shared/portrait-library.ts'), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const api = {}; new Function('exports', code)(api);
const items = [{ id: 'image-a', name: '角色B', tag: '出场2', caption: '', url: 'data:image/png;base64,AAAA' }, { id: 'image-b', name: '角色A', tag: '出场10', caption: '原始说明', url: 'https://example.com/b.png' }, { id: 'image-c', name: '角色A', tag: '出场1', caption: '', url: 'https://example.com/c.png' }];
const groups = [{ id: 'default', name: '默认组', items }, { id: 'other', name: '其他组', items: [] }];
test('reordering preserves image objects, IDs, bytes and original arrays', () => {
  const next = api.moveLibraryEntry(items, 'image-a', 2);
  assert.deepEqual(next.map(x => x.id), ['image-b', 'image-c', 'image-a']); assert.equal(next[2], items[0]);
  assert.deepEqual(items.map(x => x.id), ['image-a', 'image-b', 'image-c']);
  assert.deepEqual(api.moveLibraryEntry(groups, 'other', 0).map(x => x.id), ['other', 'default']);
  assert.throws(() => api.moveLibraryEntry(items, 'missing', 0)); assert.throws(() => api.moveLibraryEntry(items, 'image-a', -1));
});
test('sorting groups exact role and label text without changing image identities', () => {
  assert.deepEqual(api.sortLibraryItems(items, 'character').map(x => x.id), ['image-c', 'image-b', 'image-a']);
  assert.deepEqual(api.sortLibraryItems(items, 'tag').map(x => x.id), ['image-c', 'image-a', 'image-b']);
  assert.deepEqual(new Set(api.sortLibraryItems(items, 'tag').map(x => x.url)), new Set(items.map(x => x.url)));
});
test('editing metadata preserves the registered ID and image even if extra fields are supplied', () => {
  const next = api.editLibraryItem(groups, 'default', 'image-b', { name: ' 新角色 ', tag: ' 新分类 ', caption: '新说明', id: 'bad', url: 'javascript:bad' });
  assert.deepEqual(next[0].items[1], { ...items[1], name: '新角色', tag: '新分类', caption: '新说明' });
  assert.equal(next[1], groups[1]); assert.equal(groups[0].items[1].caption, '原始说明');
  assert.throws(() => api.editLibraryItem(groups, 'default', 'image-b', { name: '', tag: '分类', caption: '' }));
});
test('moving between groups preserves all images and rejects ID conflicts', () => {
  const next = api.moveLibraryItem(groups, 'default', 'other', 'image-b');
  assert.equal(next[1].items[0], items[1]); assert.deepEqual(next[0].items.map(x => x.id), ['image-a', 'image-c']);
  assert.equal(next.flatMap(x => x.items).length, 3); assert.equal(groups[0].items.length, 3);
  assert.throws(() => api.moveLibraryItem([groups[0], { ...groups[1], items: [items[1]] }], 'default', 'other', 'image-b'), /相同登记/);
});
