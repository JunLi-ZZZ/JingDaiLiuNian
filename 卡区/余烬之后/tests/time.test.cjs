const path = require('node:path');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('../tools/runtime.cjs');
const card = path.resolve(__dirname, '..');
const { formatGameTime, revivalRemaining } = loadTs(path.join(card, 'src/game-time.ts'));
const { applyCommand } = loadTs(path.join(card, 'src/engine.ts'));
const { createPreviewSession } = loadTs(path.join(card, '界面/状态栏/preview-state.ts'));
function command(session, id, body) {
  return applyCommand(session, { id, branchId: 'preview', expectedVersion: session.stat_data._结算.状态版本, ...body })
    .session;
}
test('状态栏时间来自剧情刻度，重复读取与电脑时区不改变时间', () => {
  const session = createPreviewSession();
  const before = JSON.stringify(session);
  assert.equal(formatGameTime(session.stat_data, 'main').time, '17:50:00');
  for (let i = 0; i < 100; i++) assert.equal(formatGameTime(session.stat_data, 'main').time, '17:50:00');
  assert.equal(JSON.stringify(session), before);
  for (const file of ['src/game-time.ts', 'src/engine.ts', '界面/状态栏/preview-state.ts']) {
    assert(!/Date\s*\(|Date\.now|Intl\.DateTimeFormat/.test(fs.readFileSync(path.join(card, file), 'utf8')));
  }
});
test('剧情推进五分钟、跨日跨月跨年按自定义历法展示', () => {
  let session = createPreviewSession();
  session = command(session, 'wait', { kind: 'advance', seconds: 300 });
  assert.equal(formatGameTime(session.stat_data, 'main').time, '17:55:00');
  session.stat_data._时空.位面目录.main.时钟.本地基准秒 = 360 * 86400 - 1;
  session.stat_data._时空.起源时刻秒 = 0;
  assert.equal(formatGameTime(session.stat_data, 'main').date, '星见历 1年12月30日');
  session = command(session, 'year', { kind: 'advance', seconds: 1 });
  assert.equal(formatGameTime(session.stat_data, 'main').date, '星见历 2年1月1日');
  assert.equal(formatGameTime(session.stat_data, 'main').time, '00:00:00');
});
test('复苏剩余时长换算成当前位面时间，推进后同步减少', () => {
  let session = createPreviewSession();
  session.stat_data._时空.位面目录.main.时钟.本地每起源秒 = 2;
  session = command(session, 'death', {
    kind: 'damage',
    targetId: 'player',
    causes: [{ sourceId: 'beast', mechanismId: 'electric', amount: 120, conditions: '接触' }],
  });
  assert.equal(revivalRemaining(session.stat_data), '20分');
  session = command(session, 'wait', { kind: 'advance', seconds: 150 });
  assert.equal(revivalRemaining(session.stat_data), '15分');
  assert.equal(formatGameTime(session.stat_data, 'main').time, '17:55:00');
});
test('缺失历法不填电脑日期，无效历法不能展示伪造日期', () => {
  const session = createPreviewSession();
  session.stat_data._时空.位面目录.main.时钟.历法 = null;
  assert.equal(formatGameTime(session.stat_data, 'main').time, '尚未设置历法');
  session.stat_data._时空.位面目录.main.时钟.历法 = {
    名称: '测试',
    元年: 1,
    每月天数: [],
    每天小时: 24,
    每小时分钟: 60,
    每分钟秒: 60,
  };
  assert.throws(() => formatGameTime(session.stat_data, 'main'));
});
