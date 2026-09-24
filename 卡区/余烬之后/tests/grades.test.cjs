const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path'), fs = require('node:fs');
const { loadTs } = require('../tools/runtime.cjs');
const load = file => loadTs(path.join(__dirname, '../src', file + '.ts'));
const { grades, legacyGrades, StoredGradeSchema, nextGrade, gradeBonus, displayGrade } = load('grades');
const { Schema, OperationSchema } = load('schema');
const { applyCommand } = load('engine');
const { createOpening } = require('./numerical-fixture.cjs');
const { acceptNarrativeUpdate } = load('mvu-policy');
const { evolve } = load('progression');
const { operationGuide } = load('operation-guide');
const clone = value => JSON.parse(JSON.stringify(value));
const acquire = grade => OperationSchema.parse({kind:'acquire',actorId:'player',abilityId:'learned',name:'观潮',grade,source:'学习',evidence:'在岸边完成观察训练',description:'辨认潮路',trigger:'观察水流',limitations:'需要现场线索',profile:'技艺'});

test('六种旧名只在读取时映射，合法新名和本源不变，错误值仍明确报错', () => {
  assert.equal(grades.length, 7);
  for (const [old, current] of Object.entries(legacyGrades)) {
    assert.equal(StoredGradeSchema.parse(old), current);
    assert.equal(StoredGradeSchema.parse(current), current);
    assert.equal(displayGrade(old), current);
    assert.equal(acquire(old).grade, current);
  }
  assert.equal(StoredGradeSchema.parse('本源'), '本源');
  assert.equal(displayGrade('普通居民'), undefined);
  assert.throws(() => StoredGradeSchema.parse('稀世'));
});

test('旧聊天能力与物品、待审动作可续写，读取不修改原档案和历史文字', () => {
  const old = createOpening({mode:'默认'}, 'grade-save').stat_data;
  old._能力['basic-attack'].品阶 = '凡常';
  old._能力['basic-attack'].描述 = '传说里提到的普通攻击';
  old._物品.token = Schema.shape._物品.unwrap().valueType.parse({名称:'信物',品阶:'凝华',所在:{类型:'实体',ID:'player'}});
  old._物品.token.品阶 = '精良';
  old.待审提案.learning = {类型:'能力定义',主体ID:'player',操作:{...acquire('凝华'),grade:'精良'}};
  const before = clone(old), parsed = Schema.parse(old);
  assert.deepEqual(clone(old), before);
  assert.equal(parsed._能力['basic-attack'].品阶, '凡尘');
  assert.equal(parsed._能力['basic-attack'].描述, before._能力['basic-attack'].描述);
  assert.equal(parsed._物品.token.品阶, '凝华');
  assert.equal(parsed.待审提案.learning.操作.grade, '凝华');
  assert.deepEqual(clone(Schema.parse(parsed)), clone(parsed));
  const next = acceptNarrativeUpdate(old, {叙事:{...clone(old.叙事),本轮时间:1,本轮结算:null}});
  assert.equal(next._能力['basic-attack'].品阶, '凡尘');
  assert.equal(next._时空.起源时刻秒, old._时空.起源时刻秒+1);
});

test('旧事件重放允许等价序列名，不重扣资源、不改历史账本', () => {
  const start = createOpening({mode:'默认'}, 'grade-replay');
  const command = {...acquire('精良'),id:'learn',branchId:'grade-replay',expectedVersion:start.stat_data._结算.状态版本};
  const saved = applyCommand(start, command).session;
  saved.death_adaptation_runtime.events.learn.command.grade = '精良';
  saved.stat_data._运行账本 = clone(saved.death_adaptation_runtime);
  const before = clone(saved);
  const result = applyCommand(saved, command, () => {throw Error('不应重掷');});
  assert.equal(result.replayed, true);
  assert.deepEqual(clone(result.session), before);
  assert.throws(() => applyCommand(saved, {...command,grade:'罕世'}), /不同请求/);
});

test('原初本源可存取显示，普通进化不进入它，特殊序列不被进化降回凡尘', () => {
  assert.equal(StoredGradeSchema.parse('原初本源'), '原初本源');
  assert.equal(nextGrade('本源'), '本源');
  assert.equal(nextGrade('原初本源'), '原初本源');
  assert.equal(gradeBonus('本源'), 6);
  assert.equal(gradeBonus('原初本源'), 0);
  assert.throws(() => acquire('原初本源'));
  const state = createOpening({mode:'默认'}, 'grade-special').stat_data;
  const a = state._能力['basic-attack'];
  a.等级 = 5;a.品阶 = '原初本源';
  evolve(state, 'basic-attack', '威力');
  assert.equal(a.品阶, '原初本源');
});

test('模型操作契约只给七个当前名称；EJS直接读取旧楼也投影新序列', async () => {
  const guide = operationGuide(['acquire']);
  assert(guide.includes('grade='+grades.join('|')));
  for (const name of Object.keys(legacyGrades)) assert(!guide.includes(name));
  const state = createOpening({mode:'默认'}, 'grade-prompt').stat_data;
  state._能力['basic-attack'].品阶 = '凡常';
  const file = fs.readFileSync(path.join(__dirname,'../世界书/变量/变量列表.txt'),'utf8');
  const output = [];
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  await new AsyncFunction('getvar','getChatMessages','print',file.slice(file.indexOf('<%')+2,file.lastIndexOf('%>')))(()=>state,()=>[],value=>output.push(value));
  assert(output.join('').includes('本质序列: 凡尘'));
  assert(!output.join('').includes('凡常'));
  assert.equal(state._能力['basic-attack'].品阶,'凡常');
});
