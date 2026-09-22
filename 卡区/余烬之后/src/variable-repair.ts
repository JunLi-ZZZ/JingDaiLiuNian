import { normalizeOperations } from './operation-input';
import { operationGuide } from './operation-guide';
import { Schema } from './schema';
import type { Session } from './engine';
import { validateSession } from './engine';
import { acceptNarrativeUpdate, formatUpdateError } from './mvu-policy';
import { readRuntime } from './runtime-store';
import { projectPromptState } from './prompt-view';

const PatchSchema = z.array(z.object({
  op: z.enum(['replace','insert','add','remove']), path:z.string(), value:z.unknown().optional(),
})).max(100);
type Patch = z.infer<typeof PatchSchema>;
const pointer=(parts:PropertyKey[])=>'/'+parts.map(p=>String(p).replace(/~/g,'~0').replace(/\//g,'~1')).join('/');
export function parseRepair(text: string): unknown {
  const xml = text.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/)?.[1];
  return JSON.parse((xml || text).trim().replace(/^`{3}(?:json)?\s*/i,'').replace(/\s*`{3}$/,''));
}

/** 失败批次是编辑底稿，已成功的存档只提供结算起点。 */
export function repairInput(state:Schema, raw:unknown=[]):Record<string,any> {
  const pending=state._待修复;
  if(!pending)throw Error('本楼没有失败的变量更新；已成功结算的动作请通过补记校正');
  if(pending.版本!==state._结算.状态版本)throw Error('存档已变化，请按最新状态核对失败更新');
  const failed=pending.输入 as Record<string,any>;
  const candidate:Record<string,any>=_.cloneDeep({叙事:state.叙事,待审提案:state.待审提案,...failed});
  if(candidate.叙事)candidate.叙事.本轮结算=normalizeOperations(candidate.叙事.本轮结算);
  if(typeof candidate.叙事?.本轮时间==='number')candidate.叙事.本轮时间={起算起源秒:state._时空.起源时刻秒,经过本地秒:candidate.叙事.本轮时间};
  if(Array.isArray(candidate.叙事?.本轮结算))candidate.叙事.本轮结算={起算状态版本:state._结算.状态版本,操作:candidate.叙事.本轮结算};
  for(const change of PatchSchema.parse(raw)){
    const parts=change.path.split('/').slice(1).map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'));
    if(!change.path.startsWith('/') || !['叙事','待审提案'].includes(parts[0]) || parts.some(p=>!p || ['__proto__','prototype','constructor'].includes(p)))throw Error('补丁路径仅支持叙事与待审提案');
    let target:Record<string,any>=candidate;
    for(const key of parts.slice(0,-1)){
      if(!Object.hasOwn(target,key) || !target[key] || typeof target[key]!=='object')throw Error('补丁父路径不存在：'+change.path);
      target=target[key];
    }
    const key=parts.at(-1)!;
    if(change.op!=='remove' && !Object.hasOwn(change,'value'))throw Error('补丁缺少value');
    if(Array.isArray(target)){
      const index=key==='-'?target.length:Number(key);
      if((key!=='-' && !/^(0|[1-9]\d*)$/.test(key)) || !Number.isInteger(index) || index<0 || index>target.length || ((change.op==='replace'||change.op==='remove') && index>=target.length))throw Error('数组下标不存在：'+change.path);
      if(change.op==='remove')target.splice(index,1);
      else if(change.op==='replace')target[index]=_.cloneDeep(change.value);
      else target.splice(index,0,_.cloneDeep(change.value));
    }else if(change.op==='remove'){
      if(!Object.hasOwn(target,key))throw Error('remove目标不存在：'+change.path);
      delete target[key];
    }else{
      if(change.op==='replace' && !Object.hasOwn(target,key))throw Error('replace目标不存在：'+change.path);
      target[key]=_.cloneDeep(change.value);
    }
  }
  return candidate;
}

/** 完整更新由程序重组，用于楼层重解析；模型只生成局部修正。 */
export function repairReplayPatch(state:Schema, patch:unknown):Patch {
  const input=repairInput(state,patch);
  return (['叙事','待审提案'] as const).filter(key=>input[key]!==undefined).map(key=>({op:'replace',path:'/'+key,value:input[key]}));
}
export function applyRepairPatch(session: Session, raw: unknown): Session {
  const patch=PatchSchema.parse(raw);
  const candidate=repairInput(session.stat_data,patch);
  const pending=session.stat_data._待修复!;
  const state=acceptNarrativeUpdate(session.stat_data,candidate,session.death_adaptation_runtime,pending.骰源版本 ?? pending.版本);
  state._更新错误='';state._待修复=null;
  state._修复记录={原文:JSON.stringify(pending.输入),补丁:patch};
  const result={stat_data:Schema.parse(state),death_adaptation_runtime:readRuntime({stat_data:state})!};
  validateSession(result);
  return result;
}

export function repairIssues(state:Schema, patch:unknown=[]){
  const input=repairInput(state,patch);
  try{acceptNarrativeUpdate(state,input,readRuntime({stat_data:state})!,state._待修复?.骰源版本 ?? state._待修复?.版本);return [];}
  catch(error){
    const issues=error instanceof z.ZodError?error.issues.map(i=>({path:i.path,message:i.message})):[];
    if(!issues.length){
      const message=formatUpdateError(error),index=message.match(/本轮结算\/操作\/(\d+)/)?.[1];
      const path=index!==undefined?['叙事','本轮结算','操作',Number(index)]:['叙事',message.includes('本轮时间')?'本轮时间':'本轮结算'];
      issues.push({path,message});
    }
    const list=issues.map(issue=>({路径:pointer(issue.path),当前值:_.get(input,issue.path),原因:issue.message,所在记录:_.get(input,issue.path.slice(0,-1))}));
    const raw=input.叙事?.本轮结算?.操作;
    if(Array.isArray(raw) && raw.some(v=>typeof v!=='object' || !v)){
      const rest=list.filter(i=>!i.路径.startsWith('/叙事/本轮结算/操作'));
      rest.unshift({路径:'/叙事/本轮结算/操作',当前值:raw,原因:'行动列表需要由带kind及参数的对象组成；按正文将现有内容整理为最多32个顺序动作。',所在记录:undefined});
      return rest;
    }
    return list;
  }
}
export function assertLocalRepair(state:Schema, previous:unknown, addition:unknown){
  const issues=repairIssues(state,previous);
  for(const p of PatchSchema.min(1).parse(addition)){
    if(!issues.some(i=>p.path===i.路径 || p.path.startsWith(i.路径+'/')))throw Error('候选改动超出了报错范围：'+p.path+'；请保留原有正确字段');
  }
}
export function repairPrompt(state:Schema, story:string, hint:string, patch:unknown=[]){
  const input=repairInput(state,patch),issues=repairIssues(state,patch);
  const kinds=new Set(issues.flatMap(i=>{
    const index=i.路径.match(/\/操作\/(\d+)/)?.[1];
    return index===undefined?[]:[input.叙事?.本轮结算?.操作?.[Number(index)]?.kind];
  }));
  const definitions=operationGuide([...kinds].filter((k):k is string=>typeof k==='string'));
  const context=projectPromptState({...state,_更新错误:'',_待修复:null});
  return [
    {role:'system' as const,content:'修正一次未保存的变量更新。返回JSONPatch数组，针对“待修正”的路径填写必要的replace、insert或remove。底稿已保留该轮全部输入，正确的时间、资料和其他动作由程序保留。按本轮正文与补充依据修正报错字段，类型和范围按给出的结构。路径以待修正列表为准；输出的value是该路径的实际值。程序合并后统一校验并结算。'},
    {role:'user' as const,content:JSON.stringify({待修正:issues,相关操作结构:definitions,当前存档:context,本轮正文:story.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/g,'').replace(/<EmbersPanel\s*\/>/g,''),补充:hint})},
  ];
}
