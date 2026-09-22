const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const root = path.resolve(__dirname, '..');
const { createOpening } = require('./numerical-fixture.cjs');
const { acceptNarrativeUpdate } = loadTs(path.join(root, 'src/mvu-policy.ts'));
const { applyCommand } = loadTs(path.join(root, 'src/engine.ts'));
const { projectPromptState } = loadTs(path.join(root, 'src/prompt-view.ts'));
const { MvuInputSchema } = loadTs(path.join(root, 'src/schema.ts'));
const clone = x => JSON.parse(JSON.stringify(x));
const start = () => createOpening({ mode: '默认' }, 'story');
function turn(state, operations = [], seconds = 0) {
  const p = clone(state);
  p.叙事.本轮时间 = { 起算起源秒: state._时空.起源时刻秒, 经过本地秒: seconds };
  p.叙事.本轮结算 = { 起算状态版本: state._结算.状态版本, 操作: operations };
  return p;
}
test('实际回复的致命危险自动死亡、获得能力，复苏后同类伤害转为储能并可用于环境', () => {
  const s = start().stat_data;
  assert(s._实体.player.能力ID['origin-rebirth']);
  const hazard = { kind: 'exposure', source: '破损闸门', mechanism: 'electric', mechanismName: '电击', abilityName: '电荷转移', amount: 150, conditions: '触及通电导体，持续放电' };
  const dead = acceptNarrativeUpdate(s, turn(s, [hazard]));
  assert.equal(dead._实体.player.生命.当前, 0);
  assert.equal(dead._实体.player.生命阶段, '重构中');
  assert(dead._实体.player.能力ID['adapt-player-electric']);
  assert.deepEqual(clone(acceptNarrativeUpdate(dead, turn(s, [hazard]))), clone(dead));
  const alive = acceptNarrativeUpdate(dead, turn(dead, [{ kind: 'revive' }], 600));
  assert.equal(alive._实体.player.生命阶段, '存活');
  const charged = acceptNarrativeUpdate(alive, turn(alive, [hazard]));
  assert.equal(charged._实体.player.生命.当前, 100);
  assert.equal(charged._实体.player.资源['adapt-player-electric'].当前, 150);
  const used = acceptNarrativeUpdate(charged, turn(charged, [{ kind: 'channel', abilityId: 'adapt-player-electric', amount: 20, purpose: '给闸门电机供电' }]));
  assert.equal(used._实体.player.资源['adapt-player-electric'].当前, 130);
  assert.equal(used._时空.起源时刻秒, 600);
});
test('旅行可抵达未预写的世界，返回后规则和时钟仍存在；继承旧操作不重复旅行', () => {
  const before = start().stat_data;
  const move = { kind: 'travel', planeId: 'glass-sea', name: '玻璃海', description: '记忆凝成玻璃的海洋，潜水者交易梦境；声音能打碎潮汐。', locationId: 'pier', location: '无声码头', route: '旧渡口的雾中渡船', rate: 2 };
  const after = acceptNarrativeUpdate(before, turn(before, [move], 60));
  assert.equal(after._时空.当前地点.位面ID, 'glass-sea');
  assert.equal(after._时空.位面目录['glass-sea'].简介, move.description);
  assert.equal(after._时空.位面目录['glass-sea'].时钟.本地每起源秒, 2);
  assert.equal(after._时空.起源时刻秒, 60);
  assert.equal(after._锚点.start.位面ID, 'glass-sea');
  assert.deepEqual(clone(acceptNarrativeUpdate(after, after)), clone(after));
});

test('庭院重构与肉体归来分阶段，同轮跨越重构须在死亡之后计时', () => {
  const s = start().stat_data;
  const hit = { kind: 'exposure', source: '断裂电缆', mechanism: 'electric', mechanismName: '电击', abilityName: '电荷转移', amount: 300, conditions: '持续放电' };
  assert.throws(() => acceptNarrativeUpdate(s, turn(s, [hit, { kind:'revive' }], 30)), /尚未到复苏时间/);
  assert.equal(s._实体.player.生命.当前, 100);
  const recovered = clone(s);
  recovered._更新错误 = '尚未到复苏时间';
  assert.equal(projectPromptState(recovered).上轮结算反馈, '尚未到复苏时间');
  const dead = acceptNarrativeUpdate(recovered, turn(recovered, [hit], 30));
  assert.equal(dead._更新错误, '');
  assert.equal(dead._复苏.完成起源秒, 630);
  const complete = acceptNarrativeUpdate(s, turn(s, [hit, {kind:'advance', seconds:600}, {kind:'revive'}], 30));
  assert.equal(complete._时空.起源时刻秒, 630);
  assert.equal(complete._实体.player.生命阶段, '存活');
});

test('MVU接收层保留无效行动，提交层整体拒绝，时间不会单独推进', () => {
  const s = start().stat_data;
  const input = MvuInputSchema.parse(turn(s, [{kind:'channel', abilityId:'adapt-player-electric', amount:0, purpose:'给电机供电'}], 25));
  assert.equal(input.叙事.本轮结算.操作[0].amount, 0);
  assert.equal(input.叙事.本轮时间.经过本地秒, 25);
  assert.throws(() => acceptNarrativeUpdate(s, input), /消耗储能必须大于0/);
  assert.equal(s._时空.起源时刻秒, 0);
  assert.equal(s._实体.player.生命.当前, 100);
  const invalidTime = MvuInputSchema.parse(turn(s, [], -5));
  assert.equal(invalidTime.叙事.本轮时间.经过本地秒, -5);
  assert.throws(() => acceptNarrativeUpdate(s, invalidTime));
});
test('新死因可形成独立能力，已有防护不能挡住另一机制；失败批次保持原存档', () => {
  const s = start().stat_data;
  const op = { kind: 'exposure', source: '深海压强', mechanism: 'pressure', mechanismName: '高压压迫', abilityName: '等压外壳', amount: 180, conditions: '降入高压深海' };
  const after = acceptNarrativeUpdate(s, turn(s, [op]));
  assert(after._能力['adapt-player-pressure']);
  const original = clone(s);
  assert.throws(() => acceptNarrativeUpdate(s, turn(s, [op, {kind:'channel', abilityId:'absent', amount:1, purpose:'测试'}])));
  assert.deepEqual(clone(s), original);
});
test('见闻工作集有上限，合并与删除保持有效，历史正文和归档不反复注入', () => {
  const s = start().stat_data;
  const p = turn(s);
  for (let i=0; i<40; i++) p.叙事.见闻['note'+i] = {类别:'事件', 对象ID:'n'+i, 标题:'线索'+i, 内容:'记录'+i, 可信度:'观察', 来源:'现场', 知情者ID:{player:true}};
  const after = acceptNarrativeUpdate(s, p);
  assert.equal(Object.keys(after.叙事.见闻).length, 24);
  assert.equal(Object.keys(after._见闻档案).length, 16);
  const next = turn(after);
  delete next.叙事.见闻.note39;
  next.叙事.记忆摘要 = '已解决渡口事故，约定返回探望许灯。';
  const edited = acceptNarrativeUpdate(after, next);
  assert(!edited.叙事.见闻.note39);
  assert.equal(edited.叙事.记忆摘要, next.叙事.记忆摘要);
});

test('模型视图只包含当前位面，档案与规则没有文件名和开局大纲；长期游玩提示词有界', () => {
  const s = start().stat_data;
  const a = projectPromptState(s);
  assert.deepEqual(Object.keys(a._时空.位面目录), ['main']);
  assert(!JSON.stringify(a).includes('世界书条目":"余烬之后'));
  assert(!JSON.stringify(a).includes('场景设定'));
  assert.equal(a._能力['origin-rebirth'].名称, '起源涅槃');
  for (let i=0;i<1000;i++) {
    s._见闻档案['old'+i] = {内容:'归档内容'.repeat(40)};
    s.叙事.见闻['note'+i] = {类别:'事件', 对象ID:'n'+i, 标题:'线索', 内容:'内容', 可信度:'观察', 来源:'现场', 知情者ID:{player:true}};
  }
  const b = projectPromptState(s);
  assert(Object.keys(b.叙事.见闻).length <= 10);
  assert(!JSON.stringify(b).includes('归档内容'));
  assert(JSON.stringify(b).length < JSON.stringify(a).length + 2500);
});

test('首次完整填写后切日常，日常增量修改不清除其余资料', () => {
  const s = start().stat_data;
  assert.equal(s._初始化完成, true);
  assert.equal(s.叙事.首次资料完成, false);
  const first = turn(s);
  Object.assign(first.叙事, {首次资料完成:true, 天气:'细雨', 场景描述:'旧渡口救援', 记忆摘要:'种核初醒'});
  first.叙事.关系.helper = {主体ID:'player', 对象ID:'helper', 已发生互动:'求援', 已表达态度:'焦急', 已有约定:''};
  const after = acceptNarrativeUpdate(s, first);
  const daily = turn(after, [], 10);
  daily.叙事.场景描述 = '闸门开启';
  const next = acceptNarrativeUpdate(after, daily);
  assert.equal(next.叙事.首次资料完成, true);
  assert.deepEqual(clone(next.叙事.关系), clone(after.叙事.关系));
  assert.equal(next.叙事.记忆摘要, '种核初醒');
});
