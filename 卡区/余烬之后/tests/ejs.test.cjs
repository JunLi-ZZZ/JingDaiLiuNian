const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { scriptBody, verifyEjsEntries } = require('../tools/ejs-check.cjs');
const { bindWorldbook } = require('../tools/worldbook.cjs');
const { worldbookName } = require('../tools/release-info.cjs');
const root = path.resolve(__dirname, '..');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const { loadTs } = require('../tools/runtime.cjs');
const { createOpening } = loadTs(path.join(root, 'src/opening.ts'));
const { createUninitializedState } = loadTs(path.join(root, 'src/presets.ts'));
function entries() {
  return YAML.parse(fs.readFileSync(path.join(root, '世界书条目清单.yaml'), 'utf8')).条目.map(entry => {
    const file = ['.txt', '.yaml'].map(ext => path.join(root, entry.文件 + ext)).find(fs.existsSync);
    return { comment: entry.名称, enabled: entry.启用, content: bindWorldbook(fs.readFileSync(file, 'utf8'), worldbookName) };
  });
}

test('EJS所有启用条目可合并、重复编译，打包闸门能检出顶层撞名', () => {
  assert.throws(() => verifyEjsEntries([
    { enabled: true, content: '<% const library = {}; %>' },
    { enabled: true, content: '<% const library = {}; %>' },
  ]), /already been declared/);
  assert.equal(verifyEjsEntries(entries()), 7);
});

test('EJS合并与逐条执行路由一致，覆盖首轮/日常/生成世界/成长与外部作用域', async () => {
  const opening = createOpening({ mode: '默认' }, 'ejs-regression').stat_data;
  const daily = structuredClone(opening);
  daily.叙事.首次资料完成 = true;
  daily._时空.当前地点.位面ID = 'remote';
  daily._资料库.remote = { id: 'remote', kind: 'plane', name: '远潮', aliases: [], planeId: 'remote', summary: '摘要', book: 'chat-library', entry: '远潮全文' };
  const controls = entries().filter(entry => entry.enabled && entry.content.includes('<%'));
  for (const state of [createUninitializedState(), opening, daily]) {
    async function evaluate(joined) {
      const calls = [], depths = [], output = [];
      const getvar = (key, opts) => key.split('.').reduce((o, k) => o?.[k], { stat_data: state }) ?? opts?.defaults;
      const args = [getvar, depth => { depths.push(depth); return [{ message: depth < 0 ? '这次想练习，并尝试进化。' : '旧楼内容' }]; }, async (...args) => { calls.push(args); return args.join(':'); }, () => false, value => output.push(value)];
      const code = controls.map(entry => scriptBody(entry.content));
      for (const body of joined ? [code.join('\n')] : code) await new AsyncFunction('getvar', 'getChatMessages', 'getwi', 'matchChatMessages', 'print', body)(...args);
      return { calls, depths, output };
    }
    const together = await evaluate(true);
    assert.deepEqual(together, await evaluate(false));
    assert(together.calls.some(([, name]) => name === '熟练度与等级'));
    assert(together.calls.some(([, name]) => name === '能力进化'));
    assert(together.depths.every(depth => depth < 0));
    assert(together.calls.some(([, name]) => name === (state.叙事.首次资料完成 ? '余烬之后_变量更新规则_日常' : '余烬之后_变量更新规则_首次')));
    if (state === daily) assert(together.calls.some(([book, name]) => book === 'chat-library' && name === '远潮全文'));
  }
});
