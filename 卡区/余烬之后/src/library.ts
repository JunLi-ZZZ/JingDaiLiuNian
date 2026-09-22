import { worldbookOrder } from './worldbook-order';
import { LibraryEntrySchema } from './schema';
import type { LibraryEntry, Schema } from './schema';
export function plainDossierText(text:string): string {
  return text.replace(/\*\*\*([^*\n]+)\*\*\*/g,'$1').replace(/\*\*([^*\n]+)\*\*/g,'$1').replace(/__([^_\n]+)__/g,'$1');
}
export function parseLibrary(text:string): LibraryEntry {
  const value=JSON.parse(text.trim().replace(/^`{3}(?:json)?\s*/i,'').replace(/\s*`{3}$/,''));
  const result=LibraryEntrySchema.parse(value);
  if (['__proto__','prototype','constructor'].includes(result.id)) throw Error('请更换档案ID');
  // 生成的档案保持纯设定文本，EJS控制器只读取登记项。
  if (/<%|%>|@@preprocessing|@@activate|<script/i.test(JSON.stringify(result))) throw Error('档案请使用纯文字设定');
  result.content=plainDossierText(result.content);
  result.summary=plainDossierText(result.summary);
  if(result.kind==='plane') result.planeId=result.id;
  return result;
}
export const libraryName=(entry:LibraryEntry)=>'余烬之后·潮镜·'+entry.kind+'·'+entry.id;
export function libraryWorldbookEntry(entry:LibraryEntry): Omit<WorldbookEntry,'uid'> {
 return {
  name:libraryName(entry), enabled:false,
  strategy:{type:'constant',keys:[entry.name,...entry.aliases],keys_secondary:{logic:'and_any',keys:[]},scan_depth:2},
  position:{type:'after_character_definition',role:'system',depth:0,order:worldbookOrder.资料库控制器},
  content:entry.name+'\n'+(entry.kind==='plane'?'位面ID：':'人物档案ID：')+entry.id+'\n'+entry.content,probability:100,
  recursion:{prevent_incoming:true,prevent_outgoing:true,delay_until:null},
  effect:{sticky:null,cooldown:null,delay:null},extra:{embersLibraryId:entry.id,embersLibraryKind:entry.kind},
 };
}
export type LibraryPort={
 check():void; book():Promise<string>; read(book:string):Promise<WorldbookEntry[]>;
 update(book:string, transform:(entries:WorldbookEntry[])=>WorldbookEntry[]):Promise<unknown>;
 create(book:string, entry:Omit<WorldbookEntry,'uid'>):Promise<unknown>;
 persist(entry:Schema['_资料库'][string]):Promise<boolean>;
};
export async function saveLibrary(port:LibraryPort, entry:LibraryEntry) {
 entry=parseLibrary(JSON.stringify(entry));
 port.check();const book=await port.book();port.check();
 const entries=await port.read(book);port.check();
 const spec=libraryWorldbookEntry(entry);
 const owns=(e:WorldbookEntry)=>e.extra?.embersLibraryId===entry.id && e.extra?.embersLibraryKind===entry.kind;
 if(entries.some(owns)){
  await port.update(book,list=>{
    port.check();
    return list.map(e=>owns(e)?{...spec,uid:e.uid}:e);
  });
 }else{
  if(entries.some(e=>e.name===spec.name))throw Error('世界书存在同名非潮镜条目，请使用其他ID');
  await port.create(book,spec);
 }
 port.check();
 const saved=(await port.read(book)).find(owns);
 if(!saved || saved.content!==spec.content || saved.enabled)throw Error('世界书回读校验失败，请重试保存');
 const {content:_content,...ref}=entry;
 if(!await port.persist({...ref,book,entry:spec.name}))throw Error('条目已写入世界书，聊天引用尚未保存；请返回原楼层重试，已有条目会更新');
 return {book,entry:spec.name};
}
