// 使用本次下载的真实MVU消息处理函数；无需操作用户酒馆或请求模型。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const _ = require('lodash');
const { loadTs } = require('../tools/runtime.cjs');
const { createOpening } = loadTs(path.resolve(__dirname, '../src/opening.ts'));
const { createUninitializedState } = loadTs(path.resolve(__dirname, '../src/presets.ts'));
const { readRuntime } = loadTs(path.resolve(__dirname, '../src/runtime-store.ts'));
const source = fs.readFileSync(path.resolve(__dirname, '../build/verification/mvu-bundle.js'), 'utf8');
const start = source.indexOf('async function Yt(');
const end = source.indexOf('async function Zt(', start);
assert(start >= 0 && end > start, 'MVU构建已变化，请重新定位消息处理函数');
const handlerSource = source.slice(start, end);
async function replay(previous, target) {
  const current = { role: 'assistant', message: '足够长度的正式开场白', data: _.cloneDeep(target) };
  const handler = new Function('getChatMessages', 'At', 'yt', '_', '$t', 'eventEmit', 'ct', 'setChatMessages', 'updateVariablesWith',
    `${handlerSource}; return Yt;`)(
    () => [current], () => _.cloneDeep(previous), { D: () => ({ effective_settings: { 兼容性: { 更新到聊天变量: false } } }) }, _,
    async () => {}, async () => {}, {}, async () => {}, async update => { current.data = update(current.data); },
  );
  await handler(1);
  return current.data;
}
(async () => {
  const session = createOpening({ mode: '默认' }, 'mvu-real-handler');
  const old = await replay({ stat_data: createUninitializedState(), schema: {} }, session);
  assert.equal(old.stat_data._初始化完成, false, '旧流程应复现从首楼继承未初始化状态');
  const fixed = await replay({ ...session, schema: {} }, {});
  assert.equal(fixed.stat_data._初始化完成, true);
  assert.equal(fixed.death_adaptation_runtime, undefined, '真实MVU不会复制任意外层字段');
  assert.deepEqual(readRuntime(fixed), session.death_adaptation_runtime);
  console.log('PASS: real MVU message handler reproduces old uninitialized opening; initialized source and stat_data ledger survive new assistant message. Parser/model/UI not invoked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
