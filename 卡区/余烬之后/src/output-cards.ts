import type { Session } from './engine';
import { characterEntity } from './character-dossier';

const Reference = z.strictObject({ 分支ID: z.string(), 事件ID: z.string() });
export function eventReference(state:Session['stat_data'], id:string) {
  if (/^\d+$/.test(id) && state.叙事.本轮结算) return 'story-'+state.叙事.本轮结算.起算状态版本+'-'+Number(id);
  return id;
}
export function battleToken(session: Session, eventId: string): string {
  eventId=eventReference(session.stat_data,eventId);
  return `<DACombat>${JSON.stringify({ 分支ID: session.stat_data._结算.分支ID, 事件ID: eventId })}</DACombat>`;
}

// 正文只传事件引用；数值从同一楼层的结算账本取得，不接收模型给出的伤害数字或HTML。
export function resolveBattleCard(session: Session, token: string) {
  const prefix = '<DACombat>';
  const suffix = '</DACombat>';
  if (!token.startsWith(prefix) || !token.endsWith(suffix)) throw Error('不是战斗卡片引用');
  const ref = Reference.parse(JSON.parse(token.slice(prefix.length, -suffix.length)));
  if (ref.分支ID !== session.stat_data._结算.分支ID) throw Error('卡片不属于当前分支');
  const event = Object.hasOwn(session.death_adaptation_runtime.events, ref.事件ID)
    ? session.death_adaptation_runtime.events[ref.事件ID]
    : undefined;
  if (!event?.battle) throw Error('结算事件尚不存在');
  const report = event.battle;
  const playerId = session.stat_data._开局.主角ID;
  const known = (id: string) =>
    id === playerId ||
    Object.values(session.stat_data.叙事.见闻).some(info => info.对象ID === id && info.知情者ID[playerId]);
  return {
    eventId: ref.事件ID,
    actor: known(report.actorId) ? report.actorName : '未辨明的来源',
    target: known(report.targetId) ? report.targetName : '未辨明的目标',
    skill: known(report.actorId) ? report.skillName : '未知作用',
    outcome: !report.hit ? '未命中' : report.critical ? '暴击' : '命中',
    damage: report.actualDamage,
    absorbed: report.absorbed,
    hp: report.targetId === playerId ? `${report.hpBefore} → ${report.hpAfter} / ${report.hpMax}` : null,
    cost:
      report.actorId === playerId
        ? Object.entries(report.energyCost)
            .map(([id, amount]) => `${session.stat_data._实体[playerId].资源[id]?.名称 || id} ${amount}`)
            .join('、')
        : '',
    elapsed: report.elapsedLocalSeconds,
    // 隐藏目标的防御、抗性、生命和原始计算参数不进入玩家展示模型。
    roll: report.actorId === playerId ? `${report.hitRoll.toFixed(4)} < ${report.hitChance.toFixed(4)}` : '',
  };
}
export type PublicBattleCard = ReturnType<typeof resolveBattleCard>;

export type DossierCard = {
 kind:string;title:string;grade:string;subtitle:string;description:string;detail:string;
 type?:string; emblem?:string; source?:string; metrics?:{label:string;value:string}[];
};
export function entityMetrics(entity: Session['stat_data']['_实体'][string]) {
  const energy = entity.资源.energy;
  return [
    ...(entity.生命 ? [{ label: '生命', value: `${entity.生命.当前} / ${entity.生命.上限}` }] : []),
    ...(energy ? [{ label: energy.名称 || '能量', value: `${energy.当前} / ${energy.上限 ?? '∞'}` }] : []),
    ...(entity.战斗 ? [
      { label: '攻击', value: String(entity.战斗.攻击) },
      { label: '防御', value: String(entity.战斗.防御) },
    ] : []),
  ];
}
export function resolveDossierCard(state: Session['stat_data'], kind: string, id: string):DossierCard {
  const playerId = state._开局.主角ID;
  const player = state._实体[playerId];
  const note = Object.values({ ...state._见闻档案, ...state.叙事.见闻 }).find((value: any) => value.对象ID === id && value.知情者ID?.[playerId]) as Session['stat_data']['叙事']['见闻'][string] | undefined;
  if ((kind === 'ability' || kind === 'gain') && player?.能力ID[id]) {
    const a = state._能力[id]; const r = player.资源[id];
    const source=a.来源.说明 || Object.values(state._死亡记录[a.来源.死亡事件ID || '']?.因果链 || {}).map(c=>c.作用条件).join('；') || '传承种核';
    const mechanism=String(a.效果.guard?.参数.mechanism || '');
    return { type:kind,emblem:a.效果.guard?(mechanism==='electric'?'transfer':mechanism==='heat'?'flame':mechanism==='cold'?'frost':'shield'):id==='world-crossing'?'gate':'star',source,
      metrics:[{label:'位阶',value:a.品阶},{label:'掌握',value:'Lv.'+a.等级},{label:'冷却',value:a.冷却本地秒+'秒'},...(r?[{label:'储能',value:r.当前+' / '+r.上限}]:[])],
      kind: kind === 'gain' ? '能力获得 · '+a.来源.类型 : '能力', title: a.名称, grade: a.品阶, subtitle: `${a.用法} · Lv.${a.等级}`, description: a.描述,
      detail: [kind === 'gain' ? '来源：'+a.来源.类型+' · '+source : '', a.触发条件, a.限制, r ? `储能 ${r.当前} / ${r.上限}` : '', a.进化方向 ? `进化：${a.进化方向}` : ''].filter(Boolean).join('\n') };
  }
  if (kind === 'character' && id === playerId) {
    const p = state._开局.档案;
    return {type:kind,kind:'人物档案',title:p.姓名 || player?.名称 || '旅人',grade:'旅途中的你',subtitle:p.身份 || p.种族,
      description:p.外貌,detail:[p.经历,p.持有者补充].filter(Boolean).join('\n'),metrics:player ? entityMetrics(player) : undefined};
  }
  if (kind === 'character') {
    const p=state.叙事.人物档案[id];
    if(p) return {type:kind,kind:'人物档案',title:p.名称,grade:'旅途相逢',subtitle:p.身份,description:p.外貌,detail:[p.近况,p.关系经历].filter(Boolean).join('\n'),metrics:characterEntity(state,id)?entityMetrics(characterEntity(state,id)!):undefined};
  }
  if (kind === 'item') {
    const item = state._物品[id];
    if (item && ((item.所在.类型 === '实体' && item.所在.ID === playerId) || note)) return { type:kind,kind:'物品', title:item.名称, grade:item.品阶, subtitle:`${item.类别} · ${item.数量}${item.单位}`, description:item.描述, detail:item.耐久 ? `耐久 ${item.耐久.当前} / ${item.耐久.上限}` : '' };
  }
  if (kind === 'entity' && (id === playerId || note || (['人物','生物'].includes(state._实体[id]?.类别) && state._实体[id]?.位面ID===state._时空.当前地点.位面ID && state._实体[id]?.地点ID===state._时空.当前地点.地点ID))) {
    const entity = state._实体[id];
    if (entity) return { type:kind,kind:entity.类别, title:entity.名称 || (id === playerId ? state._开局.档案.姓名 : '') || '未命名实体',
      grade:entity.档案.本土境界 || '', subtitle:entity.档案.种族, description:note?.内容 || entity.档案.外貌,
      detail:note?.来源 || '', metrics:entityMetrics(entity) };
  }
  const info = state.叙事.见闻[id] || state._见闻档案[id] as Session['stat_data']['叙事']['见闻'][string] | undefined;
  if (kind === 'note' && info?.知情者ID[playerId]) return {type:kind,kind:info.类别, title:info.标题, grade:info.可信度, subtitle:'见闻手记', description:info.内容, detail:info.来源};
  throw Error('此条目尚未收录于可见档案');
}


export type SceneCard={type:string;title:string;kicker:string;body:string;seal:string;rows:{label:string;value:string}[];die?:number;bonus?:number;difficulty?:number;success?:boolean};
export function resolveSceneCard(session:Session,kind:string,id:string):SceneCard {
 const s=session.stat_data, player=s._实体[s._开局.主角ID];
 if(['check','death','travel'].includes(kind))id=eventReference(s,id);
 const event=session.death_adaptation_runtime.events[id];
 const card:SceneCard={type:kind,title:'',kicker:'',body:'',seal:'',rows:[]};
 if(kind==='check' && event?.command.kind==='check'){
  const report=event.check;
  return {...card,title:event.command.task,kicker:'命运检定',body:event.result,seal:report?report.success?'达成':'未达成':'记录',...report,rows:report?[{label:'骰面',value:String(report.die)},{label:'加值',value:'+'+report.bonus},{label:'难度',value:String(report.difficulty)}]:[]};
 }
 if(kind==='death'){
  const death=s._死亡记录[id];
  if(!death || death.实体ID!==s._开局.主角ID)throw Error('尚无对应归泊记录');
  return {...card,title:'此程未竟，归途已明',kicker:'终焉 · 归泊',seal:'归',body:Object.values(death.因果链).map(c=>c.作用条件).join('；'),rows:[
   {label:'此刻',value:death.复苏完成起源秒===null?'归泊庭 · 重构':'已复苏'},
   {label:'留下的力量',value:Object.keys(death.授予能力ID).map(a=>s._能力[a]?.名称).filter(Boolean).join('、')||'既有适应得到强化'},
   {label:'世界',value:'时间继续，经历保留'}]};
 }
 if(kind==='travel' && event?.command.kind==='travel')return {...card,title:event.command.name,kicker:'越界 · 抵达',seal:'渡',body:event.command.description,rows:[{label:'通路',value:event.command.route},{label:'落脚点',value:event.command.location},{label:'当地流速',value:event.command.rate+' : 1'}]};
 if(kind==='growth'){
  const a=s._能力[id];if(!a || !player.能力ID[id])throw Error('未掌握该能力');
  return {...card,title:a.名称,kicker:'能力成长',seal:String(a.等级),body:Object.values(a.成长记录).slice(-1)[0]||'本次运用留下了新的体会。',rows:[{label:'当前品阶',value:a.品阶},{label:'熟练度',value:a.熟练度+' / '+a.等级*5},{label:'进化方向',value:a.进化方向||'尚未选择'}]};
 }
 if(kind==='quest'){
  const task=s._任务[id];if(!task)throw Error('尚无对应事项');
  return {...card,title:task.名称,kicker:'旅途委托',seal:task.状态,body:task.描述,rows:[...Object.values(task.目标).map(g=>({label:g.描述,value:g.当前+' / '+g.所需+g.单位})),{label:'酬报',value:task.奖励说明||'按约定'},{label:'牵连',value:task.后果说明}]};
 }
 if(kind==='snapshot' && id==='current'){
  const loc=s._时空.当前地点;
  const known=new Set(Object.values(s.叙事.见闻).filter(n=>n.知情者ID[s._开局.主角ID]).map(n=>n.对象ID));
  const onsite=Object.entries(s._实体).filter(([key,e])=>key!==s._开局.主角ID && known.has(key) && e.位面ID===loc.位面ID && e.地点ID===loc.地点ID);
  return {...card,title:loc.场景||loc.地点ID,kicker:'交锋 · 局面',seal:'此刻',body:s.叙事.场景描述,rows:[{label:player.名称+' · 生命',value:(player.生命?.当前 ?? '—')+' / '+(player.生命?.上限 ?? '—')},...Object.values(player.资源).slice(0,4).map(v=>({label:v.名称,value:v.当前+' / '+(v.上限??'—')})),...onsite.slice(0,6).map(([,e])=>({label:e.名称,value:e.生命阶段}))]};
 }
 throw Error('此卡片等待对应的结算记录');
}
