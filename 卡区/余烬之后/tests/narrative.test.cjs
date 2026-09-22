const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const card = path.resolve(__dirname, '..');
const { createOpening } = require('./numerical-fixture.cjs');
const { acceptNarrativeUpdate } = loadTs(path.join(card, 'src/mvu-policy.ts'));
const { applyCommand, validateSession } = loadTs(path.join(card, 'src/engine.ts'));
const { formatGameTime } = loadTs(path.join(card, 'src/game-time.ts'));
const clone = value => JSON.parse(JSON.stringify(value));
const initial = () => createOpening({ mode: '默认' }, 'narrative-test').stat_data;
const turn = (state, seconds, changes = {}) => ({
  ...clone(state),
  叙事: { ...clone(state.叙事), 本轮时间: { 起算起源秒: state._时空.起源时刻秒, 经过本地秒: seconds }, ...changes },
});
const session = state => ({ stat_data: state, death_adaptation_runtime: state._运行账本 });

test('普通对话的本地耗时自动计入权威时间，同时保存场景关系；空更新保持原存档', () => {
  const before = initial();
  assert.equal(formatGameTime(before, 'main').time, '17:50:00');
  assert.deepEqual(clone(acceptNarrativeUpdate(before, before)), clone(before));
  const proposed = turn(before, 180, {
    场景描述: '执勤人员结束交谈，回应锁门通知；巷口传来声响。',
    关系: { guard: { 主体ID: 'player', 对象ID: 'guard', 已发生互动: '帮执勤人员点烟并提醒少抽烟' } },
  });
  const after = acceptNarrativeUpdate(before, proposed);
  assert.equal(after._时空.起源时刻秒, 180);
  assert.equal(formatGameTime(after, 'main').time, '17:53:00');
  assert.equal(after.叙事.关系.guard.已发生互动, proposed.叙事.关系.guard.已发生互动);
  assert.equal(before._时空.起源时刻秒, 0);
  validateSession(session(after));
});

test('重复解析、继承上一轮耗时不重复累计；重抽从前楼分叉，下一轮可继续计时', () => {
  const before = initial();
  const proposed = turn(before, 180);
  const after = acceptNarrativeUpdate(before, proposed);
  assert.deepEqual(clone(acceptNarrativeUpdate(before, proposed)), clone(after));
  assert.deepEqual(clone(acceptNarrativeUpdate(after, proposed)), clone(after));
  assert.deepEqual(clone(acceptNarrativeUpdate(after, after)), clone(after));
  assert.equal(acceptNarrativeUpdate(before, turn(before, 60))._时空.起源时刻秒, 60);
  assert.equal(acceptNarrativeUpdate(after, turn(after, 30))._时空.起源时刻秒, 210);
});

test('按位面倍率换算；旧开发存档兼容；零耗时和错误时间不自动补固定时长', () => {
  const before = initial();
  before._时空.位面目录.main.时钟.本地每起源秒 = 2;
  assert.equal(acceptNarrativeUpdate(before, turn(before, 60))._时空.起源时刻秒, 30);
  assert.equal(acceptNarrativeUpdate(before, turn(before, 0))._结算.状态版本, before._结算.状态版本);
  const old = clone(before);
  delete old.叙事.本轮时间;
  delete old._运行账本;
  assert.equal(acceptNarrativeUpdate(old, turn(old, 60), before._运行账本)._时空.起源时刻秒, 30);
  assert.throws(() => acceptNarrativeUpdate(before, turn(before, -1)));
  const stale = turn(before, 60);
  stale.叙事.本轮时间.起算起源秒 = 99;
  assert.throws(() => acceptNarrativeUpdate(before, stale), /起算/);
});

test('本轮新提案随自动计时调整版本，旧提案保持过期；攻击的6秒只由战斗结算一次', () => {
  let before = initial();
  before = applyCommand(session(before), { id: 'enemy', branchId: 'narrative-test', expectedVersion: 0,
    kind: 'encounter', name: '测试敌人', tier: '普通', mechanism: 'impact' }).session.stat_data;
  before.待审提案.old = { 类型: '行动', 主体ID: 'player', 目标ID: {}, 能力ID: null,
    玩家原文引用: '', 内容: '旧提案', 操作: null, 预期状态版本: before._结算.状态版本 };
  const proposed = turn(before, 30);
  proposed.待审提案.attack = { ...before.待审提案.old, 内容: '攻击', 玩家原文引用: '攻击敌人',
    操作: { kind: 'strike', actorId: 'player', targetId: 'enc-enemy', abilityId: 'basic-attack' } };
  const after = acceptNarrativeUpdate(before, proposed);
  assert.equal(after.待审提案.attack.预期状态版本, after._结算.状态版本);
  assert.equal(after.待审提案.old.预期状态版本, before._结算.状态版本);
  const fought = applyCommand(session(after), { ...after.待审提案.attack.操作, id: 'attack',
    branchId: 'narrative-test', expectedVersion: after._结算.状态版本 }, () => 0.5).session.stat_data;
  const recap = acceptNarrativeUpdate(fought, turn(fought, 0));
  assert.equal(recap._时空.起源时刻秒, 36);
});

test('世界继续流逝可完成重构计时，复苏仍沿用既有规则', () => {
  let state = initial();
  state = applyCommand(session(state), { id: 'death', branchId: 'narrative-test', expectedVersion: 0,
    kind: 'damage', targetId: 'player', causes: [{ sourceId: 'player', mechanismId: 'heat', amount: 150, conditions: '测试热损伤' }] }).session.stat_data;
  const after = acceptNarrativeUpdate(state, turn(state, 600));
  assert.equal(after._复苏.阶段, '可复苏');
  assert.equal(after._实体.player.生命.当前, 0);
  const revived = applyCommand(session(after), { id: 'return', branchId: 'narrative-test', expectedVersion: after._结算.状态版本, kind: 'revive' }).session.stat_data;
  assert.equal(revived._实体.player.生命.当前, 100);
  assert.equal(revived._时空.起源时刻秒, 600);
});
