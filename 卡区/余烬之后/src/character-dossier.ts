import type { Schema, LibraryEntry } from './schema';

export function characterEntity(state:Schema,id:string) {
  const key=state.叙事.人物档案[id]?.实体ID || id;
  return Object.hasOwn(state._实体,key) ? state._实体[key] : undefined;
}

export function characterAttributes(state:Schema,id:string) {
  const e=characterEntity(state,id),p=state.叙事.人物档案[id];
  if(e?.生命 && e.战斗 && e.资源.energy)return {生命:e.生命,能量:{当前:e.资源.energy.当前,上限:e.资源.energy.上限 ?? e.资源.energy.当前},...e.战斗};
  return p?.属性 ?? null;
}

/** 角色建档自带属性；已登记实体的实时数值继续由结算维护。 */
export function dossierRegistrations(state:Schema) {
  return Object.entries(state.叙事.人物档案).flatMap(([id,p])=>{
    const key=p.实体ID||id,a=p.属性;
    if(!a || state._实体[key] || key===state._开局.主角ID)return [];
    return [{kind:'register' as const,entityId:key,name:p.名称,category:'人物' as const,
      life:a.生命.上限,currentLife:a.生命.当前,energy:a.能量.上限,currentEnergy:a.能量.当前,
      attack:a.攻击,defense:a.防御,hit:a.命中率,dodge:a.闪避率,critical:a.暴击率,criticalMultiplier:a.暴击倍率,resistance:a.抗性,
      evidence:('人物属性建档：'+[p.身份,p.能力与局限,p.背景经历].filter(Boolean).join('；')).slice(0,500)}];
  });
}

export function syncDossierLocations(state:Schema) {
  for(const [id,p] of Object.entries(state.叙事.人物档案)){
    const e=characterEntity(state,id);if(!e || (p.实体ID||id)===state._开局.主角ID)continue;
    if(p.在场){
      if(!p.位面ID)p.位面ID=state._时空.当前地点.位面ID;
      if(!p.地点ID && p.位面ID===state._时空.当前地点.位面ID)p.地点ID=state._时空.当前地点.地点ID;
    }
    if(p.位面ID)e.位面ID=p.位面ID;
    if(p.地点ID)e.地点ID=p.地点ID;
  }
}

/** 稳定设定导出；当局快照仍留在人物档案。 */
export function characterArchive(state:Schema,id:string):LibraryEntry {
  const p=state.叙事.人物档案[id];
  if(!p)throw Error('人物档案不存在');
  const fields=['名称','性别','年龄','种族','来源世界','身份','外貌','性格','说话方式','能力与局限','背景经历','日常喜好'] as const;
  const origin=Object.entries(state._时空.位面目录).find(([,plane])=>plane.名称===p.来源世界)?.[0] || '';
  return {id,kind:'character',name:p.名称,aliases:p.别名,planeId:origin,
    summary:[p.身份,p.种族].filter(Boolean).join('；'),
    content:fields.filter(key=>p[key]).map(key=>key+'：'+p[key]).join('\n')};
}
