import type { Schema } from './schema';

export type ArchiveCategory = 'character' | 'entity' | 'note' | 'ability' | 'item' | 'quest';
export function removed(state: Schema, category: string, id: string): boolean {
  if (state._档案整理?.[`${category}:${id}`]) return true;
  if (category === 'character') return !!state._档案整理?.['entity:' + (state.叙事.人物档案[id]?.实体ID || id)];
  if (category === 'entity') return Object.entries(state.叙事.人物档案).some(([key, p]) => (p.实体ID || key) === id && state._档案整理?.['character:' + key]);
  if (category === 'note') {
    const note = state.叙事.见闻[id] || state._见闻档案[id] as Schema['叙事']['见闻'][string] | undefined;
    return !!note?.对象ID && (removed(state, 'entity', note.对象ID) || removed(state, 'character', note.对象ID) || ['ability', 'item', 'quest'].some(kind => !!state._档案整理?.[kind + ':' + note.对象ID]));
  }
  return false;
}
export function archiveEntries(state: Schema) {
  const groups: [ArchiveCategory, string, Record<string, any>][] = [
    ['character','人物',state.叙事.人物档案], ['entity','实体',state._实体],
    ['note','见闻',{...state._见闻档案,...state.叙事.见闻}], ['ability','能力',state._能力],
    ['item','物品',state._物品], ['quest','事项',state._任务],
  ];
  return groups.flatMap(([category,label,table]) => Object.entries(table)
    .filter(([id]) => id !== state._开局.主角ID)
    .map(([id,record]) => ({category,label,id,name:record.名称 || record.标题 || id,removed:removed(state,category,id),explicit:!!state._档案整理[category+':'+id]})));
}
export function characterGroups(state: Schema, search = '') {
  const people = Object.entries(state.叙事.人物档案).filter(([id,p]) => !removed(state,'character',id)
    && state._实体[p.实体ID || id]?.类别 !== '生物' && (!search || (p.名称+p.别名.join(' ')+p.身份).includes(search))).slice(-60);
  const entities = Object.entries(state._实体).filter(([id,e]) => id !== state._开局.主角ID && !removed(state,'entity',id)
    && e.位面ID===state._时空.当前地点.位面ID && e.地点ID===state._时空.当前地点.地点ID && (!search || e.名称.includes(search)));
  return {people, entities: entities.filter(([id,e]) => e.类别==='人物' && !people.some(([key,p]) => (p.实体ID||key)===id)),
    creatures: entities.filter(([,e]) => e.类别==='生物')};
}

export function rosterEntries(state:Schema,search='') {
  const linked=new Set<string>();
  const records=Object.entries(state.叙事.人物档案).filter(([id])=>id!==state._开局.主角ID && !removed(state,'character',id)).map(([id,p])=>{
    const entityId=p.实体ID||id,e=state._实体[entityId];linked.add(entityId);
    return {id,entityId,category:'character' as const,name:p.名称,dossier:p,entity:e,
      group:state._人物分组?.[entityId]||state._人物分组?.[id]||p.分组||'同伴',
      present:p.在场 && p.位面ID===state._时空.当前地点.位面ID && (!p.地点ID||p.地点ID===state._时空.当前地点.地点ID)};
  });
  const others=Object.entries(state._实体).filter(([id,e])=>id!==state._开局.主角ID && !linked.has(id) && !removed(state,'entity',id) && ['人物','生物'].includes(e.类别)).map(([id,e])=>({
    id,entityId:id,category:'entity' as const,name:e.名称,dossier:undefined,entity:e,
    group:state._人物分组?.[id]||'附近的人',
    present:e.位面ID===state._时空.当前地点.位面ID && e.地点ID===state._时空.当前地点.地点ID,
  }));
  return [...records,...others].filter(r=>(r.name+(r.dossier?.别名.join(' ')||'')+(r.dossier?.身份||'')).includes(search));
}
