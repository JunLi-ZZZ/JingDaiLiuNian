const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {loadTs}=require('../tools/runtime.cjs');
const load=name=>loadTs(path.join(__dirname,'../src',name+'.ts'));
const {createOpening}=require('./numerical-fixture.cjs');
const {applyCommand}=load('engine'),{Schema,CharacterDossierSchema}=load('schema');
const {acceptNarrativeUpdate}=load('mvu-policy');
const {projectPromptState}=load('prompt-view'),{formatPromptView}=load('prompt-format');
const {characterArchive}=load('character-dossier'),{resolveDossierCard}=load('output-cards');
const {workshopReferences}=load('workshop-context'),{workshopPrompt}=load('workshop-model');
const clone=x=>JSON.parse(JSON.stringify(x));
const register={kind:'register',entityId:'visitor',name:'来访者',life:137,energy:43,attack:36,defense:17,evidence:'边境巡守经历与本土训练'};
const run=(s,op,id)=>applyCommand(s,{...op,id,branchId:s.stat_data._结算.分支ID,expectedVersion:s.stat_data._结算.状态版本},()=>.5).session;

test('人物和生物按稳定ID定标，受伤/消耗保留，同轮可攻防，重复登记不治愈',()=>{
 let s=createOpening({mode:'默认'},'registry');
 s.stat_data.叙事.人物档案.visitor=CharacterDossierSchema.parse({名称:'来访者',种族:'人类',在场:true,位面ID:s.stat_data._时空.当前地点.位面ID});
 const input={叙事:{...clone(s.stat_data.叙事),本轮结算:[{...register,currentLife:101,currentEnergy:21},{kind:'strike',actorId:'visitor',targetId:'player',abilityId:'attack-visitor'}]}};
 const after=acceptNarrativeUpdate(s.stat_data,input);
 assert.equal(after._实体.visitor.生命.当前,101);assert.equal(after._实体.visitor.资源.energy.当前,21);
 assert.equal(after.叙事.人物档案.visitor.实体ID,'visitor');assert(after._实体.player.生命.当前<100);
 assert.equal(resolveDossierCard(after,'character','visitor').metrics[0].value,'101 / 137');
 assert.equal(resolveDossierCard(after,'entity','visitor').metrics[1].value,'21 / 43');
 s={stat_data:after,death_adaptation_runtime:after._运行账本};
 s=run(s,register,'repeat');assert.equal(s.stat_data._实体.visitor.生命.当前,101);assert.equal(s.stat_data._实体.visitor.资源.energy.当前,21);
 const beast=run(s,{...register,entityId:'beast',name:'灰羽兽',category:'生物'},'beast');assert.equal(beast.stat_data._实体.beast.类别,'生物');
 assert.throws(()=>run(s,{...register,entityId:'player'},'bad'));
 assert.throws(()=>run(s,{...register,entityId:'bad',currentLife:999},'bad'));
 assert.throws(()=>run(s,{...register,name:'另一人'},'collision'));
});

test('注册后能力使用、资源与场景投影共用内核',()=>{
 let s=run(createOpening({mode:'默认'},'actor'),register,'create');
 s=run(s,{kind:'acquire',actorId:'visitor',abilityId:'visitor-skill',name:'静听',grade:'精良',source:'学习',evidence:'多年巡守练习',description:'辨识远处响动',trigger:'环境允许倾听',limitations:'噪声遮盖时受限',profile:'技艺',cost:3},'learn');
 s=run(s,{kind:'use',actorId:'visitor',abilityId:'visitor-skill',purpose:'听辨脚步'},'use');
 assert.equal(s.stat_data._实体.visitor.资源.energy.当前,40);
 const view=projectPromptState(s.stat_data);assert(view._实体.visitor);assert(view._能力['visitor-skill']);
});

test('骰列移出提示词，结算仍确定、跨分支变化',()=>{
 const dice=[];
 for(let i=0;i<20;i++){
 const s=createOpening({mode:'默认'},'dice-'+i),input={叙事:{...clone(s.stat_data.叙事),本轮结算:[{kind:'check',actorId:'player',abilityId:null,task:'观察',difficulty:12}]}};
 const a=acceptNarrativeUpdate(s.stat_data,input),b=acceptNarrativeUpdate(s.stat_data,input);
 assert.deepEqual(clone(a._运行账本),clone(b._运行账本));dice.push(a._运行账本.events['story-0-0'].check.die);
 const text=formatPromptView(projectPromptState(a));assert(!text.includes('<本轮判定>'));assert(!Object.hasOwn(projectPromptState(a),'本轮骰列'));
 }
 assert(new Set(dice).size>5);
});

test('见闻自动相关筛选与手动重点并存，未选的旧资料留在档案',()=>{
 const s=createOpening({mode:'默认'},'knowledge').stat_data;
 for(let i=0;i<20;i++)s._见闻档案['old-'+i]={类别:'事件',对象ID:'remote',标题:'旧线索'+i,内容:'旧内容',可信度:'观察',来源:'旧经历',知情者ID:{player:true}};
 s.叙事.见闻.recent={类别:'地点',对象ID:s._时空.当前地点.地点ID,标题:'码头路标',内容:'向东',可信度:'观察',来源:'观察',知情者ID:{player:true}};
 let p=projectPromptState(s);assert(p.叙事.见闻.recent);assert(!p.叙事.见闻['old-1']);
 s._查阅.见闻=['old-1'];p=projectPromptState(s,'旧线索12');assert(p.叙事.见闻['old-1']);assert(p.叙事.见闻['old-12']);assert(Object.keys(p.叙事.见闻).length<=10);assert.equal(Object.keys(s._见闻档案).length,20);
});

test('永久档案导出排除当前快照，生成请求只收相关原始设定',async()=>{
 const s=createOpening({mode:'默认'},'author').stat_data;
 s.叙事.人物档案.writer=CharacterDossierSchema.parse({名称:'书匠',来源世界:'主世界',位面ID:'harbor',在场:true,身份:'抄书人',性格:'耐心',近况:'唯一现场动作',关系经历:'唯一玩家关系',已知信息:'唯一即时知识',动机:'唯一当轮动机'});
 const archive=characterArchive(s,'writer');assert.equal(archive.planeId,'main');assert(!JSON.stringify(archive).includes('唯一'));assert(!archive.content.includes('在场'));
 s._资料库.remote={id:'remote',kind:'plane',name:'远洋',aliases:[],planeId:'remote',summary:'摘要',book:'chat',entry:'潮镜远洋'};
 const records={main:[{name:'多元位面-体系概述',content:'虚海基础',enabled:true},{name:'余烬之后_位面_主世界',content:'完整主世界设定',enabled:false},{name:'人物档案',content:'变量写入规则',enabled:true},{name:'[EJS]控制器',content:'<% code %>',enabled:true}],chat:[{name:'潮镜远洋',content:'完整远洋设定',enabled:false}]};
 const before=clone(records),calls=[];
 const refs=await workshopReferences({bindings:()=>({primary:'main',additional:[]}),read:async name=>{calls.push(name);return records[name];}},'character','主世界 远洋',s);
 const contents=JSON.stringify(refs);assert(contents.includes('完整主世界设定'));assert(contents.includes('完整远洋设定'));assert(!contents.includes('变量写入'));assert(!contents.includes('<%'));assert.deepEqual(records,before);
 const prompt=workshopPrompt('character','','',{},s,refs),input=JSON.parse(prompt[1].content);assert(!JSON.stringify(input).includes('唯一'));assert(input.参考设定.length>=2);
 assert(!prompt[0].content.includes('对玩家的相识状态'));assert(!prompt[0].content.includes('目前在何处做什么'));
});

test('EJS查询来自最近楼层而非固定第2楼，关闭的潮镜条目按注册位置读回',async()=>{
 const state=createOpening({mode:'默认'},'recent').stat_data;
 state._见闻档案.old={类别:'事件',对象ID:'remote',标题:'旧港密信',内容:'应调入的旧线索',可信度:'观察',来源:'旧经历',知情者ID:{player:true}};
 state._资料库.remote={id:'remote',kind:'plane',name:'遥远海域',aliases:[],planeId:'remote',summary:'摘要',book:'chat',entry:'潮镜远洋'};
 const calls=[],messages=depth=>{calls.push(depth);return depth===-1?[{message:'查阅旧港密信，想去遥远海域。'}]:[{message:'普通闲谈'}];};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const output=[],text=fs.readFileSync(path.join(__dirname,'../世界书/变量/变量列表.txt'),'utf8');
 await new AsyncFunction('getvar','getChatMessages','print',text.slice(text.indexOf('<%')+2,text.lastIndexOf('%>')))(()=>state,messages,x=>output.push(x));
 assert(output.join('').includes('应调入的旧线索'));assert.deepEqual(calls,[-2,-1]);
 const control=fs.readFileSync(path.join(__dirname,'../世界书/控制器/EJS资料库控制器.txt'),'utf8'),reads=[];
 await new AsyncFunction('getvar','getChatMessages','getwi','print',control.slice(control.indexOf('<%')+2,control.lastIndexOf('%>')))(key=>key.split('.').reduce((o,k)=>o?.[k],{stat_data:state}),messages,async(...args)=>{reads.push(args);return '完整源设定';},()=>{});
 assert.deepEqual(reads,[['chat','潮镜远洋']]);
});
