const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const z = require('zod');
const { loadTs } = require('./runtime.cjs');
const card = path.resolve(__dirname, '..');
const source = card;
const { Schema } = loadTs(path.join(source, 'src/schema.ts'));
const { createUninitializedState, presetPlanes } = loadTs(path.join(source, 'src/presets.ts'));
const { worldbookOrder: order } = loadTs(path.join(source,'src/worldbook-order.ts'));
const { operationGuide } = loadTs(path.join(source,'src/operation-guide.ts'));
const { formatPromptView } = loadTs(path.join(source, 'src/prompt-format.ts'));
const { projectPromptState } = loadTs(path.join(source, 'src/prompt-view.ts'));
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
};

const json = JSON.stringify(z.toJSONSchema(Schema, { io: 'input', reused: 'ref' }), null, 2) + '\n';
write(path.join(card, 'generated/schema.json'), json);
write(path.join(card, '世界书/变量/变量列表.txt'), `@@preprocessing
本局 {{user}} 就是下列档案中的角色，姓名与性别采用该档案。
<%
const project = ${projectPromptState.toString()};
const render = ${formatPromptView.toString()};
const recent = typeof getChatMessages === 'function' ? [-2,-1].flatMap(depth => getChatMessages(depth) || []).map(item => String(typeof item === 'string' ? item : item?.message ?? item?.mes ?? '').replace(/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/gi, '')).join('\\n') : '';
print(render(project(getvar('stat_data', { defaults: {} }) || {}, recent)));
%>\n`);
write(
  path.join(card, '世界书/变量/initvar.yaml'),
  '# yaml-language-server: $schema=../../generated/schema.json\n' + YAML.stringify(createUninitializedState()),
);

const entry = (name, file, enabled, order, position = '角色定义之前') => ({
  名称: name,
  启用: enabled,
  激活策略: { 类型: '蓝灯' },
  插入位置: { 类型: position, 顺序: order, ...(position === '指定深度' ? { 深度: 0, 角色: 'system' } : {}) },
  激活概率: 100,
  递归: { 不可被其他条目激活: true, 不可激活其他条目: true },
  文件: file,
});
write(path.join(card, 'generated/repair-guide.json'), JSON.stringify(
  ['世界书/系统/行动与结算.txt','世界书/系统/人物档案.txt','世界书/变量/变量输出格式.yaml']
    .map(file=>fs.readFileSync(path.join(card,file),'utf8')).join('\n')));
write(path.join(card,'世界书/系统/操作字段契约.txt'), '<操作字段契约>\n每行定义一种动作对象。?表示可省略字段；其余字段必填。按本轮实际动作取相应字段，参数类型和范围如下。\n'+operationGuide()+'\n</操作字段契约>\n');
const entries = [
  entry('多元位面-体系概述','世界书/核心/多元位面-体系概述',true,order.核心背景),
  entry('故事基调','世界书/核心/故事基调',true,order.故事基调),
  entry('世界与人物','世界书/核心/世界与人物',true,order.世界人物),
  entry('角色行为准则','世界书/核心/角色行为准则',true,order.角色行为),
  entry('叙事规则','世界书/系统/叙事规则',true,order.叙事规则),
  entry('NPC生成规则','世界书/系统/NPC生成规则',true,order.NPC生成),
  entry('位面生成规则','世界书/系统/位面生成规则',true,order.位面生成),
  entry('品阶','世界书/系统/品阶',true,order.品阶),
  entry('能力体系','世界书/系统/能力体系',true,order.能力体系),
  entry('起源种核-传承','世界书/玩法/起源涅槃/起源种核-传承',false,order.种核),
  entry('起源涅槃-死亡与能力','世界书/玩法/起源涅槃/死亡与复苏',false,order.死亡复苏),
  entry('起源涅槃-运行衔接','世界书/玩法/起源涅槃/运行衔接',false,order.死亡复苏+10),
  entry('余烬之后_位面使用规则','世界书/位面/位面使用规则',true,order.能力体系+100),
  entry('[EJS]余烬之后_位面控制器','世界书/控制器/EJS位面控制器',true,order.位面控制器,'角色定义之后'),
  entry('[EJS]传承人物与空间','世界书/控制器/EJS传承控制器',true,order.传承控制器,'角色定义之后'),
  entry('[EJS]潮镜资料库','世界书/控制器/EJS资料库控制器',true,order.资料库控制器,'角色定义之后'),
  entry('[EJS]开局与专属能力','世界书/控制器/EJS开局控制器',true,order.开局控制器,'角色定义之后'),
  entry('人物档案','世界书/系统/人物档案',true,order.人物档案,'角色定义之后'),
  entry('行动与结算','世界书/系统/行动与结算',true,order.行动结算,'角色定义之后'),
  entry('战斗与检定','世界书/系统/战斗与检定',true,order.战斗检定,'角色定义之后'),
  entry('[EJS]能力成长','世界书/控制器/EJS成长控制器',true,order.成长控制器,'角色定义之后'),
  entry('变量列表','世界书/变量/变量列表',true,order.当前状态,'指定深度'),
  entry('[EJS]余烬之后_变量规则控制器','世界书/控制器/EJS变量规则控制器',true,order.更新控制器,'指定深度'),
  entry('操作字段契约','世界书/系统/操作字段契约',true,order.操作契约,'指定深度'),
  entry('正文格式','世界书/系统/正文格式',true,order.正文格式,'指定深度'),
  entry('[mvu_update]变量输出格式','世界书/变量/变量输出格式',true,order.输出格式,'指定深度'),
  entry('余烬之后_变量更新规则_首次','世界书/变量/变量更新规则_首次',false,order.首次规则),
  entry('余烬之后_变量更新规则_日常','世界书/变量/变量更新规则_日常',false,order.日常规则),
  entry('熟练度与等级','世界书/系统/熟练度与等级',false,order.熟练度),
  entry('能力进化','世界书/系统/能力进化',false,order.进化),
  ...['初微','艾斯特瑞亚','末墟'].map((name,i)=>entry(name,'世界书/角色/'+name,false,order.固定角色+i*100)),
  entry('归泊庭','世界书/玩法/起源涅槃/归泊庭',false,order.空间),
  entry('开局_初次归泊','世界书/玩法/起源涅槃/开局-初次归泊',false,order.开局资料),
  entry('能力_越界','世界书/玩法/起源涅槃/能力-越界',false,order.能力资料),
  ...Object.values(presetPlanes).map((name,i)=>entry('余烬之后_位面_'+name,'世界书/位面/'+name,false,order.位面资料+i*100)),
  entry('[initvar]变量初始化勿开','世界书/变量/initvar',false,order.初始化),
];
// 本卡独立打包器读取的世界书清单。
write(
  path.join(card, '世界书条目清单.yaml'),
  '# 本卡独立打包器读取的世界书清单。\n' + YAML.stringify({ 条目: entries }),
);
console.log('Generated schema.json, initvar.yaml and worldbook manifest.');
// 草稿生成显式读取所选世界，不依赖尚未初始化的MVU位面来触发EJS。
write(
  path.join(card, 'generated/opening-worlds.json'),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(presetPlanes).map(([id, name]) => [
        id,
        fs.readFileSync(path.join(card, `世界书/位面/${name}.txt`), 'utf8'),
      ]),
    ),
    null,
    2,
  ) + '\n',
);
