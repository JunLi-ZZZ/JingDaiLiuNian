const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const root = path.resolve(__dirname, '..');
const { applyCommand } = loadTs(path.join(root, 'src/engine.ts'));
const { calculateAttack } = loadTs(path.join(root, 'src/combat.ts'));
const { createPreviewSession } = loadTs(path.join(root, '界面/状态栏/preview-state.ts'));
const { resolveBattleCard, battleToken } = loadTs(path.join(root, 'src/output-cards.ts'));
const command = (s, id, body = {}) => ({
  kind: 'strike',
  actorId: 'player',
  targetId: 'beast',
  abilityId: 'strike',
  id,
  branchId: 'preview',
  expectedVersion: s.stat_data._结算.状态版本,
  ...body,
});
const stats = { 攻击: 100, 防御: 100, 命中率: 1, 闪避率: 0, 暴击率: 0, 暴击倍率: 2, 抗性: {} };

test('攻防、抗性与暴击按统一公式计算；完全抗性不强制扣一点血', () => {
  const calc = (a, d, random = () => 0.5) => calculateAttack(a, d, 'electric', 1, 0, random);
  assert.equal(calc(stats, stats).damage, 50);
  assert.equal(calc({ ...stats, 暴击率: 1 }, stats).damage, 100);
  assert.equal(calc(stats, { ...stats, 抗性: { electric: 0.5 } }).damage, 25);
  assert.equal(calc(stats, { ...stats, 抗性: { electric: 1 } }).damage, 0);
  assert.equal(calc(stats, { ...stats, 抗性: { electric: -1 } }).damage, 100);
  assert.throws(() => calc({ ...stats, 暴击率: 1.1 }, stats));
  assert.throws(() => calc(stats, stats, () => 1));
});
test('概率边界、未命中不掷暴击，未命中仍消耗行动与能量', () => {
  let calls = 0;
  const miss = calculateAttack({ ...stats, 命中率: 0.5 }, stats, 'electric', 1, 0, () => {
    calls++;
    return 0.5;
  });
  assert.equal(miss.hit, false);
  assert.equal(calls, 1);
  const s = createPreviewSession();
  const next = applyCommand(s, command(s, 'miss'), () => 0.99).session;
  assert.equal(next.stat_data._实体.player.资源.energy.当前, 40);
  assert.equal(next.stat_data._实体.beast.生命.当前, 200);
  assert.equal(next.stat_data._时空.起源时刻秒, 6);
});
test('技能扣费、冷却、时间与伤害原子提交；重复事件不重掷', () => {
  const s = createPreviewSession();
  const request = command(s, 'hit');
  const next = applyCommand(s, request, () => 0.5).session;
  assert.equal(next.stat_data._实体.beast.生命.当前, 154);
  assert.equal(next.stat_data._实体.player.资源.energy.当前, 40);
  assert.equal(next.stat_data._结算.冷却结束['player:strike'], 18);
  const before = JSON.stringify(next);
  assert.throws(() => applyCommand(next, command(next, 'early'), () => 0.5), /冷却/);
  assert.equal(JSON.stringify(next), before);
  assert.equal(
    applyCommand(next, request, () => {
      throw Error('不能重掷');
    }).replayed,
    true,
  );
  let ready = applyCommand(next, command(next, 'wait', { kind: 'advance', seconds: 12 })).session;
  ready = applyCommand(ready, command(ready, 'again'), () => 0.5).session;
  assert.equal(ready.stat_data._实体.player.资源.energy.当前, 30);
});
test('缺失数值、资源不足、跨地点和未知效果不扣费不写入', () => {
  for (const change of [
    s => {
      s.stat_data._实体.player.战斗 = null;
    },
    s => {
      s.stat_data._实体.player.资源.energy.当前 = 0;
    },
    s => {
      s.stat_data._实体.beast.地点ID = 'elsewhere';
    },
    s => {
      s.stat_data._能力.strike.效果.hit.规则ID = 'unknown';
    },
  ]) {
    const s = createPreviewSession();
    change(s);
    const before = JSON.stringify(s);
    assert.throws(() => applyCommand(s, command(s, 'invalid'), () => 0.5));
    assert.equal(JSON.stringify(s), before);
  }
});
test('攻防计算接死亡适应，复苏不回退时间；再次受击适应转移', () => {
  let s = createPreviewSession();
  const attack = id => command(s, id, { actorId: 'beast', targetId: 'player', abilityId: 'arc' });
  s = applyCommand(s, attack('death'), () => 0.5).session;
  assert.equal(s.stat_data._实体.player.生命.当前, 0);
  assert.equal(s.stat_data._复苏.完成起源秒, 606);
  assert.equal(s.stat_data._能力['adapt-player-electric'].效果.guard.参数.capacity, 120);
  s = applyCommand(s, command(s, 'wait', { kind: 'advance', seconds: 600 })).session;
  s = applyCommand(s, command(s, 'revive', { kind: 'revive' })).session;
  s = applyCommand(s, attack('adapted'), () => 0.5).session;
  assert.equal(s.stat_data._实体.player.生命.当前, 100);
  assert.equal(s.stat_data._实体.player.资源['adapt-player-electric'].当前, 120);
  assert.equal(s.stat_data._时空.起源时刻秒, 612);
  assert.equal(s.death_adaptation_runtime.events.adapted.battle.absorbed, 120);
});
test('正文卡片只引用既有事件，拒绝伪造伤害/错分支；隐藏敌方生命与防御', () => {
  let s = createPreviewSession();
  s = applyCommand(s, command(s, 'hit'), () => 0.5).session;
  const token = battleToken(s, 'hit');
  const card = resolveBattleCard(s, token);
  assert.equal(card.damage, 46);
  assert.equal(card.hp, null);
  assert.equal(card.defense, undefined);
  assert.throws(() => resolveBattleCard(s, token.replace('preview', 'other')));
  assert.throws(() => resolveBattleCard(s, token.replace('"事件ID":"hit"', '"事件ID":"hit","伤害":999')));
  assert.throws(() => resolveBattleCard(s, battleToken(s, 'missing')));
});
