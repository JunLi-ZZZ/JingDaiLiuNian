import {createApp,h,ref} from 'vue';
import {createOpening} from '../../src/opening';
import {createPreviewSession} from './preview-state';
import {applyCommand} from '../../src/engine';
import {resolveDossierCard,resolveSceneCard,resolveBattleCard,battleToken} from '../../src/output-cards';
import {CharacterDossierSchema} from '../../src/schema';
import type {Operation} from '../../src/schema';
import { displayGrades } from '../../src/grades';
import GradeBadge from './GradeBadge.vue';
import DossierCard from './DossierCard.vue';
import BattleCard from './BattleCard.vue';
import SceneCard from './SceneCard.vue';
import Workshop from './Workshop.vue';
import './page.css';
const origin=createOpening({mode:'默认'},'card-preview');
let session=createPreviewSession();
const run=(id:string,op:Operation)=>{session=applyCommand(session,{...op,id,branchId:session.stat_data._结算.分支ID,expectedVersion:session.stat_data._结算.状态版本},()=>.76).session;};
run('example-hit',{kind:'strike',actorId:'beast',targetId:'player',abilityId:'arc'});
const dead=session;
const gain=resolveDossierCard(dead.stat_data,'gain','adapt-player-electric');
const battle=resolveBattleCard(dead,battleToken(dead,'example-hit'));
run('rest',{kind:'advance',seconds:600});run('return',{kind:'revive'});
run('check',{kind:'check',actorId:'player',abilityId:'adapt-player-electric',task:'辨认残镜里的断路',difficulty:15});
run('travel',{kind:'travel',planeId:'glass-sea',name:'琉潮群岛',description:'海在月缺时凝成透明的陆地。整座港口的日程，系在一条越来越不可靠的潮刻表上。',locationId:'sand-port',location:'鸣砂港 · 回收中的浮桥',route:'归泊庭潮镜 → 无声灯塔镜台',rate:1});
session.stat_data.叙事.人物档案['tide-ferryman']=CharacterDossierSchema.parse({名称:'闻潮',别名:['渡潮人'],位面ID:'harbor',在场:true,身份:'渡潮人 · 镜路修补匠',外貌:'墨绿长衫的袖口沾着抛光粉，灰绿眼睛看人时很专注。左手虎口的旧疤被一根银线轻轻绕过。',性格:'温和但固执',动机:'寻找旧航路',说话方式:'先问细节',已知信息:'旧航路',关系经历:'答应修补一面映出熄灯灯塔的残镜。',近况:'她把那封未寄出的回信，重新压回航图底下。',性别:'女',年龄:'实际四十六岁，外表约三十岁',种族:'人类',来源世界:'琉潮群岛'});
run('register-ferryman',{kind:'register',entityId:'tide-ferryman',name:'闻潮',category:'人物',life:120,energy:80,attack:24,defense:18,hit:.95,dodge:.12,critical:.1,criticalMultiplier:1.5,resistance:{},evidence:'长期修镜和航路工作，受过船员自卫训练'});
const item=Object.entries(session.stat_data._物品).find(([,item])=>item.所在.类型==='实体' && item.所在.ID==='player');
const task=Object.keys(session.stat_data._任务)[0];
const tab=ref('传承');
const dossier=(kind:string,id:string,source=session)=>h(DossierCard,{card:resolveDossierCard(source.stat_data,kind,id)});
const scene=(kind:string,id:string,source=session)=>h(SceneCard,{card:resolveSceneCard(source,kind,id)});
const prose=(text:string)=>h('p',{class:'gallery-prose'},text);
createApp({render:()=>h('main',{class:'card-gallery'},[
 h('header',{class:'gallery-heading'},[h('span','余 烬 之 后 / 正 文 札 记'),h('h1','故事留下的，岂止一行数值。'),h('p','点击分类查看实际卡片。每张记录均来自演示存档与结算。')]),
 h('nav',{class:'gallery-tabs','aria-label':'卡片分类'},['传承','交锋','检定','归泊','人物与物品','旅途','本质序列','设定工坊'].map(name=>h('button',{'aria-pressed':tab.value===name,onClick:()=>tab.value=name},name))),
 h('section',{class:'gallery-stage'},tab.value==='传承'?[
 prose('断裂电缆的火花沉入浅水。归泊庭中的身体重新凝聚时，掌心浮起一缕安静的蓝光。'),h(DossierCard,{card:gain}),scene('growth','adapt-player-electric'),
 ]:tab.value==='交锋'?[
 prose('巡雷兽压低弯角。电弧沿湿润地面爬来，先于雷声击中了尚未来得及撤开的身体。'),h(BattleCard,{card:battle}),scene('snapshot','current',dead),
 ]:tab.value==='检定'?[
 prose('残镜里的光一明一暗。艾斯特瑞亚辨认出了一段可供接入的电流，是否能找到断路，仍需一次尝试。'),scene('check','check'),
 ]:tab.value==='归泊'?[
 prose('喧嚣在一瞬间远去。悬空石阶上，一枚尚未熄灭的余烬在界膜的微光中重聚。'),scene('death','example-hit',dead),dossier('gain','origin-rebirth',origin),
 ]:tab.value==='人物与物品'?[
 dossier('character','player'),dossier('character','tide-ferryman'),item?dossier('item',item[0]):null,task?scene('quest',task):null,
 ]:tab.value==='旅途'?[
 prose('镜面接通的那端，一座港口正赶在海水凝固之前收回浮桥。'),scene('travel','travel'),
 ]:tab.value==='本质序列'?[
 h('div',{class:'grade-showcase'},displayGrades.map(grade=>h('section',[grade==='原初本源'?h('p',{class:'gallery-prose'},'特殊序列 · 独立于七阶'):null,h(GradeBadge,{grade}),h(DossierCard,{card:{...gain,grade,metrics:gain.metrics?.map(m=>m.label==='本质序列'?{...m,value:grade}:m),title:grade==='原初本源'?'虚海本源':'远行者的技艺'}}),h(DossierCard,{card:{type:'item',title:grade==='原初本源'?'原初本源 · 形态展台':'旅途的信物',kind:'物品',grade,subtitle:'藏品 · 1件',description:'随旅途留下的记忆与痕迹。',detail:''}})])))
 ]:[h(Workshop,{state:session.stat_data,preview:true,standalone:true})])
])}).mount('#app');
