import { EvolutionDesignSchema } from './schema';
import type { Schema, EvolutionDesign } from './schema';

import { grades } from './grades';
import type { EvolutionDirection } from './grades';
export { grades } from './grades';
export function proficiencyNeeded(level: number): number { return level * 5; }

/** 有效运用产生熟练度；重放事件不会再次调用。 */
export function practice(state: Schema, actorId: string, abilityId: string, points = 1): void {
  const ability = state._能力[abilityId];
  if (!ability || !state._实体[actorId]?.能力ID[abilityId]) return;
  if (!Number.isInteger(points) || points < 1 || points > 24) throw Error('熟练增长需要1至24的整数');
  const oldLevel=ability.等级;
  ability.熟练度 += points;
  while (ability.等级 < 20 && ability.熟练度 >= proficiencyNeeded(ability.等级)) {
    ability.熟练度 -= proficiencyNeeded(ability.等级);
    ability.等级++;
    const guard = ability.效果.guard;
    const resource = state._实体[actorId].资源[abilityId];
    if (guard?.规则ID === 'trial-convert') guard.参数.capacity = Math.ceil(Number(guard.参数.capacity) * 1.05);
    if (resource?.上限 != null) resource.上限 = Math.ceil(resource.上限 * 1.05);
    const strike = ability.效果.strike;
    if (strike?.规则ID === 'combat-strike-1') strike.参数.倍率 = Math.round((Number(strike.参数.倍率) + 0.05) * 100) / 100;
  }
  if(ability.等级>oldLevel)ability.成长记录['level-'+ability.等级]='掌握提升至'+ability.等级+'级';
  if (ability.等级 === 20) ability.熟练度 = Math.min(ability.熟练度, proficiencyNeeded(20));
}

export function evolutionOptions(state:Schema, actorId:string, abilityId:string):{direction:EvolutionDirection;label:string}[] {
  const a=state._能力[abilityId],actor=state._实体[actorId];
  if(!a || !actor?.能力ID[abilityId])return [];
  const options:{direction:EvolutionDirection;label:string}[]=[];
  if(a.效果.guard?.规则ID==='trial-convert'){
    if(actor.资源[abilityId]?.上限!=null)options.push({direction:'容纳',label:'储能上限 ×1.5'});
    options.push({direction:'转化',label:'单次转化 ×1.25'});
  }
  if(a.效果.release?.规则ID==='trial-release')options.push({direction:'释放',label:'释放倍率 +0.25'});
  if(a.效果.strike?.规则ID==='combat-strike-1')options.push({direction:'威力',label:'攻击倍率 +0.25'});
  if(a.效果.utility?.规则ID==='general-utility')options.push({direction:'精通',label:'专长检定 +1'});
  if(a.冷却本地秒>0)options.push({direction:'节律',label:'冷却 ×0.8'});
  if(Object.values(a.消耗).some(v=>v>0))options.push({direction:'节能',label:'消耗 ×0.8'});
  return options;
}
export function evolve(state: Schema, abilityId: string, direction:string, actorId=state._开局.主角ID, design?:EvolutionDesign): string {
  const actor=state._实体[actorId],ability=state._能力[abilityId];
  if(!ability || !actor?.能力ID[abilityId])throw Error('进化者尚未掌握此能力');
  if(!design && !evolutionOptions(state,actorId,abilityId).some(o=>o.direction===direction))throw Error('自拟进化需要提供design，说明变化原理、获得依据、作用、条件与代价');
  if(ability.进化次数>=3 || ability.等级<(ability.进化次数+1)*5)throw Error('能力在等级5、10、15各获得一次进化');
  if(design){
    design=EvolutionDesignSchema.parse(design);
    if(design.cost && !actor.资源.energy)throw Error('进化所需能量资源尚未登记');
    if(design.conversion && (actor.资源[abilityId]?.当前||0)>design.conversion.storage)throw Error('新储能上限低于当前储量，请先释放多余储能');
    if(design.name)ability.名称=design.name;
    ability.描述=design.description;ability.触发条件=design.trigger;ability.限制=design.limitations;
    if(design.cost!==undefined)ability.消耗.energy=design.cost;
    if(design.cooldown!==undefined)ability.冷却本地秒=design.cooldown;
    if(design.utility)ability.效果.utility={规则ID:'general-utility',参数:{检定加值:design.utility.bonus}};
    if(design.strike){const p=design.strike;ability.效果.strike={规则ID:'combat-strike-1',参数:{机制ID:p.mechanism,倍率:p.power,固定伤害:p.fixed,耗时本地秒:p.seconds}};ability.机制ID[p.mechanism]=true;}
    if(design.conversion){
      const p=design.conversion;
      ability.效果.guard={规则ID:'trial-convert',参数:{mechanism:p.mechanism,capacity:p.capacity}};
      ability.效果.release={规则ID:'trial-release',参数:{mechanism:p.mechanism,multiplier:p.multiplier}};
      actor.资源[abilityId]={名称:ability.名称+'储能',当前:actor.资源[abilityId]?.当前||0,上限:p.storage,单位:'点'};
      ability.机制ID[p.mechanism]=true;
    }
    if(ability.效果.guard && (ability.效果.utility||ability.效果.strike||ability.效果.release))ability.用法='复合';
    else if(ability.效果.utility||ability.效果.strike)ability.用法='主动';
  }else{
  const resource=actor.资源[abilityId];
  if(direction==='容纳')resource.上限=Math.ceil(resource.上限!*1.5);
  if(direction==='转化')ability.效果.guard.参数.capacity=Math.ceil(Number(ability.效果.guard.参数.capacity)*1.25);
  if(direction==='释放')ability.效果.release.参数.multiplier=Math.round((Number(ability.效果.release.参数.multiplier||1)+.25)*100)/100;
  if(direction==='威力')ability.效果.strike.参数.倍率=Math.round((Number(ability.效果.strike.参数.倍率)+.25)*100)/100;
  if(direction==='精通')ability.效果.utility.参数.检定加值=Number(ability.效果.utility.参数.检定加值||0)+1;
  if(direction==='节律')ability.冷却本地秒=Math.round(ability.冷却本地秒*.8*100)/100;
  if(direction==='节能')for(const key of Object.keys(ability.消耗))ability.消耗[key]=Math.round(ability.消耗[key]*.8*100)/100;
  }
  ability.进化次数++;
  ability.进化方向=[ability.进化方向,direction].filter(Boolean).join(' → ');
  ability.品阶=grades[Math.min(grades.length-1,grades.indexOf(ability.品阶)+1)];
  ability.成长记录['evolve-'+ability.进化次数]=direction+'进化，'+ability.品阶+(design?'；'+design.principle+'；依据：'+design.evidence:'');
  return ability.名称+'进化为'+ability.品阶+'，选择'+direction;
}

/** 同一状态版本与操作序号的骰子固定，供提示词预览及实际结算共用。 */
export function seededRandom(seed: number, branchId = ''): () => number {
  let hash = seed;
  for (const char of branchId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return () => { hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b); return Math.floor((hash >>> 0) / 4294967296 * 10000) / 10000; };
}
export function storyRandom(version: number, index: number, branchId = ''): () => number {
  return seededRandom((version + 1) * 7919 + index * 104729, branchId);
}
