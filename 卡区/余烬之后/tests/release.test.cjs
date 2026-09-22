const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { cardPosition, bindWorldbook } = require('../tools/worldbook.cjs');
const { releaseName, worldbookName, version } = require('../tools/release-info.cjs');
const root = path.resolve(__dirname, '..');

test('独立升版拒绝回退与无效版本，同版本重复执行不改文件', () => {
  const { spawnSync } = require('node:child_process');
  const packageFile = path.join(root, 'package.json');
  const before = fs.readFileSync(packageFile, 'utf8');
  for (const [target, status] of [[version, 0], ['0.0.0', 1], ['../other', 1], ['1.2.9007199254740992', 1]]) {
    const result = spawnSync(process.execPath, [path.join(__dirname, '../tools/bump.cjs'), target], { encoding: 'utf8' });
    assert.equal(result.status, status, result.stdout + result.stderr);
    assert.equal(fs.readFileSync(packageFile, 'utf8'), before);
  }
});

test('单一版本派生卡名和世界书名；MVU条目按D0顺序打包，背景与细节保留各自位置', () => {
  assert.equal(releaseName, `余烬之后 v${version}`);
  assert.equal(worldbookName, releaseName);
  const entries = YAML.parse(fs.readFileSync(path.join(root, '世界书条目清单.yaml'), 'utf8')).条目;
  const byName = name => cardPosition(entries.find(e => e.名称 === name).插入位置);
  const variables = byName('变量列表');
  const rules = byName('[EJS]余烬之后_变量规则控制器');
  const format = byName('[mvu_update]变量输出格式');
  for (const entry of [variables, rules, format]) assert.deepEqual(entry.extensions, { position: 4, depth: 0, role: 0 });
  assert(variables.insertion_order < rules.insertion_order && rules.insertion_order < format.insertion_order);
  assert.equal(byName('多元位面-体系概述').extensions.position, 0);
  assert.equal(byName('[EJS]余烬之后_位面控制器').extensions.position, 1);
});

test('打包后的EJS明确读取本版本世界书，同名旧版条目不参与路由', async () => {
  const code = fs.readFileSync(path.join(root, '世界书/控制器/EJS变量规则控制器.txt'), 'utf8');
  const compiled = bindWorldbook(code, worldbookName);
  const calls = [];
  const output = [];
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('getvar', 'getwi', 'print', compiled.slice(compiled.indexOf('<%') + 2, compiled.lastIndexOf('%>')))(
    (key, options) => key === 'stat_data.叙事.首次资料完成' ? true : key === 'stat_data._时空.起源时刻秒' ? 123 : options.defaults,
    async (...args) => { calls.push(args); return '规则内容'; },
    value => output.push(value),
  );
  assert.deepEqual(calls, [[worldbookName, '余烬之后_变量更新规则_日常']]);
  assert(output.join('\n').includes('规则内容'));
  assert.equal(bindWorldbook('普通说明中的 getwi()', worldbookName), '普通说明中的 getwi()');
});
