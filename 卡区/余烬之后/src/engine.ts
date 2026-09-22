import { grantOriginInheritance, settleOriginDeath, reviveOrigin } from './玩法/起源涅槃/结算';
import { Schema, OperationSchema } from './schema';
import type { Operation } from './schema';
import { createUninitializedState, defaultProtagonist, presetPlanes } from './presets';
import { normalizeIdentity } from './character-profile';
import { calculateAttack, checkedNumber, validateCombatStats } from './combat';
import type { BattleReport } from './combat';
import { grades } from './grades';
import { practice, evolve } from './progression';

// 纯结算内核：调用者提供已校验的场景输入；不解析模型文本、不读写酒馆。
export type Rules = {
  id: string;
  revivalSeconds: number;
  mechanisms: Record<string, { name: string; ability: string }>;
};
export { trialRules } from './玩法/起源涅槃/规则';

type Cause = { sourceId: string; mechanismId: string; amount: number; conditions: string };
type CommandBody = Operation
  | { kind: 'damage'; targetId: string; causes: Cause[] }
  | { kind: 'advance'; seconds: number }
  | { kind: 'revive' }
  | { kind: 'strike'; actorId: string; targetId: string; abilityId: string }
  | { kind: 'release'; actorId: string; targetId: string; abilityId: string };
export type Command = CommandBody & { id: string; branchId: string; expectedVersion: number };
export type Session = {
  stat_data: Schema;
  death_adaptation_runtime: {
    rules: Rules;
    events: Record<string, { command: Command; result: string; outputVersion: number; battle?: BattleReport; check?: {die:number;bonus:number;difficulty:number;success:boolean;task:string} }>;
  };
};
export type StartOptions = {
  branchId: string;
  mode: '默认' | '自定义';
  profile?: Partial<Schema['_开局']['档案']>;
  location: Schema['_时空']['当前地点'];
  localSecondsPerOriginSecond: number;
  life: number;
  rules: Rules;
  opportunity: string;
  initialPlane?: { id: string; name: string };
};

const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function matchingGuard(state:Schema,targetId:string,mechanism:string):string {
  return Object.keys(state._实体[targetId]?.能力ID||{}).filter(id=>{
    const a=state._能力[id];return state._实体[targetId].能力ID[id] && a?.规则状态==='可结算' && a.效果.guard?.规则ID==='trial-convert' && a.效果.guard.参数.mechanism===mechanism;
  }).sort((a,b)=>Number(state._能力[b].效果.guard.参数.capacity)-Number(state._能力[a].效果.guard.参数.capacity)||a.localeCompare(b))[0] || '';
}
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}
function finite(value: number, minimum = 0): void {
  requireValue(typeof value === 'number' && Number.isFinite(value) && value >= minimum, '数值必须有限且不低于下界');
}
function identifier(value: string): void {
  requireValue(
    typeof value === 'string' && /^[\w-]+$/.test(value) && !['__proto__', 'prototype', 'constructor'].includes(value),
    '无效ID',
  );
}
function validateRules(rules: Rules): void {
  identifier(rules.id);
  finite(rules.revivalSeconds, Number.EPSILON);
  requireValue(Object.keys(rules.mechanisms).length, '至少登记一种机制');
  for (const [id, rule] of Object.entries(rules.mechanisms)) {
    identifier(id);
    requireValue(rule.name.trim() && rule.ability.trim(), '机制缺少名称');
  }
}

/** 已获得权能之后的开局快照。获得过程文本由玩家选择的开局提供。 */
export function startSession(options: StartOptions): Session {
  identifier(options.branchId);
  validateRules(options.rules);
  finite(options.life, Number.EPSILON);
  finite(options.localSecondsPerOriginSecond, Number.EPSILON);
  requireValue(options.mode === '默认' || options.mode === '自定义', '无效开局模式');
  requireValue(options.opportunity.trim(), '需要已确认的机缘记录');
  const state = createUninitializedState();
  if (options.initialPlane) {
    identifier(options.initialPlane.id);
    requireValue(!own(state._时空.位面目录, options.initialPlane.id), '自定义世界ID不能覆盖预设世界');
    requireValue(options.initialPlane.name.trim(), '自定义世界需要名称');
    state._时空.位面目录[options.initialPlane.id] = Schema.shape._时空
      .unwrap()
      .shape.位面目录.unwrap()
      .valueType.parse({
        名称: options.initialPlane.name.trim(),
        来源: '生成',
      });
  }
  const profile = normalizeIdentity(
    Schema.shape._开局
      .unwrap()
      .shape.档案.parse(
        options.mode === '默认' ? { ...defaultProtagonist, ...options.profile } : (options.profile ?? {}),
      ),
  );
  requireValue(profile && profile.姓名?.trim() && profile.种族?.trim(), '自定义角色需要姓名和种族，其余信息允许留白');
  requireValue(own(state._时空.位面目录, options.location.位面ID), '测试开局需要已登记位面');
  requireValue(options.location.地点ID.trim(), '开局缺少地点ID');
  state._开局 = Schema.shape._开局.parse({
    模式: options.mode,
    档案: profile,
    机缘记录: options.opportunity,
    起源涅槃已获得: true,
  });
  state._时空.当前地点 = copy(options.location);
  const plane = state._时空.位面目录[options.location.位面ID];
  plane.已发现 = true;
  plane.时钟.本地每起源秒 = options.localSecondsPerOriginSecond;
  state._实体.player = Schema.shape._实体.unwrap().valueType.parse({
    名称: profile.姓名,
    类别: '主角',
    档案: { 种族: profile.种族, 外貌: profile.外貌, 身份: profile.身份 },
    位面ID: options.location.位面ID,
    地点ID: options.location.地点ID,
    生命: { 当前: options.life, 上限: options.life },
    数值规则版本: options.rules.id,
  });
  grantOriginInheritance(state, options.opportunity);
  state._锚点.start = Schema.shape._锚点.unwrap().valueType.parse({
    名称: '初始复苏锚点',
    位面ID: options.location.位面ID,
    地点ID: options.location.地点ID,
    状态: '可用',
    建立事件ID: 'start',
  });
  state._初始化完成 = true;
  state._结算.分支ID = options.branchId;
  const session = { stat_data: state, death_adaptation_runtime: { rules: copy(options.rules), events: {} } };
  state._运行账本 = copy(session.death_adaptation_runtime);
  validateSession(session);
  return session;
}

export function validateSession(session: Session): void {
  const state = Schema.parse(session.stat_data);
  requireValue(_.isEqual(state, session.stat_data), '状态缺字段或未按schema规范化');
  validateRules(session.death_adaptation_runtime.rules);
  requireValue(state._初始化完成, '尚未初始化');
  identifier(state._结算.分支ID);
  finite(state._结算.状态版本);
  requireValue(Number.isSafeInteger(state._结算.状态版本), '无效状态版本');
  finite(state._时空.起源时刻秒);
  requireValue(own(state._实体, state._开局.主角ID), '主角不存在');
  const player = state._实体[state._开局.主角ID];
  requireValue(
    player.位面ID === state._时空.当前地点.位面ID && player.地点ID === state._时空.当前地点.地点ID,
    '主角地点不一致',
  );
  for (const [id, entity] of Object.entries(state._实体)) {
    identifier(id);
    if (entity.战斗) validateCombatStats(entity.战斗);
    if (entity.生命) {
      finite(entity.生命.当前);
      finite(entity.生命.上限, Number.EPSILON);
      requireValue(entity.生命.当前 <= entity.生命.上限, '生命超过上限');
      requireValue(entity.生命阶段 !== '存活' || entity.生命.当前 > 0, '存活实体生命为零');
      requireValue(!['死亡', '重构中'].includes(entity.生命阶段) || entity.生命.当前 === 0, '死亡实体生命未清零');
    }
    for (const resource of Object.values(entity.资源)) {
      finite(resource.当前);
      if (resource.上限 !== null) {
        finite(resource.上限);
        requireValue(resource.当前 <= resource.上限, '资源超过上限');
      }
    }
    for (const [ability, enabled] of Object.entries(entity.能力ID))
      if (enabled) requireValue(own(state._能力, ability), '能力引用不存在');
    if (entity.当前形态ID !== null) requireValue(own(entity.形态, entity.当前形态ID), '形态引用不存在');
    for (const item of Object.values(entity.装备))
      requireValue(
        own(state._物品, item) && state._物品[item].所在.类型 === '实体' && state._物品[item].所在.ID === id,
        '装备不属于该实体',
      );
  }
  for (const item of Object.values(state._物品)) {
    finite(item.数量);
    requireValue(item.数量 > 0, '物品数量必须大于零');
    if (item.所在.类型 === '实体') requireValue(own(state._实体, item.所在.ID), '物品持有者不存在');
    if (item.所在.类型 === '容器') requireValue(own(state._物品, item.所在.ID), '容器不存在');
    requireValue(item.所在.类型 !== '容器', '测试规则暂不支持嵌套容器');
    if (item.复苏绑定实体ID !== null) requireValue(own(state._实体, item.复苏绑定实体ID), '物品绑定实体不存在');
  }
  for (const task of Object.values(state._任务)) {
    if (task.截止起源秒 !== null) finite(task.截止起源秒);
    for (const goal of Object.values(task.目标)) {
      finite(goal.当前);
      finite(goal.所需, Number.EPSILON);
      requireValue(goal.当前 <= goal.所需, '任务进度越界');
    }
  }
  for (const ability of Object.values(state._能力)) {
    if (ability.来源.类型 === '死亡')
      requireValue(ability.来源.死亡事件ID && own(state._死亡记录, ability.来源.死亡事件ID), '死亡能力缺少来源事件');
  }
  if (state._复苏) {
    requireValue(own(state._死亡记录, state._复苏.死亡事件ID), '复苏没有对应死亡记录');
    requireValue(player.生命阶段 === '重构中', '重构阶段不一致');
    if (state._复苏.完成起源秒 !== null) {
      finite(state._复苏.完成起源秒);
      requireValue(state._复苏.完成起源秒 >= state._复苏.开始起源秒, '复苏时间倒流');
    }
  }
}

export function localTime(state: Schema, planeId: string): number {
  requireValue(own(state._时空.位面目录, planeId), '位面未登记');
  const clock = state._时空.位面目录[planeId].时钟;
  requireValue(clock.本地每起源秒 !== null, '时间倍率未定标');
  finite(clock.本地每起源秒, Number.EPSILON);
  const time = clock.本地基准秒 + (state._时空.起源时刻秒 - clock.起源基准秒) * clock.本地每起源秒;
  finite(time);
  return time;
}

function damage(session: Session, targetId: string, causes: Cause[], eventId: string): string {
  const state = session.stat_data;
  const rules = session.death_adaptation_runtime.rules;
  requireValue(own(state._实体, targetId), '目标不存在');
  const target = state._实体[targetId];
  requireValue(target.生命阶段 === '存活' && target.生命 !== null, '目标不能受伤或未定标');
  requireValue(causes.length > 0, '伤害原因为空');
  // 此切片只处理没有附加状态效果的直接伤害，避免悄悄忽略未知BUFF。
  requireValue(Object.keys(target.状态).length === 0, '附加状态的伤害规则尚未实现');
  for (const [id, enabled] of Object.entries(target.能力ID)) {
    if (!enabled) continue;
    const ability = state._能力[id];
    if (ability.用法 !== '主动') {
      if (id === 'origin-rebirth' && ability.效果.rebirth?.规则ID === 'origin-rebirth') continue;
      if (id === 'terminal-affinity' && ability.效果.terminal?.规则ID === 'terminal-affinity') continue;
      requireValue(
        ability.规则状态 === '可结算' &&
          ability.效果.guard?.规则ID === 'trial-convert',
        '存在未支持的被动能力',
      );
    }
  }
  // 先检查完整输入，避免第二个原因无效时已扣第一笔血。
  for (const cause of causes) {
    finite(cause.amount, Number.EPSILON);
    requireValue(own(rules.mechanisms, cause.mechanismId), '机制尚未登记');
    requireValue(own(state._实体, cause.sourceId), '伤害来源未登记');
    const source = state._实体[cause.sourceId];
    requireValue(source.位面ID === target.位面ID && source.地点ID === target.地点ID, '伤害来源与目标需要处于同一地点');
    requireValue(source.生命阶段 === '存活' || source.生命阶段 === '无生命', '来源不能行动');
    requireValue(cause.conditions.trim(), '缺少作用条件');
  }
  const chain: Schema['_死亡记录'][string]['因果链'] = {};
  const defended: Record<string, string> = {};
  let lethal: Cause | undefined;
  let total = 0;
  for (const [index, cause] of causes.entries()) {
    const abilityId = matchingGuard(state,targetId,cause.mechanismId);
    const ability = own(state._能力, abilityId) ? state._能力[abilityId] : undefined;
    const guard = ability?.效果.guard;
    const enabled =
      target.能力ID[abilityId] === true && ability?.规则状态 === '可结算' && guard?.规则ID === 'trial-convert';
    const capacity = enabled ? Number(guard.参数.capacity) : 0;
    finite(capacity);
    const blocked = Math.min(cause.amount, capacity);
    if (blocked > 0) {
      defended[abilityId] = `转移${blocked}点${rules.mechanisms[cause.mechanismId].name}`;
      const resource = target.资源[abilityId];
      requireValue(resource !== undefined && resource.上限 !== null, '适应储能未登记');
      resource.当前 = Math.min(resource.上限, resource.当前 + blocked);
      practice(state, targetId, abilityId);
    }
    const terminal = target.能力ID['terminal-affinity'] ? 1.25 : 1;
    const actual = Math.min(target.生命.当前, Math.ceil((cause.amount - blocked) * terminal));
    target.生命.当前 -= actual;
    total += actual;
    chain[`cause${index + 1}`] = {
      顺序: index + 1,
      来源实体ID: cause.sourceId,
      机制ID: cause.mechanismId,
      作用条件: cause.conditions,
      实际伤害: actual,
      直接致死: target.生命.当前 === 0,
    };
    if (target.生命.当前 === 0) {
      lethal = cause;
      break;
    }
  }
  if (!lethal) return `实际损伤${total}，剩余生命${target.生命.当前}`;
  target.生命阶段 = '死亡';
  if (targetId !== state._开局.主角ID || !state._开局.起源涅槃已获得) return `实际损伤${total}，目标死亡`;
  return settleOriginDeath(session, targetId, lethal, chain, defended, eventId);
}

/** 所有变更在副本完成；出错不改变传入快照。相同ID不同内容必须报错。 */
function spendAbility(state:Schema,actorId:string,abilityId:string):void {
  const actor=state._实体[actorId],ability=state._能力[abilityId];
  const rate=state._时空.位面目录[actor.位面ID]?.时钟.本地每起源秒;
  requireValue(rate && rate>0,'能力所在位面时间倍率尚未确定');
  const key=actorId+':'+abilityId;
  requireValue((state._结算.冷却结束[key]||0)<=state._时空.起源时刻秒,'能力仍在冷却');
  for(const [id,cost] of Object.entries(ability.消耗))requireValue(actor.资源[id]?.当前>=cost,'能力资源不足');
  for(const [id,cost] of Object.entries(ability.消耗))actor.资源[id].当前-=cost;
  state._结算.冷却结束[key]=state._时空.起源时刻秒+ability.冷却本地秒/rate;
}

export function applyCommand(
  input: Session,
  command: Command,
  random: () => number = Math.random,
): { session: Session; result: string; replayed: boolean } {
  validateSession(input);
  if(command.kind==='acquire')command={...command,...OperationSchema.parse(_.omit(command,['id','branchId','expectedVersion']))} as Command;
  identifier(command.id);
  requireValue(command.branchId === input.stat_data._结算.分支ID, '分支不匹配');
  const events = input.death_adaptation_runtime.events;
  if (own(events, command.id)) {
    requireValue(_.isEqual(events[command.id].command, command), '事件ID被不同请求复用');
    return { session: copy(input), result: events[command.id].result, replayed: true };
  }
  requireValue(command.expectedVersion === input.stat_data._结算.状态版本, '状态版本已过期');
  const session = copy(input);
  const state = session.stat_data;
  let result: string;
  let checkReport: {die:number;bonus:number;difficulty:number;success:boolean;task:string} | undefined;
  let battle: BattleReport | undefined;
  switch (command.kind) {
    case 'acquire': {
      OperationSchema.parse(_.omit(command,['id','branchId','expectedVersion']));
      identifier(command.actorId);identifier(command.abilityId);identifier(command.mechanism);
      const actor=state._实体[command.actorId];
      requireValue(actor,'能力获得者尚未登记');
      requireValue(!state._能力[command.abilityId],'能力ID已登记；已有能力沿用原档案');
      const effects:Schema['_能力'][string]['效果']={};
      if(command.profile==='攻击'){
        requireValue(own(session.death_adaptation_runtime.rules.mechanisms,command.mechanism),'伤害机制尚未登记');
        effects.strike={规则ID:'combat-strike-1',参数:{机制ID:command.mechanism,倍率:command.power,固定伤害:0,耗时本地秒:6}};
      }else if(command.profile==='转化'){
        if(!own(session.death_adaptation_runtime.rules.mechanisms,command.mechanism))session.death_adaptation_runtime.rules.mechanisms[command.mechanism]={name:command.mechanism,ability:command.name};
        effects.guard={规则ID:'trial-convert',参数:{mechanism:command.mechanism,capacity:command.capacity}};
        effects.release={规则ID:'trial-release',参数:{mechanism:command.mechanism,multiplier:command.power}};
        actor.资源[command.abilityId]={名称:command.name+'储能',当前:0,上限:command.capacity,单位:'点'};
      }else effects.utility={规则ID:'general-utility',参数:{检定加值:0}};
      requireValue(command.cost===0 || actor.资源.energy,'能力消耗的能量资源尚未登记');
      state._能力[command.abilityId]=Schema.shape._能力.unwrap().valueType.parse({
        名称:command.name,品阶:command.grade,来源:{类型:command.source,说明:command.evidence},描述:command.description,
        用法:command.profile==='转化'?'复合':'主动',规则状态:'可结算',触发条件:command.trigger,限制:command.limitations,
        机制ID:{[command.mechanism]:true},效果:effects,消耗:command.cost?{energy:command.cost}:{},冷却本地秒:command.cooldown,
      });
      actor.能力ID[command.abilityId]=true;
      result=actor.名称+'通过'+command.source+'获得'+command.name+'（'+command.grade+'）';
      break;
    }
    case 'train': {
      OperationSchema.parse(_.omit(command,['id','branchId','expectedVersion']));
      const actor=state._实体[command.actorId];
      requireValue(actor?.生命阶段==='存活' && actor.能力ID[command.abilityId],'训练者需要存活并掌握该能力');
      const rate=state._时空.位面目录[actor.位面ID]?.时钟.本地每起源秒;
      requireValue(rate && rate>0,'训练地点时间倍率尚未确定');
      advanceTime(state,command.seconds/rate);
      const points=Math.min(24,Math.floor(command.seconds/600));
      practice(state,command.actorId,command.abilityId,points);
      result=actor.名称+'训练'+state._能力[command.abilityId].名称+'：'+command.focus+'；熟练+'+points;
      break;
    }
    case 'use': {
      OperationSchema.parse(_.omit(command,['id','branchId','expectedVersion']));
      const actor=state._实体[command.actorId],ability=state._能力[command.abilityId];
      requireValue(actor?.生命阶段==='存活' && actor.能力ID[command.abilityId] && ability?.效果.utility?.规则ID==='general-utility','此操作用于已掌握的技艺能力');
      spendAbility(state,command.actorId,command.abilityId);
      practice(state,command.actorId,command.abilityId);
      result=actor.名称+'运用'+ability.名称+'：'+command.purpose;
      break;
    }
    case 'reconcile': {
      OperationSchema.parse(_.omit(command, ['id', 'branchId', 'expectedVersion']));
      requireValue(!Object.values(session.death_adaptation_runtime.events).some(event => event.command.kind === 'reconcile' && event.command.actorId === command.actorId && event.command.resourceId === command.resourceId && event.command.evidence === command.evidence), '这项依据已经补记；如有新的事实，请写明新的依据');
      const actor = state._实体[command.actorId];
      const resource = command.resourceId === 'life' ? actor?.生命 : actor?.资源[command.resourceId];
      requireValue(resource && resource.当前 === command.before, '补记前值已变化，请重新读取');
      finite(command.value); requireValue(command.evidence.trim().length >= 4, '请填写补记依据');
      requireValue(resource.上限 === null || command.value <= resource.上限, '补记值超过上限');
      if (command.resourceId === 'life') requireValue(actor.生命阶段 === '存活' && command.value > 0, '生命校正用于存活状态；死亡与复苏采用对应结算');
      resource.当前 = command.value;
      result = `补记${actor.名称}的${command.resourceId === 'life' ? '生命' : actor.资源[command.resourceId].名称}：${command.before} → ${command.value}；依据：${command.evidence}`;
      break;
    }
    case 'evolve': {
      OperationSchema.parse(_.omit(command, ['id', 'branchId', 'expectedVersion']));
      if(command.design)for(const mechanism of [command.design.strike?.mechanism,command.design.conversion?.mechanism].filter(Boolean) as string[]){
        identifier(mechanism);
        if(!own(session.death_adaptation_runtime.rules.mechanisms,mechanism))session.death_adaptation_runtime.rules.mechanisms[mechanism]={name:mechanism,ability:command.design.name||state._能力[command.abilityId]?.名称||command.direction};
      }
      result = evolve(state, command.abilityId, command.direction, command.actorId,command.design); break;
    }
    case 'check': {
      const actor = state._实体[command.actorId];
      requireValue(actor?.生命阶段 === '存活', '检定者当前无法行动');
      requireValue(Number.isInteger(command.difficulty) && command.difficulty >= 5 && command.difficulty <= 30 && command.task.trim(), '检定需要任务与5至30的难度');
      const ability = command.abilityId ? state._能力[command.abilityId] : null;
      if (command.abilityId) requireValue(actor.能力ID[command.abilityId] && ability, '尚未掌握检定能力');
      if(command.abilityId && ability?.效果.utility)spendAbility(state,command.actorId,command.abilityId);
      const sample = random(); requireValue(sample >= 0 && sample < 1, '骰子值无效');
      const die = Math.floor(sample * 20) + 1;
      const bonus = ability ? Math.min(8, Math.floor(ability.等级 / 2) + grades.indexOf(ability.品阶)+Number(ability.效果.utility?.参数.检定加值||0)) : 0;
      const success = die === 20 || (die !== 1 && die + bonus >= command.difficulty);
      checkReport={die,bonus,difficulty:command.difficulty,success,task:command.task};
      result = `${command.task}：D20=${die} + ${bonus}，难度${command.difficulty}，${success ? '成功' : '未达成'}${die === 20 ? '（大成功）' : die === 1 ? '（失手）' : ''}`;
      if (command.abilityId) practice(state, command.actorId, command.abilityId);
      break;
    }
    case 'exposure': {
      identifier(command.mechanism);
      finite(command.amount, Number.EPSILON);
      requireValue(command.conditions.trim() && command.source.trim() && command.mechanismName.trim(), '危险源需要来源、机制与作用条件');
      const rules = session.death_adaptation_runtime.rules;
      if (!own(rules.mechanisms, command.mechanism)) rules.mechanisms[command.mechanism] = { name: command.mechanismName, ability: command.abilityName?.trim() || command.mechanismName.trim()+'适应' };
      const id = `hazard-${command.id}`;
      state._实体[id] = Schema.shape._实体.unwrap().valueType.parse({
        名称: command.source, 类别: '危险源', 生命阶段: '无生命',
        位面ID: state._时空.当前地点.位面ID, 地点ID: state._时空.当前地点.地点ID,
      });
      result = damage(session, state._开局.主角ID, [{ sourceId: id, mechanismId: command.mechanism, amount: command.amount, conditions: command.conditions }], command.id);
      break;
    }
    case 'travel': {
      const player = state._实体[state._开局.主角ID];
      requireValue(player.生命阶段 === '存活', '重构完成后才能旅行');
      identifier(command.planeId); identifier(command.locationId);
      finite(command.rate, Number.EPSILON);
      requireValue(command.route.trim() && command.name.trim() && command.location.trim(), '旅行需要目的地与通行方式');
      const presetId = Object.entries(presetPlanes).find(([, name]) => name === command.name)?.[0];
      const knownId = Object.entries(state._时空.位面目录).find(([, value]) => value.名称 === command.name)?.[0];
      const planeId = presetId || knownId || command.planeId;
      const travelId=command.abilityId===undefined?(player.能力ID['world-crossing']?'world-crossing':null):command.abilityId;
      if (travelId && planeId !== player.位面ID) {
        const ability=state._能力[travelId];
        requireValue(player.能力ID[travelId] && ability?.效果.travel,'尚未掌握此旅行能力');
        const key = `${state._开局.主角ID}:${travelId}`;
        requireValue((state._结算.冷却结束[key] || 0) <= state._时空.起源时刻秒, '越界仍在冷却');
        for(const [id,cost] of Object.entries(ability.消耗))requireValue(player.资源[id]?.当前>=cost,'旅行能力资源不足');
        for(const [id,cost] of Object.entries(ability.消耗))player.资源[id].当前-=cost;
        state._结算.冷却结束[key] = state._时空.起源时刻秒 + ability.冷却本地秒;
        practice(state, state._开局.主角ID, travelId);
      }
      let plane = state._时空.位面目录[planeId];
      if (!plane) {
        requireValue(command.description.trim(), '首次抵达需要世界设定');
        plane = Schema.shape._时空.unwrap().shape.位面目录.unwrap().valueType.parse({
          名称: command.name, 来源: '生成', 简介: command.description,
          时钟: { 起源基准秒: state._时空.起源时刻秒, 本地基准秒: 64800, 本地每起源秒: command.rate,
            历法: { 名称: '当地历', 元年: 1, 每月天数: Array(12).fill(30), 每天小时: 24, 每小时分钟: 60, 每分钟秒: 60 } },
        });
        state._时空.位面目录[planeId] = plane;
      }
      if (plane.时钟.本地每起源秒 === null) {
        plane.时钟 = { ...copy(state._时空.位面目录[player.位面ID].时钟), 起源基准秒: state._时空.起源时刻秒, 本地基准秒: 64800, 本地每起源秒: command.rate };
      }
      plane.已发现 = true;
      player.位面ID = planeId; player.地点ID = command.locationId;
      state._时空.当前地点 = Schema.shape._时空.unwrap().shape.当前地点.parse({ 位面ID: planeId, 地点ID: command.locationId, 场景: command.location });
      state._锚点.start = { 名称: '最近抵达点', 位面ID: planeId, 地点ID: command.locationId, 状态: '可用', 建立事件ID: command.id };
      state._结算.遭遇ID = null;
      result = `经${command.route}抵达${plane.名称} · ${command.location}`;
      break;
    }
    case 'channel': {
      const player = state._实体[state._开局.主角ID];
      requireValue(player.生命阶段 === '存活' && player.能力ID[command.abilityId], '当前不能使用此能力');
      const resource = player.资源[command.abilityId];
      requireValue(state._能力[command.abilityId]?.效果.release?.规则ID === 'trial-release', '此能力没有储能释放效果');
      finite(command.amount, Number.EPSILON);
      requireValue(resource && resource.当前 >= command.amount && command.purpose.trim(), '储能不足或缺少用途');
      spendAbility(state,state._开局.主角ID,command.abilityId);
      resource.当前 -= command.amount;
      const output = Math.floor(command.amount * Number(state._能力[command.abilityId].效果.release.参数.multiplier || 1));
      practice(state, state._开局.主角ID, command.abilityId);
      result = `${state._能力[command.abilityId].名称}消耗${command.amount}点储能，输出${output}点作用：${command.purpose}`;
      break;
    }
    case 'encounter': {
      const tiers = { 普通: [60, 18, 10], 强敌: [140, 60, 25], 致命: [240, 144, 40] };
      requireValue(
        own(tiers, command.tier) && own(session.death_adaptation_runtime.rules.mechanisms, command.mechanism),
        '遭遇模板未登记',
      );
      requireValue(
        typeof command.name === 'string' && command.name.trim() && command.name.length <= 80,
        '遭遇名称无效',
      );
      requireValue(state._实体[state._开局.主角ID].生命阶段 === '存活', '重构期间不能建立当前遭遇');
      const id = `enc-${command.id}`;
      const skillId = `attack-${id}`;
      const [hp, attack, defense] = tiers[command.tier];
      state._能力[skillId] = basicStrike(command.mechanism);
      state._实体[id] = Schema.shape._实体.unwrap().valueType.parse({
        名称: command.name.trim(),
        类别: '生物',
        位面ID: state._时空.当前地点.位面ID,
        地点ID: state._时空.当前地点.地点ID,
        生命: { 当前: hp, 上限: hp },
        战斗: { 攻击: attack, 防御: defense, 命中率: 0.95, 闪避率: 0, 暴击率: 0.1, 暴击倍率: 1.5, 抗性: {} },
        能力ID: { [skillId]: true },
        数值规则版本: session.death_adaptation_runtime.rules.id,
      });
      state._结算.遭遇ID = id;
      state.叙事.见闻[id] = {
        类别: '生物',
        对象ID: id,
        标题: command.name.trim(),
        内容: '已确认进入当前场景的遭遇对象。',
        可信度: '观察',
        来源: '遭遇确认',
        知情者ID: { [state._开局.主角ID]: true },
      };
      result = `已登记遭遇：${command.name.trim()}（${command.tier}）`;
      break;
    }
    case 'strike': {
      const actor = own(state._实体, command.actorId) ? state._实体[command.actorId] : undefined;
      const target = own(state._实体, command.targetId) ? state._实体[command.targetId] : undefined;
      requireValue(actor?.生命阶段 === '存活' && target?.生命阶段 === '存活', '攻击双方必须存活');
      requireValue(actor.战斗 && actor.生命 && target.战斗 && target.生命, '战斗属性或生命未定标');
      requireValue(actor.位面ID === target.位面ID && actor.地点ID === target.地点ID, '目标不在同一场景');
      requireValue(!Object.keys(actor.状态).length && !Object.keys(target.状态).length, '状态效果尚未接入攻防计算');
      requireValue(actor.能力ID[command.abilityId] === true && own(state._能力, command.abilityId), '未获得此技能');
      const skill = state._能力[command.abilityId];
      requireValue(skill.规则状态 === '可结算' && ['主动','复合'].includes(skill.用法), '技能不可结算');
      const effect = Object.values(skill.效果).find(e=>e.规则ID==='combat-strike-1');
      requireValue(effect, '此能力尚未登记攻击效果');
      const params = effect.参数;
      const mechanism = String(params.机制ID);
      requireValue(own(session.death_adaptation_runtime.rules.mechanisms, mechanism), '机制尚未登记');
      const seconds = checkedNumber(params.耗时本地秒, '行动耗时', Number.EPSILON);
      const cooldown = checkedNumber(skill.冷却本地秒, '技能冷却');
      const key = `${command.actorId}:${command.abilityId}`;
      const deadlines = state._结算.冷却结束;
      requireValue((deadlines[key] ?? 0) <= state._时空.起源时刻秒, '技能仍在冷却');
      const rate = state._时空.位面目录[actor.位面ID]?.时钟.本地每起源秒;
      requireValue(rate !== null && rate !== undefined, '行动地点时间倍率未定标');
      finite(rate, Number.EPSILON);
      for (const [id, amount] of Object.entries(skill.消耗)) {
        checkedNumber(amount, '技能消耗');
        requireValue(own(actor.资源, id) && actor.资源[id].当前 >= amount, '技能资源不足');
      }
      const calculation = calculateAttack(
        actor.战斗,
        target.战斗,
        mechanism,
        checkedNumber(params.倍率, '技能倍率', 0, 100),
        checkedNumber(params.固定伤害, '固定伤害'),
        random,
      );
      for (const [id, amount] of Object.entries(skill.消耗)) actor.资源[id].当前 -= amount;
      advanceTime(state, seconds / rate);
      deadlines[key] = state._时空.起源时刻秒 + cooldown / rate;
      const hpBefore = target.生命.当前;
      const guardId = matchingGuard(state,command.targetId,mechanism);
      const guard = state._能力[guardId]?.效果.guard;
      const absorbed =
        target.能力ID[guardId] && guard?.规则ID === 'trial-convert'
          ? Math.min(calculation.damage, Number(guard.参数.capacity))
          : 0;
      result =
        calculation.damage > 0
          ? damage(
              session,
              command.targetId,
              [
                {
                  sourceId: command.actorId,
                  mechanismId: mechanism,
                  amount: calculation.damage,
                  conditions: `${actor.名称}使用${skill.名称}`,
                },
              ],
              command.id,
            )
          : calculation.hit
            ? '攻击命中，实际伤害为0'
            : '攻击未命中';
      battle = {
        ...calculation,
        actorId: command.actorId,
        targetId: command.targetId,
        actorName: actor.名称,
        targetName: target.名称,
        skillName: skill.名称,
        mechanism: session.death_adaptation_runtime.rules.mechanisms[mechanism].name,
        hpBefore,
        hpAfter: target.生命.当前,
        hpMax: target.生命.上限,
        actualDamage: hpBefore - target.生命.当前,
        absorbed,
        energyCost: copy(skill.消耗),
        elapsedLocalSeconds: seconds,
        result,
      };
      if (calculation.damage > 0) practice(state, command.actorId, command.abilityId);
      break;
    }
    case 'damage':
      result = damage(session, command.targetId, command.causes, command.id);
      break;
    case 'release': {
      requireValue(own(state._实体, command.actorId), '行动者不存在');
      const actor = state._实体[command.actorId];
      requireValue(actor.生命阶段 === '存活', '行动者不能使用能力');
      requireValue(actor.能力ID[command.abilityId] === true && own(state._能力, command.abilityId), '未获得此能力');
      const ability = state._能力[command.abilityId];
      requireValue(
        ability.规则状态 === '可结算' && ability.效果.release?.规则ID === 'trial-release',
        '未实现的主动效果',
      );
      const resource = actor.资源[command.abilityId];
      requireValue(resource && resource.当前 > 0, '没有可释放的储能');
      spendAbility(state,command.actorId,command.abilityId);
      const amount = Math.floor(resource.当前 * Number(ability.效果.release.参数.multiplier || 1));
      resource.当前 = 0;
      result = damage(
        session,
        command.targetId,
        [
          {
            sourceId: command.actorId,
            mechanismId: String(ability.效果.release.参数.mechanism),
            amount,
            conditions: '同场景直接释放已储能量',
          },
        ],
        command.id,
      );
      practice(state, command.actorId, command.abilityId);
      break;
    }
    case 'advance': {
      finite(command.seconds, Number.EPSILON);
      advanceTime(state, command.seconds);
      result = `世界时间推进${command.seconds}起源秒`;
      break;
    }
    case 'revive': {
      result = reviveOrigin(state, localTime);
      break;
    }
    default:
      throw Error('未实现的指令');
  }
  state._结算.状态版本++;
  state._结算.最近事件ID = command.id;
  session.death_adaptation_runtime.events[command.id] = {
    command: copy(command),
    result,
    outputVersion: state._结算.状态版本,
    ...(battle ? { battle } : {}),
    ...(checkReport ? {check:checkReport} : {}),
  };
  state._运行账本 = copy(session.death_adaptation_runtime);
  validateSession(session);
  return { session, result, replayed: false };
}

export function basicStrike(mechanism = 'impact'): Schema['_能力'][string] {
  return Schema.shape._能力.unwrap().valueType.parse({
    名称: '基础攻击',
    描述: '一次针对同场景目标的直接攻击。',
    来源: { 类型: '初始' },
    用法: '主动',
    规则状态: '可结算',
    机制ID: { [mechanism]: true },
    效果: { strike: { 规则ID: 'combat-strike-1', 参数: { 机制ID: mechanism, 倍率: 1, 固定伤害: 0, 耗时本地秒: 6 } } },
  });
}

function advanceTime(state: Schema, seconds: number): void {
  state._时空.起源时刻秒 += seconds;
  finite(state._时空.起源时刻秒);
  for (const task of Object.values(state._任务)) {
    if (task.状态 === '进行中' && task.截止起源秒 !== null && state._时空.起源时刻秒 >= task.截止起源秒)
      task.状态 = '已失效';
  }
  if (state._复苏?.完成起源秒 !== null && state._复苏 && state._时空.起源时刻秒 >= state._复苏.完成起源秒)
    state._复苏.阶段 = '可复苏';
}
