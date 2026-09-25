const test=require('node:test'), assert=require('node:assert/strict'),path=require('node:path');
const {loadTs}=require('../tools/runtime.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const load=f=>loadTs(path.resolve(__dirname,'../src/'+f+'.ts'));
const {createOpening}=require('./numerical-fixture.cjs');
test('正文漏记见闻可单独补全，已结算时间与账本不重跑',()=>{
 const {missingCards,applyCardRecovery}=load('card-recovery');
 const s=createOpening({mode:'默认'},'missing-card');
 const story='<EmbersCard type="note" id="harbor_mirror"/>';
 const targets=missingCards(s.stat_data,story);
 assert.equal(targets.length,1);assert.equal(s.stat_data._待修复,null);
 const next=applyCardRecovery(s.stat_data,targets[0],{record:{类别:'地点',对象ID:'harbor',标题:'潮镜',内容:'庭中的镜面通向外界。',来源:'现场观察',可信度:'观察',知情者ID:{player:true}}});
 assert.equal(load('output-cards').resolveDossierCard(next,'note','harbor_mirror').title,'潮镜');
 assert.deepEqual(clone(next._时空),clone(s.stat_data._时空));assert.deepEqual(clone(next._运行账本),clone(s.stat_data._运行账本));
 assert.equal(missingCards(next,story).length,0);
});
test('人物与生物分栏，关联同一实体时只出现一次',()=>{
 const {characterGroups}=load('archive-tools'); const s=createOpening({mode:'默认'},'category').stat_data;
 s._实体.wolf={...structuredClone(s._实体.player),名称:'灰狼',类别:'生物'};
 s._实体.guard={...structuredClone(s._实体.player),名称:'看守',类别:'人物'};
 s.叙事.人物档案.guard=load('schema').CharacterDossierSchema.parse({名称:'看守',实体ID:'guard'});
 const g=characterGroups(s);assert.equal(g.people.length,1);assert.equal(g.entities.length,0);assert.deepEqual(clone(g.creatures.map(([id])=>id)),['wolf']);
});
test('错误引用关联已有档案，隐私档案与手动移除不自动补造',()=>{
 const {missingCards,applyCardRecovery}=load('card-recovery'),{resolveDossierCard}=load('output-cards');
 const s=createOpening({mode:'默认'},'aliases').stat_data;
 const note={类别:'地点',对象ID:'harbor',标题:'潮镜',内容:'庭中之镜',来源:'观察',可信度:'观察',知情者ID:{player:true}};
 s._见闻档案.real=note;
 let next=applyCardRecovery(s,{kind:'note',id:'wrong'},{existingId:'real'});
 assert.equal(resolveDossierCard(next,'note','wrong').title,'潮镜');assert.equal(Object.keys(next.叙事.见闻).length,Object.keys(s.叙事.见闻).length);
 next._档案整理['note:real']=true;
 assert.throws(()=>applyCardRecovery(next,{kind:'note',id:'other'},{existingId:'real'}),/移除/);
 s.叙事.见闻.secret={...note,知情者ID:{npc:true}};
 assert.equal(missingCards(s,"<EmbersCard id='secret' type='note'/>").length,0);
 assert.throws(()=>applyCardRecovery(s,{kind:'note',id:'secret'},{record:note}),/已存在/);
 assert.throws(()=>applyCardRecovery(s,{kind:'note',id:'__proto__'},{record:note}),/无效/);
 assert.throws(()=>applyCardRecovery(s,{kind:'note',id:'new'},{record:note,operations:[{kind:'advance',seconds:600}]}));
});
test('移除关联人物时退出人物、实体、见闻与关系投影，恢复不损伤数值账本',()=>{
 const {editSession}=load('settlement'),{projectPromptState}=load('prompt-view'),{characterGroups}=load('archive-tools');
 const s=createOpening({mode:'默认'},'remove');
 s.stat_data._实体.guard={...clone(s.stat_data._实体.player),名称:'看守',类别:'人物'};
 s.stat_data.叙事.人物档案.dossier=load('schema').CharacterDossierSchema.parse({名称:'看守',实体ID:'guard',在场:true,位面ID:'main'});
 s.stat_data.叙事.见闻.guard_note={类别:'人物',对象ID:'guard',标题:'看守的消息',内容:'当前线索',来源:'观察',可信度:'观察',知情者ID:{player:true}};
 s.stat_data.叙事.见闻.dossier_note={...s.stat_data.叙事.见闻.guard_note,对象ID:'dossier'};
 s.stat_data.叙事.关系.guard={主体ID:'player',对象ID:'guard',已发生互动:'交谈',已表达态度:'友善',已有约定:''};
 const after=editSession(s,{kind:'remove',category:'character',id:'dossier',base:s.stat_data});
 const view=projectPromptState(after.stat_data,'看守');
 assert(!view._实体.guard);assert(!view.叙事.人物档案.dossier);assert(!view.叙事.见闻.guard_note);assert(!view.叙事.见闻.dossier_note);assert(!view.叙事.关系.guard);
 assert.equal(characterGroups(after.stat_data).entities.length,0);assert(after.stat_data._实体.guard);
 assert.deepEqual(clone(after.stat_data._运行账本),clone(s.stat_data._运行账本));
 const restored=editSession(after,{kind:'restore',category:'character',id:'dossier',base:after.stat_data});assert(projectPromptState(restored.stat_data)._实体.guard);
 assert.throws(()=>editSession(after,{kind:'restore',category:'character',id:'dossier',base:s.stat_data}),/变化/);
 assert.throws(()=>editSession(s,{kind:'remove',category:'entity',id:'player',base:s.stat_data}),/主角/);
});
test('本楼重解析恢复手动补全、清理与分类；其他消息页不挪用',()=>{
 const {saveLocalArchive,replayLocalArchive}=load('local-archive'),{applyCardRecovery}=load('card-recovery'),{acceptNarrativeUpdate}=load('mvu-policy');
 const s=createOpening({mode:'默认'},'reparse').stat_data;
 const successful=acceptNarrativeUpdate(s,{叙事:{...clone(s.叙事),本轮时间:600}});
 const target={kind:'note',id:'harbor_mirror'},record={类别:'地点',对象ID:'harbor',标题:'潮镜',内容:'通路',来源:'观察',可信度:'观察',知情者ID:{player:true}};
 let manual=applyCardRecovery(successful,target,{record});manual._档案整理['note:harbor_mirror']=true;
 const local=saveLocalArchive(successful,manual,undefined,'floor-2');
 const replay=acceptNarrativeUpdate(s,{叙事:{...clone(s.叙事),本轮时间:600}});
 const saved=replayLocalArchive(replay,local,'floor-2');
 assert.equal(saved._时空.起源时刻秒,600);assert(saved.叙事.见闻.harbor_mirror);assert(saved._档案整理['note:harbor_mirror']);
 assert(!replayLocalArchive(replay,local,'floor-3').叙事.见闻.harbor_mirror);
 assert.throws(()=>replayLocalArchive(replay,{...local,changes:[{path:['_实体','player','生命'],value:1}]},'floor-2'),/无效路径/);
 assert.deepEqual(clone(saved._运行账本),clone(successful._运行账本));
});
test('分类修改可关联原人物档案，数值保持原样',()=>{
 const {editSession}=load('settlement'),{characterGroups}=load('archive-tools');
 const s=createOpening({mode:'默认'},'classify');
 s.stat_data._实体.collector={...clone(s.stat_data._实体.player),名称:'催收壮汉的袭击',类别:'生物'};
 s.stat_data.叙事.人物档案.guard=load('schema').CharacterDossierSchema.parse({名称:'催收者'});
 const n=editSession(s,{kind:'classify',id:'collector',name:'催收者',category:'人物',dossierId:'guard',base:s.stat_data});
 assert.equal(characterGroups(n.stat_data).creatures.length,0);assert.equal(characterGroups(n.stat_data).entities.length,0);assert.equal(n.stat_data.叙事.人物档案.guard.实体ID,'collector');
 assert.deepEqual(clone(n.stat_data._实体.collector.生命),clone(s.stat_data._实体.collector.生命));
});
test('真实MVU事件入口从当前消息读取本地编辑并在同楼重解析后恢复',async()=>{
 const vm=require('node:vm'),ts=require('typescript'),fs=require('node:fs');
 const {saveLocalArchive}=load('local-archive'),{applyCardRecovery}=load('card-recovery'),{turnReceipt}=load('turn-receipt');
 const s=createOpening({mode:'默认'},'mvu-entry');
 const content='<EmbersCard type="note" id="harbor_mirror"/><UpdateVariable><JSONPatch>[]</JSONPatch></UpdateVariable>';
 const after=applyCardRecovery(s.stat_data,{kind:'note',id:'harbor_mirror'},{record:{类别:'地点',对象ID:'harbor',标题:'潮镜',内容:'通路',来源:'观察',可信度:'观察',知情者ID:{player:true}}});
 const local=saveLocalArchive(s.stat_data,after,undefined,turnReceipt(1,0,content));
 const handlers={},filename=path.resolve(__dirname,'../脚本/变量结构/index.ts');
 const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 let startup;
 vm.runInNewContext(compiled,{
  exports:{},z:require('zod'),_:require('lodash'),console,window:{},
  require:id=>id.startsWith('https:')?{registerMvuSchema(){}}:loadTs(path.resolve(path.dirname(filename),id+'.ts')),
  $:arg=>typeof arg==='function'?(startup=arg()):{on(){}},waitGlobalInitialized:async()=>{},initializeGlobal(){},
  Mvu:{events:{COMMAND_PARSED:'parsed',VARIABLE_UPDATE_ENDED:'ended'}},eventOn:(name,fn)=>{handlers[name]=fn;return {stop(){}};},
  getLastMessageId:()=>1,getChatMessages:(id,options)=>options?.include_swipes?[{message_id:1,swipe_id:0,swipes:[content]}]:[{message_id:1,message:content,data:{...clone(s),embers_local_archive:local}}],
 });
 await startup;
 const previous=clone(s),next=clone(s);next.stat_data.叙事.本轮时间=600;
 handlers.parsed(next,[{}],content);handlers.ended(next,previous);
 assert.equal(next.stat_data._时空.起源时刻秒,600);assert.equal(next.stat_data.叙事.见闻.harbor_mirror.标题,'潮镜');assert.equal(next.stat_data._待修复,null);
});
