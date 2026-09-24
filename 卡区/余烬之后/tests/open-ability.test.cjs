const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadTs } = require('../tools/runtime.cjs');

const load = file => loadTs(path.join(__dirname, '../src', file + '.ts'));
const { createOpenStart } = load('open-start');
const { applyCommand } = load('engine');
const { abilityPresets } = load('ability-presets');
const { Schema } = load('schema');
const { openingRequest } = load('opening-request');
const { operationGuide } = load('operation-guide');
const clone = value => JSON.parse(JSON.stringify(value));
const command = (s, body, id='event') => ({...body,id,branchId:s.stat_data._结算.分支ID,expectedVersion:s.stat_data._结算.状态版本});

test('开放能力开局可不选择传承，预设能力与基础数值进入同一快照', () => {
  const session = createOpenStart({
    mode: '自定义',
    profile: { 姓名: '潮汐旅人', 种族: '人类' },
    scenario: { 模式: '自定义', 位面ID: 'main', 场景: '旧港', 城市: '港城' },
    ability: { mode: 'designed', design: abilityPresets.synthesis },
  }, 'open-ability');
  const state = session.stat_data;
  assert.equal(state._开局.起源涅槃已获得, false);
  assert.equal(state._实体.player.生命阶段, '存活');
  assert.equal(state._实体.player.能力ID['initial-ability'], true);
  assert.equal(state._能力['initial-ability'].名称, '合成进化');
  assert.equal(state._能力['initial-ability'].效果.transformation.规则ID, 'general-compose');
  assert.equal(state._锚点.start, undefined);
});

test('素材数量、重复结果或资源不足均回滚；成功结算和重放只扣一次',()=>{
  const session=createOpenStart({mode:'默认',ability:{mode:'designed',design:{...abilityPresets.synthesis,cost:3,cooldown:10}}},'material-test');
  session.stat_data._物品.crystal=Schema.shape._物品.unwrap().valueType.parse({名称:'素材',数量:3,所在:{类型:'实体',ID:'player'}});
  const operation={kind:'compose',actorId:'player',abilityId:'initial-ability',evidence:'实际投入晶体并形成结构',materials:{crystal:2},results:[{abilityId:'result',design:abilityPresets.devour}],seconds:30};
  const before=clone(session);
  assert.throws(()=>applyCommand(session,command(session,{...operation,materials:{crystal:4}})),/素材数量/);
  assert.throws(()=>applyCommand(session,command(session,{...operation,results:[...operation.results,...operation.results]})),/能力ID已存在/);
  const poor=clone(session);poor.stat_data._实体.player.资源.energy.当前=0;
  assert.throws(()=>applyCommand(poor,command(poor,operation)),/资源不足/);
  assert.equal(poor.stat_data._能力.result,undefined);
  assert.deepEqual(clone(session),before);
  const cmd=command(session,operation), settled=applyCommand(session,cmd).session;
  assert.equal(settled.stat_data._物品.crystal.数量,1);
  assert.equal(settled.stat_data._实体.player.资源.energy.当前,47);
  assert.equal(settled.stat_data._时空.起源时刻秒,30);
  assert.deepEqual(clone(applyCommand(settled,cmd).session),clone(settled));
  assert.throws(()=>applyCommand(settled,{...cmd,evidence:'另一项不相同的操作'}),/不同请求/);
});

test('非涅槃开局请求只携带所选能力，致命危险不会凭空复苏；纯叙事被动不阻塞伤害',()=>{
  const choice={mode:'默认',profile:{姓名:'旅人'},ability:{mode:'designed',design:{...abilityPresets.devour,name:'听见颜色',usage:'被动',transformation:false}}};
  const request=openingRequest(choice);
  assert.match(request,/听见颜色/);assert.doesNotMatch(request,/起源涅槃|终焉眷引|卡车|归泊庭/);
  const start=createOpenStart(choice,'ordinary-life');
  const dead=applyCommand(start,command(start,{kind:'exposure',source:'倒塌的石壁',mechanism:'impact',mechanismName:'冲击',amount:160,conditions:'被坍塌墙体直接击中'})).session;
  assert.equal(dead.stat_data._实体.player.生命阶段,'死亡');assert.equal(dead.stat_data._复苏,null);
});

test('自由能力的进化可获得旅行与素材转化；旅行按出发位面当地时钟结算冷却',()=>{
  let session=createOpenStart({mode:'默认',ability:{mode:'designed',design:{...abilityPresets.synthesis,transformation:false,cost:2,cooldown:60}}},'evolution-travel');
  session.stat_data._能力['initial-ability'].等级=5;
  session=applyCommand(session,command(session,{kind:'evolve',abilityId:'initial-ability',direction:'新联系',design:{principle:'理解空间与素材共同结构',evidence:'旅途中反复观察边界',description:'沿可辨认的结构联系穿行与重组',trigger:'发现可连接的结构',limitations:'需要已知落点',travel:true,transformation:true}})).session;
  session.stat_data._时空.位面目录.main.时钟.本地每起源秒=2;
  session=applyCommand(session,command(session,{kind:'travel',abilityId:'initial-ability',planeId:'new-world',name:'新世界',description:'潮路终点',locationId:'shore',location:'岸边',route:'沿已确认潮路',rate:1},'travel')).session;
  assert.equal(session.stat_data._结算.冷却结束['player:initial-ability'],30);
  assert.equal(session.stat_data._实体.player.资源.energy.当前,48);
  assert.equal(session.stat_data._能力['initial-ability'].效果.transformation.规则ID,'general-compose');
  const guide=operationGuide(['evolve']);assert(guide.includes('principle'));assert(!guide.includes('design?=能力定义'));
  assert(operationGuide(['compose']).includes('materials?={[ID]:number'));
});

test('自由define与compose共用能力登记器，结果保存为真实能力而非只有正文描述', () => {
  let session = createOpenStart({
    mode: '默认',
    scenario: { 模式: '自定义', 位面ID: 'main', 场景: '测试场' },
    ability: { mode: 'none' },
  }, 'define-compose');
  const design = {
    name: '潮声塑形', grade: '凡尘', usage: '复合',
    description: '将听见的节律转为短暂的形状。', trigger: '听见持续节律',
    limitations: '需要可辨认的声音来源。', principle: '以节律作为结构边界。',
    utility: { bonus: 1 }, strike: { mechanism: 'sound', power: 1.2, fixed: 0, seconds: 4 },
    cost: 2, cooldown: 10,
  };
  session = applyCommand(session, {
    kind: 'define', actorId: 'player', abilityId: 'sound-shape', design,
    evidence: '在旧港听见潮声并完成第一次定标', id: 'define-1', branchId: 'define-compose', expectedVersion: 0,
  }).session;
  assert.equal(session.stat_data._能力['sound-shape'].效果.strike.规则ID, 'combat-strike-1');
  assert.equal(session.stat_data._能力['sound-shape'].效果.utility.规则ID, 'general-utility');
  assert.equal(session.stat_data._实体.player.能力ID['sound-shape'], true);
  const operator = {
    ...abilityPresets.synthesis,
    name: '临时重组', grade: '凡尘',
  };
  session = applyCommand(session, {
    kind: 'define', actorId: 'player', abilityId: 'composer', design: operator,
    evidence: '学会整理素材', id: 'define-2', branchId: 'define-compose', expectedVersion: 1,
  }).session;
  session = applyCommand(session, {
    kind: 'compose', actorId: 'player', abilityId: 'composer', consumedAbilities: ['sound-shape'],
    materials: {}, seconds: 30, evidence: '将潮声结构整理为可持续的感知技艺',
    results: [{ abilityId: 'echo-sense', design: { ...design, name: '回声感知', usage: '主动', strike: undefined, cost: 0 } }],
    id: 'compose-1', branchId: 'define-compose', expectedVersion: 2,
  }).session;
  assert.equal(session.stat_data._能力['sound-shape'].名称, '潮声塑形');
  assert.equal(session.stat_data._能力['echo-sense'].名称, '回声感知');
  assert.equal(session.stat_data._实体.player.能力ID['echo-sense'], true);
  assert.equal(session.stat_data._实体.player.能力ID['sound-shape'], false);
});
