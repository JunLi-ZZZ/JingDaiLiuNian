const path=require('node:path'),test=require('node:test'),assert=require('node:assert/strict');
const {loadTs}=require('../tools/runtime.cjs');
const load=n=>loadTs(path.resolve(__dirname,'../src/'+n+'.ts'));
const {createOpening}=require('./numerical-fixture.cjs');
const {applyRepairPatch,repairReplayPatch,repairPrompt,assertLocalRepair,repairInput}=load('variable-repair');
const {acceptNarrativeUpdate}=load('mvu-policy');
const {parseLibrary}=load('library');
const clone=x=>JSON.parse(JSON.stringify(x));
function failed(){
 const s=createOpening({mode:'默认'},'feedback');
 const input={叙事:{...clone(s.stat_data.叙事),场景描述:'潮水漫过石阶。',天气:'细雨',本轮时间:12,本轮结算:[{kind:'exposure',source:'寒雾',mechanism:'cold',mechanismName:'低温',abilityName:null,amount:null,conditions:'裸露皮肤接触寒雾'}]}};
 s.stat_data._待修复={版本:s.stat_data._结算.状态版本,输入:input,原因:'amount: expected number, received null'};
 return s;
}
test('只修失败操作的数值，保留本轮其余叙事和时间；原始失败输入不变',()=>{
 const s=failed(),original=clone(s);
 const patch=[{op:'replace',path:'/叙事/本轮结算/操作/0/amount',value:10}];
 const result=applyRepairPatch(s,patch);
 assert.equal(result.stat_data.叙事.天气,'细雨');assert.equal(result.stat_data.叙事.场景描述,'潮水漫过石阶。');
 assert.equal(result.stat_data._时空.起源时刻秒,s.stat_data._时空.起源时刻秒+12);
 assert.deepEqual(clone(s),original);
 const replay=repairReplayPatch(s.stat_data,patch);
 const proposed=clone(s.stat_data);for(const p of replay)proposed[p.path.slice(1)]=p.value;
 assert.deepEqual(clone(acceptNarrativeUpdate(s.stat_data,proposed)),clone({...result.stat_data,_修复记录:s.stat_data._修复记录}));
});
test('局部修复提示只聚焦失败字段，再次修复沿用已改候选',()=>{
 const s=failed();
 const prompts=repairPrompt(s.stat_data,'寒雾接触皮肤。','',[]);
 const context=JSON.parse(prompts[1].content);
 assert(context.待修正.some(x=>x.路径.endsWith('/amount')));
 assert(!prompts[0].content.includes('重新提交本轮完整更新'));
 const first=[{op:'replace',path:'/叙事/本轮结算/操作/0/amount',value:-1}];
 const next=JSON.parse(repairPrompt(s.stat_data,'','',first)[1].content);
 assert.equal(next.待修正.find(x=>x.路径.endsWith('/amount')).当前值,-1);
});
test('空能力名对已有机制可省略，不再阻断环境结算；实际强度仍必填',()=>{
 const s=failed();s.stat_data._待修复.输入.叙事.本轮结算[0].amount=10;
 assert.doesNotThrow(()=>acceptNarrativeUpdate(s.stat_data,s.stat_data._待修复.输入));
});
test('AI局部候选越出错误范围被拒绝，数组插入/删除保留相邻操作',()=>{
 const s=failed();
 assert.doesNotThrow(()=>assertLocalRepair(s.stat_data,[],[{op:'replace',path:'/叙事/本轮结算/操作/0/amount',value:10}]));
 assert.throws(()=>assertLocalRepair(s.stat_data,[],[{op:'replace',path:'/叙事',value:{}}]),/报错范围/);
 assert.throws(()=>assertLocalRepair(s.stat_data,[],[{op:'replace',path:'/叙事/天气',value:'晴'}]),/报错范围/);
 const ops='/叙事/本轮结算/操作/';
 const inserted=repairInput(s.stat_data,[{op:'insert',path:ops+'0',value:{kind:'advance',seconds:1}}]);
 assert.equal(inserted.叙事.本轮结算.操作[1].source,'寒雾');
 const removed=repairInput(s.stat_data,[{op:'insert',path:ops+'0',value:{kind:'advance',seconds:1}},{op:'remove',path:ops+'0'}]);
 assert.equal(removed.叙事.本轮结算.操作.length,1);
 assert.equal(removed.叙事.本轮结算.操作[0].source,'寒雾');
 assert.throws(()=>repairInput(s.stat_data,[{op:'replace',path:ops+'999/amount',value:1}]),/父路径/);
});
test('未知机制以通用命名回退，新能力名称可选；无需为每种能力定制规则',()=>{
 const s=failed();const op=s.stat_data._待修复.输入.叙事.本轮结算[0];
 op.mechanism='resonance';op.mechanismName='共振';op.amount=10;delete op.abilityName;
 assert.doesNotThrow(()=>acceptNarrativeUpdate(s.stat_data,s.stat_data._待修复.输入));
});
test('档案清理成对强调标记，保留正文含义、章节、单个星号与数学符号',()=>{
 const raw={id:'visitor',kind:'character',name:'访客',aliases:[],planeId:'main',summary:'**修钟匠**',content:'# 基本信息\n**姓名**：访客\n**性别**：男\n# 能力\n钟面刻着 A* 和 2 * 3。\n***惯用语***：时间还够。'};
 const parsed=parseLibrary(JSON.stringify(raw));
 assert(!parsed.content.includes('**'));assert.equal(parsed.summary,'修钟匠');
 assert(parsed.content.includes('A* 和 2 * 3'));assert(parsed.content.includes('# 基本信息'));
 assert(parsed.content.includes('惯用语：时间还够。'));
});
