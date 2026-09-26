import { Schema } from './schema';
import { readRuntime } from './runtime-store';
import { registerDossierEntities } from './dossier-runtime';
type Change={path:string[];value:unknown};
export type LocalArchive={receipt:string;branch:string;changes:Change[]};
const allowed=(p:string[])=>p.every(k=>k && !['__proto__','constructor','prototype'].includes(k)) && (
  (p.length===2 && ['_档案整理','_档案引用','_人物分组'].includes(p[0])) ||
  (p.length===3 && p[0]==='叙事' && ['见闻','人物档案'].includes(p[1])) ||
  (p.length===3 && p[0]==='_实体' && ['名称','类别'].includes(p[2])));
/** 手动编辑附着于消息页原文回执，重解析同一回复仍能恢复，切换消息页则不挪用。 */
export function saveLocalArchive(before:Schema,after:Schema,old:LocalArchive|undefined,receipt:string):LocalArchive {
  const branch=after._结算.分支ID;
  const changes=old?.receipt===receipt && old.branch===branch ? _.cloneDeep(old.changes) : [];
  const put=(path:string[],value:unknown)=>{
    if(_.isEqual(_.get(before,path),value))return;
    const index=changes.findIndex(c=>_.isEqual(c.path,path));
    const entry={path,value:_.cloneDeep(value)};
    if(index<0)changes.push(entry);else changes[index]=entry;
  };
  for(const root of ['_档案整理','_档案引用','_人物分组'] as const)for(const [id,value] of Object.entries(after[root]))put([root,id],value);
  for(const root of ['见闻','人物档案'] as const)for(const [id,value] of Object.entries(after.叙事[root]))put(['叙事',root,id],value);
  for(const [id,e] of Object.entries(after._实体))for(const field of ['名称','类别'] as const)put(['_实体',id,field],e[field]);
  return {branch,receipt,changes};
}
export function replayLocalArchive(state:Schema,raw:unknown,receipt?:string):Schema {
  const parsed=z.object({receipt:z.string(),branch:z.string(),changes:z.array(z.object({path:z.array(z.string()),value:z.unknown()}))}).safeParse(raw);
  if(!parsed.success || parsed.data.receipt!==receipt || parsed.data.branch!==state._结算.分支ID)return state;
  const next=_.cloneDeep(state);
  for(const c of parsed.data.changes){
    if(!allowed(c.path))throw Error('本地档案记录包含无效路径');
    if(c.path[0]==='_实体' && !Object.hasOwn(next._实体,c.path[1]))continue;
    _.set(next,c.path,_.cloneDeep(c.value));
  }
  const stateAfter=Schema.parse(next),runtime=readRuntime({stat_data:stateAfter});
  return runtime && stateAfter._初始化完成
    ? registerDossierEntities({stat_data:stateAfter,death_adaptation_runtime:runtime}).stat_data : stateAfter;
}
