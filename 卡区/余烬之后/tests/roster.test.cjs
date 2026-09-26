const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadTs}=require('../tools/runtime.cjs');
const load=name=>loadTs(path.join(__dirname,'../src',name+'.ts'));
const {createOpening}=require('./numerical-fixture.cjs');
const {Schema,CharacterDossierSchema}=load('schema');
const {acceptNarrativeUpdate}=load('mvu-policy');
const {editSession}=load('settlement');
const {rosterEntries}=load('archive-tools');
const {projectPromptState}=load('prompt-view');
const {resolveDossierCard}=load('output-cards');
const {saveLocalArchive,replayLocalArchive}=load('local-archive');
const clone=x=>JSON.parse(JSON.stringify(x));
const attributes={生命:{当前:121,上限:160},能量:{当前:27,上限:70},攻击:32,防御:12,命中率:1,闪避率:0,暴击率:0,暴击倍率:1.5,抗性:{}};
function person(s,extra={}){return CharacterDossierSchema.parse({名称:'林间来客',种族:'兽灵',身份:'巡林者',在场:true,位面ID:s._时空.当前地点.位面ID,地点ID:s._时空.当前地点.地点ID,分组:'附近的人',属性:attributes,...extra});}
function populated(){const s=createOpening({mode:'默认'},'roster');return acceptNarrativeUpdate(s.stat_data,{叙事:{...clone(s.stat_data.叙事),人物档案:{visitor:person(s.stat_data)}}});}
const session=s=>({stat_data:s,death_adaptation_runtime:s._运行账本});

test('首次人物档案自动登记数值，同轮耗时与攻击沿用同一账本',()=>{
 const s=createOpening({mode:'默认'},'dossier-register').stat_data;
 const next=acceptNarrativeUpdate(s,{叙事:{...clone(s.叙事),人物档案:{visitor:person(s)},本轮时间:60,本轮结算:[{kind:'strike',actorId:'visitor',targetId:'player',abilityId:'attack-visitor'}]}},undefined,undefined,'turn-1');
 assert.equal(next._时空.起源时刻秒,66);assert.equal(next._实体.visitor.生命.当前,121);assert.equal(next._实体.visitor.资源.energy.当前,27);
 assert(next._实体.player.生命.当前<100);assert.equal(next.叙事.人物档案.visitor.实体ID,'visitor');
 const card=resolveDossierCard(next,'character','visitor');assert.equal(card.metrics[0].value,'121 / 160');assert.equal(card.metrics.length,8);
 assert.deepEqual(clone(acceptNarrativeUpdate(next,{叙事:next.叙事},undefined,undefined,'turn-1')),clone(next));
 const changed=clone(next.叙事);changed.人物档案.visitor.属性.生命.当前=160;
 assert.equal(acceptNarrativeUpdate(next,{叙事:changed})._实体.visitor.生命.当前,121);
});

test('同伴与附近的人不按物种划分，双向转移固定到稳定ID',()=>{
 const s=populated();assert.equal(rosterEntries(s)[0].group,'附近的人');
 const joined=editSession(session(s),{kind:'roster',id:'visitor',group:'同伴',base:s});
 assert.equal(rosterEntries(joined.stat_data)[0].group,'同伴');assert.deepEqual(clone(joined.stat_data._实体),clone(s._实体));
 const input=clone(joined.stat_data.叙事);input.人物档案.visitor.分组='附近的人';
 const next=acceptNarrativeUpdate(joined.stat_data,{叙事:input});assert.equal(rosterEntries(next)[0].group,'同伴');
 const back=editSession(session(next),{kind:'roster',id:'visitor',group:'附近的人',base:next});assert.equal(rosterEntries(back.stat_data)[0].group,'附近的人');
 assert.throws(()=>editSession(joined,{kind:'roster',id:'visitor',group:'附近的人',base:s}),/变化/);
 const legacy=Schema.parse(s);legacy.叙事.人物档案.legacy=CharacterDossierSchema.parse({名称:'旧同伴'});assert.equal(rosterEntries(legacy).find(r=>r.id==='legacy').group,'同伴');
});

test('附近的人离场后档案、数值、见闻、关系退出本轮投影，原存档完整保留',()=>{
 const s=populated();s.叙事.人物档案.visitor.在场=false;
 s.叙事.见闻.visitor_note={类别:'人物',对象ID:'visitor',标题:'林间来客',内容:'完整经历',来源:'交谈',可信度:'观察',知情者ID:{player:true}};
 s.叙事.关系.visitor={主体ID:'player',对象ID:'visitor',已发生互动:'交谈',已表达态度:'友善',已有约定:''};
 const view=projectPromptState(s,'林间来客');assert(!view._实体.visitor);assert(!view.叙事.人物档案.visitor);assert(!view.叙事.见闻.visitor_note);assert(!view.叙事.关系.visitor);
 assert(s._实体.visitor);assert(s.叙事.人物档案.visitor);assert(s.叙事.见闻.visitor_note);
 s._人物分组.visitor='同伴';const companion=projectPromptState(s,'林间来客');assert(companion._实体.visitor);assert(companion.叙事.人物档案.visitor);assert.equal(companion.叙事.同伴索引[0].在场,false);
});

test('跨界后旧在场标记不会将原位面角色拖进新场景',()=>{
 const s=populated();s._时空.当前地点={...s._时空.当前地点,地点ID:'elsewhere',显示名:'另一地点'};
 const next=acceptNarrativeUpdate(s,{叙事:clone(s.叙事)});
 assert.equal(next.叙事.人物档案.visitor.在场,false);assert.notEqual(next._实体.visitor.地点ID,'elsewhere');assert(!projectPromptState(next)._实体.visitor);
});

test('旧档属性单项补全可预览保存，同楼重解析恢复登记与转移，不重复改写数值',()=>{
 const s=createOpening({mode:'默认'},'local-stats').stat_data;s.叙事.人物档案.visitor=person(s,{属性:null});
 const filled=editSession(session(s),{kind:'character-stats',id:'visitor',attributes,base:s});assert.equal(filled.stat_data._实体.visitor.生命.当前,121);
 const manual=editSession(filled,{kind:'roster',id:'visitor',group:'同伴',base:filled.stat_data});
 const local=saveLocalArchive(s,manual.stat_data,undefined,'same-floor');
 const replay=replayLocalArchive(s,local,'same-floor');assert.deepEqual(clone(replay._实体.visitor),clone(manual.stat_data._实体.visitor));assert.equal(replay._人物分组.visitor,'同伴');
 assert.deepEqual(clone(replay._运行账本),clone(manual.stat_data._运行账本));
 assert.deepEqual(clone(replayLocalArchive(replay,local,'same-floor')._运行账本),clone(replay._运行账本));
 assert(!replayLocalArchive(s,local,'other-floor')._实体.visitor);
 assert.throws(()=>editSession(filled,{kind:'character-stats',id:'visitor',attributes,base:filled.stat_data}),/已有属性/);
 assert.throws(()=>editSession(session(s),{kind:'character-stats',id:'visitor',attributes:{...attributes,生命:{当前:300,上限:160}},base:s}));
});

test('正文缺失人物补建后立即具备结算实体，后续无需再注册',()=>{
 const s=createOpening({mode:'默认'},'recover-person').stat_data;
 const next=load('card-recovery').applyCardRecovery(s,{kind:'character',id:'visitor'},{record:person(s)});
 assert.equal(next._实体.visitor.战斗.攻击,32);assert(next._能力['attack-visitor']);
});

test('EJS世界书回忆遵循在场与同伴分组，离场附近档案不回灌',async()=>{
 const s=populated();s.叙事.人物档案.visitor.在场=false;
 s._资料库.visitor={id:'visitor',kind:'character',name:'林间来客',aliases:[],planeId:'main',summary:'巡林者',book:'人物书',entry:'来客设定'};
 const code=require('../tools/ejs-check.cjs').scriptBody(fs.readFileSync(path.join(__dirname,'../世界书/控制器/EJS资料库控制器.txt'),'utf8'));
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const run=async()=>{const calls=[];await new AsyncFunction('getvar','getChatMessages','getwi','print',code)((key,opts)=>key.split('.').reduce((v,k)=>v?.[k],{stat_data:s})??opts?.defaults,()=>[{message:'想起林间来客'}],async(...args)=>{calls.push(args);return '设定';},()=>{});return calls;};
 assert.equal((await run()).length,0);s._人物分组.visitor='同伴';assert.equal((await run()).length,1);
});
