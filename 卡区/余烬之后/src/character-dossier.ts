import type { Schema, LibraryEntry } from './schema';

export function characterEntity(state:Schema,id:string) {
  const key=state.叙事.人物档案[id]?.实体ID || id;
  return Object.hasOwn(state._实体,key) ? state._实体[key] : undefined;
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
