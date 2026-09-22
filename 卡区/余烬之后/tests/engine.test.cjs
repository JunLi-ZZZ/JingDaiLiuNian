const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const card = path.resolve(__dirname, '..');
const { Schema } = loadTs(path.join(card, 'src/schema.ts'));
const { startSession, applyCommand, localTime, trialRules, validateSession } = loadTs(path.join(card, 'src/engine.ts'));
const clone = value => JSON.parse(JSON.stringify(value));

function setup(overrides = {}) {
  const session = startSession({
    branchId: 'test-branch',
    mode: '默认',
    opportunity: '测试：接触种核后取得权能',
    location: Schema.shape._时空.unwrap().shape.当前地点.parse({ 位面ID: 'main', 地点ID: 'square' }),
    localSecondsPerOriginSecond: 2,
    life: 100,
    rules: trialRules,
    ...overrides,
  });
  session.stat_data = Schema.parse({
    ...session.stat_data,
    _实体: {
      ...session.stat_data._实体,
      hazard: {
        名称: '雷兽',
        类别: '生物',
        种族ID: 'thunder-beast',
        生命: { 当前: 200, 上限: 200 },
        位面ID: 'main',
        地点ID: 'square',
        数值规则版本: 'trial-1',
      },
    },
  });
  return session;
}
const cmd = (session, id, body) => ({
  id,
  branchId: session.stat_data._结算.分支ID,
  expectedVersion: session.stat_data._结算.状态版本,
  ...body,
});
const hit = (amount = 120, mechanismId = 'electric') => ({
  kind: 'damage',
  targetId: 'player',
  causes: [{ sourceId: 'hazard', mechanismId, amount, conditions: '接触放电' }],
});
function step(session, id, body) {
  return applyCommand(session, cmd(session, id, body)).session;
}
function resurrect(session) {
  session = step(session, 'wait', { kind: 'advance', seconds: 600 });
  return step(session, 'return', { kind: 'revive' });
}

test('开局没有伪造死亡；自定义档案不混入默认主角身份，规则保存副本', () => {
  const session = setup({ mode: '自定义', profile: { 姓名: '风旅者', 种族: '元素生命' } });
  assert.equal(session.stat_data._开局.档案.身份, '');
  assert.equal(session.stat_data._开局.档案.原世界, '');
  assert.equal(Object.values(session.stat_data._能力).filter(a => a.来源.类型 === "死亡").length, 0);
  assert.equal(Object.keys(session.stat_data._死亡记录).length, 0);
  const rules = clone(trialRules);
  const separate = setup({ rules });
  rules.revivalSeconds = 1;
  assert.equal(separate.death_adaptation_runtime.rules.revivalSeconds, 600);
});

test('同种同名实体以不同ID保存，多形态不强制兽娘；任务默认不存在', () => {
  const session = setup();
  session.stat_data = Schema.parse({
    ...session.stat_data,
    _实体: {
      ...session.stat_data._实体,
      hazard2: {
        ...session.stat_data._实体.hazard,
        当前形态ID: 'mist',
        形态: { mist: { 名称: '雷雾', 描述: '电离云团' } },
      },
    },
  });
  validateSession(session);
  assert.equal(session.stat_data._实体.hazard.名称, session.stat_data._实体.hazard2.名称);
  assert.equal(Object.keys(session.stat_data._实体).length, 3);
  assert.equal(session.stat_data._实体.hazard2.形态.mist.名称, '雷雾');
  assert.equal(Object.keys(session.stat_data._任务).length, 0);
});

test('非致死伤害不奖励；致死后生成能力与重构记录，同一事件幂等', () => {
  let session = setup();
  session = step(session, 'scratch', hit(10));
  assert.equal(session.stat_data._实体.player.生命.当前, 90);
  assert.equal(Object.values(session.stat_data._能力).filter(a => a.来源.类型 === "死亡").length, 0);
  const request = cmd(session, 'death', hit());
  const next = applyCommand(session, request);
  assert.equal(session.stat_data._实体.player.生命.当前, 90);
  assert.equal(next.session.stat_data._实体.player.生命阶段, '重构中');
  assert.equal(next.session.stat_data._能力['adapt-player-electric'].用法, '复合');
  assert.equal(next.session.stat_data._复苏.完成起源秒, 600);
  const replay = applyCommand(next.session, request);
  assert.equal(replay.replayed, true);
  assert.deepEqual(clone(replay.session), clone(next.session));
  assert.throws(() => applyCommand(next.session, { ...request, causes: hit(999).causes }));
});

test('死亡期间世界和任务期限推进，复苏不回滚时间、叙事与掉落', () => {
  let session = setup();
  session.stat_data = Schema.parse({
    ...session.stat_data,
    _任务: { delivery: { 名称: '限时交付', 状态: '进行中', 截止起源秒: 300 } },
    _物品: {
      bag: { 名称: '旅行包', 所在: { 类型: '实体', ID: 'player' } },
      charm: { 名称: '绑定挂坠', 所在: { 类型: '实体', ID: 'player' }, 复苏绑定实体ID: 'player' },
    },
    叙事: { 天气: '雨', 关系: { witness: { 主体ID: 'hazard', 对象ID: 'player', 已发生互动: '目击倒下' } } },
  });
  session.stat_data._实体.player.装备 = { 手持: 'bag', 饰品: 'charm' };
  session = step(session, 'death', hit());
  assert.throws(() => step(session, 'too-early', { kind: 'revive' }));
  session = resurrect(session);
  assert.equal(session.stat_data._时空.起源时刻秒, 600);
  assert.equal(localTime(session.stat_data, 'main'), 1200);
  assert.equal(session.stat_data._任务.delivery.状态, '已失效');
  assert.equal(session.stat_data.叙事.关系.witness.已发生互动, '目击倒下');
  assert.equal(session.stat_data._物品.bag.所在.类型, '地点');
  assert.equal(session.stat_data._物品.charm.所在.类型, '实体');
  assert.equal(session.stat_data._实体.player.装备.手持, undefined);
  assert.equal(session.stat_data._实体.player.装备.饰品, 'charm');
  assert.equal(Object.keys(session.stat_data._物品).length, 2);
  assert.equal(session.stat_data._实体.player.生命.当前, 100);
  assert.equal(session.stat_data._死亡记录.death.复苏完成起源秒, 600);
});

test('复苏后相同攻击不会再次致死，蓄能可以主动释放而不只是抗性', () => {
  let session = resurrect(step(setup(), 'death', hit()));
  session = step(session, 'same-attack', hit());
  assert.equal(session.stat_data._实体.player.生命.当前, 100);
  assert.equal(session.stat_data._实体.player.资源['adapt-player-electric'].当前, 120);
  session = step(session, 'release', {
    kind: 'release',
    actorId: 'player',
    targetId: 'hazard',
    abilityId: 'adapt-player-electric',
  });
  assert.equal(session.stat_data._实体.hazard.生命.当前, 80);
  assert.equal(session.stat_data._实体.player.资源['adapt-player-electric'].当前, 0);
  assert.equal(Object.keys(session.stat_data._死亡记录).length, 1);
  assert.throws(() =>
    step(session, 'empty-release', {
      kind: 'release',
      actorId: 'player',
      targetId: 'hazard',
      abilityId: 'adapt-player-electric',
    }),
  );
});

test('更强同类攻击强化已有能力，不复制能力；新机制另行判定', () => {
  let session = resurrect(step(setup(), 'death', hit()));
  session = step(session, 'stronger', hit(250));
  assert.equal(Object.values(session.stat_data._能力).filter(a => a.来源.类型 === "死亡").length, 1);
  assert.equal(session.stat_data._能力['adapt-player-electric'].效果.guard.参数.capacity, 250);
  assert.equal(Object.keys(session.stat_data._能力['adapt-player-electric'].成长记录).length, 2);
  let other = resurrect(step(setup(), 'death', hit()));
  other = step(other, 'fire', hit(120, 'heat'));
  assert.equal(Object.values(other.stat_data._能力).filter(a => a.来源.类型 === "死亡").length, 2);
});

test('复合攻击按顺序记录直接死因，未知后续机制使整笔失败且不扣血', () => {
  const session = setup();
  const body = { ...hit(), causes: [...hit(20, 'heat').causes, ...hit(90, 'electric').causes] };
  const next = step(session, 'combined', body);
  assert.equal(next.stat_data._死亡记录.combined.因果链.cause1.直接致死, false);
  assert.equal(next.stat_data._死亡记录.combined.因果链.cause2.直接致死, true);
  assert.equal(next.stat_data._死亡记录.combined.因果链.cause2.实际伤害, 80);
  assert.equal(next.stat_data._能力['adapt-player-electric'].效果.guard.参数.capacity, 90);
  const before = clone(session);
  assert.throws(() =>
    step(session, 'invalid', { ...hit(), causes: [...hit(20).causes, ...hit(80, 'unknown').causes] }),
  );
  assert.deepEqual(clone(session), before);
});

test('跨地点释放、错误分支、过期状态、非法数字和失效锚点均无部分提交', () => {
  let session = resurrect(step(setup(), 'death', hit()));
  session = step(session, 'charge', hit());
  session.stat_data._实体.hazard.地点ID = 'elsewhere';
  const before = clone(session);
  assert.throws(() =>
    step(session, 'bad-target', {
      kind: 'release',
      actorId: 'player',
      targetId: 'hazard',
      abilityId: 'adapt-player-electric',
    }),
  );
  assert.equal(session.stat_data._实体.player.资源['adapt-player-electric'].当前, 120);
  for (const seconds of [-1, NaN, Infinity])
    assert.throws(() => step(session, 'bad-time', { kind: 'advance', seconds }));
  assert.throws(() =>
    applyCommand(session, { ...cmd(session, 'branch', { kind: 'advance', seconds: 1 }), branchId: 'other' }),
  );
  assert.throws(() =>
    applyCommand(session, { ...cmd(session, 'old', { kind: 'advance', seconds: 1 }), expectedVersion: 0 }),
  );
  assert.deepEqual(clone(session), before);
  let dead = step(setup(), 'death', hit());
  dead = step(dead, 'wait', { kind: 'advance', seconds: 600 });
  dead.stat_data._锚点.start.状态 = '失效';
  assert.throws(() => step(dead, 'revive', { kind: 'revive' }));
  assert.equal(dead.stat_data._实体.player.生命阶段, '重构中');
});

test('序列化恢复保留去重记录，独立存档互不污染', () => {
  const session = setup();
  const request = cmd(session, 'tick', { kind: 'advance', seconds: 20 });
  const stored = clone(applyCommand(session, request).session);
  assert.equal(applyCommand(stored, request).replayed, true);
  assert.equal(setup().stat_data._时空.起源时刻秒, 0);
  assert.equal(session.stat_data._时空.起源时刻秒, 0);
});

module.exports = { setup, cmd, hit };
