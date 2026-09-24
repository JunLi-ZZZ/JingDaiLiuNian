import { Schema } from './schema';
import { AbilityDesignSchema, type AbilityDesign } from './ability-design';
import type { Session } from './engine';
const idOk=(id:string)=>/^[a-zA-Z0-9_-]{1,80}$/.test(id)&&!['constructor','prototype','__proto__'].includes(id);
/** 同一登记器供开局、剧情获得与能力重组使用，调用方负责事务副本与历史回执。 */
export function registerDesignedAbility(session:Session,actorId:string,abilityId:string,input:AbilityDesign,evidence:string,initial=false):void {
  const state=session.stat_data,actor=state._实体[actorId],design=AbilityDesignSchema.parse(input);
  if(!idOk(abilityId)||!idOk(actorId)||!actor)throw Error('能力持有者或能力ID无效');
  if(Object.hasOwn(state._能力,abilityId))throw Error('能力ID已存在，请沿用原档案或为新能力设置新ID');
  if(design.cost>0&&!actor.资源.energy)throw Error('能力所需能量资源尚未登记');
  const effects:Schema['_能力'][string]['效果']={narrative:{规则ID:'story-effect',参数:{原理:design.principle}}};
  const mechanisms:Record<string,boolean>={};
  const register=(id:string)=>{if(!idOk(id))throw Error('作用机制ID无效');mechanisms[id]=true;if(!Object.hasOwn(session.death_adaptation_runtime.rules.mechanisms,id))session.death_adaptation_runtime.rules.mechanisms[id]={name:id,ability:design.name};};
  if(design.travel)effects.travel={规则ID:'general-travel',参数:{}};
  if(design.transformation)effects.transformation={规则ID:'general-compose',参数:{}};
  if(design.utility)effects.utility={规则ID:'general-utility',参数:{检定加值:design.utility.bonus}};
  if(design.strike){const d=design.strike;register(d.mechanism);effects.strike={规则ID:'combat-strike-1',参数:{机制ID:d.mechanism,倍率:d.power,固定伤害:d.fixed,耗时本地秒:d.seconds}};}
  if(design.conversion){const d=design.conversion;register(d.mechanism);
    effects.guard={规则ID:'trial-convert',参数:{mechanism:d.mechanism,capacity:d.capacity}};
    effects.release={规则ID:'trial-release',参数:{mechanism:d.mechanism,multiplier:d.multiplier}};
    actor.资源[abilityId]={名称:design.name+'储能',当前:0,上限:d.storage,单位:'点'};
  }
  state._能力[abilityId]=Schema.shape._能力.unwrap().valueType.parse({名称:design.name,品阶:design.grade,
    用法:design.conversion?'复合':design.usage,规则状态:'可结算',来源:{类型:initial?'初始':'其他',说明:evidence},
    描述:design.description,触发条件:design.trigger,限制:design.limitations,机制ID:mechanisms,效果:effects,
    消耗:design.cost?{energy:design.cost}:{},冷却本地秒:design.cooldown});
  actor.能力ID[abilityId]=true;
}
