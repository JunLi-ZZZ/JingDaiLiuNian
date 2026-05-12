(async function() {
'use strict';

var PLUGIN_ID = 'battle-sim';
var P = 'bts';
var API_KEY = 'dlgd_api_config';
var PRESET_KEY = 'bts_presets_v5';

var TARGET_IDS = ['斗罗大陆','斗罗','Douluo','douluo','Soul Land','武魂殿','唐三','史莱克','魂导通讯器'];

var PHASE_NAMES = {opening:'开场',clash:'交锋',stalemate:'僵持',crisis:'危机',turning:'转折',decisive:'决胜'};
var PHASE_ORDER = ['opening','clash','stalemate','crisis','turning','decisive'];
var TACTICS = ['全力进攻','稳扎稳打','防御反击','集火目标','分散牵制','边打边退','拖延时间'];
var ROLE_CMDS = {'强攻':['全力输出','牵制敌人','保存体力'],'控制':['控住敌人','大范围控场','限制移动'],'敏攻':['侧翼突击','游走找破绽','背后偷袭'],'防御':['保护队友','正面扛伤','格挡'],'辅助':['增幅某人','全体增幅','保存魂力'],'食物':['制作恢复道具','给某人回复','待命']};
var COMMON_CMDS = ['自由发挥','配合我','集火目标','防御','撤退'];
var RING_COLORS = {'白':'w','黄':'y','紫':'p','黑':'k','红':'r'};

var G = createGameState();
function createGameState() {
  return {
    scene:'', allies:[], enemies:[], fusions:[],
    tactic:'稳扎稳打', phase:'opening', step:0,
    history:[], keyEvents:[], situation:'', hint:'',
    queue:[], target:0, batchMode:true,
    teamCmds:{}, ended:false, pendingData:null,
    currentGenId:0, intentCounter:0,
    allyAlive:0, enemyAlive:0
  };
}
function resetGameState() { G = createGameState(); return G; }

function createAlly(raw) {
  return {
    name:raw.name||'', level:raw.level||1, levelDisplay:raw.levelDisplay||'Lv.1',
    wuhun:raw.wuhun||'', attr:raw.attr||'', role:raw.role||'',
    style:raw.style||'', state:raw.state||'状态良好',
    skills:raw.skills||[], bones:raw.bones||[],
    side:'ally', alive:true, isBeast:false
  };
}
function createEnemy(raw) {
  return {
    name:raw.name||'', level:raw.level||0, levelDisplay:raw.levelDisplay||'',
    wuhun:raw.wuhun||'', attr:raw.attr||'', side:'enemy',
    isBeast:raw.isBeast||false, yearLimit:raw.yearLimit||'',
    beastType:raw.beastType||'', imp:raw.imp||false,
    trait:raw.trait||'', skills:raw.skills||[], bones:raw.bones||[],
    alive:true
  };
}

/* === 工具 === */
function log(msg, d) { if (d !== undefined) console.log('[战斗模拟器] ' + msg, d); else console.log('[战斗模拟器] ' + msg); }
function toast(msg, type) { try { if (type==='err') toastr.error(msg); else if (type==='warn') toastr.warning(msg); else if (type==='info') toastr.info(msg); else toastr.success(msg); } catch(e) { log(msg); } }
function getDoc() { try { return window.top ? window.top.document : document; } catch(e) { return document; } }
function qs(sel, ctx) { return (ctx||getDoc()).querySelector(sel); }
function qa(sel, ctx) { return Array.from((ctx||getDoc()).querySelectorAll(sel)); }
function esc(s) { var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

function getSTContext() {
  try { var win = window.top||window; return (win.SillyTavern && win.SillyTavern.getContext) ? win.SillyTavern.getContext() : null; } catch(e) { return null; }
}
function isTargetCard() {
  var ctx = getSTContext(); if (!ctx) return false;
  var cn = ctx.name2||'', cd = ctx.characterDescription||'', gid = ctx.groupId||'';
  if (!cn && !gid) return false;
  if (ctx.groups && gid) { var g = ctx.groups.find(function(x){return x.id===gid;}); if (g && g.name) { for (var i=0;i<TARGET_IDS.length;i++) { if (g.name.includes(TARGET_IDS[i])) return true; } } }
  for (var i=0;i<TARGET_IDS.length;i++) { if (cn.includes(TARGET_IDS[i])||cd.includes(TARGET_IDS[i])) return true; }
  return false;
}
function getCharName() { var ctx=getSTContext(); return ctx?(ctx.name2||''):''; }
function getChatId() { var ctx=getSTContext(); return ctx?(ctx.chatId||'default'):'default'; }

/* === 生命周期 === */
function destroyPlugin() {
  log('销毁'); window.__btsActive = false;
  var doc = getDoc();
  qa('#'+P+'-trigger,#'+P+'-overlay,#'+P+'-styles', doc).forEach(function(el){el.remove();});
  if (doc!==document) { try { qa('#'+P+'-trigger,#'+P+'-overlay,#'+P+'-styles', document).forEach(function(el){el.remove();}); } catch(e){} }
  try {
    var win=window.top||window;
    if (win.eventSource && win.event_types) {
      if (window.__btsChatH) { try{win.eventSource.removeListener(win.event_types.CHAT_CHANGED,window.__btsChatH);}catch(e){} window.__btsChatH=null; }
      if (window.__btsMsgH) { try{win.eventSource.removeListener(win.event_types.CHARACTER_MESSAGE_RENDERED,window.__btsMsgH);}catch(e){} window.__btsMsgH=null; }
    }
  } catch(e){}
  if (window.__btsPoll) { clearInterval(window.__btsPoll); window.__btsPoll=null; }
  G = createGameState();
}
window.removeEventListener('pagehide', destroyPlugin);
window.addEventListener('pagehide', destroyPlugin);

function setupTriggerSystem() {
  if (window.__btsPoll) { clearInterval(window.__btsPoll); window.__btsPoll=null; }
  var lastChar=getCharName(), lastChat=getChatId();
  window.__btsPoll = setInterval(function(){ var cn=getCharName(),ci=getChatId(); if(cn!==lastChar||ci!==lastChat){lastChar=cn;lastChat=ci;handleChatChange();} checkLatestMessage(); }, 2000);
  try {
    var win=window.top||window;
    if (win.eventSource && win.event_types) {
      if (window.__btsChatH) try{win.eventSource.removeListener(win.event_types.CHAT_CHANGED,window.__btsChatH);}catch(e){}
      if (window.__btsMsgH) try{win.eventSource.removeListener(win.event_types.CHARACTER_MESSAGE_RENDERED,window.__btsMsgH);}catch(e){}
      window.__btsChatH = function(){setTimeout(handleChatChange,300);};
      win.eventSource.on(win.event_types.CHAT_CHANGED, window.__btsChatH);
      window.__btsMsgH = function(){setTimeout(checkLatestMessage,500);};
      win.eventSource.on(win.event_types.CHARACTER_MESSAGE_RENDERED, window.__btsMsgH);
    }
  } catch(e){}
}
function handleChatChange() { var isT=isTargetCard(),isA=window.__btsActive===true; if(isT&&!isA) setTimeout(initPlugin,400); else if(!isT&&isA) destroyPlugin(); }
function activateTrigger() { var btn=qs('#'+P+'-trigger'); if(btn) btn.classList.add('active'); }
function deactivateTrigger() { var btn=qs('#'+P+'-trigger'); if(btn) btn.classList.remove('active'); }

/* === API === */
function getApiConfig() { try { var s=localStorage.getItem(API_KEY); if(s) return JSON.parse(s); } catch(e){} return {apiUrl:'',apiKey:'',model:'',savedModels:[]}; }
function normalizeUrl(url) { var u=url.trim().replace(/\/+$/,''); u=u.replace(/\/v1\/chat\/completions\/?$/,'').replace(/\/v1\/models\/?$/,'').replace(/\/v1\/?$/,''); return u; }

async function callAI(userPrompt, maxTokens) {
  var cfg=getApiConfig(); if(!cfg.apiUrl||!cfg.model) throw new Error('API未配置，请在魂导通讯器中配置');
  var preset=getActivePreset(); var sysPrompt=buildSystemPrompt(preset);
  maxTokens = maxTokens || parseInt(preset.maxTokens) || 2048;
  G.currentGenId++; var myId=G.currentGenId;
  try {
    var win=window.top||window;
    if (typeof win.generateRaw==='function') {
      var gc={should_silence:true,should_stream:false,ordered_prompts:[{role:'system',content:sysPrompt},{role:'user',content:userPrompt}],custom_api:{temperature:getPresetTemp(),max_tokens:maxTokens}};
      var result=await win.generateRaw(gc);
      if(myId!==G.currentGenId) return null;
      return result;
    }
  } catch(e){ log('generateRaw失败',e); }
  var baseUrl=normalizeUrl(cfg.apiUrl); var headers={'Content-Type':'application/json'};
  if(cfg.apiKey) headers['Authorization']='Bearer '+cfg.apiKey;
  var controller=new AbortController(); var timeout=setTimeout(function(){controller.abort();},60000);
  try {
    var res=await fetch(baseUrl+'/v1/chat/completions',{method:'POST',headers:headers,body:JSON.stringify({model:cfg.model,messages:[{role:'system',content:sysPrompt},{role:'user',content:userPrompt}],temperature:getPresetTemp(),max_tokens:maxTokens}),signal:controller.signal});
    clearTimeout(timeout);
    if(!res.ok){var msg='API错误:'+res.status;try{var e=await res.json();if(e.error&&e.error.message)msg+=' '+e.error.message;}catch(ex){}throw new Error(msg);}
    var data=await res.json(); if(myId!==G.currentGenId) return null;
    return (data.choices&&data.choices[0]&&data.choices[0].message)?data.choices[0].message.content:null;
  } catch(e){ clearTimeout(timeout); if(e.name==='AbortError') throw new Error('请求超时(60s)'); throw e; }
}
function getPresetTemp() { var p=getActivePreset(); var t=parseFloat(p.temperature); return(!isNaN(t)&&t>=0.1&&t<=1.5)?t:0.75; }

/* ========== 预设系统（v5.1 优化） ========== */
var DEFAULT_PRESET = {
  id:'default_v5', name:'默认预设v5.1', author:'秋青子', version:'5.1',
  desc:'战斗模拟器优化预设 - 融入战斗描写指南', temperature:0.75, maxTokens:2048,

  cotTemplate: '以下检查在你内部执行，回复中不输出检查过程。回复直接从[叙述]标签开始。\n\n'
    + '1. 实力差距：\n'
    + '   - 双方等级/年限差多少？\n'
    + '   - 差10级以内=势均力敌，来回拉锯\n'
    + '   - 差10-20级=一方明显占优，弱方必须靠技巧和地形\n'
    + '   - 差20级以上=碾压，弱方每多撑一秒都是奇迹\n'
    + '   - 魂兽按年限：百年<千年<万年，跨档差距巨大\n'
    + '   - 碾压局不能写成拉锯战\n\n'
    + '2. 魂技消耗追踪：\n'
    + '   - 这是第几段？双方到现在用了哪些技能？\n'
    + '   - 消耗比例：第1技=1份，第4技=4-5份，第7技=持续消耗，第9技=15-20份\n'
    + '   - 累计消耗50%以上：技能威力下降，释放变慢，开始喘气\n'
    + '   - 累计消耗80%以上：高序号技能无法使用，身体明显疲劳\n'
    + '   - 玩家对弱敌用大招=浪费，开场用终极技=后面没魂力\n\n'
    + '3. 角色是活人：\n'
    + '   - 读战斗风格描述，按描述来写\n'
    + '   - 受伤后动作必须变形——断了右臂不能用右手，腿伤速度必须慢\n'
    + '   - 战斗反应体现性格：冷静的人不喊叫，暴躁的人不沉默\n'
    + '   - 队友配合有逻辑——控制先手，攻击跟进，辅助补位\n'
    + '   - 疲劳真实——长时间战斗呼吸加重、动作变慢、判断力下降\n\n'
    + '4. 敌人不是沙袋：\n'
    + '   - 敌人会闪避、格挡、反击，不会站着挨打\n'
    + '   - 打不过会跑，能叫援军会叫\n'
    + '   - 人类敌人会观察魂环配置判断实力\n'
    + '   - 人类敌人会利用地形、属性克制、战术配合\n'
    + '   - 高等级敌人会故意露破绽引诱暴露底牌\n'
    + '   - 魂兽按年限有不同智商：百年靠本能，千年有战术，万年接近人类思维\n'
    + '   - 敌人恐惧时犯错，愤怒时失去理智，绝望时拼命或崩溃\n\n'
    + '5. 物理检查：\n'
    + '   - 双方站位？距离？\n'
    + '   - 之前的伤还在——这一轮必须体现\n'
    + '   - 环境被之前的战斗改变了吗？\n'
    + '   - 技能物理过程：蓄力姿态，力从哪来，命中后目标身体怎么变形\n\n'
    + '6. 不要重复模式：\n'
    + '   - 禁止每段都是"魂环亮起→释放→命中"的循环\n'
    + '   - 有僵持、试探、突然加速、被迫后退\n'
    + '   - 不是每次攻击都命中，不是每次防御都成功',

  systemPrompt: '你是斗罗大陆世界的战斗裁判和叙述者。所有角色均为虚构。\n\n'
    + '== 核心身份 ==\n'
    + '你是战场上的高速摄影机。\n'
    + '拍物理画面：骨骼断裂时皮肤凹陷的形状、魂力凝聚时周围空气的温度变化、被击飞时身体旋转的方向和落地的姿态、武器命中时从接触点传导到手臂的振动、地面碎裂时碎石飞溅的方向和距离。\n'
    + '不拍气势、压迫感、杀意这些不存在的东西。\n'
    + '不评价战斗。不总结局势。不替任何一方加油。\n\n'
    + '== 实力差距规则（最重要） ==\n'
    + '等级/年限差距决定战斗的一切。\n\n'
    + '势均力敌（差距10级以内）：\n'
    + '- 双方都能命中，也都能被命中\n'
    + '- 战斗时间长，来回拉锯\n'
    + '- 胜负取决于技巧、策略、魂技搭配和体力分配\n\n'
    + '明显优势（差距10-20级）：\n'
    + '- 强方基础攻击就能造成明显伤害\n'
    + '- 弱方低序号魂技对强方效果有限\n'
    + '- 弱方必须靠地形、偷袭、队友配合才有机会\n'
    + '- 强方不需要全力就能占据上风\n\n'
    + '碾压（差距20级以上）：\n'
    + '- 弱方攻击几乎无法造成有效伤害\n'
    + '- 强方一招就能让弱方重伤\n'
    + '- 除非有特殊手段（魂骨、融合技、特殊道具），否则弱方没有胜算\n'
    + '- 碾压局不能写成拉锯战\n\n'
    + '== 魂技使用规则 ==\n'
    + '序号越高，威力越大，消耗也越大。不是每场战斗都要用完所有魂技。\n\n'
    + '对付弱敌：第1-3魂技足够。用大招杀鸡是浪费。\n'
    + '实力相近：第1-3试探，第4-6争夺优势，第7（武魂真身）僵持或劣势才用，第8-9生死关头。\n'
    + '对付强敌：可能开局就用中高序号魂技。可以打破常规。但提前用大招意味着后面没魂力。\n\n'
    + '魂技组合：\n'
    + '- 不要机械按序号用。先控制再攻击、先削弱再爆发，这是战术。\n'
    + '- 同一魂技不能连续无间隔使用，有冷却。\n'
    + '- 维持型魂技（武魂真身、控制类）每秒都在烧魂力。\n\n'
    + '== 魂力消耗体系 ==\n'
    + '- 第1技消耗1份，第4技约4-5份，第7技持续消耗，第9技约15-20份\n'
    + '- 战斗初期：魂技释放流畅，动作敏捷\n'
    + '- 战斗中期：开始省着用，避免浪费\n'
    + '- 战斗后期：魂力不足时技能威力下降、释放变慢、身体疲劳\n'
    + '- 魂力耗尽：只剩肉体战斗力，武魂可能被迫收回\n\n'
    + '== 敌人行为逻辑 ==\n'
    + '敌人不是沙袋。禁止敌人站着挨打。禁止敌人只会正面硬抗。\n\n'
    + '人类敌人：\n'
    + '- 观察魂环配置判断实力\n'
    + '- 利用地形（高处、遮蔽、窄道）\n'
    + '- 劣势时撤退或求援，优势时追击\n'
    + '- 针对属性克制制定策略\n'
    + '- 高手故意露破绽引诱暴露底牌\n'
    + '- 团队敌人有配合——前排扛伤后排输出\n\n'
    + '魂兽敌人：\n'
    + '- 百年以下：本能战斗，模式单一\n'
    + '- 百年至千年：有基本策略，利用环境\n'
    + '- 千年以上：有战斗智慧，声东击西、佯攻\n'
    + '- 万年以上：接近人类战术思维，会评估对手决定战或退\n\n'
    + '== 文风铁律 ==\n'
    + '1. 白描。写发生了什么，不写看起来像什么\n'
    + '2. 动作精确：写哪只手、打哪个部位、移动了多远\n'
    + '3. 结果具体：骨折、淤青、流血、被弹开——写清楚\n'
    + '4. 声音写质感：骨头断裂的脆响、金属碰撞的嗡鸣、身体砸地的闷响\n'
    + '5. 技能三拍子：蓄力→释放→命中或被挡，三步不少于三句\n'
    + '6. 空间感：每段至少一次位置描写\n'
    + '7. 短句推进：动作描写5-12字短句\n'
    + '8. 伤势累积：之前的伤必须影响后续动作\n'
    + '9. 疼痛真实：被打中会疼，长时间战斗会喘，受伤后动作变慢\n'
    + '10. 环境互动：战斗破坏环境——树断、地裂、墙碎要体现\n\n'
    + '战斗中的对话：\n'
    + '- 短句，不超过6字\n'
    + '- 喘气时说话断断续续\n'
    + '- 对话体现角色性格——冷静的人简洁，暴躁的人骂人，谨慎的人不说话\n'
    + '- 不说废话，不念台词，不做战前演讲\n\n'
    + '== 战斗节奏 ==\n'
    + '不是每段都一样的烈度。\n'
    + '- 开场：试探，低消耗手段摸底，节奏缓\n'
    + '- 交锋：中序号魂技登场，攻防交换，找破绽，最长阶段\n'
    + '- 危机/转折：大招或意外，烈度急剧上升\n'
    + '- 决胜：胜负将分，短暂但危险\n\n'
    + '碾压局节奏不同——可能一个回合结束。\n'
    + '切磋不进入爆发阶段。伏击跳过试探直接爆发。',

  bannedWords: '似乎,仿佛,如同,宛如,几乎,隐约,极度,无比,嘴角上扬,眼里闪过,指尖泛白,睫毛轻颤,瞳孔骤缩,不自觉地,下意识地,不容小觑,势不可挡,摧枯拉朽,排山倒海,战意盎然,杀气腾腾,千钧一发,电光火石,身形一闪,化作残影,快如闪电,然而下一刻,话音未落,重重摔在,应声而碎,更胜一筹,实力悬殊,紧接着,下一秒,刹那间,恐惧,愤怒,震惊,绝望,带着XX口吻,用XX语气,令人胆寒,磅礴气势,恐怖压迫感,窒息威压,璀璨,浩瀚,凌厉,凝重,骇然,战意,杀意,锋芒,如潮水般,如山岳般,一道身影,残影,破空之声,撕裂虚空,毁天灭地,摧毁一切,无坚不摧,所向披靡,战斗本能,危险直觉,身体本能,强者之间,不是A而是B,与其说A不如说B',

  outputFormat: '[叙述]\n'
    + '（8-12句战斗描写。写物理画面：动作、位置、距离、伤势、声音、环境变化。\n'
    + '角色的行为必须符合TA的战斗风格描述。\n'
    + '受伤的角色动作必须变形。\n'
    + '魂力消耗多的角色技能释放必须变慢。\n'
    + '敌人必须有主动行为——闪避、反击、利用地形，不能只挨打。\n'
    + '关键技能释放写10-15句，包含完整的蓄力→释放→命中三拍子。）\n'
    + '[/叙述]\n\n'
    + '[对话]\n'
    + '（战斗台词。短句3-6字。体现角色性格。喘气时断句。\n'
    + '没有合适台词就写「无」。不要为了有台词而硬编。）\n'
    + '[/对话]\n\n'
    + '{teammates}\n\n'
    + '[战况]\n'
    + '（每个存活角色一行：\n'
    + '名字 | 伤势（具体部位+程度） | 魂力剩余（百分比估算） | 当前位置\n'
    + '已被击败的角色标注击败原因。）\n'
    + '[/战况]\n\n'
    + '[提示]\n'
    + '（用战场上可观察的现象暗示接下来可能发生什么。1-2句。\n'
    + '写玩家角色能看到的东西，不写全知视角。）\n'
    + '[/提示]\n\n'
    + '[敌人意图|类型|具体内容]\n'
    + '类型：无、蓄力大招、准备逃跑、喊话挑衅、弱点暴露、召唤援军、利用地形、属性克制\n\n'
    + '{allyCall}\n\n'
    + '[战斗阶段|阶段词]\n'
    + '阶段词：开场、交锋、僵持、危机、转折、决胜\n\n'
    + '[判断|继续] 或 [判断|建议结束|理由]\n'
    + '[结果|胜利或战败或平局]（仅在判断为建议结束时输出）'
};

function loadPresets() { try { var s=localStorage.getItem(PRESET_KEY); if(s){var d=JSON.parse(s); if(!d.presets.find(function(p){return p.id==='default_v5';})) d.presets.unshift(JSON.parse(JSON.stringify(DEFAULT_PRESET))); return d;} } catch(e){} return {presets:[JSON.parse(JSON.stringify(DEFAULT_PRESET))],activeId:'default_v5'}; }
function savePresets(data) { try{localStorage.setItem(PRESET_KEY,JSON.stringify(data));}catch(e){} }
function getActivePreset() { var data=loadPresets(); return data.presets.find(function(p){return p.id===data.activeId;})||data.presets[0]||JSON.parse(JSON.stringify(DEFAULT_PRESET)); }
function setActivePreset(id) { var data=loadPresets(); if(data.presets.find(function(p){return p.id===id;})){data.activeId=id;savePresets(data);} }
function savePreset(preset) { var data=loadPresets(); var idx=data.presets.findIndex(function(p){return p.id===preset.id;}); if(idx>=0) data.presets[idx]=preset; else data.presets.push(preset); savePresets(data); }
function deletePreset(id) { if(id==='default_v5') return false; var data=loadPresets(); data.presets=data.presets.filter(function(p){return p.id!==id;}); if(data.activeId===id) data.activeId='default_v5'; savePresets(data); return true; }
function exportPreset(preset) { var json=JSON.stringify(preset,null,2); var blob=new Blob([json],{type:'application/json'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='bts_preset_'+preset.name+'.json'; a.click(); URL.revokeObjectURL(url); }
function importPresetFromFile(file) { return new Promise(function(resolve,reject){ var reader=new FileReader(); reader.onload=function(e){ try{ var preset=JSON.parse(e.target.result); if(!preset.systemPrompt){reject(new Error('无效的预设文件'));return;} preset.id='imported_'+Date.now(); if(!preset.name) preset.name='导入的预设'; savePreset(preset); resolve(preset); }catch(err){reject(err);} }; reader.onerror=function(){reject(new Error('读取文件失败'));}; reader.readAsText(file); }); }

function buildSystemPrompt(preset) {
  var sys = '';
  if (preset.cotTemplate) sys += preset.cotTemplate + '\n\n';
  sys += (preset.systemPrompt||'') + '\n\n';
  if (G.phase) sys += '当前战斗阶段：' + (PHASE_NAMES[G.phase]||G.phase) + '，第' + G.step + '段。\n';
  if (preset.bannedWords) {
    var words = (typeof preset.bannedWords==='string') ? preset.bannedWords : preset.bannedWords.join(',');
    if (words) sys += '\n== 禁止词汇 ==\n' + words + '\n禁止句式：不是A而是B、与其说A不如说B\n禁止标签：<think>、<thinking>、<content>\n';
  }
  return sys;
}

/* ========== 数据解析（v5.1 增强） ========== */
function parseBattleData(content) {
  var r = {scene:'', allies:[], enemies:[], fusions:[]};

  // === 数据清洗 ===
  content = content.replace(/｜/g, '|').replace(/【/g, '[').replace(/】/g, ']');
  content = content.replace(/\s*\|\s*/g, '|');
  content = content.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');

  log('清洗后数据预览:', content.substring(0, 300));

  var sm = content.match(/\[战斗场景\|([^\]]+)\]/); if(sm) r.scene=sm[1].trim();
  var fmR = /\[融合技\|([^|]+)\|([^|]+)\|([^\]]+)\]/g, fm;
  while ((fm=fmR.exec(content))!==null) r.fusions.push({who:fm[1].trim(),name:fm[2].trim(),desc:fm[3].trim()});

  var lines=content.split('\n'); var cur=null, side=null;
  for (var i=0;i<lines.length;i++) {
    var ln=lines[i].trim(); if(!ln) continue;
    ln = ln.replace(/\s*\|\s*/g, '|');

    var am=ln.match(/^\[己方\|([^|]+)\|(\d+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/);
    if (am) {
      if(cur&&side==='a') r.allies.push(createAlly(cur));
      if(cur&&side==='e') r.enemies.push(createEnemy(cur));
      cur={name:am[1].trim(),level:+am[2]||1,levelDisplay:'Lv.'+am[2],wuhun:am[3].trim(),attr:am[4].trim(),role:am[5].trim(),skills:[],bones:[],style:'',state:'状态良好'};
      side='a'; log('解析己方:', cur.name); continue;
    }

    var em=ln.match(/^\[敌人\|([^|]+)\|(\d+)\|([^|]*)\|([^|]*)\|([^\]]+)\]/);
    if (em) {
      if(cur&&side==='a') r.allies.push(createAlly(cur));
      if(cur&&side==='e') r.enemies.push(createEnemy(cur));
      cur={name:em[1].trim(),level:+em[2]||1,levelDisplay:'Lv.'+em[2],wuhun:em[3].trim()||'无',attr:em[4].trim()||'无',isBeast:false,imp:em[5].trim()==='重要',skills:[],bones:[],trait:''};
      side='e'; log('解析敌人:', cur.name); continue;
    }

    var bm=ln.match(/^\[魂兽\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)\|([^\]]+)\]/);
    if (bm) {
      if(cur&&side==='a') r.allies.push(createAlly(cur));
      if(cur&&side==='e') r.enemies.push(createEnemy(cur));
      cur={name:bm[1].trim(),level:0,levelDisplay:bm[2].trim(),wuhun:bm[3].trim()||'魂兽',attr:bm[4].trim()||'无',isBeast:true,yearLimit:bm[2].trim(),beastType:bm[3].trim()||'魂兽',imp:bm[5].trim()==='重要',skills:[],bones:[],trait:''};
      side='e'; log('解析魂兽:', cur.name); continue;
    }

    var stm=ln.match(/^\[战斗风格\|([^\]]+)\]/); if(stm&&cur){cur.style=stm[1].trim();continue;}
    var stam=ln.match(/^\[状态\|([^\]]+)\]/); if(stam&&cur){cur.state=stam[1].trim();continue;}
    var trm=ln.match(/^\[战斗特点\|([^\]]+)\]/); if(trm&&cur){cur.trait=trm[1].trim();continue;}

    // === 魂环解析（4段） ===
    var rm=ln.match(/^\[魂环\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/);
    if(rm&&cur){
      cur.skills.push({name:rm[3].trim(),color:rm[2].trim(),desc:rm[4].trim(),src:'ring',ring:rm[1].trim()});
      log('  解析魂环:', rm[3].trim(), '→ skills数量:', cur.skills.length);
      continue;
    }
    // === 魂环解析（3段，无效果） ===
    var rm2=ln.match(/^\[魂环\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);
    if(rm2&&cur&&!rm){
      cur.skills.push({name:rm2[3].trim(),color:rm2[2].trim(),desc:'',src:'ring',ring:rm2[1].trim()});
      log('  解析魂环(无效果):', rm2[3].trim());
      continue;
    }

    // === 魂环暴力拆分兜底 ===
    if(ln.indexOf('[魂环')===0 && cur){
      log('⚠ 魂环行未匹配正则:', ln);
      var parts = ln.replace(/^\[/, '').replace(/\].*$/, '').split('|');
      if(parts.length >= 4){
        cur.skills.push({name:(parts[3]||'').trim(), color:(parts[2]||'').trim(), desc:(parts[4]||'').trim(), src:'ring', ring:(parts[1]||'').trim()});
        log('  暴力解析成功:', (parts[3]||'').trim());
      } else if(parts.length >= 3){
        cur.skills.push({name:(parts[2]||parts[1]||'').trim(), color:(parts[1]||'').trim(), desc:'', src:'ring', ring:(parts[1]||'').trim()});
        log('  暴力解析(最小):', (parts[2]||'').trim());
      }
      continue;
    }

    // === 魂骨解析 ===
    var bom=ln.match(/^\[魂骨\|([^|]+)\|([^|]+)\|([^\]]+)\]/);
    if(bom&&cur){cur.bones.push({part:bom[1].trim(),name:bom[2].trim(),desc:bom[3].trim()});cur.skills.push({name:bom[2].trim(),color:'骨',desc:bom[3].trim(),src:'bone',ring:bom[1].trim()});log('  解析魂骨:', bom[2].trim());continue;}
    var bom2=ln.match(/^\[魂骨\|([^|]+)\|([^\]]+)\]$/);
    if(bom2&&cur&&!bom){cur.bones.push({part:bom2[1].trim(),name:bom2[2].trim(),desc:''});cur.skills.push({name:bom2[2].trim(),color:'骨',desc:'',src:'bone',ring:bom2[1].trim()});continue;}

    // === 魂骨暴力拆分兜底 ===
    if(ln.indexOf('[魂骨')===0 && cur){
      log('⚠ 魂骨行未匹配正则:', ln);
      var bparts = ln.replace(/^\[/, '').replace(/\].*$/, '').split('|');
      if(bparts.length >= 3){
        cur.bones.push({part:(bparts[1]||'').trim(),name:(bparts[2]||'').trim(),desc:(bparts[3]||'').trim()});
        cur.skills.push({name:(bparts[2]||'').trim(),color:'骨',desc:(bparts[3]||'').trim(),src:'bone',ring:(bparts[1]||'').trim()});
        log('  暴力解析成功:', (bparts[2]||'').trim());
      }
      continue;
    }

    // === 技能解析 ===
    var skm=ln.match(/^\[技能\|([^|]+)\|([^\]]+)\]/);
    if(skm&&cur){cur.skills.push({name:skm[1].trim(),color:'',desc:skm[2].trim(),src:'skill',ring:''});log('  解析技能:', skm[1].trim());continue;}

    // === 技能暴力拆分兜底 ===
    if(ln.indexOf('[技能')===0 && cur){
      log('⚠ 技能行未匹配正则:', ln);
      var sparts = ln.replace(/^\[/, '').replace(/\].*$/, '').split('|');
      if(sparts.length >= 3){
        cur.skills.push({name:(sparts[1]||'').trim(),color:'',desc:(sparts[2]||'').trim(),src:'skill',ring:''});
        log('  暴力解析成功:', (sparts[1]||'').trim());
      }
      continue;
    }
  }
  if(cur&&side==='a') r.allies.push(createAlly(cur));
  if(cur&&side==='e') r.enemies.push(createEnemy(cur));

  // === 解析结果汇总 ===
  log('=== 解析结果汇总 ===');
  r.allies.forEach(function(a){ log('己方 ' + a.name + ': skills=' + a.skills.length + ', bones=' + a.bones.length); a.skills.forEach(function(s){ log('    [' + s.src + '] ' + s.name); }); });
  r.enemies.forEach(function(e){ log('敌方 ' + e.name + ': skills=' + e.skills.length + (e.isBeast ? ' (魂兽 '+e.yearLimit+')' : ' (Lv.'+e.level+')')); });

  return (r.allies.length>0&&r.enemies.length>0)?r:null;
}

function checkLatestMessage() {
  var ctx=getSTContext(); if(!ctx||!ctx.chat||!ctx.chat.length) return;
  var lastMsg=ctx.chat[ctx.chat.length-1]; if(!lastMsg||lastMsg.is_user) return;
  var text=lastMsg.mes||''; var match=text.match(/<battle_init>([\s\S]*?)<\/battle_init>/);
  if(!match) return;
  var parsed=parseBattleData(match[1]); if(!parsed) return;
  var msgId=lastMsg.send_date||lastMsg.mes_id||text.substring(0,50);
  if(window.__btsLastTriggered===msgId) return;
  window.__btsLastTriggered=msgId;
  G.pendingData=parsed; activateTrigger(); log('检测到战斗数据',parsed);
}

/* === Prompt构建 === */
function charInfoStr(u) {
  if (u.isBeast) return u.name+'（'+u.yearLimit+'魂兽，'+u.beastType+(u.attr&&u.attr!=='无'?'，'+u.attr:'')+'）\n'+(u.trait?'  特点：'+u.trait+'\n':'')+'  技能：'+u.skills.map(function(s){return s.name+(s.desc?'（'+s.desc+'）':'');}).join('、')+'\n';
  else if (u.side==='ally') return u.name+'（Lv.'+u.level+'，'+u.wuhun+'，'+u.role+'）\n  风格：'+u.style+'\n  状态：'+u.state+'\n  魂技：'+u.skills.map(function(s){return s.name+(s.desc?'（'+s.desc+'）':'');}).join('、')+'\n';
  else return u.name+'（'+(u.levelDisplay||'Lv.'+u.level)+(u.wuhun!=='无'?'，'+u.wuhun:'')+'）\n'+(u.trait?'  特点：'+u.trait+'\n':'')+'  技能：'+u.skills.map(function(s){return s.name+(s.desc?'（'+s.desc+'）':'');}).join('、')+'\n';
}

function buildStepPrompt(actions, customHint) {
  var preset=getActivePreset();
  var p='== 战斗场景 ==\n'+G.scene+'\n';
  p+='\n== 己方 ==\n'; G.allies.forEach(function(u){if(!u.alive){p+=u.name+' — 已阵亡\n';return;} p+=charInfoStr(u);});
  p+='\n== 敌方 ==\n'; G.enemies.forEach(function(u){if(!u.alive){p+=u.name+' — 已被击败\n';return;} p+=charInfoStr(u);});
  if(G.fusions.length){p+='\n== 融合技 ==\n';G.fusions.forEach(function(f){p+=f.who+'——'+f.name+'：'+f.desc+'\n';});}
  p+='\n== 玩家行动 ==\n'; var mainChar=G.allies[0];
  if(actions&&actions.length){
    if(actions.length>1) p+=mainChar.name+'使用连招：'+actions.map(function(a){return a.name;}).join(' → ')+'\n连招逻辑：第一招创造条件→后续利用条件→最后打最大伤害\n';
    else p+=mainChar.name+'使用：'+actions[0].name+'\n';
    // === 目标选择（支持全体） ===
    if(G.target===-1){
      p+='目标：全体敌人（AOE范围攻击）\n';
    } else {
      var tgt=G.enemies.filter(function(e){return e.alive;})[G.target];
      if(tgt) p+='目标：'+tgt.name+'\n';
    }
  }
  p+='战术方针：'+G.tactic+'\n';
  if(G.allies.length>1){p+='\n== 队友指令 ==\n';G.allies.forEach(function(u,i){if(i===0)return;if(!u.alive)return;p+=u.name+'：'+(G.teamCmds[u.name]||'自由发挥')+'\n';});}
  if(customHint&&customHint.trim()) p+='\n== 玩家自定义意图 ==\n'+customHint.trim()+'\n';
  if(G.keyEvents.length){p+='\n== 之前发生过 ==\n';G.keyEvents.slice(-10).forEach(function(k){p+='· '+k+'\n';});}
  if(G.situation) p+='\n== 上一轮战况 ==\n'+G.situation+'\n';
  p+='\n== 请输出 ==\n';
  var fmt=preset.outputFormat||DEFAULT_PRESET.outputFormat;
  var hasTeam=G.allies.filter(function(u){return u.alive;}).length>1;
  if(hasTeam){
    var tmBlock='[队友动态]\n'; G.allies.forEach(function(u,i){if(i>0&&u.alive) tmBlock+='[队友|'+u.name+'|（一句话描写）]\n';});
    fmt=fmt.replace('{teammates}',tmBlock); fmt=fmt.replace('{allyCall}','[队友喊话|名字|台词]');
  } else { fmt=fmt.replace('{teammates}',''); fmt=fmt.replace('{allyCall}',''); }
  p+=fmt;
  return p;
}

function buildSkipPrompt() {
  var curIdx=PHASE_ORDER.indexOf(G.phase); var nextPhase=curIdx<PHASE_ORDER.length-1?PHASE_ORDER[curIdx+1]:'decisive';
  var targetName=PHASE_NAMES[nextPhase]||'下一阶段';
  var p='请从当前状态推演到'+targetName+'。\n\n== 场景 ==\n'+G.scene+'\n';
  p+='\n== 己方 ==\n'; G.allies.forEach(function(u){if(!u.alive){p+=u.name+' — 已阵亡\n';return;} p+=charInfoStr(u);});
  p+='\n== 敌方 ==\n'; G.enemies.forEach(function(u){if(!u.alive){p+=u.name+' — 已被击败\n';return;} p+=charInfoStr(u);});
  if(G.keyEvents.length){p+='\n== 已发生 ==\n';G.keyEvents.slice(-8).forEach(function(k){p+='· '+k+'\n';});}
  if(G.situation) p+='\n== 当前战况 ==\n'+G.situation+'\n';
  p+='\n用3-5句概括中间过程，然后从'+targetName+'开始详细描写8-12句。\n\n';
  p+='格式：\n[跳过]\n（概括）\n[/跳过]\n';
  var preset=getActivePreset(); var fmt=preset.outputFormat||DEFAULT_PRESET.outputFormat;
  var hasTeam=G.allies.filter(function(u){return u.alive;}).length>1;
  if(hasTeam){var tmBlock='[队友动态]\n';G.allies.forEach(function(u,i){if(i>0&&u.alive)tmBlock+='[队友|'+u.name+'|（一句话）]\n';});fmt=fmt.replace('{teammates}',tmBlock);fmt=fmt.replace('{allyCall}','[队友喊话|名字|台词]');}
  else{fmt=fmt.replace('{teammates}','');fmt=fmt.replace('{allyCall}','');}
  p+=fmt;
  return p;
}

/* === AI响应解析 === */
function parseStepResponse(text) {
  var r={narr:'',talk:'',teammates:[],situation:'',hint:'',shouldEnd:false,endReason:'',endResult:'',intentType:'无',intentContent:'',allyCallName:'',allyCallLine:'',phase:''};
  var nm=text.match(/\[叙述\]([\s\S]*?)\[\/叙述\]/); r.narr=nm?nm[1].trim():'';
  var tm2=text.match(/\[对话\]([\s\S]*?)\[\/对话\]/); if(tm2){var t=tm2[1].trim();if(t!=='无'&&t)r.talk=t;}
  var tmR=/\[队友\|([^|]+)\|([^\]]+)\]/g,tmm; while((tmm=tmR.exec(text))!==null) r.teammates.push({name:tmm[1].trim(),action:tmm[2].trim()});
  var sm2=text.match(/\[战况\]([\s\S]*?)\[\/战况\]/); r.situation=sm2?sm2[1].trim():'';
  var hm=text.match(/\[提示\]([\s\S]*?)\[\/提示\]/); r.hint=hm?hm[1].trim():'';
  var jm=text.match(/\[判断\|([^\]|]+)(?:\|([^\]]*))?]/); if(jm&&jm[1].trim()!=='继续'){r.shouldEnd=true;r.endReason=jm[2]?jm[2].trim():'';}
  var rsm=text.match(/\[结果\|([^\]]+)\]/); if(rsm) r.endResult=rsm[1].trim();
  var im=text.match(/\[敌人意图\|([^|]*)\|([^\]]*)\]/); if(im){r.intentType=im[1].trim();r.intentContent=im[2].trim();}
  var acm=text.match(/\[队友喊话\|([^|]*)\|([^\]]*)\]/); if(acm){r.allyCallName=acm[1].trim();r.allyCallLine=acm[2].trim();}
  var pm=text.match(/\[战斗阶段\|([^\]]*)\]/); if(pm) r.phase=pm[1].trim();
  if(!r.narr&&text.length>20) r.narr=text.substring(0,1500);
  return r;
}

function mapPhase(s) { if(!s) return ''; if(s.indexOf('开场')>-1) return 'opening'; if(s.indexOf('交锋')>-1) return 'clash'; if(s.indexOf('僵持')>-1) return 'stalemate'; if(s.indexOf('危机')>-1) return 'crisis'; if(s.indexOf('转折')>-1) return 'turning'; if(s.indexOf('决胜')>-1) return 'decisive'; return ''; }

/* === 处理AI响应 === */
function processStepResult(text, actions) {
  var r=parseStepResponse(text);
  G.step++; G.keyEvents.push(extractKey(r.narr,actions)); G.situation=r.situation; G.hint=r.hint;
  if(r.phase){var mp=mapPhase(r.phase);if(mp&&mp!==G.phase){var oldP=G.phase;G.phase=mp;appendSys('── '+(PHASE_NAMES[oldP]||oldP)+' → '+(PHASE_NAMES[G.phase]||G.phase)+' ──');}}
  var narr=qs('#'+P+'-narr'); if(narr){
    var sh='<div class="'+P+'-seg"><div class="'+P+'-seg-hd">── 第'+G.step+'段 ──</div><div class="'+P+'-seg-body">'+r.narr.replace(/\n/g,'<br>')+'</div>';
    if(r.talk) sh+='<div class="'+P+'-talk">'+r.talk.replace(/\n/g,'<br>')+'</div>';
    r.teammates.forEach(function(t){sh+='<div class="'+P+'-ally">'+esc(t.name)+'：'+esc(t.action)+'</div>';});
    sh+='</div>'; narr.insertAdjacentHTML('beforeend',sh); narr.scrollTop=narr.scrollHeight;
  }
  G.enemies.forEach(function(e){if(e.alive&&r.situation){var pat=new RegExp(e.name+'[^，。]*(?:击败|倒下|已死|失去战斗力|死亡)');if(pat.test(r.situation))e.alive=false;}});
  G.allies.forEach(function(u){if(u.alive&&r.situation){var pat=new RegExp(u.name+'[^，。]*(?:阵亡|倒下|失去意识|死亡)');if(pat.test(r.situation))u.alive=false;}});
  G.allyAlive=G.allies.filter(function(u){return u.alive;}).length;
  G.enemyAlive=G.enemies.filter(function(u){return u.alive;}).length;
  if(r.shouldEnd){
    appendSys('\u{1F3C1} AI建议结束'+(r.endReason?'——'+r.endReason:''));
    var result=r.endResult||'胜利';
    setTimeout(function(){showResult(result);},800);
  }
  updateSitBar(); renderActions();
  if(r.intentType&&r.intentType!=='无') renderIntentCard(r);
  else if(r.allyCallName) renderIntentCard({intentType:'队友喊话',intentContent:r.allyCallLine,allyCallName:r.allyCallName,allyCallLine:r.allyCallLine});
}

function extractKey(narr, actions) {
  var k='第'+(G.step+1)+'段：';
  if(actions&&actions.length) k+=G.allies[0].name+'使用'+actions.map(function(a){return a.name;}).join('→');
  else k+='战斗推进';
  if(narr&&narr.length>60) k+='——'+narr.substring(0,50);
  return k;
}

/* === UI辅助 === */
function appendSys(text) { var narr=qs('#'+P+'-narr'); if(!narr) return; narr.insertAdjacentHTML('beforeend','<div class="'+P+'-sys">'+text+'</div>'); narr.scrollTop=narr.scrollHeight; }

function showRetryInline(msg, retryFn) {
  var narr=qs('#'+P+'-narr'); if(!narr) return;
  var rid='rt'+Date.now();
  narr.insertAdjacentHTML('beforeend','<div class="'+P+'-sys">'+msg+' <span class="'+P+'-retry" id="'+rid+'">🔄 重试</span></div>');
  narr.scrollTop=narr.scrollHeight;
  var retryEl=qs('#'+rid); if(retryEl) retryEl.addEventListener('click',function(){retryEl.parentElement.remove();if(retryFn)retryFn();});
}

function showWait() { var w=qs('#'+P+'-wait');if(w)w.style.display='block'; var a=qs('#'+P+'-acts');if(a)a.style.display='none'; var inp=qs('#'+P+'-inp-area');if(inp)inp.style.display='none'; }
function hideWait() { var w=qs('#'+P+'-wait');if(w)w.style.display='none'; var a=qs('#'+P+'-acts');if(a)a.style.display=''; var inp=qs('#'+P+'-inp-area');if(inp)inp.style.display=''; }

function updateSitBar() {
  G.allyAlive=G.allies.filter(function(u){return u.alive;}).length;
  G.enemyAlive=G.enemies.filter(function(u){return u.alive;}).length;
  var moodBar=qs('#'+P+'-mood-bar');
  if(moodBar) moodBar.textContent='\u2694 '+G.tactic+' \u00b7 '+(PHASE_NAMES[G.phase]||G.phase)+' \u00b7 第'+G.step+'段';
  var sitTags=qs('#'+P+'-sit-tags');
  if(sitTags) sitTags.innerHTML='<span class="'+P+'-tag ally">己方'+G.allyAlive+'/'+G.allies.length+'</span><span class="'+P+'-tag enemy">敌方'+G.enemyAlive+'/'+G.enemies.length+'</span>';
  var sitDetail=qs('#'+P+'-sit-detail');
  if(sitDetail){
    var d='';
    G.allies.forEach(function(u){d+=esc(u.name)+'：'+(u.alive?esc(u.state||'正常'):'<b style="color:var(--ns-red)">已阵亡</b>')+'<br>';});
    G.enemies.forEach(function(u){d+=esc(u.name)+'：'+(u.alive?'存活':'<b style="color:var(--ns-green)">已击败</b>')+'<br>';});
    if(G.situation) d+='<br>'+G.situation.replace(/\n/g,'<br>');
    if(G.hint) d+='<div class="'+P+'-hint-box">\u26A0 '+esc(G.hint)+'</div>';
    sitDetail.innerHTML=d;
  }
}

/* === 意图系统（v5.1 扩展） === */
function renderIntentCard(r) {
  var it=r.intentType; if(!it||it==='无') return;
  G.intentCounter++; var cid=P+'-ic'+G.intentCounter;
  var narr=qs('#'+P+'-narr'); if(!narr) return;
  var configs={
    '蓄力大招':{hd:'\u26A0 敌人正在蓄力！',btns:[['打断','打断'],['防御','防御'],['拉开距离','闪避'],['趁机全力攻击','趁机全力攻击']]},
    '准备逃跑':{hd:'\u{1F3C3} 敌人想逃！',btns:[['追击','追击'],['放走','放走'],['截断退路','截断退路']]},
    '喊话挑衅':{hd:'\u{1F4AC} 敌人喊话',btns:[['无视','无视'],['回嘴','回嘴'],['趁说话偷袭','趁机偷袭']]},
    '弱点暴露':{hd:'\u{1F3AF} 发现弱点！',btns:[['集火弱点','集火弱点'],['谨慎试探','谨慎试探'],['全力一击','全力一击']]},
    '召唤援军':{hd:'\u{1F43A} 敌人在召唤援军！',btns:[['阻止','阻止召唤'],['速战速决','速战速决'],['准备应对','准备应对']]},
    '利用地形':{hd:'\u{1F3D4} 敌人在利用地形！',btns:[['抢占地形','抢占有利地形'],['逼出来','逼敌人离开有利位置'],['将计就计','利用敌人的地形依赖设陷阱']]},
    '属性克制':{hd:'\u{1F525} 敌人在针对属性克制！',btns:[['切换战术','切换战术避开克制'],['硬扛','硬扛克制强行推进'],['找弱点','绕开克制攻击其他弱点']]},
    '队友喊话':{hd:'\u{1F5E3} '+(r.allyCallName||'队友')+'喊道：',btns:[['配合','配合'+(r.allyCallName||'队友')],['不管','不管'],['让TA等等','让'+(r.allyCallName||'队友')+'等等']]}
  };
  var cfg=configs[it]; if(!cfg) return;
  var body=r.intentContent||r.allyCallLine||'…';
  if(it==='队友喊话') body='「'+body+'」';
  var h='<div class="'+P+'-intent" id="'+cid+'"><div class="'+P+'-intent-hd">'+cfg.hd+'</div><div class="'+P+'-intent-body">'+esc(body)+'</div><div class="'+P+'-intent-btns">';
  cfg.btns.forEach(function(b){h+='<div class="'+P+'-intent-btn" data-r="'+b[1]+'">'+b[0]+'</div>';});
  h+='</div><input class="'+P+'-intent-inp" placeholder="或者自己决定…"></div>';
  narr.insertAdjacentHTML('beforeend',h); narr.scrollTop=narr.scrollHeight;
  var card=qs('#'+cid); if(!card) return;
  card.querySelectorAll('.'+P+'-intent-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var inp=card.querySelector('.'+P+'-intent-inp'); var custom=inp?inp.value.trim():'';
      var response=custom||btn.dataset.r;
      G.keyEvents.push('玩家应对：'+response); card.classList.add('resolved');
      handleIntentResponse(response);
    });
  });
}

async function handleIntentResponse(response) {
  showWait();
  try {
    var text=await callAI(buildStepPrompt([{name:response}],null));
    hideWait();
    if(!text){showRetryInline('\u26A0 AI未响应',function(){handleIntentResponse(response);});return;}
    processStepResult(text,[{name:response}]);
  } catch(e){hideWait();showRetryInline('\u26A0 '+e.message,function(){handleIntentResponse(response);});}
}

/* === 执行行动 === */
async function execStep() {
  if(G.ended) return;
  var actions=G.queue.length?G.queue.slice():[{name:'观察局势'}];
  var hint=qs('#'+P+'-inp-ta')?qs('#'+P+'-inp-ta').value:'';
  G.queue=[]; renderQueue();
  showWait();
  try {
    var text=await callAI(buildStepPrompt(actions,hint));
    hideWait();
    if(!text){showRetryInline('\u26A0 AI未响应',execStep);return;}
    var ta=qs('#'+P+'-inp-ta');if(ta)ta.value='';
    processStepResult(text,actions);
  } catch(e){hideWait();showRetryInline('\u26A0 '+e.message,execStep);}
}

async function doSkip() {
  G.step++; showWait();
  try {
    var text=await callAI(buildSkipPrompt(),3000);
    hideWait();
    if(!text){G.step--;showRetryInline('\u26A0 快进失败',doSkip);return;}
    var skipM=text.match(/\[跳过\]([\s\S]*?)\[\/跳过\]/);
    if(skipM) appendSys(skipM[1].trim().replace(/\n/g,'<br>'));
    processStepResult(text,[{name:'快进'}]);
  } catch(e){hideWait();G.step--;showRetryInline('\u26A0 '+e.message,doSkip);}
}

/* === 结束流程 === */
function generateSummary(result) {
  var alliesStr=G.allies.map(function(u){return u.name+'('+u.levelDisplay+'，'+u.wuhun+')';}).join('、');
  var enemiesStr=G.enemies.map(function(u){return u.name+'('+(u.isBeast?u.yearLimit:u.levelDisplay)+')';}).join('、');
  var keyStr=''; G.keyEvents.filter(function(e){return !e.startsWith('第')||e.includes('使用')||e.includes('融合')||e.includes('击败')||e.includes('阵亡');}).slice(-8).forEach(function(e){keyStr+='· '+e+'\n';});
  return '（战斗已在模拟器中完成，以下是战斗摘要。请从战斗结束后直接继续推进剧情，不需要描写战斗过程。）\n\n场景：'+G.scene+'\n参战：'+alliesStr+' vs '+enemiesStr+'\n结果：'+result+'\n\n重要经过：\n'+keyStr.trim()+'\n\n战后状态：\n'+(G.situation||'未知')+'\n\n请从战斗结束后继续推进剧情。';
}

function showResult(result) {
  G.ended=true;
  var summary=generateSummary(result);
  var h='<div class="'+P+'-result-icon">\u2694</div><div class="'+P+'-result-title">'+esc(result)+'</div>';
  h+='<div class="'+P+'-result-stats">步数：<b>'+G.step+'</b><br>己方存活：<b>'+G.allyAlive+'/'+G.allies.length+'</b><br>敌方存活：<b>'+G.enemyAlive+'/'+G.enemies.length+'</b></div>';
  h+='<div class="'+P+'-result-btns">';
  h+='<button class="'+P+'-btn primary" id="'+P+'-res-send" style="width:100%;padding:12px;font-size:12px">\u{1F4E4} 发送摘要，继续剧情</button>';
  h+='<button class="'+P+'-btn danger" id="'+P+'-res-cancel" style="width:100%;padding:10px;font-size:11px">\u2715 取消本次模拟</button></div>';
  var container=qs('#'+P+'-result-content'); if(container) container.innerHTML=h;
  showPage('result');
  var sendBtn=qs('#'+P+'-res-send');
  if(sendBtn) sendBtn.addEventListener('click',function(){trySendMessage(summary);closePanel();resetAfterEnd();});
  var cancelBtn=qs('#'+P+'-res-cancel');
  if(cancelBtn) cancelBtn.addEventListener('click',function(){sendCancelToMainAI();closePanel();resetAfterEnd();});
}

function resetAfterEnd() { G=createGameState(); deactivateTrigger(); window.__btsLastTriggered=null; }
function sendCancelToMainAI() { trySendMessage('（玩家取消了战斗模拟。请从上一条消息中断处继续正常输出正文，战斗场景未发生。）'); }
function trySendMessage(msg) {
  try { var win=window.top||window; if(typeof win.triggerSlash==='function'){win.triggerSlash('/send '+msg);return;} var textarea=qs('#send_textarea');if(textarea){textarea.value=msg;var sendBtn=qs('#send_but');if(sendBtn)sendBtn.click();} } catch(e){log('发送消息失败',e);}
}

/* === 连招队列 === */
function renderQueue() {
  var qArea=qs('#'+P+'-queue'); if(!qArea) return;
  if(G.queue.length===0){qArea.style.display='none';return;}
  qArea.style.display='block';
  var h='<div class="'+P+'-queue-chips">';
  G.queue.forEach(function(q,i){if(i>0)h+='<span class="'+P+'-queue-arrow">→</span>';h+='<span class="'+P+'-queue-chip" data-qi="'+i+'">'+esc(q.name)+'</span>';});
  h+='</div><div style="display:flex;gap:4px;margin-top:4px"><button class="'+P+'-btn" id="'+P+'-q-clear" style="font-size:9px;padding:3px 8px">清空</button><button class="'+P+'-btn primary" id="'+P+'-q-exec" style="font-size:9px;padding:3px 8px;flex:1">执行连招</button></div>';
  qArea.innerHTML=h;
  qArea.querySelectorAll('[data-qi]').forEach(function(chip){chip.addEventListener('click',function(){G.queue.splice(parseInt(chip.dataset.qi),1);renderQueue();});});
  var clearBtn=qs('#'+P+'-q-clear');if(clearBtn)clearBtn.addEventListener('click',function(){G.queue=[];renderQueue();});
  var execBtn=qs('#'+P+'-q-exec');if(execBtn)execBtn.addEventListener('click',function(){execStep();});
}

/* === 页面切换 === */
function showPage(id) { qa('.'+P+'-page').forEach(function(p){p.classList.remove('active');}); var page=qs('#'+P+'-page-'+id);if(page)page.classList.add('active'); }
function openPanel() {
  var overlay=qs('#'+P+'-overlay'); if(!overlay) return;
  overlay.classList.add('active');
  if(G.pendingData&&!G.ended&&G.step===0){renderPrepPage(G.pendingData);showPage('prep');}
  else if(G.step>0&&!G.ended) showPage('interact');
  else{renderIdlePage();showPage('idle');}
}
function closePanel() { var overlay=qs('#'+P+'-overlay');if(overlay&&!overlay.classList.contains('pinned'))overlay.classList.remove('active'); }

function renderIdlePage() {
  var preset=getActivePreset(); var apiCfg=getApiConfig();
  var el1=qs('#'+P+'-idle-preset'); var el2=qs('#'+P+'-idle-api');
  if(el1) el1.textContent=preset.name||'--';
  if(el2) el2.textContent=apiCfg.model?('\u2705 '+apiCfg.model):'\u274C 未配置';
}

function renderPrepPage(data) {
  var container=qs('#'+P+'-prep-content'); if(!container) return;
  var h='';
  if(data.scene) h+='<div class="'+P+'-scene-box">\u{1F4CD} '+esc(data.scene)+'</div>';
  h+='<div class="'+P+'-card"><div class="'+P+'-card-title">己方</div>';
  data.allies.forEach(function(u){
    h+='<div class="'+P+'-npc-card ally"><div class="'+P+'-npc-name">'+esc(u.name)+'</div><div class="'+P+'-npc-info">';
    h+=esc(u.levelDisplay)+' · '+esc(u.wuhun)+' · <b>'+esc(u.role)+'</b>';
    if(u.style) h+='<br>风格：'+esc(u.style);
    h+='<br>魂技：'+u.skills.map(function(s){return esc(s.name);}).join('、');
    h+='</div></div>';
  });
  h+='</div>';
  h+='<div class="'+P+'-card"><div class="'+P+'-card-title" style="color:var(--ns-red)">敌方</div>';
  data.enemies.forEach(function(u){
    h+='<div class="'+P+'-npc-card enemy"><div class="'+P+'-npc-name">'+esc(u.name)+'</div><div class="'+P+'-npc-info">';
    if(u.isBeast) h+=esc(u.yearLimit)+' · '+esc(u.beastType);
    else h+=esc(u.levelDisplay)+(u.wuhun!=='无'?' · '+esc(u.wuhun):'');
    if(u.trait) h+='<br>'+esc(u.trait);
    h+='</div></div>';
  });
  h+='</div>';
  if(data.fusions.length){h+='<div class="'+P+'-card"><div class="'+P+'-card-title">融合技</div>';data.fusions.forEach(function(f){h+='<div class="'+P+'-npc-info">'+esc(f.who)+'：<b>'+esc(f.name)+'</b> — '+esc(f.desc)+'</div>';});h+='</div>';}
  h+='<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">';
  h+='<button class="'+P+'-btn primary" id="'+P+'-start-btn" style="padding:12px;font-size:12px">'+SVG.play+' 开始战斗</button>';
  h+='<button class="'+P+'-btn" id="'+P+'-cancel-prep" style="padding:8px;font-size:11px">'+SVG.x+' 取消模拟</button></div>';
  container.innerHTML=h;
  qs('#'+P+'-start-btn').addEventListener('click',function(){startInteraction(data);});
  qs('#'+P+'-cancel-prep').addEventListener('click',function(){sendCancelToMainAI();showPage('idle');deactivateTrigger();});
}

function startInteraction(data) {
  resetGameState();
  G.scene=data.scene; G.allies=data.allies; G.enemies=data.enemies; G.fusions=data.fusions;
  G.pendingData=data; G.allyAlive=G.allies.length; G.enemyAlive=G.enemies.length;
  var narr=qs('#'+P+'-narr'); if(narr) narr.innerHTML='<div class="'+P+'-sys">等待你的行动…</div>';
  var ht=qs('#'+P+'-htitle');
  if(ht){var short=data.scene.length>8?data.scene.substring(0,8)+'…':data.scene;ht.textContent='\u2694 '+short;}
  renderTeamBar(); updateSitBar(); renderActions(); renderQueue(); showPage('interact');
}

/* ========== 动作面板（v5.1 增加全体目标） ========== */
function renderActions() {
  var container=qs('#'+P+'-acts'); if(!container) return;
  container.innerHTML=''; var main=G.allies[0]; if(!main) return;

  // === 魂技（魂环） ===
  var rings=main.skills.filter(function(s){return s.src==='ring';});
  if(rings.length){
    var h='<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">魂技</div><div class="'+P+'-act-wrap">';
    rings.forEach(function(s){var cc=RING_COLORS[s.color]||'';h+='<div class="'+P+'-ab sk-ring'+(cc?' rc-'+cc:'')+'" data-sk="'+esc(s.name)+'" title="'+esc(s.desc)+'">'+esc(s.name)+'</div>';});
    h+='</div></div>'; container.insertAdjacentHTML('beforeend',h);
  }

  // === 魂骨技能 ===
  var bones=main.skills.filter(function(s){return s.src==='bone';});
  if(bones.length){
    var h2='<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">魂骨</div><div class="'+P+'-act-wrap">';
    bones.forEach(function(s){h2+='<div class="'+P+'-ab sk-bone" data-sk="'+esc(s.name)+'" title="'+esc(s.desc)+'">'+esc(s.name)+'</div>';});
    h2+='</div></div>'; container.insertAdjacentHTML('beforeend',h2);
  }

  // === 融合技 ===
  if(G.fusions.length){
    var hf='<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">融合技</div><div class="'+P+'-act-wrap">';
    G.fusions.forEach(function(f){hf+='<div class="'+P+'-ab sk-ring" data-sk="'+esc(f.name)+'" title="'+esc(f.who+'：'+f.desc)+'" style="font-weight:700">\u2B50'+esc(f.name)+'</div>';});
    hf+='</div></div>'; container.insertAdjacentHTML('beforeend',hf);
  }

  // === 基础动作 ===
  container.insertAdjacentHTML('beforeend','<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">基础</div><div class="'+P+'-act-wrap"><div class="'+P+'-ab" data-sk="普攻">普攻</div><div class="'+P+'-ab" data-sk="防御">防御</div><div class="'+P+'-ab" data-sk="闪避">闪避</div></div></div>');

  // === 战术 ===
  var ht='<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">战术</div><div class="'+P+'-act-wrap">';
  TACTICS.forEach(function(t){ht+='<div class="'+P+'-ab tact'+(t===G.tactic?' active':'')+'" data-tact="'+t+'">'+t+'</div>';});
  ht+='</div></div>'; container.insertAdjacentHTML('beforeend',ht);

  // === 目标选择（v5.1 增加全体） ===
  var alive=G.enemies.filter(function(e){return e.alive;});
  if(alive.length>1){
    var hg='<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">目标</div><div class="'+P+'-act-wrap">';
    hg+='<div class="'+P+'-ab tgt'+(G.target===-1?' active':'')+'" data-tgt="-1">\u{1F4A5}全体</div>';
    alive.forEach(function(e,i){hg+='<div class="'+P+'-ab tgt'+(i===G.target?' active':'')+'" data-tgt="'+i+'">\u{1F3AF}'+esc(e.name)+'</div>';});
    hg+='</div></div>'; container.insertAdjacentHTML('beforeend',hg);
  }

  // === 控制按钮 ===
  var hc='<div class="'+P+'-act-grp"><div class="'+P+'-act-lbl">控制</div><div class="'+P+'-act-wrap">';
  hc+='<div class="'+P+'-ab ctrl" data-ctrl="skip">\u23E9快进</div>';
  hc+='<div class="'+P+'-ab end" data-ctrl="finish">\u23F9结束</div>';
  hc+='</div></div>'; container.insertAdjacentHTML('beforeend',hc);

  // === 事件绑定 ===
  container.querySelectorAll('[data-sk]').forEach(function(el){
    el.addEventListener('click',function(){
      if(G.batchMode){G.queue.push({name:el.dataset.sk});renderQueue();}
      else{G.queue=[{name:el.dataset.sk}];execStep();}
    });
  });
  container.querySelectorAll('[data-tact]').forEach(function(el){
    el.addEventListener('click',function(){G.tactic=el.dataset.tact;container.querySelectorAll('[data-tact]').forEach(function(b){b.classList.remove('active');});el.classList.add('active');updateSitBar();});
  });
  container.querySelectorAll('[data-tgt]').forEach(function(el){
    el.addEventListener('click',function(){G.target=parseInt(el.dataset.tgt);container.querySelectorAll('[data-tgt]').forEach(function(b){b.classList.remove('active');});el.classList.add('active');});
  });
  container.querySelectorAll('[data-ctrl]').forEach(function(el){
    el.addEventListener('click',function(){
      if(el.dataset.ctrl==='skip') doSkip();
      else if(el.dataset.ctrl==='finish') showResult('胜利');
    });
  });
}

/* === 队友栏 === */
function renderTeamBar() {
  var bar=qs('#'+P+'-team-bar'); if(!bar) return;
  if(G.allies.length<=1){bar.style.display='none';return;}
  bar.style.display='flex';
  var h='';
  G.allies.forEach(function(u,i){
    if(i===0) return;
    var cmd=G.teamCmds[u.name]||'自由发挥';
    h+='<div class="'+P+'-tm-icon'+(!u.alive?' dead':'')+'" data-ti="'+i+'" title="'+esc(u.name+'·'+u.role)+'">'+esc(u.name.substring(0,1))+'<span class="'+P+'-tm-cmd">'+esc(cmd.substring(0,1))+'</span></div>';
  });
  bar.innerHTML=h;
  bar.querySelectorAll('[data-ti]').forEach(function(icon){
    icon.addEventListener('click',function(){if(!icon.classList.contains('dead'))showTeamPanel(parseInt(icon.dataset.ti));});
  });
}

function showTeamPanel(idx) {
  var u=G.allies[idx]; if(!u) return;
  var panel=qs('#'+P+'-panel-team'); if(!panel) return;
  var body=panel.querySelector('.'+P+'-panel-body'); if(!body) return;
  var title=panel.querySelector('.'+P+'-panel-title'); if(title) title.textContent=u.name+' · '+u.role;
  var curCmd=G.teamCmds[u.name]||'自由发挥';
  var h='<div class="'+P+'-card"><div class="'+P+'-card-title">通用指令</div><div style="display:flex;flex-wrap:wrap;gap:4px">';
  COMMON_CMDS.forEach(function(c){h+='<div class="'+P+'-style-btn'+(c===curCmd?' active':'')+'" data-cmd="'+c+'">'+c+'</div>';});
  h+='</div></div>';
  var roleCmds=ROLE_CMDS[u.role]||[];
  if(roleCmds.length){h+='<div class="'+P+'-card"><div class="'+P+'-card-title">'+esc(u.role)+'指令</div><div style="display:flex;flex-wrap:wrap;gap:4px">';roleCmds.forEach(function(c){h+='<div class="'+P+'-style-btn'+(c===curCmd?' active':'')+'" data-cmd="'+c+'">'+c+'</div>';});h+='</div></div>';}
  h+='<div class="'+P+'-card"><div class="'+P+'-card-title">自定义</div><input class="'+P+'-intent-inp" id="'+P+'-team-custom" placeholder="具体指令…" style="width:100%"></div>';
  h+='<div style="text-align:center;margin-top:8px"><button class="'+P+'-btn primary" id="'+P+'-team-confirm">确定</button></div>';
  body.innerHTML=h; panel.classList.add('active');
  body.querySelectorAll('[data-cmd]').forEach(function(btn){
    btn.addEventListener('click',function(){body.querySelectorAll('[data-cmd]').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');});
  });
  qs('#'+P+'-team-confirm').addEventListener('click',function(){
    var custom=qs('#'+P+'-team-custom')?qs('#'+P+'-team-custom').value.trim():'';
    var selected=body.querySelector('[data-cmd].active');
    G.teamCmds[u.name]=custom||(selected?selected.dataset.cmd:'自由发挥');
    panel.classList.remove('active'); renderTeamBar();
  });
}

/* === 设置面板 === */
function renderSettingsPanel() {
  var container=qs('#'+P+'-settings-content'); if(!container) return;
  var data=loadPresets(); var active=getActivePreset(); var apiCfg=getApiConfig();
  var h='';
  h+='<div class="'+P+'-setting-grp"><div class="'+P+'-setting-lbl">\u{1F4CB} 预设</div>';
  data.presets.forEach(function(p){h+='<div class="'+P+'-preset-item'+(p.id===data.activeId?' active':'')+'" data-pid="'+p.id+'"><div class="'+P+'-preset-radio"></div><div class="'+P+'-preset-info"><div class="'+P+'-preset-name">'+esc(p.name)+'</div><div class="'+P+'-preset-author">'+esc(p.author||'未知')+' · v'+esc(p.version||'?')+'</div></div></div>';});
  h+='<div style="display:flex;gap:5px;margin-top:6px"><button class="'+P+'-btn" id="'+P+'-preset-new">'+SVG.plus+' 新建</button><button class="'+P+'-btn" id="'+P+'-preset-import">'+SVG.upload+' 导入</button><input type="file" id="'+P+'-preset-file" accept=".json" style="display:none"></div></div>';
  h+='<div class="'+P+'-setting-grp"><div class="'+P+'-setting-lbl">\u270F\uFE0F 编辑: '+esc(active.name)+'</div>';
  h+='<div class="'+P+'-edit-tabs"><div class="'+P+'-edit-tab active" data-etab="sys">系统指令</div><div class="'+P+'-edit-tab" data-etab="cot">思维链</div><div class="'+P+'-edit-tab" data-etab="ban">禁止词</div><div class="'+P+'-edit-tab" data-etab="fmt">输出格式</div></div>';
  h+='<div class="'+P+'-edit-content active" data-econtent="sys"><textarea class="'+P+'-setting-ta" id="'+P+'-edit-sys" style="min-height:140px">'+esc(active.systemPrompt||'')+'</textarea></div>';
  h+='<div class="'+P+'-edit-content" data-econtent="cot"><textarea class="'+P+'-setting-ta" id="'+P+'-edit-cot" style="min-height:100px">'+esc(active.cotTemplate||'')+'</textarea></div>';
  h+='<div class="'+P+'-edit-content" data-econtent="ban"><textarea class="'+P+'-setting-ta" id="'+P+'-edit-ban" style="min-height:60px">'+esc(typeof active.bannedWords==='string'?active.bannedWords:(active.bannedWords||[]).join(','))+'</textarea></div>';
  h+='<div class="'+P+'-edit-content" data-econtent="fmt"><textarea class="'+P+'-setting-ta" id="'+P+'-edit-fmt" style="min-height:120px">'+esc(active.outputFormat||'')+'</textarea><div class="'+P+'-setting-hint">可用占位符：{teammates} {allyCall}</div></div>';
  h+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px"><button class="'+P+'-btn primary" id="'+P+'-preset-save">'+SVG.save+' 保存</button><button class="'+P+'-btn" id="'+P+'-preset-export">'+SVG.download+' 导出</button>';
  if(active.id!=='default_v5') h+='<button class="'+P+'-btn danger" id="'+P+'-preset-delete">'+SVG.trash+' 删除</button>';
  h+='</div></div>';
  h+='<div class="'+P+'-setting-grp"><div class="'+P+'-setting-lbl">\u{1F50C} API</div><div class="'+P+'-row"><span class="k">状态</span><span class="v">'+(apiCfg.model?('\u2705 '+apiCfg.model):'\u274C 未配置')+'</span></div><div class="'+P+'-setting-hint">API在魂导通讯器设置中配置</div></div>';
  h+='<div class="'+P+'-setting-grp"><div class="'+P+'-setting-lbl">\u{1F39B} 温度</div><div style="display:flex;align-items:center;gap:6px;margin:4px 0"><input type="range" id="'+P+'-temp-range" min="0.1" max="1.5" step="0.05" value="'+(active.temperature||0.75)+'" style="flex:1;accent-color:var(--ns-ac)"><span id="'+P+'-temp-val" style="font-size:10px;min-width:30px;text-align:right">'+(active.temperature||0.75).toFixed(2)+'</span></div></div>';
  container.innerHTML=h;
  container.querySelectorAll('.'+P+'-preset-item').forEach(function(item){item.addEventListener('click',function(){setActivePreset(item.dataset.pid);renderSettingsPanel();toast('预设已切换');});});
  var newBtn=qs('#'+P+'-preset-new');if(newBtn)newBtn.addEventListener('click',function(){var np=JSON.parse(JSON.stringify(DEFAULT_PRESET));np.id='custom_'+Date.now();np.name='新预设';np.author='用户';savePreset(np);setActivePreset(np.id);renderSettingsPanel();toast('新预设已创建');});
  var importBtn=qs('#'+P+'-preset-import');if(importBtn)importBtn.addEventListener('click',function(){var f=qs('#'+P+'-preset-file');if(f)f.click();});
  var fileInput=qs('#'+P+'-preset-file');if(fileInput)fileInput.addEventListener('change',async function(e){var file=e.target.files[0];if(!file)return;try{var preset=await importPresetFromFile(file);setActivePreset(preset.id);renderSettingsPanel();toast('预设「'+preset.name+'」导入成功');}catch(err){toast(err.message,'err');}e.target.value='';});
  container.querySelectorAll('.'+P+'-edit-tab').forEach(function(tab){tab.addEventListener('click',function(){container.querySelectorAll('.'+P+'-edit-tab').forEach(function(t){t.classList.remove('active');});container.querySelectorAll('.'+P+'-edit-content').forEach(function(c){c.classList.remove('active');});tab.classList.add('active');var ct=container.querySelector('[data-econtent="'+tab.dataset.etab+'"]');if(ct)ct.classList.add('active');});});
  var saveBtn2=qs('#'+P+'-preset-save');if(saveBtn2)saveBtn2.addEventListener('click',function(){var p=getActivePreset();var sysEl=qs('#'+P+'-edit-sys');if(sysEl)p.systemPrompt=sysEl.value;var cotEl=qs('#'+P+'-edit-cot');if(cotEl)p.cotTemplate=cotEl.value;var banEl=qs('#'+P+'-edit-ban');if(banEl)p.bannedWords=banEl.value;var fmtEl=qs('#'+P+'-edit-fmt');if(fmtEl)p.outputFormat=fmtEl.value;var tempEl=qs('#'+P+'-temp-range');if(tempEl)p.temperature=parseFloat(tempEl.value);savePreset(p);toast('预设已保存');});
  var exportBtn=qs('#'+P+'-preset-export');if(exportBtn)exportBtn.addEventListener('click',function(){exportPreset(getActivePreset());toast('预设已导出');});
  var deleteBtn=qs('#'+P+'-preset-delete');if(deleteBtn)deleteBtn.addEventListener('click',function(){var p=getActivePreset();if(confirm('确定删除预设「'+p.name+'」？')){deletePreset(p.id);renderSettingsPanel();toast('预设已删除');}});
  var tempRange=qs('#'+P+'-temp-range');if(tempRange)tempRange.addEventListener('input',function(){var valEl=qs('#'+P+'-temp-val');if(valEl)valEl.textContent=parseFloat(this.value).toFixed(2);});
}

/* === SVG图标 === */
var SVG = {
  sword:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>',
  back:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
  settings:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  x:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  pin:'<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>',
  send:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
  download:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  upload:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  plus:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  save:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  play:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  stop:'<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
  moon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
};

/* === CSS === */
var styles = '<style id="'+P+'-styles">'+
':root{--ns-bg:#0a0e1a;--ns-bg2:#111827;--ns-sf:#1a1f35;--ns-sf2:#222842;--ns-ac:#3b82f6;--ns-ac2:rgba(59,130,246,.12);--ns-t1:#e8e0d0;--ns-t2:#8090a0;--ns-t3:#4a5568;--ns-bd:rgba(59,130,246,.2);--ns-bd2:rgba(255,255,255,.08);--ns-r:14px;--ns-rs:8px;--ns-green:#2ecc71;--ns-red:#e74c3c}'+
'#'+P+'-trigger,.'+P+'-frame *{box-sizing:border-box}'+
'.'+P+'-trigger{position:fixed!important;top:42vh;left:18px;width:38px!important;height:38px!important;border-radius:50%!important;background:rgba(26,31,53,.9)!important;border:1.5px solid rgba(59,130,246,.3)!important;box-shadow:0 0 12px rgba(59,130,246,.1),0 4px 12px rgba(0,0,0,.4)!important;z-index:2147483645!important;cursor:grab;display:flex!important;align-items:center;justify-content:center;user-select:none;touch-action:none;transition:all .3s;color:rgba(59,130,246,.5)}'+
'.'+P+'-trigger:hover{transform:scale(1.08);color:var(--ns-ac)}'+
'.'+P+'-trigger.active{border-color:var(--ns-ac)!important;color:var(--ns-ac);animation:'+P+'-glow 2s ease-in-out infinite}'+
'.'+P+'-trigger.dragging{cursor:grabbing!important;opacity:.8;animation:none}'+
'@keyframes '+P+'-glow{0%,100%{box-shadow:0 0 12px rgba(59,130,246,.15),0 4px 12px rgba(0,0,0,.4)}50%{box-shadow:0 0 20px rgba(59,130,246,.35),0 4px 12px rgba(0,0,0,.4)}}'+
'.'+P+'-overlay{position:fixed!important;inset:0;z-index:2147483644!important;display:none;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);pointer-events:none}'+
'.'+P+'-overlay.active{display:block!important;pointer-events:auto}'+
'.'+P+'-overlay.pinned{pointer-events:none;background:transparent;backdrop-filter:none}'+
'.'+P+'-overlay.pinned .'+P+'-frame{pointer-events:auto}'+
'.'+P+'-frame{position:absolute;width:370px;height:700px;max-width:95vw;max-height:92vh;background:var(--ns-bg);border-radius:18px;border:1px solid var(--ns-bd);box-shadow:0 0 30px rgba(59,130,246,.08),0 20px 60px rgba(0,0,0,.6);opacity:0;transform:scale(.95) translateY(15px);transition:opacity .35s,transform .35s;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif;color:var(--ns-t1);display:flex;flex-direction:column;overflow:hidden}'+
'.'+P+'-overlay.active .'+P+'-frame{opacity:1;transform:scale(1) translateY(0)}'+
'.'+P+'-frame.light{--ns-bg:#f5f0e8;--ns-bg2:#ede7dd;--ns-sf:#fff;--ns-sf2:#f8f4ee;--ns-ac:#2563eb;--ns-ac2:rgba(37,99,235,.1);--ns-t1:#2a2520;--ns-t2:#6b6560;--ns-t3:#9a948e;--ns-bd:rgba(37,99,235,.25);--ns-bd2:rgba(0,0,0,.08)}'+
'.'+P+'-frame.light .'+P+'-narr{background:rgba(245,240,232,.6)}'+
'.'+P+'-frame.light .'+P+'-header,.'+P+'-frame.light .'+P+'-panel-hd{background:rgba(237,231,221,.95)}'+
'.'+P+'-header{height:40px;flex-shrink:0;display:flex;align-items:center;padding:0 10px;border-bottom:1px solid var(--ns-bd2);background:rgba(17,24,39,.95);user-select:none;gap:6px}'+
'.'+P+'-header-title{flex:1;text-align:center;font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}'+
'.'+P+'-hbtn{width:26px;height:26px;border-radius:6px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ns-t2);transition:all .2s;flex-shrink:0}'+
'.'+P+'-hbtn:hover{background:rgba(255,255,255,.06);color:var(--ns-t1)}'+
'.'+P+'-body{flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}'+
'.'+P+'-body::-webkit-scrollbar{width:3px}.'+P+'-body::-webkit-scrollbar-thumb{background:rgba(59,130,246,.2);border-radius:2px}'+
'.'+P+'-page{display:none;flex-direction:column;flex:1;min-height:0}.'+P+'-page.active{display:flex}'+
'.'+P+'-panel{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;background:var(--ns-bg2);transform:translateX(100%);transition:transform .3s cubic-bezier(.16,1,.3,1)}.'+P+'-panel.active{transform:translateX(0)}'+
'.'+P+'-panel-hd{height:40px;display:flex;align-items:center;padding:0 8px;flex-shrink:0;border-bottom:1px solid var(--ns-bd2);background:rgba(17,24,39,.95);gap:4px}'+
'.'+P+'-panel-back{border:none;background:none;cursor:pointer;padding:6px;display:flex;align-items:center;color:var(--ns-ac)}'+
'.'+P+'-panel-title{font-weight:600;font-size:13px;flex:1;text-align:center;margin-right:30px}'+
'.'+P+'-panel-body{flex:1;overflow-y:auto;padding:10px}.'+P+'-panel-body::-webkit-scrollbar{width:3px}.'+P+'-panel-body::-webkit-scrollbar-thumb{background:rgba(59,130,246,.2);border-radius:2px}'+
'.'+P+'-card{background:var(--ns-sf);border:1px solid var(--ns-bd2);border-radius:var(--ns-r);padding:10px 12px;margin-bottom:8px}'+
'.'+P+'-card-title{font-size:11px;font-weight:600;color:var(--ns-ac);margin-bottom:6px}'+
'.'+P+'-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}.'+P+'-row .k{color:var(--ns-t2)}.'+P+'-row .v{color:var(--ns-t1);text-align:right;max-width:60%}'+
'.'+P+'-btn{padding:7px 14px;border-radius:var(--ns-rs);border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t1);font-size:11px;font-weight:500;cursor:pointer;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:4px}'+
'.'+P+'-btn:hover{background:var(--ns-sf2);transform:translateY(-1px)}.'+P+'-btn:active{transform:scale(.96)}'+
'.'+P+'-btn.primary{background:var(--ns-ac2);border-color:var(--ns-ac);color:var(--ns-ac);font-weight:600}'+
'.'+P+'-btn.danger{border-color:var(--ns-red);color:var(--ns-red)}'+
'.'+P+'-tag{padding:2px 7px;border-radius:10px;font-size:9px;font-weight:500}.'+P+'-tag.ally{background:rgba(46,204,113,.1);color:var(--ns-green)}.'+P+'-tag.enemy{background:rgba(231,76,60,.1);color:var(--ns-red)}'+
'.'+P+'-idle{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:30px;gap:16px;color:var(--ns-t2);text-align:center}'+
'.'+P+'-idle-icon{font-size:36px;opacity:.4}'+
'.'+P+'-prep{padding:12px;overflow-y:auto;flex:1}'+
'.'+P+'-scene-box{padding:8px 10px;border:1px solid var(--ns-bd2);border-radius:var(--ns-rs);background:var(--ns-sf);font-size:10px;color:var(--ns-t2);line-height:1.6;margin-bottom:8px}'+
'.'+P+'-npc-card{padding:10px 12px;margin-bottom:6px;background:var(--ns-sf);border-radius:var(--ns-r);border:1px solid var(--ns-bd2)}'+
'.'+P+'-npc-card.ally{border-left:3px solid var(--ns-green)}.'+P+'-npc-card.enemy{border-left:3px solid var(--ns-red)}'+
'.'+P+'-npc-name{font-size:12px;font-weight:700;margin-bottom:4px}'+
'.'+P+'-npc-info{font-size:10px;color:var(--ns-t2);line-height:1.7}.'+P+'-npc-info b{color:var(--ns-t1);font-weight:500}'+
'.'+P+'-style-btn{padding:5px 12px;border-radius:16px;border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t2);font-size:10px;cursor:pointer;transition:all .2s}'+
'.'+P+'-style-btn:hover{border-color:var(--ns-ac)}.'+P+'-style-btn.active{background:var(--ns-ac2);border-color:var(--ns-ac);color:var(--ns-ac);font-weight:600}'+
'.'+P+'-mood-bar{padding:4px 12px;border-bottom:1px solid var(--ns-bd2);font-size:10px;color:var(--ns-ac);background:rgba(59,130,246,.04);display:flex;align-items:center;gap:4px;flex-shrink:0}'+
'.'+P+'-sit-area{padding:5px 12px;border-bottom:1px solid var(--ns-bd2);font-size:10px;color:var(--ns-t2);flex-shrink:0;cursor:pointer;transition:background .15s}'+
'.'+P+'-sit-area:hover{background:rgba(255,255,255,.03)}'+
'.'+P+'-sit-summary{display:flex;align-items:center;justify-content:space-between}'+
'.'+P+'-sit-left{display:flex;align-items:center;gap:6px;flex:1;overflow:hidden}'+
'.'+P+'-sit-detail{display:none;padding:4px 0;font-size:9px;color:var(--ns-t2);line-height:1.7}'+
'.'+P+'-sit-area.open .'+P+'-sit-detail{display:block}'+
'.'+P+'-expand-icon{font-size:8px;color:var(--ns-t3);transition:transform .3s}.'+P+'-sit-area.open .'+P+'-expand-icon{transform:rotate(180deg)}'+
'.'+P+'-hint-box{margin-top:4px;padding:4px 8px;border-radius:6px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);color:var(--ns-red);font-size:9px}'+
'.'+P+'-narr{flex:1;overflow-y:auto;padding:10px 12px;font-size:11px;line-height:1.85;background:rgba(10,14,26,.6);color:var(--ns-t1);min-height:0}'+
'.'+P+'-narr::-webkit-scrollbar{width:3px}.'+P+'-narr::-webkit-scrollbar-thumb{background:rgba(59,130,246,.15);border-radius:2px}'+
'.'+P+'-seg{margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed var(--ns-bd2)}.'+P+'-seg:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}'+
'.'+P+'-seg-hd{font-size:9px;color:var(--ns-t3);margin-bottom:2px;font-weight:600}'+
'.'+P+'-seg-body{line-height:1.85}'+
'.'+P+'-talk{color:var(--ns-ac);font-weight:500;margin:3px 0;padding:3px 8px;border-left:2px solid var(--ns-ac);background:rgba(59,130,246,.06);border-radius:0 5px 5px 0;font-size:10px;line-height:1.7}'+
'.'+P+'-ally{font-size:9px;color:var(--ns-green);margin-top:3px}'+
'.'+P+'-sys{color:var(--ns-t3);font-size:9px;text-align:center;margin:5px 0;font-weight:500}'+
'.'+P+'-intent{margin:6px 0;padding:8px 10px;border:1px solid rgba(231,76,60,.25);border-radius:var(--ns-rs);background:rgba(231,76,60,.05);animation:'+P+'-fi .3s ease-out}'+
'.'+P+'-intent.resolved{opacity:.3;pointer-events:none}'+
'.'+P+'-intent-hd{font-size:10px;font-weight:600;color:var(--ns-red);margin-bottom:4px}'+
'.'+P+'-intent-body{font-size:9px;color:var(--ns-t1);line-height:1.6;margin-bottom:6px}'+
'.'+P+'-intent-btns{display:flex;flex-wrap:wrap;gap:3px}'+
'.'+P+'-intent-btn{padding:4px 10px;border:1px solid var(--ns-bd2);border-radius:5px;background:var(--ns-sf);color:var(--ns-t1);font-size:9px;cursor:pointer;transition:all .15s}'+
'.'+P+'-intent-btn:hover{background:var(--ns-ac2);border-color:var(--ns-ac)}'+
'.'+P+'-intent-inp{width:100%;padding:4px 8px;border:1px solid var(--ns-bd2);border-radius:5px;background:rgba(26,31,53,.5);color:var(--ns-t1);font-size:9px;outline:none;margin-top:3px;font-family:inherit}.'+P+'-intent-inp:focus{border-color:var(--ns-ac)}'+
'@keyframes '+P+'-fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}'+
'.'+P+'-team-bar{display:flex;align-items:center;gap:5px;padding:4px 12px;border-bottom:1px solid var(--ns-bd2);flex-shrink:0}'+
'.'+P+'-tm-icon{width:28px;height:28px;border-radius:50%;background:var(--ns-sf);border:2px solid var(--ns-bd2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--ns-t1);cursor:pointer;flex-shrink:0;position:relative;transition:all .2s}'+
'.'+P+'-tm-icon:hover{border-color:var(--ns-ac);transform:scale(1.1)}'+
'.'+P+'-tm-icon.dead{opacity:.3;border-color:var(--ns-red);cursor:default}'+
'.'+P+'-tm-cmd{position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:var(--ns-ac);color:#fff;font-size:6px;display:flex;align-items:center;justify-content:center;font-weight:700}'+
'.'+P+'-acts{padding:6px 10px;flex-shrink:0;overflow-y:auto;max-height:140px;border-top:1px solid var(--ns-bd2)}'+
'.'+P+'-act-grp{margin-bottom:4px}.'+P+'-act-grp:last-child{margin-bottom:0}'+
'.'+P+'-act-lbl{font-size:8px;font-weight:600;color:var(--ns-t3);margin-bottom:2px;text-transform:uppercase;letter-spacing:.3px}'+
'.'+P+'-act-wrap{display:flex;flex-wrap:wrap;gap:3px}'+
'.'+P+'-ab{padding:5px 9px;border:1px solid var(--ns-bd2);border-radius:5px;background:var(--ns-sf);color:var(--ns-t1);font-size:9px;font-weight:500;cursor:pointer;transition:all .2s}'+
'.'+P+'-ab:hover{background:var(--ns-sf2);transform:translateY(-1px)}.'+P+'-ab:active{transform:scale(.96)}'+
'.'+P+'-ab.sk-ring{border-color:rgba(175,82,222,.3);background:rgba(175,82,222,.04)}'+
'.'+P+'-ab.rc-w{border-color:rgba(199,199,204,.4)}.'+P+'-ab.rc-y{border-color:rgba(245,200,66,.4)}.'+P+'-ab.rc-p{border-color:rgba(175,82,222,.4)}.'+P+'-ab.rc-k{border-color:rgba(58,58,60,.6)}.'+P+'-ab.rc-r{border-color:rgba(255,59,48,.4)}'+
'.'+P+'-ab.sk-bone{border-color:rgba(255,149,0,.3);background:rgba(255,149,0,.04)}'+
'.'+P+'-ab.tact{border-color:rgba(59,130,246,.2);background:rgba(59,130,246,.04)}'+
'.'+P+'-ab.tact.active{background:var(--ns-ac2);border-color:var(--ns-ac);color:var(--ns-ac);font-weight:600}'+
'.'+P+'-ab.tgt{border-color:rgba(231,76,60,.2);background:rgba(231,76,60,.04)}.'+P+'-ab.tgt.active{background:rgba(231,76,60,.12);border-color:var(--ns-red);color:var(--ns-red);font-weight:600}'+
'.'+P+'-ab.ctrl{border-color:rgba(46,204,113,.2);background:rgba(46,204,113,.04)}'+
'.'+P+'-ab.end{border-color:rgba(100,100,120,.2);background:rgba(80,80,100,.04)}'+
'.'+P+'-queue{display:none;padding:4px 10px;border-top:1px solid var(--ns-bd2);flex-shrink:0}'+
'.'+P+'-queue-chips{display:flex;flex-wrap:wrap;gap:2px;align-items:center}'+
'.'+P+'-queue-chip{padding:2px 6px;border-radius:5px;font-size:9px;background:var(--ns-ac2);color:var(--ns-ac);cursor:pointer}.'+P+'-queue-chip:hover{text-decoration:line-through}'+
'.'+P+'-queue-arrow{font-size:8px;color:var(--ns-t3)}'+
'.'+P+'-inp{padding:5px 10px;border-top:1px solid var(--ns-bd2);flex-shrink:0;display:flex;gap:5px;align-items:flex-end}'+
'.'+P+'-inp-ta{flex:1;min-height:28px;max-height:48px;padding:5px 8px;border:1px solid var(--ns-bd2);border-radius:6px;background:rgba(26,31,53,.5);color:var(--ns-t1);font-size:10px;font-family:inherit;outline:none;resize:none;line-height:1.4}.'+P+'-inp-ta:focus{border-color:var(--ns-ac)}.'+P+'-inp-ta::placeholder{color:var(--ns-t3)}'+
'.'+P+'-inp-send{padding:5px 10px;border:1px solid var(--ns-ac);border-radius:6px;background:var(--ns-ac2);color:var(--ns-ac);font-size:9px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:3px}.'+P+'-inp-send:hover{background:var(--ns-ac);color:#fff}'+
'.'+P+'-wait{text-align:center;padding:14px;color:var(--ns-t3);font-size:10px;display:none}'+
'.'+P+'-dots span{display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--ns-ac);margin:0 2px;animation:'+P+'-db 1.4s ease-in-out infinite}'+
'.'+P+'-dots span:nth-child(2){animation-delay:.2s}.'+P+'-dots span:nth-child(3){animation-delay:.4s}'+
'@keyframes '+P+'-db{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-5px);opacity:1}}'+
'.'+P+'-stop{margin-top:6px;padding:4px 12px;border:1px solid rgba(231,76,60,.3);border-radius:6px;background:rgba(231,76,60,.08);color:var(--ns-red);font-size:9px;font-weight:600;cursor:pointer}'+
'.'+P+'-retry{display:inline-flex;align-items:center;gap:2px;padding:2px 8px;border:1px solid var(--ns-bd2);border-radius:5px;background:var(--ns-sf);color:var(--ns-ac);font-size:8px;cursor:pointer;margin-left:4px}.'+P+'-retry:hover{background:var(--ns-ac2);border-color:var(--ns-ac)}'+
'.'+P+'-result-icon{font-size:28px;text-align:center;margin-bottom:8px}'+
'.'+P+'-result-title{font-size:14px;font-weight:700;color:var(--ns-ac);text-align:center;margin-bottom:10px}'+
'.'+P+'-result-stats{font-size:11px;color:var(--ns-t2);line-height:1.8;text-align:center;margin-bottom:12px}.'+P+'-result-stats b{color:var(--ns-t1);font-weight:600}'+
'.'+P+'-result-btns{display:flex;flex-direction:column;gap:6px;align-items:center}'+
'.'+P+'-setting-grp{margin-bottom:12px}'+
'.'+P+'-setting-lbl{font-size:10px;color:var(--ns-ac);margin-bottom:4px;font-weight:600}'+
'.'+P+'-setting-ta{width:100%;min-height:80px;max-height:200px;padding:7px 10px;border-radius:6px;border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t1);font-size:10px;font-family:inherit;outline:none;resize:vertical;line-height:1.5}.'+P+'-setting-ta:focus{border-color:var(--ns-ac)}'+
'.'+P+'-setting-hint{font-size:9px;color:var(--ns-t3);margin-top:2px}'+
'.'+P+'-preset-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--ns-bd2);border-radius:var(--ns-rs);margin-bottom:5px;cursor:pointer;transition:all .15s}'+
'.'+P+'-preset-item:hover{background:rgba(255,255,255,.03)}.'+P+'-preset-item.active{border-color:var(--ns-ac);background:var(--ns-ac2)}'+
'.'+P+'-preset-radio{width:14px;height:14px;border-radius:50%;border:2px solid var(--ns-t3);flex-shrink:0;display:flex;align-items:center;justify-content:center}'+
'.'+P+'-preset-item.active .'+P+'-preset-radio{border-color:var(--ns-ac)}.'+P+'-preset-item.active .'+P+'-preset-radio::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--ns-ac)}'+
'.'+P+'-preset-info{flex:1;overflow:hidden}.'+P+'-preset-name{font-size:11px;font-weight:600}.'+P+'-preset-author{font-size:9px;color:var(--ns-t3)}'+
'.'+P+'-edit-tabs{display:flex;border-bottom:1px solid var(--ns-bd2);margin-bottom:8px;flex-wrap:wrap}'+
'.'+P+'-edit-tab{flex:1;padding:6px;text-align:center;font-size:9px;cursor:pointer;color:var(--ns-t2);border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;min-width:40px}'+
'.'+P+'-edit-tab:hover{color:var(--ns-t1)}.'+P+'-edit-tab.active{color:var(--ns-ac);border-bottom-color:var(--ns-ac)}'+
'.'+P+'-edit-content{display:none}.'+P+'-edit-content.active{display:block}'+
'.'+P+'-tg-row{display:flex;align-items:center;gap:8px;padding:0 10px 4px;flex-shrink:0;font-size:8px;color:var(--ns-t3)}'+
'.'+P+'-tg-sw{width:28px;height:16px;border-radius:8px;background:var(--ns-bd2);position:relative;cursor:pointer;transition:background .3s;flex-shrink:0}.'+P+'-tg-sw.on{background:var(--ns-ac)}'+
'.'+P+'-tg-knob{width:12px;height:12px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .3s;box-shadow:0 1px 3px rgba(0,0,0,.15)}.'+P+'-tg-sw.on .'+P+'-tg-knob{transform:translateX(12px)}'+
'@media(max-width:400px){.'+P+'-frame{padding:0}.'+P+'-ab{padding:6px 10px;font-size:10px}}'+
'</style>';

/* === HTML === */
var html = '<div id="'+P+'-trigger" class="'+P+'-trigger">'+SVG.sword+'</div>'+
'<div id="'+P+'-overlay" class="'+P+'-overlay"><div id="'+P+'-frame" class="'+P+'-frame">'+
'<div class="'+P+'-header" id="'+P+'-header">'+
'<button class="'+P+'-hbtn" id="'+P+'-close">'+SVG.x+'</button>'+
'<div class="'+P+'-header-title" id="'+P+'-htitle">\u2694 战斗模拟</div>'+
'<button class="'+P+'-hbtn" id="'+P+'-settings-btn">'+SVG.settings+'</button>'+
'<button class="'+P+'-hbtn" id="'+P+'-theme-btn">'+SVG.moon+'</button>'+
'<button class="'+P+'-hbtn" id="'+P+'-pin-btn">'+SVG.pin+'</button></div>'+
'<div class="'+P+'-body" id="'+P+'-body">'+
'<div class="'+P+'-page active" id="'+P+'-page-idle"><div class="'+P+'-idle">'+
'<div class="'+P+'-idle-icon">\u2694</div>'+
'<div style="font-size:12px;line-height:1.6">等待战斗触发…<br><span style="font-size:10px;color:var(--ns-t3)">AI输出战斗标签后自动激活</span></div>'+
'<div class="'+P+'-card" style="width:100%;text-align:left"><div class="'+P+'-card-title">\u{1F4CB} 状态</div>'+
'<div class="'+P+'-row"><span class="k">预设</span><span class="v" id="'+P+'-idle-preset">--</span></div>'+
'<div class="'+P+'-row"><span class="k">API</span><span class="v" id="'+P+'-idle-api">未配置</span></div></div></div></div>'+
'<div class="'+P+'-page" id="'+P+'-page-prep"><div class="'+P+'-prep" id="'+P+'-prep-content"></div></div>'+
'<div class="'+P+'-page" id="'+P+'-page-interact">'+
'<div class="'+P+'-mood-bar" id="'+P+'-mood-bar">\u2694 稳扎稳打 \u00b7 开场 \u00b7 第0段</div>'+
'<div class="'+P+'-sit-area" id="'+P+'-sit-area"><div class="'+P+'-sit-summary"><div class="'+P+'-sit-left"><b style="font-size:10px;font-weight:600">\u2694 战况</b> <span id="'+P+'-sit-tags"></span></div><span class="'+P+'-expand-icon">\u25BC</span></div><div class="'+P+'-sit-detail" id="'+P+'-sit-detail">双方对峙中…</div></div>'+
'<div class="'+P+'-narr" id="'+P+'-narr"><div class="'+P+'-sys">等待你的行动…</div></div>'+
'<div class="'+P+'-team-bar" id="'+P+'-team-bar" style="display:none"></div>'+
'<div class="'+P+'-tg-row"><span>单步</span><div class="'+P+'-tg-sw on" id="'+P+'-tg-batch"><div class="'+P+'-tg-knob"></div></div><span>批量</span></div>'+
'<div id="'+P+'-queue"></div>'+
'<div class="'+P+'-acts" id="'+P+'-acts"></div>'+
'<div class="'+P+'-inp" id="'+P+'-inp-area"><textarea class="'+P+'-inp-ta" id="'+P+'-inp-ta" placeholder="自定义提示（可选）" rows="1"></textarea><div class="'+P+'-inp-send" id="'+P+'-inp-send">'+SVG.send+'</div></div>'+
'<div class="'+P+'-wait" id="'+P+'-wait">AI正在推演 <span class="'+P+'-dots"><span></span><span></span><span></span></span><br><button class="'+P+'-stop" id="'+P+'-stop-btn">'+SVG.stop+' 停止</button></div></div>'+
'<div class="'+P+'-page" id="'+P+'-page-result"><div style="padding:16px 14px" id="'+P+'-result-content"></div></div></div>'+
'<div class="'+P+'-panel" id="'+P+'-panel-settings"><div class="'+P+'-panel-hd"><button class="'+P+'-panel-back" id="'+P+'-settings-back">'+SVG.back+'</button><div class="'+P+'-panel-title">\u2699 设置</div></div><div class="'+P+'-panel-body" id="'+P+'-settings-content"></div></div>'+
'<div class="'+P+'-panel" id="'+P+'-panel-team"><div class="'+P+'-panel-hd"><button class="'+P+'-panel-back" id="'+P+'-team-back">'+SVG.back+'</button><div class="'+P+'-panel-title">队友指令</div></div><div class="'+P+'-panel-body"></div></div>'+
'</div></div>';

/* === 拖拽 === */
function initDrag(target, options) {
  options=options||{};
  var handle=options.handle?target.querySelector(options.handle):target;
  if(!handle) return;
  var sx,sy,ix,iy,moving=false,moved=false;
  handle.style.touchAction='none';
  handle.onpointerdown=function(e){if(e.pointerType==='mouse'&&e.button!==0)return;if(options.ignore&&e.target.closest(options.ignore))return;moving=true;moved=false;sx=e.clientX;sy=e.clientY;var r=target.getBoundingClientRect();ix=r.left;iy=r.top;handle.setPointerCapture(e.pointerId);target.classList.add('dragging');};
  handle.onpointermove=function(e){if(!moving)return;var dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&(Math.abs(dx)>6||Math.abs(dy)>6))moved=true;if(moved){var w=(window.top||window).innerWidth,h2=(window.top||window).innerHeight;target.style.left=Math.max(-target.offsetWidth/2,Math.min(ix+dx,w-target.offsetWidth/2))+'px';target.style.top=Math.max(0,Math.min(iy+dy,h2-50))+'px';target.style.right='auto';target.style.bottom='auto';}};
  handle.onpointerup=function(e){if(!moving)return;moving=false;target.classList.remove('dragging');handle.releasePointerCapture(e.pointerId);if(!moved&&options.onClick)options.onClick();};
  handle.onpointercancel=function(){moving=false;target.classList.remove('dragging');};
}

/* === 初始化 === */
function initPlugin() {
  log('战斗模拟器 v5.1 初始化...');
  var doc=getDoc();
  qa('#'+P+'-trigger,#'+P+'-overlay,#'+P+'-styles',doc).forEach(function(el){el.remove();});
  if(doc!==document){try{qa('#'+P+'-trigger,#'+P+'-overlay,#'+P+'-styles',document).forEach(function(el){el.remove();});}catch(e){}}
  doc.head.insertAdjacentHTML('beforeend',styles);
  doc.body.insertAdjacentHTML('beforeend',html);
  window.__btsActive=true;

  var trigger=doc.getElementById(P+'-trigger');
  var overlay=doc.getElementById(P+'-overlay');
  var frame=doc.getElementById(P+'-frame');
  var winW=(window.top||window).innerWidth, winH=(window.top||window).innerHeight;
  frame.style.left=(winW/2-185)+'px';
  frame.style.top=(winW<=1024?'50px':((winH/2-350)+'px'));

  initDrag(trigger,{onClick:function(){if(overlay.classList.contains('active'))closePanel();else openPanel();}});
  initDrag(frame,{handle:'.'+P+'-header',ignore:'.'+P+'-hbtn'});

  overlay.addEventListener('click',function(e){if(e.target===overlay&&!overlay.classList.contains('pinned'))closePanel();});
  qs('#'+P+'-close').addEventListener('click',closePanel);
  qs('#'+P+'-settings-btn').addEventListener('click',function(){renderSettingsPanel();qs('#'+P+'-panel-settings').classList.add('active');});
  qs('#'+P+'-settings-back').addEventListener('click',function(){qs('#'+P+'-panel-settings').classList.remove('active');});
  qs('#'+P+'-team-back').addEventListener('click',function(){qs('#'+P+'-panel-team').classList.remove('active');});
  qs('#'+P+'-pin-btn').addEventListener('click',function(){overlay.classList.toggle('pinned');});

  var themeBtn=qs('#'+P+'-theme-btn');
  if(themeBtn){
    var isLight=localStorage.getItem(P+'_theme')==='light';
    if(isLight){frame.classList.add('light');themeBtn.innerHTML=SVG.sun;}
    themeBtn.addEventListener('click',function(){var light=frame.classList.toggle('light');themeBtn.innerHTML=light?SVG.sun:SVG.moon;localStorage.setItem(P+'_theme',light?'light':'dark');});
  }

  qs('#'+P+'-sit-area').addEventListener('click',function(){this.classList.toggle('open');});
  qs('#'+P+'-tg-batch').addEventListener('click',function(){G.batchMode=!G.batchMode;this.classList.toggle('on',G.batchMode);});

  qs('#'+P+'-inp-send').addEventListener('click',function(){var ta=qs('#'+P+'-inp-ta');if(!ta)return;var text=ta.value.trim();if(!text){execStep();return;}G.queue.push({name:text});execStep();});
  qs('#'+P+'-inp-ta').addEventListener('keypress',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();qs('#'+P+'-inp-send').click();}});
  qs('#'+P+'-stop-btn').addEventListener('click',function(){G.currentGenId++;hideWait();appendSys('\u23F9 已停止');});

  checkLatestMessage(); renderIdlePage();
  log('\u2705 战斗模拟器 v5.1 就绪');
}

setupTriggerSystem();
if(isTargetCard()) initPlugin();
else{log('当前角色卡不匹配，插件待命');window.__btsActive=false;}
log('战斗模拟器 v5.1 已加载');

})();
