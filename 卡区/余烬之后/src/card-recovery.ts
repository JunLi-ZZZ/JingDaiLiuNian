import { Schema, CharacterDossierSchema } from './schema';
import { resolveDossierCard } from './output-cards';
import { removed } from './archive-tools';
import { readRuntime } from './runtime-store';
import { registerDossierEntities } from './dossier-runtime';
export type MissingCard = {kind: 'note' | 'character'; id: string};
const safeId = (id:string) => /^[a-zA-Z0-9_-]{1,80}$/.test(id) && !['constructor','prototype','__proto__'].includes(id);
const noteSchema = Schema.shape.叙事.unwrap().shape.见闻.unwrap().valueType;
export function missingCards(state:Schema, story:string):MissingCard[] {
  const result:MissingCard[]=[];
  for(const match of story.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g,'').matchAll(/<EmbersCard\b([^>]+)>/gi)) {
    const attrs=Object.fromEntries([...match[1].matchAll(/\b(type|id)\s*=\s*["']([^"']+)["']/g)].map(m=>[m[1],m[2]]));
    if(!['note','character'].includes(attrs.type) || !safeId(attrs.id || '') || removed(state,attrs.type,attrs.id) || removed(state,attrs.type,state._档案引用?.[attrs.type+':'+attrs.id] || attrs.id))continue;
    const kind=attrs.type as MissingCard['kind'],id=attrs.id;
    try { resolveDossierCard(state,kind,id); } catch {
      // 已有但未公开的见闻不是漏记，不由补全功能提升知情权限。
      if(kind==='note' && (state.叙事.见闻[id] || state._见闻档案[id]))continue;
      if(!result.some(r=>r.kind===kind && r.id===id))result.push({kind,id});
    }
  }
  return result;
}
export function applyCardRecovery(state:Schema, target:MissingCard, raw:unknown):Schema {
  if(!safeId(target.id) || !['note','character'].includes(target.kind))throw Error('档案引用无效');
  if(removed(state,target.kind,target.id))throw Error('该档案已手动移除，可在档案整理中恢复');
  const choice=z.strictObject({record:z.unknown().optional(),existingId:z.string().optional()}).parse(raw);
  if((choice.record!==undefined)===!!choice.existingId)throw Error('请提供一份新档案或一个已有档案ID');
  const next=_.cloneDeep(state);
  if(choice.existingId){
    if(!safeId(choice.existingId) || choice.existingId===target.id)throw Error('关联ID无效');
    resolveDossierCard(state,target.kind,choice.existingId);
    next._档案引用[target.kind+':'+target.id]=state._档案引用[target.kind+':'+choice.existingId] || choice.existingId;
  }else if(target.kind==='note'){
    if(state.叙事.见闻[target.id] || state._见闻档案[target.id])throw Error('该见闻已存在，请核对引用');
    const note=noteSchema.parse(choice.record);
    if(!note.标题.trim() || !note.内容.trim() || !note.来源.trim() || !note.知情者ID[state._开局.主角ID])throw Error('请补齐标题、内容、来源和主角知情依据');
    next.叙事.见闻[target.id]=note;
  }else{
    if(state.叙事.人物档案[target.id] || target.id===state._开局.主角ID)throw Error('该人物已存在');
    next.叙事.人物档案[target.id]=CharacterDossierSchema.parse(choice.record);
  }
  const parsed=Schema.parse(next),runtime=readRuntime({stat_data:parsed});
  return target.kind==='character' && runtime && parsed._初始化完成
    ? registerDossierEntities({stat_data:parsed,death_adaptation_runtime:runtime}).stat_data : parsed;
}
export function cardRecoveryPrompt(state:Schema,target:MissingCard,story:string,hint:string) {
  const all=target.kind==='note'?{...state._见闻档案,...state.叙事.见闻}:state.叙事.人物档案;
  const candidates=Object.entries(all).filter(([id])=>!removed(state,target.kind,id)).filter(([,v]:[string,any])=>target.kind!=='note' || v.知情者ID?.[state._开局.主角ID]).slice(-24);
  return [{role:'system' as const,content:'你负责补全正文引用的一条档案。根据本轮正文与用户补充整理事实，输出一个JSON对象。若同一资料已经存在，输出{"existingId":"已有ID"}；否则输出{"record":档案对象}。仅处理指定引用。人物基础信息结合背景协调补全；见闻按正文中已获得的信息与实际知情者记录。'},
    {role:'user' as const,content:JSON.stringify({目标:target,字段:z.toJSONSchema(target.kind==='note'?noteSchema:CharacterDossierSchema,{io:'input'}),主角ID:state._开局.主角ID,地点:state._时空.当前地点,已有档案:Object.fromEntries(candidates),本轮正文:story.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g,''),补充:hint})}];
}
