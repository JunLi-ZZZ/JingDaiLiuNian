import { Schema, OpeningScenarioSchema } from './schema';
import type { OpeningScenario } from './schema';
import { presetPlanes } from './presets';
import { startSession,trialRules,basicStrike,validateSession } from './engine';
import type { Session } from './engine';
import { registerDesignedAbility } from './ability-runtime';
import { AbilityDesignSchema, type InitialAbilityChoice } from './ability-design';
export type OpeningChoice={mode:'默认'|'自定义';profile?:Partial<Schema['_开局']['档案']>;scenario?:Partial<OpeningScenario>;ability?:InitialAbilityChoice};
export const openScenario=()=>OpeningScenarioSchema.parse({模式:'默认',位面ID:'main',城市:'星见市',场景:'旧港候船厅',
  机缘:'旅途即将开始，人物来历与所持能力采用本局档案。',基调:'异界探索、人物相遇与真实冒险',出场人物:'',
  构想:'从启程前的现场写起。让一位有自身诉求的人物与我发生联系，留下可以交谈、调查或启程的机会。',大纲:''});
export function resolveOpenScenario(choice:OpeningChoice):OpeningScenario {
  const scenario=OpeningScenarioSchema.parse(choice.scenario?.模式==='自定义'?{...openScenario(),...choice.scenario}:openScenario());
  if(!Object.hasOwn(presetPlanes,scenario.位面ID)&&scenario.位面ID!=='opening-world')throw Error('请选择预设位面或自定义世界');
  if(scenario.位面ID==='opening-world'&&(!scenario.世界名称.trim()||!scenario.世界设定.trim()))throw Error('自定义世界需要名称和基本设定');
  if(!scenario.场景.trim())throw Error('请填写开局地点');
  return scenario;
}
export function createOpenStart(choice:OpeningChoice,branchId:string):Session {
  const scenario=resolveOpenScenario(choice);
  const selection=choice.ability;
  if(!selection || !['none','designed'].includes(selection.mode))throw Error('请确认初始能力选择');
  const design=selection.mode==='designed'?AbilityDesignSchema.parse(selection.design):undefined;
  const session=startSession({branchId,mode:choice.mode,profile:choice.mode==='默认'?{经历:'在主世界成长，过往身份与旅途由本局档案确定。',...choice.profile}:choice.profile,
    originInheritance:false,opportunity:scenario.机缘.trim()||'以本局档案开始旅途',
    initialPlane:scenario.位面ID==='opening-world'?{id:'opening-world',name:scenario.世界名称}:undefined,
    location:Schema.shape._时空.unwrap().shape.当前地点.parse({位面ID:scenario.位面ID,地点ID:'opening-site',城市:scenario.城市,场景:scenario.场景}),
    localSecondsPerOriginSecond:1,life:100,rules:trialRules});
  const state=session.stat_data,actor=state._实体.player,plane=state._时空.位面目录[scenario.位面ID];
  state._开局.场景设定=scenario;
  const [hour,minute]=scenario.起始时间.split(':').map(Number);plane.时钟.本地基准秒=hour*3600+minute*60;
  plane.时钟.历法={名称:scenario.位面ID==='main'?'星见历':'旅途历',元年:1,每月天数:Array(12).fill(30),每天小时:24,每小时分钟:60,每分钟秒:60};
  if(plane.来源==='生成')plane.简介=scenario.世界设定.slice(0,3000);
  actor.战斗={攻击:30,防御:20,命中率:.95,闪避率:0,暴击率:.2,暴击倍率:1.5,抗性:{}};
  actor.资源.energy={名称:'能量',当前:50,上限:50,单位:'点'};
  state._能力['basic-attack']=basicStrike();actor.能力ID['basic-attack']=true;
  state.叙事.场景描述=scenario.场景;
  if(design)registerDesignedAbility(session,'player','initial-ability',design,scenario.机缘||design.principle,true);
  state._运行账本=_.cloneDeep(session.death_adaptation_runtime);
  validateSession(session);return session;
}
