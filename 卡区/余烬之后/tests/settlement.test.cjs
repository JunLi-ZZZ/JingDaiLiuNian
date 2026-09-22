const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const { createOpening } = require('./numerical-fixture.cjs');
const { Schema } = loadTs(path.resolve(__dirname, '../src/schema.ts'));
const { settleProposal } = loadTs(path.resolve(__dirname, '../src/settlement.ts'));
const clone = value => JSON.parse(JSON.stringify(value));
function host() {
  let data = { ...createOpening({ mode: '默认' }, 'branch'), metadata: 'preserved' };
  let queue = Promise.resolve();
  const port = {
    writes: 0,
    page: 'swipe0',
    latest: 2,
    exclusive: (_key, fn) => {
      const p = queue.then(fn);
      queue = p.catch(() => {});
      return p;
    },
    context: () => ({ chatId: 'chat', latestMessageId: port.latest }),
    selection: () => port.page,
    read: () => clone(data),
    write: async next => {
      data = clone(next);
      port.writes++;
    },
    proposal: (id, operation) => {
      const proposal = Schema.shape.待审提案
        .unwrap()
        .valueType.parse({
          内容: '根据当前场景确认',
          玩家原文引用: '攻击它',
          操作: operation,
          预期状态版本: data.stat_data._结算.状态版本,
        });
      data.stat_data.待审提案[id] = proposal;
      return proposal;
    },
  };
  return port;
}
const target = { chatId: 'chat', messageId: 2, selection: 'swipe0' };
test('酒馆事务：遭遇、致死、授予能力、时间推进、复苏、再次防护和释放均持久化', async () => {
  const port = host();
  async function submit(id, operation) {
    return settleProposal(port, target, id, port.proposal(id, operation), () => 0.5);
  }
  let saved = await submit('enc', { kind: 'encounter', name: '雷兽', tier: '致命', mechanism: 'electric' });
  const enemy = saved.stat_data._结算.遭遇ID;
  const abilityId = Object.keys(saved.stat_data._实体[enemy].能力ID)[0];
  saved = await submit('hit', { kind: 'strike', actorId: enemy, targetId: 'player', abilityId });
  assert.equal(saved.stat_data._实体.player.生命.当前, 0);
  assert.equal(saved.stat_data._实体.player.生命阶段, '重构中');
  assert(saved.stat_data._能力['adapt-player-electric']);
  saved = await submit('wait', { kind: 'advance', seconds: 600 });
  saved = await submit('revive', { kind: 'revive' });
  assert.equal(saved.stat_data._实体.player.生命.当前, 100);
  assert.equal(saved.stat_data._时空.起源时刻秒, 606);
  saved = await submit('hit2', { kind: 'strike', actorId: enemy, targetId: 'player', abilityId });
  assert.equal(saved.stat_data._实体.player.生命.当前, 100);
  assert.equal(saved.stat_data._实体.player.资源['adapt-player-electric'].当前, 120);
  saved = await submit('release', {
    kind: 'release',
    actorId: 'player',
    targetId: enemy,
    abilityId: 'adapt-player-electric',
  });
  assert.equal(saved.stat_data._实体[enemy].生命.当前, 120);
  assert.equal(saved.metadata, 'preserved');
  assert.equal(Object.keys(saved.stat_data.待审提案).length, 0);
  assert.equal(Object.keys(saved.death_adaptation_runtime.events).length, 6);
});
test('重复点击不重掷、不重复保存，过期/历史/换页/改提案拒绝写入', async () => {
  const port = host();
  const proposal = port.proposal('wait', { kind: 'advance', seconds: 10 });
  const result = await Promise.allSettled([
    settleProposal(port, target, 'wait', proposal),
    settleProposal(port, target, 'wait', proposal),
  ]);
  assert.equal(result.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(port.writes, 1);
  const pending = port.proposal('next', { kind: 'advance', seconds: 10 });
  port.latest = 4;
  await assert.rejects(settleProposal(port, target, 'next', pending), /历史楼层/);
  port.latest = 2;
  port.page = 'swipe1';
  await assert.rejects(settleProposal(port, target, 'next', pending), /消息已编辑/);
  port.page = 'swipe0';
  await assert.rejects(settleProposal(port, target, 'next', { ...pending, 内容: '篡改' }), /提案已变更/);
  assert.equal(port.writes, 1);
});
test('模型任意伤害与数值被严格schema拒绝；未实现/存档失败不假报成功', async () => {
  const port = host();
  assert.throws(() => port.proposal('raw', { kind: 'damage', amount: 999 }));
  assert.throws(() => port.proposal('raw', { kind: 'advance', seconds: 1, damage: 999 }));
  const proposal = port.proposal('wait', { kind: 'advance', seconds: 1 });
  port.write = async () => {};
  await assert.rejects(settleProposal(port, target, 'wait', proposal), /回读校验/);
});
