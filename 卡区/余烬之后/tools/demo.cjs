const fs = require('node:fs');
const path = require('node:path');
const { loadTs } = require('./runtime.cjs');
const card = path.resolve(__dirname, '..');
const { Schema } = loadTs(path.join(card, 'src/schema.ts'));
const { startSession, applyCommand, localTime, trialRules } = loadTs(path.join(card, 'src/engine.ts'));
let session = startSession({
  branchId: 'demo',
  mode: '默认',
  opportunity: '测试开局：接触种核，已取得起源涅槃。',
  location: Schema.shape._时空.unwrap().shape.当前地点.parse({ 位面ID: 'main', 地点ID: 'square', 场景: '测试广场' }),
  localSecondsPerOriginSecond: 1,
  life: 100,
  rules: trialRules,
});
session.stat_data = Schema.parse({
  ...session.stat_data,
  _实体: {
    ...session.stat_data._实体,
    beast: {
      名称: '雷兽',
      类别: '生物',
      种族ID: 'thunder-beast',
      位面ID: 'main',
      地点ID: 'square',
      生命: { 当前: 200, 上限: 200 },
      数值规则版本: 'trial-1',
    },
  },
  _任务: { meet: { 名称: '赶上约定时间', 状态: '进行中', 截止起源秒: 300 } },
  _物品: { bag: { 名称: '旅行包', 所在: { 类型: '实体', ID: 'player' } } },
});
const rows = [];
function run(id, body) {
  const command = { id, branchId: 'demo', expectedVersion: session.stat_data._结算.状态版本, ...body };
  const result = applyCommand(session, command);
  session = result.session;
  rows.push(
    `| ${id} | ${result.result} | ${session.stat_data._实体.player.生命.当前} | ${localTime(session.stat_data, 'main')} |`,
  );
}
const attack = {
  kind: 'damage',
  targetId: 'player',
  causes: [{ sourceId: 'beast', mechanismId: 'electric', amount: 120, conditions: '身体接触放电范围' }],
};
run('first-death', attack);
run('world-continues', { kind: 'advance', seconds: 600 });
run('revival', { kind: 'revive' });
run('same-attack', attack);
run('release', { kind: 'release', actorId: 'player', targetId: 'beast', abilityId: 'adapt-player-electric' });
const output = `# 余烬之后：结算闭环演示\n\n由 npm run demo 生成。固定输入用于检查程序行为，不是玩家已发生的经历，也不是正式平衡方案。\n\n测试规则：主角生命 100、雷兽生命 200、攻击强度 120、复苏耗时 600 起源秒、当前位面时间倍率 1。\n\n| 步骤 | 结算 | 主角生命 | 本地时间（秒） |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n- 雷兽剩余生命：${session.stat_data._实体.beast.生命.当前}。\n- 截止时间为 300 秒的任务：${session.stat_data._任务.meet.状态}。\n- 旅行包仍在：${session.stat_data._物品.bag.所在.ID}（${session.stat_data._物品.bag.所在.类型}）。\n- 死亡记录：${Object.keys(session.stat_data._死亡记录).length} 次；已获得能力：${Object.keys(session.stat_data._能力).length} 项。\n- 全程没有调用模型、改写酒馆存档或修改其他卡。\n`;
fs.writeFileSync(path.join(card, 'docs/history/结算演示.md'), output, 'utf8');
console.log(output);
