const path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),YAML=require('yaml'),_=require('lodash');
const {loadTs}=require('../tools/runtime.cjs'),root=path.resolve(__dirname,'..');
const load=n=>loadTs(path.join(root,'src',n+'.ts'));
const {createOpening}=load('opening'),{Schema}=load('schema');
const {resolveDossierCard}=load('output-cards');
test('主角身份卡直接读取封面档案，不依赖AI重复建档',()=>{
 const s=createOpening({mode:'默认'},'handoff');
 assert.equal(resolveDossierCard(s.stat_data,'character','player').title,s.stat_data._开局.档案.姓名);
});
test('新字段与旧存档字段同时可读，保存只输出新名称',()=>{
 const input={_开局:{档案:{玩家补充:'旧补充'}},待审提案:{p:{玩家原文引用:'旧引用'}}};
 const s=Schema.parse(input);assert.equal(s._开局.档案.持有者补充,'旧补充');assert.equal(s.待审提案.p.原文引用,'旧引用');
 assert(!Object.hasOwn(s._开局.档案,'玩家补充'));assert(!Object.hasOwn(s.待审提案.p,'玩家原文引用'));
 assert.deepEqual(Schema.parse(s),s);
 assert.equal(Schema.parse({_开局:{档案:{持有者补充:'新',玩家补充:'旧'}}})._开局.档案.持有者补充,'新');
});
test('对象包装转为MVU命令，时间与正文档案进入真实结算；相同回执不重算',()=>{
 const {bridgeUpdateCommands}=load('update-protocol'),{acceptNarrativeUpdate}=load('mvu-policy');
 const s=createOpening({mode:'默认'},'handoff'),commands=[];
 const body='<UpdateVariable>'+JSON.stringify({Analysis:'一段交谈',JSONPatch:[
  {op:'replace',path:'/叙事/本轮时间',value:15},{op:'replace',path:'/叙事/本轮结算',value:null},
  {op:'replace',path:'/叙事/天气',value:'潮声轻缓'},
  {op:'insert',path:'/叙事/人物档案/asteria',value:{名称:'艾斯特瑞亚'}},
  {op:'replace',path:'/叙事/首次资料完成',value:true} ]})+'</UpdateVariable>';
 assert.equal(bridgeUpdateCommands(body,commands),'');assert.equal(commands.length,5);
 const next=_.cloneDeep(s.stat_data);
 for(const c of commands){if(c.type==='set')_.set(next,c.args[0],JSON.parse(c.args[1]));else if(c.type==='insert')_.get(next,c.args[0])[JSON.parse(c.args[1])]=JSON.parse(c.args[2]);}
 const after=acceptNarrativeUpdate(s.stat_data,next,s.death_adaptation_runtime,undefined,'receipt');
 assert.equal(after._时空.起源时刻秒,s.stat_data._时空.起源时刻秒+15);assert.equal(after.叙事.天气,'潮声轻缓');
 assert.equal(resolveDossierCard(after,'character','asteria').title,'艾斯特瑞亚');
 assert.equal(JSON.stringify(acceptNarrativeUpdate(after,next,undefined,undefined,'receipt')),JSON.stringify(after));
});
test('格式桥接不重复已解析命令，失败时不注入半批次或原型路径',()=>{
 const {bridgeUpdateCommands,updateReceiptStatus}=load('update-protocol');
 const commands=[{type:'set',args:['x','1']}];assert.equal(bridgeUpdateCommands('<UpdateVariable>bad</UpdateVariable>',commands),'');assert.equal(commands.length,1);
 for(const path of ['/_实体/player','/叙事/__proto__/x']){const out=[];assert.match(bridgeUpdateCommands('<UpdateVariable>'+JSON.stringify({JSONPatch:[{op:'replace',path:'/叙事/天气',value:'雨'},{op:'replace',path,value:1}]})+'</UpdateVariable>',out),/未解析/);assert.equal(out.length,0);}
 assert.match(updateReceiptStatus('<UpdateVariable>x</UpdateVariable>','','r',''),/尚未确认/);
 assert.equal(updateReceiptStatus('<UpdateVariable>x</UpdateVariable>','r','r',''),'本轮变量已处理。');
});
test('所有世界书源稿均纳入清单；不打包越界的装备与遭遇参考',()=>{
 const entries=YAML.parse(fs.readFileSync(path.join(root,'世界书条目清单.yaml'),'utf8')).条目;
 const listed=new Set(entries.map(e=>e.文件));
 function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,f.name);if(f.isDirectory())walk(full);else if(/\.(txt|yaml)$/.test(f.name))assert(listed.has(path.relative(root,full).replaceAll('\\','/').replace(/\.(txt|yaml)$/, '')),full);}}walk(path.join(root,'世界书'));
 assert(!entries.some(e=>/装备生成|遭遇生成/.test(e.名称)));
 for(const name of ['角色行为准则','叙事规则','NPC生成规则','位面生成规则'])assert(entries.find(e=>e.名称===name)?.启用);
});

test('真实变量脚本事件入口接入格式桥接、回执和失败回滚',async()=>{
 const ts=require('typescript'),vm=require('node:vm'),hooks=new Map();let ready,inputSchema;
 const source=fs.readFileSync(path.join(root,'脚本/变量结构/index.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const state=createOpening({mode:'默认'},'hook').stat_data;
 let content='<UpdateVariable>'+JSON.stringify({JSONPatch:[{op:'replace',path:'/叙事/本轮时间',value:12},{op:'replace',path:'/叙事/本轮结算',value:null}]})+'</UpdateVariable>';
 const context={exports:{},_:_,console:{warn(){}},window:{},Mvu:{events:{COMMAND_PARSED:'parsed',VARIABLE_UPDATE_ENDED:'ended'}},
  $:arg=>typeof arg==='function'?(ready=arg()):{on(){}},waitGlobalInitialized:async()=>{},initializeGlobal(){},
  eventOn:(name,fn)=>{hooks.set(name,fn);return {stop(){}}},getLastMessageId:()=>1,getChatMessages:()=>[{message_id:1,swipe_id:0,swipes:[content]}],
  require:id=>id.startsWith('https:')?{registerMvuSchema:s=>inputSchema=s}:loadTs(path.resolve(root,'脚本/变量结构',id+'.ts'))};
 vm.runInNewContext(compiled,context);await ready;
 const previous={stat_data:_.cloneDeep(state)},next=_.cloneDeep(previous),commands=[];
 hooks.get('parsed')(next,commands,content);
 for(const c of commands)_.set(next.stat_data,c.args[0],JSON.parse(c.args[1]));
 next.stat_data=inputSchema.parse(next.stat_data);hooks.get('ended')(next,previous);
 assert.equal(next.stat_data._时空.起源时刻秒,12);assert(next.stat_data._叙事回执);
 // 第二个动作失败时，额外时间与第一个动作同批回退，原输入可用于局部修复。
 content='<UpdateVariable>'+JSON.stringify({JSONPatch:[{op:'replace',path:'/叙事/本轮时间',value:9},{op:'replace',path:'/叙事/本轮结算',value:[{kind:'advance',seconds:1},{kind:'revive'}]}]})+'</UpdateVariable>';
 const failed=_.cloneDeep(next),ops=[];hooks.get('parsed')(failed,ops,content);
 for(const c of ops)_.set(failed.stat_data,c.args[0],JSON.parse(c.args[1]));
 failed.stat_data=inputSchema.parse(failed.stat_data);hooks.get('ended')(failed,next);
 assert.equal(failed.stat_data._时空.起源时刻秒,12);assert.match(failed.stat_data._更新错误,/尚未到复苏时间/);assert(failed.stat_data._待修复);
});
