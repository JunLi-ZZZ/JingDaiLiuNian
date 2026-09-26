import { Schema, OpeningScenarioSchema } from '../../schema';
import type { OpeningScenario } from '../../schema';
import { presetPlanes } from '../../presets';
import { startSession, trialRules, validateSession, basicStrike, applyCommand } from '../../engine';
import type { Session } from '../../engine';

export type OpeningChoice = {
  mode: '默认' | '自定义';
  profile?: Partial<Schema['_开局']['档案']>;
  scenario?: Partial<OpeningScenario>;
};

export function openingScenario(choice: OpeningChoice): OpeningScenario {
  const scenario = OpeningScenarioSchema.parse(choice.scenario ?? {});
  if (scenario.模式 === '默认') return OpeningScenarioSchema.parse({});
  if (!Object.hasOwn(presetPlanes, scenario.位面ID) && scenario.位面ID !== 'opening-world')
    throw Error('请选择预设位面或自定义世界');
  if (scenario.位面ID === 'opening-world' && (!scenario.世界名称.trim() || !scenario.世界设定.trim()))
    throw Error('自定义世界需要名称和基本设定');
  if (!scenario.场景.trim() || !scenario.机缘.trim()) throw Error('请填写开局地点和获得起源涅槃的机缘');
  return scenario;
}

/** 开局的数值快照；首次剧情资料由第一轮MVU回复补全。 */
export function createOpening(choice: OpeningChoice, branchId: string): Session {
  const scenario = openingScenario(choice);
  let session = startSession({
    branchId,
    mode: choice.mode,
    profile: choice.profile,
    opportunity: scenario.机缘,
    initialPlane: scenario.位面ID === 'opening-world' ? { id: 'opening-world', name: scenario.世界名称 } : undefined,
    location: Schema.shape._时空.unwrap().shape.当前地点.parse({
      位面ID: scenario.位面ID,
      地点ID: scenario.模式 === '默认' ? 'old-pier' : 'opening-site',
      城市: scenario.城市.trim(),
      场景: scenario.场景.trim(),
    }),
    localSecondsPerOriginSecond: 1,
    life: 100,
    rules: trialRules,
  });
  const state = session.stat_data;
  state._开局.场景设定 = scenario;
  const [hour, minute] = scenario.起始时间.split(':').map(Number);
  const plane = state._时空.位面目录[scenario.位面ID];
  if (plane.来源 === '生成') plane.简介 = scenario.世界设定.slice(0, 3000);
  plane.时钟.本地基准秒 = hour * 3600 + minute * 60;
  plane.时钟.历法 = {
    名称: scenario.位面ID === 'main' ? '星见历' : '旅途历',
    元年: 1,
    每月天数: Array(12).fill(30),
    每天小时: 24,
    每小时分钟: 60,
    每分钟秒: 60,
  };
  state._实体.player.战斗 = {
    攻击: 30,
    防御: 20,
    命中率: 0.95,
    闪避率: 0,
    暴击率: 0.2,
    暴击倍率: 1.5,
    抗性: {},
  };
  state._实体.player.资源.energy = { 名称: '能量', 当前: 50, 上限: 50, 单位: '点' };
  state._能力['basic-attack'] = basicStrike();
  state._实体.player.能力ID['basic-attack'] = true;
  state.叙事.天气 = scenario.模式 === '默认' ? '界膜外微光缓缓变化' : '';
  state.叙事.场景描述 =
    scenario.模式 === '默认'
      ? '归泊庭的白石阶悬在微光中，界膜外浮着遥远的位面气泡。末墟在长廊等候，艾斯特瑞亚守着尚未重构的身体；潮镜映着未曾抵达的世界。'
      : scenario.场景;
  state._时空.位面目录.harbor = Schema.shape._时空.unwrap().shape.位面目录.unwrap().valueType.parse({
    名称: '归泊庭', 来源: '生成', 简介: '悬于虚空的独立庭院界域，承接死亡与复苏，潮镜通向多元位面。', 已发现: scenario.模式 === '默认',
    时钟: { ...plane.时钟, 历法说明: '庭中计时与虚海基准一致', 本地每起源秒: 1 },
  });
  state._锚点.harbor = { 名称: '归泊庭', 位面ID: 'harbor', 地点ID: 'return-court', 状态: '可用', 建立事件ID: 'start' };
  state._能力['terminal-affinity'] = Schema.shape._能力.unwrap().valueType.parse({
    名称: '终焉眷引', 品阶: '本源', 用法: '被动', 规则状态: '可结算', 来源: { 类型: '初始', 说明: '末墟的终末之力' },
    描述: '生命更容易走到终点；死亡后，自我循末墟的联系归泊。', 触发条件: '防护之后仍受到损伤',
    效果: { terminal: { 规则ID: 'terminal-affinity', 参数: { 倍率: 1.25 } } },
    限制: '剩余伤害乘1.25并向上取整；已被适应完全转化的作用仍为零伤害。',
  });
  state._实体.player.能力ID['terminal-affinity'] = true;
  if (scenario.模式 === '默认') {
    state._时空.当前地点.场景 = '主世界 · 路口';
    session = applyCommand(session, { kind: 'exposure', source: '失控的重型卡车', mechanism: 'impact', mechanismName: '冲撞', abilityName: '冲量偏折', amount: 160, conditions: '主世界路口的致命车辆碰撞', id: 'first-return', branchId, expectedVersion: 0 }).session;
    const current = session.stat_data;
    delete current._能力['adapt-player-impact'];
    delete current._实体.player.能力ID['adapt-player-impact'];
    delete current._实体.player.资源['adapt-player-impact'];
    current._能力['world-crossing'] = Schema.shape._能力.unwrap().valueType.parse({
      名称: '越界', 品阶: '史铭', 用法: '主动', 规则状态: '可结算',
      来源: { 类型: '死亡', 死亡事件ID: 'first-return', 说明: '以离开碰撞所在空间回应第一次死亡' },
      描述: '从归泊庭的潮镜选择世界，沿坐标或世界意象抵达能够容纳自身的落点。',
      触发条件: '完成重构并选择目的地', 效果: { travel: { 规则ID: 'world-crossing', 参数: {} } },
      限制: '开启界门消耗10点能量、冷却60起源秒；落点遵循目的世界的环境。庭中复苏恢复基础能量。',
      消耗: { energy: 10 }, 冷却本地秒: 60,
    });
    current._实体.player.能力ID['world-crossing'] = true;
    current._死亡记录['first-return'].授予能力ID = { 'world-crossing': true };
    session.death_adaptation_runtime.events['first-return'].result = '主世界车辆碰撞确认死亡；起源涅槃初醒，获得越界，归泊庭开始重构（600起源秒）';
    current._运行账本 = _.cloneDeep(session.death_adaptation_runtime);
  }
  validateSession(session);
  return session;
}

