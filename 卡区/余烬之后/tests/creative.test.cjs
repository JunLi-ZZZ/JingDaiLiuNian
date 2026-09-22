const path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const {loadTs}=require('../tools/runtime.cjs'),root=path.resolve(__dirname,'..');
const load=p=>loadTs(path.join(root,'src',p+'.ts'));
const {workshopPrompt,characterGroups,planeGroups,exportLibrary}=load('workshop-model');
const {parseLibrary}=load('library');
const {applyCommand}=load('engine');
const {createOpening}=require('./numerical-fixture.cjs');
const {resolveSceneCard,resolveDossierCard,eventReference}=load('output-cards');
const examples=require('../assets/workshop-examples.json');
test('随机与选项生成提供完整常规档案结构，选择性发送用户指定属性',()=>{
 const empty=workshopPrompt('character','','',{}),given=workshopPrompt('character','自定名','构想',{gender:'非二元',race:'自定义种族',traits:'谨慎、幽默'});
 const input=JSON.parse(given[1].content);assert.equal(input.已选属性.性别,'非二元');assert.equal(input.已选属性.种族,'自定义种族');assert.equal(input.名称,'自定名');
 assert.equal(JSON.parse(empty[1].content).参考情境,undefined);
 for(const field of ['基本信息','外貌特征','经历与动机','能力与局限','语言与互动','关系与认知','日常与爱好'])assert(empty[0].content.includes(field));
 for(const field of ['地理与生态','历史脉络','文明与日常','力量体系','势力与人物','落脚与探索'])assert(workshopPrompt('plane','','',{})[0].content.includes(field));
 assert(characterGroups.flatMap(g=>g.fields).length>=20);assert(planeGroups.flatMap(g=>g.fields).length>=15);
 for(const group of [characterGroups,planeGroups])assert.equal(new Set(group.flatMap(g=>g.fields.map(f=>f.key))).size,group.flatMap(g=>g.fields).length);
});
test('完整示例可保存与导出，含全部章节，正文不依赖JSON编辑',()=>{
 for(const raw of Object.values(examples)){const entry=parseLibrary(JSON.stringify(raw));assert(entry.content.length>1000);assert.equal(entry.content.match(/^# /gm).length,10);assert(exportLibrary(entry).includes(entry.content));}
});
test('检定卡读取结算骰面，回放不重掷；本轮序号映射到正确事件',()=>{
 let session=createOpening({mode:'默认'},'cards');
 const op={kind:'check',actorId:'player',abilityId:null,task:'辨认锁芯',difficulty:15,id:'story-0-0',branchId:'cards',expectedVersion:0};
 session=applyCommand(session,op,()=>.76).session;
 assert.equal(session.death_adaptation_runtime.events[op.id].check.die,16);
 session.stat_data.叙事.本轮结算={起算状态版本:0,操作:[{kind:'check',actorId:'player',abilityId:null,task:'辨认锁芯',difficulty:15}]};
 assert.equal(eventReference(session.stat_data,'0'),'story-0-0');
 const card=resolveSceneCard(session,'check','0');assert.equal(card.die,16);assert.equal(card.success,true);assert.equal(card.difficulty,15);
 assert.throws(()=>resolveSceneCard(session,'check','9'));
 assert.equal(resolveSceneCard(session,'check','0').die,card.die);
});
test('死亡归来、成长卡有实际记录支撑，错误引用不造结果',()=>{
 let session=createOpening({mode:'默认'},'return-card');
 session=applyCommand(session,{id:'death',branchId:'return-card',expectedVersion:0,kind:'exposure',source:'电线',mechanism:'electric',mechanismName:'电击',abilityName:'电荷转移',amount:200,conditions:'握住裸导体'}).session;
 const death=resolveSceneCard(session,'death','death');assert(death.rows.some(x=>x.value.includes('电荷转移')));
 const gain=resolveDossierCard(session.stat_data,'gain','adapt-player-electric');assert.equal(gain.emblem,'transfer');assert(gain.metrics.some(x=>x.label==='储能'));
 const growth=resolveSceneCard(session,'growth','adapt-player-electric');assert.equal(growth.title,'电荷转移');
 assert.throws(()=>resolveSceneCard(session,'death','no-event'));
 assert.throws(()=>resolveSceneCard(session,'quest','imaginary-task'));
});
