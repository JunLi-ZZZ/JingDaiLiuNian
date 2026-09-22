const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const YAML = require('yaml');
const { loadTs } = require('../tools/runtime.cjs');
const card = path.resolve(__dirname, '..');
const source = card;
const { Schema } = loadTs(path.join(source, 'src/schema.ts'));
const { createUninitializedState, presetPlanes, defaultProtagonist } = loadTs(path.join(source, 'src/presets.ts'));
const { acceptNarrativeUpdate } = loadTs(path.join(source, 'src/mvu-policy.ts'));
const plain = value => JSON.parse(JSON.stringify(value));
const read = relative => fs.readFileSync(path.join(card, relative), 'utf8');
const manifest = YAML.parse(read('世界书条目清单.yaml')).条目;

async function renderController(name, state) {
  const content = read(`世界书/控制器/${name}.txt`);
  const code = content.slice(content.indexOf('<%') + 2, content.lastIndexOf('%>'));
  const calls = [];
  const output = [];
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('getvar', 'getwi', 'print', code)(
    (key, options) => key.split('.').reduce((value, part) => value?.[part], { stat_data: state }) ?? options.defaults,
    async name => {
      calls.push(name);
      return `BODY:${name}`;
    },
    value => output.push(value),
  );
  return { calls, output };
}

test('初始化可重复解析，不自动选主角、授予能力或确定时钟倍率', () => {
  const initial = createUninitializedState();
  assert.deepEqual(plain(Schema.parse(initial)), plain(initial));
  assert.equal(initial._开局.模式, '待选择');
  assert.equal(initial._开局.起源涅槃已获得, false);
  assert.deepEqual(Object.keys(initial._能力), []);
  assert.equal(initial._复苏, null);
  assert.equal(Object.keys(initial._时空.位面目录).length, 6);
  for (const plane of Object.values(initial._时空.位面目录)) {
    assert.equal(plane.已发现, false);
    assert.equal(plane.时钟.本地每起源秒, null);
  }
});

test('默认与自定义主角使用同一结构；名称变化不改变稳定ID', () => {
  const state = createUninitializedState();
  state._开局.模式 = '默认';
  state._开局.档案 = defaultProtagonist;
  Schema.parse(state);
  state._开局.模式 = '自定义';
  state._开局.档案 = { ...defaultProtagonist, 姓名: '自定义旅人', 种族: '元素生命', 原世界: '新世界' };
  state._实体.player = { 名称: '自定义旅人', 类别: '主角' };
  const parsed = Schema.parse(state);
  parsed._实体.player.名称 = '改名后的旅人';
  assert.equal(Schema.parse(parsed)._开局.主角ID, 'player');
  assert.equal(parsed._实体.player.生命, null);
  assert.equal(parsed._开局.档案.种族, '元素生命');
});

test('模型替换或删除权威根字段时保留旧状态，合法叙事与提案可以更新', () => {
  const state = createUninitializedState();
  state._实体.player = { 名称: '旅人', 类别: '主角', 生命: { 当前: 12, 上限: 20 } };
  state._时空.当前地点.位面ID = 'main';
  const before = Schema.parse(state);
  const proposed = {
    ...plain(before),
    _卡标识: 'other',
    _实体: null,
    _死亡记录: { forged: {} },
    _时空: {},
    _初始化完成: true,
  };
  proposed.叙事.天气 = '雨';
  proposed.待审提案 = { request1: { 类型: '行动', 主体ID: 'player', 内容: '寻找遮雨处' } };
  const after = acceptNarrativeUpdate(before, proposed);
  for (const key of Object.keys(before).filter(key => key.startsWith('_')))
    assert.deepEqual(plain(after[key]), plain(before[key]));
  assert.equal(after.叙事.天气, '雨');
  assert.equal(after.待审提案.request1.类型, '行动');
  assert.deepEqual(plain(acceptNarrativeUpdate(before, {})), plain(before));
  assert.throws(() => acceptNarrativeUpdate(before, { 叙事: { 见闻: { invalid: { 可信度: '全知' } } } }));
});

test('复合死因、死亡能力来源和复苏时刻在序列化后保持', () => {
  const state = createUninitializedState();
  state._死亡记录.death1 = {
    因果链: {
      cause1: { 顺序: 1, 机制ID: 'heat', 实际伤害: 8 },
      cause2: { 顺序: 2, 机制ID: 'hypoxia', 直接致死: true },
    },
    授予能力ID: { breath1: true },
    能力授予状态: '已完成',
  };
  state._能力.breath1 = { 名称: '闭息循环', 来源: { 类型: '死亡', 死亡事件ID: 'death1' } };
  state._复苏 = { 死亡事件ID: 'death1', 锚点ID: null, 开始起源秒: 120, 完成起源秒: null, 规则ID: '', 阶段: '待确定' };
  const parsed = Schema.parse(state);
  assert.deepEqual(plain(Schema.parse(plain(parsed))), plain(parsed));
  assert.equal(parsed._死亡记录.death1.因果链.cause2.直接致死, true);
  assert.equal(parsed._复苏.完成起源秒, null);
});

test('EJS只加载当前位面；空值、伪造ID不回退加载其他世界', async () => {
  const state = createUninitializedState();
  for (const [id, name] of Object.entries(presetPlanes)) {
    state._时空.当前地点.位面ID = id;
    const rendered = await renderController('EJS位面控制器', state);
    assert.deepEqual(rendered.calls, [`余烬之后_位面_${name}`]);
  }
  for (const id of ['', 'main/cangming', '__proto__', 'unknown']) {
    state._时空.当前地点.位面ID = id;
    assert.deepEqual((await renderController('EJS位面控制器', state)).calls, []);
  }
  state._时空.当前地点.位面ID = 'custom1';
  state._时空.位面目录.custom1 = { 来源: '生成', 名称: '玻璃海', 简介: '玻璃构成的海洋' };
  const custom = await renderController('EJS位面控制器', state);
  assert.deepEqual(custom.calls, []);
  assert(custom.output.join('').includes('玻璃构成的海洋'));
  assert.deepEqual((await renderController('EJS变量规则控制器', state)).calls, ['余烬之后_变量更新规则_首次']);
  state._初始化完成 = true;
  assert.deepEqual((await renderController('EJS变量规则控制器', state)).calls, ['余烬之后_变量更新规则_首次']);
  state.叙事.首次资料完成 = true;
  assert.deepEqual((await renderController('EJS变量规则控制器', state)).calls, ['余烬之后_变量更新规则_日常']);
});

test('清单文件与关闭的getwi目标齐全；initvar与代码结构一致', () => {
  assert.equal(new Set(manifest.map(entry => entry.名称)).size, manifest.length);
  for (const entry of manifest) {
    assert(
      ['.yaml', '.txt'].some(ext => fs.existsSync(path.join(card, entry.文件 + ext))),
      entry.文件,
    );
    if (entry.名称.startsWith('余烬之后_位面_') || entry.名称.startsWith('余烬之后_变量更新规则_'))
      assert.equal(entry.启用, false);
  }
  const initialized = YAML.parse(read('世界书/变量/initvar.yaml'));
  assert.deepEqual(plain(Schema.parse(initialized)), plain(createUninitializedState()));
  assert(JSON.parse(read('generated/schema.json')).properties._卡标识);
  for (const entry of manifest.filter(entry => fs.existsSync(path.join(card, entry.文件 + '.yaml'))))
    YAML.parse(read(entry.文件 + '.yaml'));
});

test('档案在当前变量中只发送一份，不再有独立称谓或预设控制条目', () => {
  const { projectPromptState } = loadTs(path.join(source, 'src/prompt-view.ts'));
  const state = createUninitializedState();
  for (const 姓名 of ['林澈', '潮生', '引号"与<%= literal %>']) {
    state._开局.档案.姓名 = 姓名;
    assert.equal(projectPromptState(state)._开局.档案.姓名, 姓名);
  }
  assert(!manifest.some(entry => entry.名称 === '余烬之后_玩家身份与称谓'));
  assert(read('世界书/变量/变量列表.txt').includes('本局 {{user}} 就是'));
});

test('正文协议为主角只输出一张合并人物卡', () => {
  const format = read('世界书/系统/正文格式.txt');
  const dossier = read('世界书/系统/人物档案.txt');
  assert(format.includes('<EmbersCard type="character" id="player"/>'));
  assert(!format.includes('<EmbersCard type="entity" id="player"/>'));
  assert(format.includes('同一对象只展示一张资料卡'));
  assert(dossier.includes('合并展示身份与当前核心数值'));
});

test('新卡入口不参与根构建扫描；独立命令不调用其他卡发布工具', () => {
  const root = path.resolve(card, '../..');
  assert(!fs.existsSync(path.join(root, 'src/余烬之后')));
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.private, true);
  assert(!JSON.stringify(pkg.scripts).match(/bump_version|copy_dist|bundle all|git push|git commit/));
  assert(read('tools/build.cjs').includes("path.join(card, 'build'"));
  assert(!read('tools/generate.cjs').includes('src/余烬之后'));
});


test('本轮变化来自两楼存档差异，忽略内部账本，使用实体名并保留新增与删除', () => {
  const { createOpening } = loadTs(path.join(source, 'src/opening.ts'));
  const { stateChanges } = loadTs(path.join(source, 'src/state-changes.ts'));
  const before = createOpening({ mode: '默认', scenario: {模式:'自定义',场景:'测试场',机缘:'测试获得种核'} }, 'changes').stat_data;
  const after = plain(before);
  after._运行账本.events.hidden = { internal: true };
  after._实体.player.生命.当前 = 75;
  after.叙事.天气 = '晴';
  const changes = stateChanges(before, after);
  assert.equal(changes.length, 2);
  assert(changes.some(row => row.label.includes('归来者') && row.before === '100' && row.after === '75'));
  assert(changes.some(row => row.label === '叙事 · 天气' && row.after === '晴'));
  assert.equal(stateChanges(null, after).length, 0);
  assert.equal(stateChanges(after, plain(after)).length, 0);
  after.待审提案.next = { 内容: '查看街道' };
  assert(stateChanges(before, after).some(row => row.label === '待确认 · next' && row.before === '—'));
  assert(stateChanges(after, before).some(row => row.label === '待确认 · next' && row.after === '—'));
});
