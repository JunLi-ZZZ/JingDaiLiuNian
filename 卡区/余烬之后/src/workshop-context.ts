import type { Schema } from './schema';
export type WorkshopReference={name:string;content:string};
export type WorkshopContextPort={bindings():{primary:string|null;additional:string[]};read(book:string):Promise<WorldbookEntry[]>};

/** 读取内容源，包括被EJS按需调用的关闭条目；生成任务只取得设定正文。 */
export async function workshopReferences(port:WorkshopContextPort,kind:'character'|'plane',query:string,state?:Schema):Promise<WorkshopReference[]> {
 const bindings=port.bindings(),books=[...new Set([bindings.primary,...bindings.additional].filter((x):x is string=>!!x))];
 const cache=new Map<string,WorldbookEntry[]>();
 const read=async(book:string)=>{if(!cache.has(book))cache.set(book,await port.read(book));return cache.get(book)!;};
 const roots=(await Promise.all(books.map(read))).flat();
 const current=state?._时空.位面目录[state._时空.当前地点.位面ID];
 const terms=query+(current?' '+current.名称:'');
 const essential=new Set(['多元位面-体系概述','世界与人物','角色行为准则',kind==='character'?'NPC生成规则':'位面生成规则']);
 const source=(entry:WorldbookEntry)=>!/<%|%>|@@preprocessing/.test(entry.content);
 const match=(entry:WorldbookEntry)=>{
  const name=entry.name.replace(/^余烬之后_位面_/,'');
  return name.length>1 && terms.includes(name);
 };
 const selected=roots.filter(e=>source(e) && (essential.has(e.name) ||
  ((e.name.startsWith('余烬之后_位面_') || ['初微','末墟','艾斯特瑞亚','归泊庭'].includes(e.name)) && match(e))));
 const refs=Object.values(state?._资料库||{}).filter(ref=>ref.id===state?._时空.当前地点.位面ID || [ref.name,...ref.aliases].some(n=>n.length>1 && terms.includes(n)));
 for(const ref of refs){const entry=(await read(ref.book)).find(e=>e.name===ref.entry);if(entry && source(entry))selected.push(entry);}
 return selected.map(e=>({name:e.name,content:e.content}));
}
