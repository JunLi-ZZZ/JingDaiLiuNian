import type { LibraryEntry, Schema } from './schema';
import type { WorkshopReference } from './workshop-context';
export type WorkshopField={key:string;label:string;options?:string[];multiple?:boolean};
export type WorkshopGroup={name:string;fields:WorkshopField[]};
export const characterGroups:WorkshopGroup[]=[
 {name:'身份与外貌',fields:[
 {key:'gender',label:'性别',options:['女性','男性','非二元','无性别']},
 {key:'age',label:'年龄阶段',options:['少年','青年','成熟','中年','年长','长生种']},
 {key:'race',label:'种族',options:['人类','精灵','妖族','兽人','龙族','人鱼','亡灵','人造生命','元素生命']},
 {key:'role',label:'身份职业',options:['普通居民','旅人','学者','医者','商人','工匠','冒险者','贵族','统治者','祭司','流亡者']},
 {key:'body',label:'体态身材',options:['匀称','纤细','高挑','健壮','丰满','娇小','非人形']},
 {key:'look',label:'外貌气质',options:['清秀','冷峻','温和','明艳','朴素','威严','疲惫','异质']},
 {key:'appearance',label:'发色、瞳色与生理标记'}]},
 {name:'性格与生活',fields:[
 {key:'traits',label:'性格特质',multiple:true,options:['温柔','谨慎','爽朗','傲慢','敏锐','固执','幽默','寡言','务实','理想主义','疑心重','重情义']},
 {key:'core',label:'内心矛盾',options:['责任与自由','理想与生计','亲情与立场','自尊与依赖','信仰与疑问','安全与好奇']},
 {key:'speech',label:'说话习惯',options:['言简意赅','温和耐心','直率粗粝','礼貌疏离','爱讲故事','尖锐幽默']},
 {key:'hobbies',label:'喜好、厌恶与日常习惯'},
 {key:'past',label:'出身、转折与人生追求'}]},
 {name:'世界、能力与关系',fields:[
 {key:'origin',label:'来源世界',options:['主世界','归泊庭','原创世界']},
 {key:'power',label:'天赋与专长',multiple:true,options:['无超凡能力','剑术','法术','治疗','炼金','机械','感知','变形','契约','空间','谋略','手艺']},
 {key:'values',label:'信念、底线与弱点'},
 {key:'level',label:'力量定位',options:['普通人','初学者','熟练者','地方强者','宗师','传说人物']},
 {key:'ties',label:'所属势力、重要关系与牵挂'},
 {key:'equipment',label:'随身物品与代表装备'}]},
 {name:'同人或已有设定',fields:[
 {key:'work',label:'作品／已有角色名'},
 {key:'adaptation',label:'改编方式',options:['沿用原作','保留核心重新演绎','平行世界','融合设定']},
 {key:'retained',label:'保留要点与改动'}]}
];
export const planeGroups:WorkshopGroup[]=[
 {name:'世界轮廓',fields:[
 {key:'genre',label:'位面类型',options:['东方仙侠','西方奇幻','现代都市','武侠江湖','神话','科幻','废土','赛博朋克','蒸汽朋克','诡秘','童话']},
 {key:'scale',label:'世界规模',options:['城市／封闭空间','单一大陆','多大陆与海洋','行星','星系','层叠世界']},
 {key:'tech',label:'技术阶段',options:['原始','古代','中古','蒸汽与火药','现代','近未来','星际文明','区域混合']},
 {key:'magic',label:'超凡程度',options:['无超凡','低魔','中魔','高魔','超凡与科技共存','区域差异']},
 {key:'races',label:'智慧种族',multiple:true,options:['人类','精灵','兽人','妖族','龙族','亡灵','人造生命','元素生命']},
 {key:'era',label:'历史阶段',options:['初生','上古','黄金时代','动荡','衰落','变革前夕','战后重建','末日边缘']}]},
 {name:'规则与生活',fields:[
 {key:'law',label:'独有法则与代价'}, {key:'geography',label:'地理、气候与地标'},
 {key:'society',label:'社会与文明',options:['城邦联盟','王国与贵族','宗门与世家','部族','现代国家','企业统治','流动聚落','多元并存']},
 {key:'culture',label:'文化、风俗与日常'},
 {key:'conflict',label:'世界矛盾',multiple:true,options:['资源争夺','旧秩序崩解','信仰冲突','生态失衡','技术变革','异界接触','遗产争夺']},
 {key:'factions',label:'主要势力与关联人物'}, {key:'arrival',label:'落脚点与探索方向'}]},
 {name:'作品与衔接',fields:[
 {key:'work',label:'原作／已有位面名'}, {key:'adaptation',label:'改编方式',options:['原创','沿用原作','平行世界','融合设定']},
 {key:'retained',label:'保留要点与改动'}, {key:'connection',label:'虚海通路与往来条件'}]}
];
export const characterTemplate=`# 基本信息
姓名、真实存在的别名、性别、实际年龄与外表年龄、种族、来源世界、身份职业、所属势力、活动范围。
# 外貌特征
体型身高、发色发型、眼睛、面部与生理标记、整体气质、衣着风格。区分稳定特征与可变打扮。
# 性格与行为
核心特质与相互牵制的欲望、软肋和底线；喜好厌恶；平常、承压、亲近与冲突时的具体行为。
# 经历与动机
出身和成长环境、重要转折及其因果、长期追求与谋生方式。经历解释价值观、习惯与能力。
# 能力与局限
天赋或专长的名称、机制、可见效果、条件、代价、弱点与本土力量层次。普通人物同样有实际技能。
# 语言与互动
语速、用词、称呼习惯、情绪表达方式；日常、分歧、关切三种情境各一句自然对白。
# 关系与认知
成长中形成的亲友、势力和对手关系；知识领域及其学习来源、社会身份带来的视野与认知局限。
# 日常与爱好
作息、谋生、爱好及其个人意义、一个能在生活中表现的习惯。
# 物品与牵挂
有来历的代表物件，其用途、限制及情感意义。
# 行为逻辑与发展空间
面对新关系、利益冲突和重大变化时怎样判断与行动；哪些经历可能改变其信念，改变需要怎样的过程。`;
export const planeTemplate=`# 世界概况
名称、类型、规模、世界的一句话特征。空间、历法和时间流速；流速留空时采用1:1。
# 地理与生态
至少三个互有关联的核心区域：地貌气候、地标、交通、资源、生物与危险。地理影响生活。
# 历史脉络
形成缘由、主要时代、至少两件改变现实格局的大事件，说明参与者与留下的后果。
# 文明与日常
社会结构、主要种族及关系、技术阶段、衣食住行、谋生与交易、文化节日和禁忌的来历。
# 力量体系
力量来源、获得途径、本土层级和可见尺度、训练与资源需求、条件与代价、超凡和社会的关系。
# 势力与人物
至少三个立场不同的势力：领地、资源、诉求、方法、相互依赖或冲突；每方一个能实际接触的代表人物。
# 独有现象
有触发条件、具体表现、利用方式与代价的世界特征，与地理历史相联系。
# 长期矛盾
资源、制度、生态和信仰之间持续存在的矛盾，各方的利益与相互依赖、局面变化的条件。
# 地点与互动空间
重要地点的职能、常见活动与来往人群，环境和社会关系能够引出的互动条件。
# 虚海联系
通路与抵达条件、当地对异界来客的知识、往来风险和限制。`;
export function workshopPrompt(kind:'character'|'plane', name:string, concept:string, values:Record<string,string>, state?:Schema, references:WorkshopReference[]=[] ) {
 const groups=kind==='character'?characterGroups:planeGroups;
 const choices=Object.fromEntries(groups.flatMap(g=>g.fields).filter(f=>values[f.key]?.trim()).map(f=>[f.label,values[f.key].trim()]));
 return [
  {role:'system' as const,content:`创作可长期放入世界书的${kind==='character'?'人物':'位面'}档案。未选择的属性由你按整体设定协调创作。选定的属性与补充内容优先。以具体事实、因果与可表现的细节建立辨识度。人物拥有独立生活，基础档案描述其自身。背景是虚海多元世界，初微掌起源，末墟掌终焉；本土人物按其所在文化与认知生活。
输出一个JSON对象：{id:英文短ID,kind:"${kind}",name:名称,aliases:别名数组,planeId:所属位面ID,summary:150字内概括,content:完整档案字符串}。位面planeId与id一致。人物所属世界从已知对应ID取值；尚未建立的世界给出稳定英文ID并在正文写明名称。
档案章节用“# 章节名”单独成行，字段用“名称：内容”的纯文字形式，段落自然换行。
content按以下章节组织，正文约${kind==='character'?'1200—2200':'1800—3000'}字，重点充分，避免重复。参考资料中的已确定事实准确延续，缺少的基础字段按来源世界、种族、经历和身份协调创作。没有别名或特殊物件时如实写无；其余字段写具体完整的设定。外貌写稳定生理特征，衣着写风格习惯；关系写人物自身的社会关系，动机写长期追求；活动写规律与条件。每段信息在时间推进和不同开局中均能成立。本局地点、动作进度和玩家关系由游玩档案记录。命名贴合本土文化；性格包含相互牵制的欲望与软肋，经历说明成因，语言体现个人习惯。章节及字段保持纯文字，例句直接写对白。输出内容用于作者审核和长期参考。
${kind==='character'?characterTemplate:planeTemplate}`},
  {role:'user' as const,content:JSON.stringify({名称:name.trim()||'自行拟定',构想:concept.trim()||'自由创作一份有生活感、有独特矛盾且能展开互动的设定',已选属性:choices,参考世界:state?._时空.位面目录[state._时空.当前地点.位面ID]?.名称,参考设定:references})}
 ];
}
export function exportLibrary(entry:LibraryEntry) {
 return '# '+entry.name+'\n\n'+entry.summary+'\n\n'+entry.content+'\n';
}
