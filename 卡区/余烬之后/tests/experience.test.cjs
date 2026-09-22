const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadTs } = require('../tools/runtime.cjs');
const root = path.resolve(__dirname,'..');
const load = name => loadTs(path.join(root,'src',name+'.ts'));
const { createOpening } = load('opening');
const { applyCommand, validateSession } = load('engine');
const { Schema } = load('schema');
const { editSession, editArchive, proposalCommand } = load('settlement');
const { acceptNarrativeUpdate } = load('mvu-policy');
const { projectPromptState } = load('prompt-view');
const { storyRandom } = load('progression');
const { resolveDossierCard } = load('output-cards');
const { createOpening: neutral } = require('./numerical-fixture.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const run = (s, op, random) => applyCommand(s,{...op,id:'test-'+s.stat_data._结算.状态版本,branchId:s.stat_data._结算.分支ID,expectedVersion:s.stat_data._结算.状态版本},random).session;
const proposed = (s,ops,seconds=0) => ({...clone(s),叙事:{...clone(s.叙事),本轮时间:{起算起源秒:s._时空.起源时刻秒,经过本地秒:seconds},本轮结算:{起算状态版本:s._结算.状态版本,操作:ops}}});
function electric(){
 let s=neutral({mode:'默认'},'exp');
 s=run(s,{kind:'exposure',source:'断裂电线',mechanism:'electric',mechanismName:'电击',abilityName:'电荷转移',amount:120,conditions:'握住导体'});
 s=run(s,{kind:'advance',seconds:600});return run(s,{kind:'revive'});
}
function failed(s){
 const p=proposed(s.stat_data,[{kind:'channel',abilityId:'adapt-player-electric',amount:20,purpose:'给电机供电'}],30);
 assert.throws(()=>acceptNarrativeUpdate(s.stat_data,p),/储能不足/);
 s.stat_data._更新错误='储能不足';
 s.stat_data._待修复={版本:s.stat_data._结算.状态版本,输入:{叙事:p.叙事,待审提案:p.待审提案},原因:'储能不足'};
 return s;
}
const repair=(value,retry=true)=>({kind:'repair',retry,operation:{kind:'reconcile',actorId:'player',resourceId:'adapt-player-electric',before:0,value,evidence:'上一轮接触电箱吸收30点，变量漏记'}});
test('默认开局是真实的首次死亡、双母赠予与归泊；自定义场景独立',()=>{
 const s=createOpening({mode:'默认'},'opening');validateSession(s);
 assert.equal(s.stat_data._实体.player.生命.当前,0);
 assert.equal(s.stat_data._时空.当前地点.位面ID,'harbor');
 assert.equal(s.stat_data._死亡记录['first-return'].位面ID,'main');
 assert.deepEqual(Object.keys(s.stat_data._死亡记录['first-return'].授予能力ID),['world-crossing']);
 assert.equal(s.stat_data._能力['terminal-affinity'].品阶,'本源');
 assert.equal(s.stat_data._复苏.完成起源秒,600);
 assert(!s.stat_data._能力['adapt-player-impact']);
 const custom=createOpening({mode:'自定义',profile:{姓名:'潮',种族:'龙',经历:'海中出生'},scenario:{模式:'自定义',场景:'海岸',机缘:'拾得种核'}},'custom');
 assert.equal(custom.stat_data._开局.档案.经历,'海中出生');
 assert.equal(custom.stat_data._实体.player.生命阶段,'存活');
 assert.equal(Object.keys(custom.stat_data._死亡记录).length,0);
});
test('重构完成后可跨入任意世界；越界扣费冷却与世界时间保留',()=>{
 let s=createOpening({mode:'默认'},'cross');
 const travel={kind:'travel',planeId:'glass',name:'玻璃海',description:'潮水凝成玻璃的群岛',locationId:'beach',location:'碎晶岸',route:'潮镜越界',rate:2};
 assert.throws(()=>run(s,travel),/重构/);
 s=run(s,{kind:'advance',seconds:600});s=run(s,{kind:'revive'});s=run(s,travel);
 assert.equal(s.stat_data._时空.当前地点.位面ID,'glass');
 assert.equal(s.stat_data._实体.player.资源.energy.当前,40);
 assert.equal(s.stat_data._时空.起源时刻秒,600);
 assert.throws(()=>run(s,{...travel,planeId:'main',name:'主世界'}),/冷却/);
});
test('终焉眷引在适应之后增伤，完全转化仍为零；死亡自动归庭',()=>{
 let s=createOpening({mode:'默认',scenario:{模式:'自定义',场景:'路边',机缘:'种核初醒'}},'terminal');
 const hit={kind:'exposure',source:'电线',mechanism:'electric',mechanismName:'电击',abilityName:'电荷转移',amount:20,conditions:'短暂接触'};
 s=run(s,hit);assert.equal(s.stat_data._实体.player.生命.当前,75);
 s=run(s,{...hit,amount:100});assert.equal(s.stat_data._时空.当前地点.位面ID,'harbor');
 s=run(s,{kind:'advance',seconds:600});s=run(s,{kind:'revive'});s=run(s,hit);
 assert.equal(s.stat_data._实体.player.生命.当前,100);
 assert.equal(s.stat_data._实体.player.资源['adapt-player-electric'].当前,20);
});
test('补记并重试原更新：恢复叙事、时间和扣费，原输入保持不变',()=>{
 const s=failed(electric()),old=clone(s);
 const fixed=editSession(s,repair(30));
 assert.deepEqual(clone(s),old);
 assert.equal(fixed.stat_data._实体.player.资源['adapt-player-electric'].当前,10);
 assert.equal(fixed.stat_data._时空.起源时刻秒,630);
 assert.equal(fixed.stat_data._待修复,null);
 assert.equal(fixed.stat_data._更新错误,'');
 assert(Object.values(fixed.death_adaptation_runtime.events).some(e=>e.result.includes('补记')));
 assert.throws(()=>editSession(fixed,{kind:'retry'}),/没有/);
});
test('无效补记、重试失败、依据重复和过期版本均不部分保存',()=>{
 const s=failed(electric()),old=clone(s);
 assert.throws(()=>editSession(s,repair(10)),/储能不足/);
 assert.throws(()=>editSession(s,repair(500)),/超过上限/);
 assert.deepEqual(clone(s),old);
 const fixed=editSession(s,repair(30));
 assert.throws(()=>run(fixed,{...repair(30).operation,before:10,value:40}),/已经补记/);
 const later=run(s,{kind:'advance',seconds:1});
 assert.throws(()=>editSession(later,repair(30)),/已有其他行动/);
});
test('分两步补记与重试保存原骰源；编辑限制最新楼层与所见快照',async()=>{
 const s=failed(electric());
 const partial=editSession(s,repair(30,false));
 assert(partial.stat_data._待修复);
 assert.equal(partial.stat_data._待修复.骰源版本,s.stat_data._结算.状态版本);
 assert.equal(editSession(partial,{kind:'retry'}).stat_data._实体.player.资源['adapt-player-electric'].当前,10);
 let data=clone(s),writes=0;
 const port={exclusive:async(k,f)=>f(),context:()=>({chatId:'chat',latestMessageId:2}),selection:()=> 'page',read:()=>clone(data),write:async value=>{data=clone(value);writes++;}};
 await assert.rejects(editArchive(port,{chatId:'chat',messageId:1,selection:'page'},s.stat_data,repair(30)),/最新/);
 const display=clone(s.stat_data);display.叙事.天气='不同';
 await assert.rejects(editArchive(port,{chatId:'chat',messageId:2,selection:'page'},display,repair(30)),/已更新/);
 assert.equal(writes,0);
 await editArchive(port,{chatId:'chat',messageId:2,selection:'page'},s.stat_data,repair(30));
 assert.equal(writes,1);
 assert.equal(data.stat_data._实体.player.资源['adapt-player-electric'].当前,10);
});
test('普通叙事不会静默丢弃失败操作；新的修正批次可以接续',()=>{
 const s=failed(electric());
 const next=acceptNarrativeUpdate(s.stat_data,{叙事:{...s.stat_data.叙事,天气:'晴'}});
 assert(next._待修复);assert.equal(next._更新错误,'储能不足');
 const p=proposed(s.stat_data,[repair(30).operation,{kind:'channel',abilityId:'adapt-player-electric',amount:20,purpose:'补完供电'}]);
 const fixed=acceptNarrativeUpdate(s.stat_data,p);assert.equal(fixed._实体.player.资源['adapt-player-electric'].当前,10);assert.equal(fixed._待修复,null);
});
test('有明确操作的旧提案允许重新确认，点击作为玩家授权，实际条件仍校验',()=>{
 const s=neutral({mode:'默认'},'proposal');
 const proposal=Schema.shape.待审提案.unwrap().valueType.parse({内容:'试探前方机关',操作:{kind:'check',actorId:'player',abilityId:null,task:'辨认机关',difficulty:10},预期状态版本:0});
 const later=run(s,{kind:'advance',seconds:3});
 const cmd=proposalCommand(later,'p1',proposal);
 assert.equal(cmd.expectedVersion,later.stat_data._结算.状态版本);
 assert.match(applyCommand(later,cmd,()=>0.5).result,/D20=11/);
});
test('脚本独立随机；提示词不含骰列，极值及重放不重掷',()=>{
 const s=neutral({mode:'默认'},'dice'), view=projectPromptState(s.stat_data);
 const p=proposed(s.stat_data,[{kind:'advance',seconds:1},{kind:'check',actorId:'player',abilityId:null,task:'攀上湿滑石墙',difficulty:10}]);
 const after=acceptNarrativeUpdate(s.stat_data,p);
 assert.match(after._运行账本.events['story-0-1'].result,new RegExp('D20='+(Math.floor(storyRandom(0,1,'dice')()*20)+1)));
 const cmd={kind:'check',actorId:'player',abilityId:null,task:'查看裂缝',difficulty:30,id:'die',branchId:'dice',expectedVersion:0};
 const success=applyCommand(s,cmd,()=>0.999);assert.match(success.result,/大成功/);
 assert.equal(applyCommand(success.session,cmd,()=>{throw Error('重掷');}).replayed,true);
 assert.match(applyCommand(s,{...cmd,id:'fail',difficulty:5},()=>0).result,/失手/);
 assert.equal(view.本轮骰列,undefined);
 assert.notEqual(storyRandom(0,0,'save-a')(),storyRandom(0,0,'save-b')());
});
test('熟练度达到门槛升级；进化产生三种真实数值效果并拒绝重复领取',()=>{
 let base=electric();
 for(let i=0;i<5;i++)base=run(base,{kind:'exposure',source:'测试电源',mechanism:'electric',mechanismName:'电击',abilityName:'电荷转移',amount:5,conditions:'短暂充能'});
 const a=base.stat_data._能力['adapt-player-electric'];
 assert.equal(a.等级,2);assert.equal(a.效果.guard.参数.capacity,126);
 for(const direction of ['容纳','转化','释放']){
  const s=clone(base);s.stat_data._能力['adapt-player-electric'].等级=5;
  const next=run(s,{kind:'evolve',abilityId:'adapt-player-electric',direction});
  const ability=next.stat_data._能力['adapt-player-electric'];
  assert.equal(ability.品阶,'史诗');assert.equal(ability.进化次数,1);
  if(direction==='容纳')assert.equal(next.stat_data._实体.player.资源['adapt-player-electric'].上限,189);
  if(direction==='转化')assert.equal(ability.效果.guard.参数.capacity,158);
  if(direction==='释放')assert.equal(ability.效果.release.参数.multiplier,1.25);
  assert.throws(()=>run(next,{kind:'evolve',abilityId:'adapt-player-electric',direction}),/等级5/);
 }
});
test('正文卡片读同楼可见档案，隐藏人物资料保持不可见',()=>{
 const s=electric().stat_data;
 const player=resolveDossierCard(s,'character','player');
 assert.equal(player.title,s._开局.档案.姓名);
 assert.deepEqual(Array.from(player.metrics,metric=>metric.label),['生命','能量','攻击','防御']);
 assert.equal(player.metrics[0].value,`${s._实体.player.生命.当前} / ${s._实体.player.生命.上限}`);
 assert.equal(resolveDossierCard(s,'ability','adapt-player-electric').grade,'稀有');
 assert.throws(()=>resolveDossierCard(s,'entity','hazard-test-0'),/尚未/);
 assert.throws(()=>resolveDossierCard(s,'ability','unknown'),/尚未/);
});
test('一千条能力与见闻仍有固定条目上限；旧资料可按名称和手动重点取回',()=>{
 const s=neutral({mode:'默认'},'long').stat_data;
 for(let i=0;i<1000;i++){
  const id='a-'+i;
  s._能力[id]=Schema.shape._能力.unwrap().valueType.parse({名称:'独有能力第'+i+'项',描述:'技能描述'.repeat(60)});
  s._实体.player.能力ID[id]=true;s._实体.player.资源[id]={名称:'对应储能',当前:3,上限:10,单位:'点'};
  s._见闻档案['n-'+i]={类别:'事件',对象ID:'p-'+i,标题:'旅途记录第'+i+'页',内容:'被保存的完整经历'.repeat(80),可信度:'观察',来源:'旧经历',知情者ID:{player:true}};
 }
 const plain=projectPromptState(s);
 assert(Object.keys(plain._能力).length<=20);assert(plain.能力索引.length<=24);assert(Object.keys(plain._实体.player.资源).length<=16);
 assert(JSON.stringify(plain).length<18000);
 const recalled=projectPromptState(s,'独有能力第0项与旅途记录第0页');
 assert(recalled._能力['a-0']);assert(recalled.叙事.见闻['n-0']);
 const focused=editSession({stat_data:s,death_adaptation_runtime:s._运行账本},{kind:'focus',category:'见闻',id:'n-1',enabled:true});
 assert(projectPromptState(focused.stat_data).叙事.见闻['n-1']);
 assert.equal(Object.keys(s._见闻档案).length,1000);
 fs.writeFileSync(path.join(root,'build/long-play-report.json'),JSON.stringify({能力数:1002,见闻数:1000,默认投影字符数:JSON.stringify(plain).length,检索投影字符数:JSON.stringify(recalled).length,说明:'字符数并非模型token数；未计聊天历史和常驻世界书'},null,2));
});
test('投影EJS可独立执行，并在近期文字中取回旧档案',()=>{
 const s=neutral({mode:'默认'},'ejs').stat_data;
 const file=fs.readFileSync(path.join(root,'世界书/变量/变量列表.txt'),'utf8');
 const code=file.slice(file.indexOf('<%')+2,file.lastIndexOf('%>'));
 let output='';
 new Function('getvar','getChatMessages','print',code)(()=>s,()=>[{message:'起源涅槃'}],x=>output+=x);
 assert(output.includes('起源涅槃'));assert(!output.includes('成长记录'));
});

test('连续1000次剧情更新将旧见闻归档，早期记录完整保留且提示词不线性增长',()=>{
 let state=neutral({mode:'默认'},'thousand-turns').stat_data;
 let size100=0;
 for(let i=0;i<1000;i++){
  const next={叙事:{...clone(state.叙事),见闻:{...clone(state.叙事.见闻),['note-'+i]:{类别:'事件',对象ID:'scene-'+i,标题:'第'+i+'段见闻',内容:'在这个世界看到的线索与约定。',可信度:'观察',来源:'现场',知情者ID:{player:true}}}}};
  state=acceptNarrativeUpdate(state,next);
  if(i===99)size100=JSON.stringify(projectPromptState(state)).length;
 }
 assert.equal(Object.keys(state.叙事.见闻).length,24);
 assert.equal(Object.keys(state._见闻档案).length,976);
 assert(state._见闻档案['note-0']);
 const size1000=JSON.stringify(projectPromptState(state)).length;
 assert(size1000<size100+300);
 assert(projectPromptState(state,'第0段见闻').叙事.见闻['note-0']);
 const reportPath=path.join(root,'build/long-play-report.json');
 const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
 fs.writeFileSync(reportPath,JSON.stringify({...report,连续剧情更新:1000,常用见闻:24,归档见闻:976,第100轮字符数:size100,第1000轮字符数:size1000},null,2));
});
