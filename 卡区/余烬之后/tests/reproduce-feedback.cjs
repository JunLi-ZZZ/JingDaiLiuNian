// 2026-09-22 截图关键字段回放；原始故障与本轮修复分别记录。
// 手工转录关键字段，省略无关正文；原始截图保存在 docs/handoff/evidence。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadTs}=require('../tools/runtime.cjs');
const root=path.resolve(__dirname,'..'),load=name=>loadTs(path.join(root,'src',name+'.ts'));
const {createOpening}=load('opening'),{OperationSchema}=load('schema');
const {applyCommand}=load('engine'),{resolveDossierCard}=load('output-cards');
const s=createOpening({mode:'默认'},'feedback-20260922'),results=[];
const body='<UpdateVariable>'+JSON.stringify({Analysis:'首次初始化完成',JSONPatch:[{op:'replace',path:'/叙事/天气',value:'潮声轻缓'}]})+'</UpdateVariable>';
const outer=/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/.test(body);
const inner=/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i.test(body);
assert(outer&&!inner);
results.push({case:'图三所示对象包装',outerTagDetected:outer,xmlPatchDetected:inner,note:'只验证本卡标签检查与包装差异；未调用用户当前MVU解析器'});
assert(s.stat_data._死亡记录['first-return']);assert(s.stat_data._能力['world-crossing']);
assert.equal(s.stat_data._实体.player.生命阶段,'重构中');
results.push({case:'默认快照',deathRegistered:true,crossingRegistered:true,lifeStage:s.stat_data._实体.player.生命阶段});
const acquire={kind:'acquire',actorId:'player',abilityId:'world-crossing',name:'越界',grade:'史诗',source:'死亡',evidence:'因果适应',description:'从归泊庭的潮镜选择世界',trigger:'完成重构并选择目的地',limitations:'消耗10能量，冷却60秒',profile:'技艺'};
const invalid=OperationSchema.safeParse(acquire);assert(!invalid.success);
results.push({case:'图四acquire来源',issues:invalid.error.issues.map(i=>({path:i.path,message:i.message}))});
const run=op=>applyCommand(s,{...op,id:'feedback',branchId:s.stat_data._结算.分支ID,expectedVersion:s.stat_data._结算.状态版本});
function failure(name,fn,expected){let message;try{fn();}catch(e){message=e.message;}assert.match(message||'',expected);results.push({case:name,error:message});}
failure('图四重构期间重演遭遇',()=>run({kind:'encounter',name:'致命车祸',tier:'致命',mechanism:'impact'}),/重构/);
failure('仅更正来源后仍重复能力ID',()=>run({...acquire,source:'其他'}),/已登记/);
assert.equal(resolveDossierCard(s.stat_data,'character','player').title,s.stat_data._开局.档案.姓名);
results.push({case:'图三character/player引用人物档案',fixed:true});
assert.equal(resolveDossierCard(s.stat_data,'entity','player').title,s.stat_data._实体.player.名称);
results.push({case:'entity/player可解析',note:'主角实体存在，叙事人物档案不因此自动存在'});
const output={scope:'离线、最小关键字段转录；不读取或写入真实聊天',results};
fs.mkdirSync(path.join(__dirname,'logs'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'logs/feedback-0.5.1.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
