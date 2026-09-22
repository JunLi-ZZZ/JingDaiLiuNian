import { Schema } from '../../schema';
import type { Session } from '../../engine';
const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw Error(message); }

export function grantOriginInheritance(state: Schema, opportunity: string): void {
  state._能力['origin-rebirth'] = Schema.shape._能力.unwrap().valueType.parse({
    名称: '起源涅槃', 描述: '致命伤令身体死亡后，种核保存自我，在十分钟起源时间内重构身体，并从直接死因中形成适应能力。世界与他人的经历继续。',
    品阶: '本源', 来源: { 类型: '初始', 说明: opportunity }, 用法: '被动', 规则状态: '可结算',
    触发条件: '生命归零', 效果: { rebirth: { 规则ID: 'origin-rebirth', 参数: {} } },
    限制: '重构需十分钟；适应覆盖已识别死因与已承受强度。随身物品依绑定关系保留或留在死亡现场。',
  });
  state._实体.player.能力ID['origin-rebirth'] = true;
  state._开局.伴生灵ID = 'asteria';
}

export function settleOriginDeath(session: Session, targetId: string, lethal: {sourceId:string;mechanismId:string;amount:number;conditions:string}, chain: Schema['_死亡记录'][string]['因果链'], defended: Record<string,string>, eventId: string): string {
  const state=session.stat_data, target=state._实体[targetId], rules=session.death_adaptation_runtime.rules;
  const deathId = eventId;
  requireValue(!own(state._死亡记录, deathId), '死亡事件已存在');
  const abilityId = `adapt-${targetId}-${lethal.mechanismId}`;
  const abilityName = rules.mechanisms[lethal.mechanismId].ability;
  const existing = own(state._能力, abilityId) ? state._能力[abilityId] : undefined;
  const ability =
    existing ??
    Schema.shape._能力.unwrap().valueType.parse({
      名称: abilityName,
      品阶: '稀有',
      来源: { 类型: '死亡', 死亡事件ID: deathId, 来源实体ID: lethal.sourceId },
      机制ID: { [lethal.mechanismId]: true },
      用法: '复合',
      规则状态: '可结算',
    });
  // 测试规则：每次受击可转换不超过已致死攻击的强度，多余能量散逸；储能可主动释放。
  ability.描述 = '被动转移对应机制的伤害，并可将暂存力量主动释放。';
  ability.触发条件 = `受到已登记的${rules.mechanisms[lethal.mechanismId].name}作用`;
  const capacity = Math.max(Number(ability.效果.guard?.参数.capacity || 0), lethal.amount);
  ability.限制 = '对应机制的作用可转化为储能；超出单次转化量的部分仍会伤害身体。转化量、储能和释放倍率见效果参数。';
  ability.效果.guard = { 规则ID: 'trial-convert', 参数: { mechanism: lethal.mechanismId, capacity } };
  ability.效果.release = { 规则ID: 'trial-release', 参数: { mechanism: lethal.mechanismId, multiplier: Number(ability.效果.release?.参数.multiplier || 1) } };
  ability.成长记录[deathId] = `转移上限达到${lethal.amount}`;
  state._能力[abilityId] = ability;
  target.能力ID[abilityId] = true;
  target.资源[abilityId] = { 名称: `${abilityName}储能`, 当前: 0, 上限: Math.max(target.资源[abilityId]?.上限 || 0, capacity), 单位: '点' };
  state._死亡记录[deathId] = Schema.shape._死亡记录.unwrap().valueType.parse({
    实体ID: targetId,
    起源时刻秒: state._时空.起源时刻秒,
    位面ID: target.位面ID,
    地点ID: target.地点ID,
    结算事件ID: eventId,
    因果链: chain,
    已参与防护: defended,
    授予能力ID: { [abilityId]: true },
    能力授予状态: '已完成',
  });
  for (const item of Object.values(state._物品)) {
    if (item.所在.类型 === '实体' && item.所在.ID === targetId && item.复苏绑定实体ID !== targetId) {
      item.所在 = { 类型: '地点', ID: target.地点ID };
    }
  }
  target.装备 = Object.fromEntries(
    Object.entries(target.装备).filter(([, id]) => state._物品[id].所在.类型 === '实体'),
  );
  target.生命阶段 = '重构中';
  state._复苏 = {
    死亡事件ID: deathId,
    锚点ID: 'start',
    开始起源秒: state._时空.起源时刻秒,
    完成起源秒: state._时空.起源时刻秒 + rules.revivalSeconds,
    规则ID: rules.id,
    阶段: '重构中',
  };
  if (state._时空.位面目录.harbor) {
    state._复苏.锚点ID = 'harbor';
    target.位面ID = 'harbor'; target.地点ID = 'return-court';
    state._时空.当前地点 = Schema.shape._时空.unwrap().shape.当前地点.parse({ 位面ID: 'harbor', 地点ID: 'return-court', 场景: '归泊庭 · 潮镜前' });
    state._结算.遭遇ID = null;
  }
  return `死亡已确认，${existing ? '强化' : '获得'}${abilityName}，开始重构`;
}

export function reviveOrigin(state:Schema, assertLocalTime:(state:Schema,planeId:string)=>number):string {
      const revival = state._复苏;
      requireValue(
        revival && revival.完成起源秒 !== null && state._时空.起源时刻秒 >= revival.完成起源秒,
        '尚未到复苏时间',
      );
      requireValue(revival.锚点ID && own(state._锚点, revival.锚点ID), '复苏锚点不存在');
      const anchor = state._锚点[revival.锚点ID];
      requireValue(anchor.状态 === '可用', '复苏锚点失效，等待合法替代位置');
      assertLocalTime(state, anchor.位面ID);
      const player = state._实体[state._开局.主角ID];
      requireValue(player.生命, '主角生命未定标');
      player.生命.当前 = player.生命.上限;
      player.生命阶段 = '存活';
      if (player.资源.energy?.上限 != null) player.资源.energy.当前 = player.资源.energy.上限;
      player.位面ID = anchor.位面ID;
      player.地点ID = anchor.地点ID;
      if (state._时空.当前地点.位面ID !== anchor.位面ID || state._时空.当前地点.地点ID !== anchor.地点ID) {
        state._时空.当前地点 = Schema.shape._时空
          .unwrap()
          .shape.当前地点.parse({ 位面ID: anchor.位面ID, 地点ID: anchor.地点ID });
      }
      state._死亡记录[revival.死亡事件ID].复苏完成起源秒 = state._时空.起源时刻秒;
      state._复苏 = null;
  return '复苏完成，外界经历与掉落物保留';
}
