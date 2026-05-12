(async function() {
'use strict';

var PLUGIN_ID = 'nsfw-sim';
var P = 'nss';
var API_KEY = 'dlgd_api_config';
var PRESET_KEY = 'nss_presets_v3';

var TARGET_IDS = ['斗罗大陆','斗罗','Douluo','douluo','Soul Land','武魂殿','唐三','史莱克','魂导通讯器'];

var PHASE_NAMES = {prepare:'准备',foreplay:'前戏',main:'正式',climax:'高潮',aftermath:'余韵'};
var PHASE_ORDER = ['prepare','foreplay','main','climax','aftermath'];
var MOODS = ['温柔','激情','挑逗','粗暴','放缓'];

var ACTIONS = {
  prepare:[{id:'sweet',n:'甜言蜜语'},{id:'kiss',n:'亲吻'},{id:'touch',n:'身体接触'},{id:'undress',n:'脱衣服'},{id:'order_strip',n:'命令她脱'},{id:'tease',n:'挑逗'}],
  foreplay:[{id:'kiss_body',n:'亲吻身体'},{id:'caress',n:'抚摸'},{id:'oral',n:'口舌'},{id:'finger',n:'手指探入'},{id:'serve',n:'让她服务'},{id:'keep_tease',n:'继续挑逗'}],
  main:[{id:'enter',n:'进入'},{id:'change_pos',n:'换体位'},{id:'faster',n:'加速'},{id:'slower',n:'放慢'},{id:'deep',n:'深顶'},{id:'stop_inside',n:'停下'},{id:'add_act',n:'同时做别的'},{id:'special',n:'特殊玩法'}],
  climax:[{id:'continue',n:'继续'},{id:'hold',n:'忍住'},{id:'together',n:'一起'}],
  aftermath:[{id:'af_hug',n:'拥抱'},{id:'af_talk',n:'说话'},{id:'af_clean',n:'清理'},{id:'af_again',n:'再来一次'}]
};

var SPEECH_TYPES = [{id:'sweet_talk',n:'甜言蜜语'},{id:'dirty_talk',n:'脏话'},{id:'command',n:'命令'},{id:'comfort',n:'安慰'},{id:'praise',n:'夸奖'}];

var EJ_OPTIONS = [
  {cat:'体内',locs:['阴道深处','子宫口','菊穴']},
  {cat:'口内',locs:['射在嘴里','深喉']},
  {cat:'体外',locs:['腹部','胸部','脸上','臀部','大腿','背上']}
];

var G = createGameState();
function createGameState() {
  return {
    scene:'', situation:'', mood:'温柔', time:'', playerState:'', envType:'室内',
    npcs:[], currentTarget:0,
    phase:'prepare', step:0, style:'温柔',
    history:[], keyEvents:[],
    ejCount:0, intentCounter:0, currentGenId:0,
    ended:false, pendingData:null, ejExpanded:false
  };
}
function resetGameState() { G = createGameState(); return G; }

function createNpc(raw) {
  return {
    name: raw.name || '未知',
    attitude: raw.attitude || '被动',
    emotion: raw.emotion || '',
    relation: raw.relation || '',
    wearing: raw.wearing || '',
    body: raw.body || '',
    clothes: raw.clothes || [],
    clothesOrig: raw.clothesOrig || [],
    position: '面对面',
    sensitive: raw.sensitive || '',
    personality: raw.personality || '',
    personalityType: raw.personalityType || '',
    speechStyle: raw.speechStyle || '',
    bodyType: raw.bodyType || '普通',
    attitudeThisSex: raw.attitudeThisSex || '',
    attitudeToPlayer: raw.attitudeToPlayer || '',
    sexTendency: raw.sexTendency || '',
    experience: raw.experience || '无经验',
    mind: raw.mind || '',
    virginity: raw.virginity || '非处女',
    excStage: '平静',
    psychState: raw.psychState || '害羞',
    orgCount: 0,
    latestMind: '',
    latestTalk: ''
  };
}

function log(msg, d) {
  if (d !== undefined) console.log('[亲密模拟器] ' + msg, d);
  else console.log('[亲密模拟器] ' + msg);
}
function toast(msg, type) {
  try {
    if (type === 'err') toastr.error(msg);
    else if (type === 'warn') toastr.warning(msg);
    else if (type === 'info') toastr.info(msg);
    else toastr.success(msg);
  } catch(e) { log(msg); }
}
function getDoc() {
  try { return window.top ? window.top.document : document; }
  catch(e) { return document; }
}
function qs(sel, ctx) { return (ctx || getDoc()).querySelector(sel); }
function qa(sel, ctx) { return Array.from((ctx || getDoc()).querySelectorAll(sel)); }
function esc(s) { var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
function safe(v, fb) { return (v != null && v !== '' && v !== '待初始化') ? v : (fb || '--'); }

function getSTContext() {
  try {
    var win = window.top || window;
    return (win.SillyTavern && win.SillyTavern.getContext) ? win.SillyTavern.getContext() : null;
  } catch(e) { return null; }
}
function isTargetCard() {
  var ctx = getSTContext();
  if (!ctx) return false;
  var cn = ctx.name2 || '', cd = ctx.characterDescription || '', gid = ctx.groupId || '';
  if (!cn && !gid) return false;
  if (ctx.groups && gid) {
    var g = ctx.groups.find(function(g) { return g.id === gid; });
    if (g && g.name) {
      for (var i = 0; i < TARGET_IDS.length; i++) {
        if (g.name.includes(TARGET_IDS[i])) return true;
      }
    }
  }
  for (var i = 0; i < TARGET_IDS.length; i++) {
    if (cn.includes(TARGET_IDS[i]) || cd.includes(TARGET_IDS[i])) return true;
  }
  return false;
}
function getCharName() { var ctx = getSTContext(); return ctx ? (ctx.name2 || '') : ''; }
function getChatId() { var ctx = getSTContext(); return ctx ? (ctx.chatId || 'default') : 'default'; }

function destroyPlugin() {
  log('销毁');
  window.__nssActive = false;
  var doc = getDoc();
  qa('#' + P + '-trigger,#' + P + '-overlay,#' + P + '-styles', doc).forEach(function(el) { el.remove(); });
  if (doc !== document) {
    try { qa('#' + P + '-trigger,#' + P + '-overlay,#' + P + '-styles', document).forEach(function(el) { el.remove(); }); } catch(e) {}
  }
  try {
    var win = window.top || window;
    if (win.eventSource && win.event_types) {
      if (window.__nssChatH) { try { win.eventSource.removeListener(win.event_types.CHAT_CHANGED, window.__nssChatH); } catch(e) {} window.__nssChatH = null; }
      if (window.__nssMsgH) { try { win.eventSource.removeListener(win.event_types.CHARACTER_MESSAGE_RENDERED, window.__nssMsgH); } catch(e) {} window.__nssMsgH = null; }
    }
  } catch(e) {}
  if (window.__nssPoll) { clearInterval(window.__nssPoll); window.__nssPoll = null; }
  G = createGameState();
}
window.removeEventListener('pagehide', destroyPlugin);
window.addEventListener('pagehide', destroyPlugin);

function setupTriggerSystem() {
  if (window.__nssPoll) { clearInterval(window.__nssPoll); window.__nssPoll = null; }
  var lastChar = getCharName(), lastChat = getChatId();
  window.__nssPoll = setInterval(function() {
    var cn = getCharName(), ci = getChatId();
    if (cn !== lastChar || ci !== lastChat) { lastChar = cn; lastChat = ci; handleChatChange(); }
    checkLatestMessage();
  }, 2000);
  try {
    var win = window.top || window;
    if (win.eventSource && win.event_types) {
      if (window.__nssChatH) { try { win.eventSource.removeListener(win.event_types.CHAT_CHANGED, window.__nssChatH); } catch(e) {} }
      if (window.__nssMsgH) { try { win.eventSource.removeListener(win.event_types.CHARACTER_MESSAGE_RENDERED, window.__nssMsgH); } catch(e) {} }
      window.__nssChatH = function() { setTimeout(handleChatChange, 300); };
      win.eventSource.on(win.event_types.CHAT_CHANGED, window.__nssChatH);
      window.__nssMsgH = function() { setTimeout(checkLatestMessage, 500); };
      win.eventSource.on(win.event_types.CHARACTER_MESSAGE_RENDERED, window.__nssMsgH);
    }
  } catch(e) {}
}
function handleChatChange() {
  var isT = isTargetCard(), isA = window.__nssActive === true;
  if (isT && !isA) setTimeout(initPlugin, 400);
  else if (!isT && isA) destroyPlugin();
}
function activateTrigger() { var btn = qs('#' + P + '-trigger'); if (btn) btn.classList.add('active'); }
function deactivateTrigger() { var btn = qs('#' + P + '-trigger'); if (btn) btn.classList.remove('active'); }

function getApiConfig() {
  try { var s = localStorage.getItem(API_KEY); if (s) return JSON.parse(s); } catch(e) {}
  return { apiUrl:'', apiKey:'', model:'', savedModels:[] };
}
function normalizeUrl(url) {
  var u = url.trim().replace(/\/+$/, '');
  u = u.replace(/\/v1\/chat\/completions\/?$/, '').replace(/\/v1\/models\/?$/, '').replace(/\/v1\/?$/, '');
  return u;
}

async function callAI(userPrompt, maxTokens) {
  var cfg = getApiConfig();
  if (!cfg.apiUrl || !cfg.model) throw new Error('API未配置');
  var preset = getActivePreset();
  var sysPrompt = buildSystemPrompt(preset);
  maxTokens = maxTokens || parseInt(preset.maxTokens) || 2048;
  G.currentGenId++;
  var myId = G.currentGenId;

  try {
    var win = window.top || window;
    if (typeof win.generateRaw === 'function') {
      var gc = {
        should_silence: true, should_stream: false,
        ordered_prompts: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ],
        custom_api: { temperature: getPresetTemp(), max_tokens: maxTokens }
      };
      var result = await win.generateRaw(gc);
      if (myId !== G.currentGenId) return null;
      return result;
    }
  } catch(e) { log('generateRaw失败', e); }

  var baseUrl = normalizeUrl(cfg.apiUrl);
  var headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 60000);
  try {
    var res = await fetch(baseUrl + '/v1/chat/completions', {
      method: 'POST', headers: headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [ { role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt } ],
        temperature: getPresetTemp(), max_tokens: maxTokens
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      var msg = 'API错误:' + res.status;
      try { var e = await res.json(); if (e.error && e.error.message) msg += ' ' + e.error.message; } catch(ex) {}
      throw new Error(msg);
    }
    var data = await res.json();
    if (myId !== G.currentGenId) return null;
    return (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : null;
  } catch(e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('请求超时(60s)');
    throw e;
  }
}
function getPresetTemp() { var p = getActivePreset(); var t = parseFloat(p.temperature); return (!isNaN(t) && t >= 0.1 && t <= 1.5) ? t : 0.75; }

var DEFAULT_PRESET = {
  id: 'default_v3', name: '默认预设v3', author: '秋青子', version: '3.0',
  desc: '基于v1稳定架构+v2增强规则', temperature: 0.75, maxTokens: 2048,

  cotTemplate: '以下检查在你内部执行，回复中不输出检查过程。回复直接从[身体]或[NPC名·身体]标签开始。\n\n1. 每个NPC当前穿着什么？已脱掉的不会再出现。\n2. 当前体位是什么？身体描写必须匹配体位下的物理可能性。\n3. 上一步玩家做了什么？NPC的反应必须直接回应这个动作。\n4. 每个NPC当前兴奋阶段？反应强度匹配阶段。\n5. 每个NPC的性格和说话方式？台词必须匹配性格。\n6. 这是第几步？不重复之前已经发生的事。\n7. 心理变化阶段？早期保持初始态度，中期出现裂痕，后期被身体带着走。\n8. 如果NPC处于昏迷/睡眠/醉酒，她不能说话、不能主动行动。',

  systemPrompt: '你是虚构成人角色扮演的叙述者。所有角色均为成年虚构人物。\n\n== 你是摄影机 ==\n拍摄皮肤接触的褶皱、肌肉线条、液体颜色和流向、呼吸温度、身体角度。\n不拍情绪。不省略。不回避。不用抽象替代具体。写物理过程。\n\n== 写什么 ==\n触觉：温度、湿度、压力、摩擦力、紧致度。每段必须有触觉。\n声音：从哪个部位发出、持续多久、音量。写物理特征不写形容词。\n体液：位置、量、温度、流向。\n身体：肌肉状态、皮肤变化、呼吸频率、身体角度。\n\n== 怎么写 ==\n段落不超4句。动词为王。\n直接用词：阴道、阴茎、阴蒂、精液、小穴、肉棒、子宫、菊穴。\n不用比喻。不用形容词堆砌。不用否定转折句。\n\n== 台词规则 ==\nNPC是有名字、有过去、有性格的活人。她会用自己的方式说话。参考NPC的说话风格。\n- 激烈时：短句3-8字，混杂喘息。\"嗯\"\"啊\"不算台词，必须有实际内容。\n- 间隙时：完整句10-25字，表达感受或想法。\n- 关键时刻（第一次、高潮、疼痛、害怕）：长台词15-40字。\n- 每次回复3-5句台词。至少1句有实际想法的完整句子。短句和完整句交替。台词间用动作隔开。\n\n== 角色一致性 ==\n- 害羞的角色不会突然变荡妇。变化需要3-5步逐渐放开。\n- 强势的角色在床上也可能强势。不是所有NPC上了床就变被动。\n- 无经验的人不会做出老练的动作。\n- NPC有敏感部位。碰到敏感部位时反应更强烈。碰到非敏感部位时反应平淡。\n- NPC可以拒绝、可以主动、可以要求换方式。她是活人，不是接受一切的玩具。\n\n== 真实感 ==\n偶尔出现：姿势转换时可能滑出来、角度不对需要调整、体液是真实存在的。\n声音不是统一的\"啊啊啊\"——有人咬嘴唇不出声，有人哭出来，有人骂人。\n\n== 玩家自主权 ==\n- 玩家说温柔就写温柔，不可擅自变粗暴\n- 玩家说的动作必须按描述执行\n- 不替玩家做选择（内射/外射等）\n- 氛围标签决定整体基调，AI必须遵守',

  stateRules: {
    '昏迷': 'NPC处于昏迷/无意识状态。硬约束：绝对不说话、不主动动作。只描写被动身体反应：呼吸、肌肉松弛/紧绷、体温、液体。意图固定输出[意图|无]。',
    '醉酒': 'NPC意识模糊。口齿不清，反应迟缓。台词简短含糊。身体协调性差。',
    '睡眠': 'NPC在睡觉。未醒时：只有身体反应，无台词。被弄醒后迷糊数步，逐渐清醒。',
    '抗拒': 'NPC不情愿。台词中有拒绝和抵抗。身体可能有不自觉的反应，但主观上排斥。不要写成享受。',
    '顺从': 'NPC被动接受。不主动但不抵抗。台词少，多为回应。',
    '主动': 'NPC积极参与。会主动索要、引导、表达需求。台词丰富。',
    '束缚': 'NPC被束缚，不能自由活动。只能有有限的反应。挣扎的描写要符合束缚方式。',
    '药物': 'NPC意识清醒但身体不受控制。可以说话但无法抗拒身体反应。',
    '余韵': 'NPC处于高潮后的无力状态。对刺激过度敏感。四肢无力。意识恍惚。'
  },

  personalityRules: {
    '强势': '主动引导节奏，可能发出指令。声音清晰有力。台词强势。不是所有事都配合。',
    '温顺': '配合所有动作，声音细小，身体柔软被动。台词简短顺从。',
    '傲娇': '嘴上说不要但身体诚实，事后矢口否认快感。羞耻感强烈。台词有大量反差。',
    '冷淡': '表面无反应但身体会出卖她。沉默居多。高潮时可能只是呼吸加重。台词极少且短。',
    '热情': '主动索取，表达直接，可能比玩家还积极。声音放得开。台词丰富直白。',
    '阴沉': '安静地盯着玩家的眼睛。微笑或无表情。可能突然说出令人不安的话。声音平静。'
  },

  experienceRules: {
    '无经验': '她不知道该做什么。身体僵硬紧绷。需要玩家引导每一步。动作生涩笨拙。对新刺激反应强烈或恐惧。',
    '少量经验': '知道基本流程但技巧生涩。对新姿势反应强烈。开始发现自己的敏感点。',
    '丰富经验': '知道自己想要什么。会主动调整角度和节奏。可能教玩家。有固定的偏好和技巧。'
  },

  bodyTypeRules: {
    '娇小': '体重轻容易被抱起。容纳能力有限可能产生痛感。身高差导致某些体位需要调整。',
    '高挑': '四肢长可以缠绕。站立姿势更容易实现。',
    '丰满': '柔软度高。胸部在运动中有物理反应。触感柔软。',
    '健壮': '肌肉质感。力量对抗。耐力更强。'
  },

  envRules: {
    '室内': '安全私密空间。注意隔壁可能听到声音。',
    '公共': '在公共/危险区域。压低声音、动作受限、被发现的风险增加紧张感。',
    '野外': '地面硬度、温度等环境因素。可能需要铺垫衣物。',
    '水中': '水中环境。浮力影响体位选择。水的阻力影响节奏。'
  },

  psychCurve: '参考心理变化曲线：\n- 第1-3步：保持角色初始态度。害羞的就害羞，抗拒的就抗拒。身体反应轻微。\n- 第4-6步：开始出现裂痕。身体反应和心理态度产生矛盾。\n- 第7-9步：逐渐被身体反应带着走。台词开始碎片化。理性减弱。\n- 第10步以上：根据累积互动决定最终状态。\n如果NPC抗拒且没有被打动的理由，她可以一直抗拒。不要为了\"进度\"而强制转变。',

  aftermathRules: '事后阶段必须描写：\n- 身体状态：汗湿、疲惫、特定部位酸痛或红肿\n- 清理过程：体液处理\n- 心理状态：根据NPC性格和关系决定（满足/空虚/羞耻/后悔/亲密感）\n- 后续行为：穿衣/躺着/拥抱/逃走/沉默——由性格决定',

  bannedWords: '花径,花核,蜜穴,玉茎,甬道,欲仙欲死,共犯,虔诚,沙哑,喑哑,嘶哑,似乎,仿佛,如同,宛如,几乎,极度,无比,嘴角上扬,眼里闪过,指尖泛白,睫毛轻颤,下意识地,四肢百骸,血液沸腾,弓起身子,蜷缩脚趾,不自觉地,如触电般,白皙,如玉,酥胸,香肩,玉足,樱唇,贝齿,呢喃,低吟,娇喘,媚眼如丝,春情荡漾',

  outputFormatSingle: '[身体]\n（8-12句，NPC物理反应。触觉细节、声音物理特征、身体部位动作。）\n\n[台词]\n（3-5句台词。短句和完整句交替。至少1句有实际内容的完整句子。台词间穿插身体动作。）\n\n[内心]（仅在心理发生显著变化时输出）\n\n[脱掉|衣物名称]（如果本步有衣物被脱掉。没有则不写）\n\n[意图|意图类型]\n意图类型：无、想说话、想换体位、感到疼痛、即将高潮、请求停下、主动索要\n\n[状态|兴奋=阶段词|心理=状态词|阶段=当前阶段]\n兴奋：平静、微热、升温、燥热、临界\n心理：害羞、紧张、沉浸、主动、失控、恍惚、抗拒\n阶段：准备、前戏、正式、高潮临近、余韵',

  outputFormatMulti: '[NPC名·身体]\n（主要目标8-10句，旁观者3-5句）\n\n[NPC名·台词]\n（主要目标3-5句，旁观者1-2句）\n\n[NPC名·内心]（可选）\n\n[脱掉|NPC名|衣物名称]\n\n[NPC名·意图|意图类型]\n\n[NPC名·状态|兴奋=阶段词|心理=状态词]\n[阶段=当前阶段]'
};

function loadPresets() {
  try {
    var s = localStorage.getItem(PRESET_KEY);
    if (s) {
      var d = JSON.parse(s);
      if (!d.presets.find(function(p) { return p.id === 'default_v3'; })) d.presets.unshift(JSON.parse(JSON.stringify(DEFAULT_PRESET)));
      return d;
    }
  } catch(e) {}
  return { presets: [JSON.parse(JSON.stringify(DEFAULT_PRESET))], activeId: 'default_v3' };
}
function savePresets(data) { try { localStorage.setItem(PRESET_KEY, JSON.stringify(data)); } catch(e) {} }
function getActivePreset() {
  var data = loadPresets();
  return data.presets.find(function(p) { return p.id === data.activeId; }) || data.presets[0] || JSON.parse(JSON.stringify(DEFAULT_PRESET));
}
function setActivePreset(id) { var data = loadPresets(); if (data.presets.find(function(p) { return p.id === id; })) { data.activeId = id; savePresets(data); } }
function savePreset(preset) { var data = loadPresets(); var idx = data.presets.findIndex(function(p) { return p.id === preset.id; }); if (idx >= 0) data.presets[idx] = preset; else data.presets.push(preset); savePresets(data); }
function deletePreset(id) { if (id === 'default_v3') return false; var data = loadPresets(); data.presets = data.presets.filter(function(p) { return p.id !== id; }); if (data.activeId === id) data.activeId = 'default_v3'; savePresets(data); return true; }
function exportPreset(preset) {
  var json = JSON.stringify(preset, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'preset_' + preset.name + '.json'; a.click();
  URL.revokeObjectURL(url);
}
function importPresetFromFile(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var preset = JSON.parse(e.target.result);
        if (!preset.systemPrompt) { reject(new Error('无效的预设文件')); return; }
        preset.id = 'imported_' + Date.now();
        if (!preset.name) preset.name = '导入的预设';
        savePreset(preset);
        resolve(preset);
      } catch(err) { reject(err); }
    };
    reader.onerror = function() { reject(new Error('读取文件失败')); };
    reader.readAsText(file);
  });
}

function detectNpcState(npc) {
  if (!npc) return null;
  var ps = (npc.psychState || '').toLowerCase();
  var att = (npc.attitude || '').toLowerCase();
  if (ps.includes('昏迷') || ps.includes('无意识')) return '昏迷';
  if (ps.includes('睡') || ps.includes('睡眠')) return '睡眠';
  if (ps.includes('醉')) return '醉酒';
  if (ps.includes('束缚') || ps.includes('捆')) return '束缚';
  if (ps.includes('药物')) return '药物';
  if (ps.includes('余韵') || ps.includes('恍惚')) return '余韵';
  if (att.includes('抗拒') || ps.includes('抗拒')) return '抗拒';
  if (att.includes('顺从') || ps.includes('顺从')) return '顺从';
  if (att.includes('主动') || ps.includes('主动')) return '主动';
  return null;
}

function inferPersonalityType(npc) {
  if (npc.personalityType) return npc.personalityType;
  var p = (npc.personality || '').toLowerCase();
  if (p.includes('强势') || p.includes('霸道') || p.includes('女王')) return '强势';
  if (p.includes('温顺') || p.includes('温柔') || p.includes('柔弱')) return '温顺';
  if (p.includes('傲') || p.includes('别扭') || p.includes('口是心非')) return '傲娇';
  if (p.includes('冷') || p.includes('淡') || p.includes('高冷')) return '冷淡';
  if (p.includes('热情') || p.includes('开朗') || p.includes('大方')) return '热情';
  if (p.includes('阴') || p.includes('暗') || p.includes('病')) return '阴沉';
  return '';
}

function inferBodyType(npc) {
  if (npc.bodyType && npc.bodyType !== '普通') return npc.bodyType;
  var b = (npc.body || '').toLowerCase();
  if (b.includes('娇小') || b.includes('矮') || b.includes('小巧')) return '娇小';
  if (b.includes('高挑') || b.includes('修长')) return '高挑';
  if (b.includes('丰满') || b.includes('圆润') || b.includes('肉感')) return '丰满';
  if (b.includes('健壮') || b.includes('肌肉') || b.includes('结实')) return '健壮';
  return '普通';
}

function detectEnvType(scene) {
  if (!scene) return '室内';
  var s = scene.toLowerCase();
  if (s.includes('温泉') || s.includes('水中') || s.includes('浴池') || s.includes('泳')) return '水中';
  if (s.includes('森林') || s.includes('野外') || s.includes('山') || s.includes('草地')) return '野外';
  if (s.includes('街') || s.includes('训练场') || s.includes('广场') || s.includes('走廊') || s.includes('教室')) return '公共';
  return '室内';
}

function buildSystemPrompt(preset) {
  var sys = '';
  if (preset.cotTemplate) sys += preset.cotTemplate + '\n\n';
  sys += (preset.systemPrompt || '') + '\n\n';

  if (preset.stateRules && G.npcs.length > 0) {
    G.npcs.forEach(function(npc) {
      var state = detectNpcState(npc);
      if (state && preset.stateRules[state]) sys += '\n【硬约束 - ' + npc.name + '处于' + state + '状态】\n' + preset.stateRules[state] + '\n';
    });
  }
  if (preset.personalityRules && G.npcs.length > 0) {
    G.npcs.forEach(function(npc) {
      var pt = inferPersonalityType(npc);
      if (pt && preset.personalityRules[pt]) sys += '\n【' + npc.name + '性格类型：' + pt + '】\n' + preset.personalityRules[pt] + '\n';
    });
  }
  if (preset.experienceRules && G.npcs.length > 0) {
    G.npcs.forEach(function(npc) {
      if (npc.experience && preset.experienceRules[npc.experience]) sys += '\n【' + npc.name + '经验：' + npc.experience + '】\n' + preset.experienceRules[npc.experience] + '\n';
    });
  }
  if (preset.bodyTypeRules && G.npcs.length > 0) {
    G.npcs.forEach(function(npc) {
      var bt = inferBodyType(npc);
      if (bt && bt !== '普通' && preset.bodyTypeRules[bt]) sys += '\n【' + npc.name + '体型：' + bt + '】\n' + preset.bodyTypeRules[bt] + '\n';
    });
  }
  if (preset.envRules) {
    var envType = G.envType || detectEnvType(G.scene);
    if (envType && preset.envRules[envType]) sys += '\n【环境：' + envType + '】\n' + preset.envRules[envType] + '\n';
  }
  if (G.phase === 'aftermath' && preset.aftermathRules) sys += '\n【事后阶段】\n' + preset.aftermathRules + '\n';
  if (preset.psychCurve) sys += '\n当前第' + G.step + '步。\n' + preset.psychCurve + '\n';
  if (preset.bannedWords) {
    var words = (typeof preset.bannedWords === 'string') ? preset.bannedWords : preset.bannedWords.join(',');
    if (words) sys += '\n== 禁止词汇 ==\n' + words + '\n禁止句式：不是A而是B、与其说A不如说B\n禁止标签：<think>、<thinking>、<content>\n';
  }
  return sys;
}

function npcDataStr(npc) {
  var s = npc.name + '（' + npc.attitude + '）\n';
  s += '  穿着：' + (npc.clothes.length ? npc.clothes.join('、') : '全裸') + '\n';
  s += '  体位：' + npc.position + '\n';
  if (npc.body) s += '  身体：' + npc.body + '\n';
  if (npc.relation) s += '  关系：' + npc.relation + '\n';
  s += '  兴奋阶段：' + npc.excStage + '\n';
  s += '  心理：' + npc.psychState + '\n';
  if (npc.virginity === '处女') s += '  ★处女\n';
  s += '  经验：' + npc.experience + '\n';
  if (npc.sensitive) s += '  敏感部位：' + npc.sensitive + '\n';
  if (npc.personality) s += '  性格：' + npc.personality + '\n';
  if (npc.speechStyle) s += '  说话风格：' + npc.speechStyle + '\n';
  if (npc.attitudeThisSex) s += '  对本次态度：' + npc.attitudeThisSex + '\n';
  if (npc.attitudeToPlayer) s += '  对玩家态度：' + npc.attitudeToPlayer + '\n';
  if (npc.sexTendency) s += '  性爱倾向：' + npc.sexTendency + '\n';
  return s;
}

function buildHistoryBlock() {
  if (G.history.length === 0) return '';
  var recent = G.history.slice(-3);
  var h = '\n== 最近发生的事 ==\n';
  recent.forEach(function(r, i) {
    var stepNum = G.step - recent.length + i + 1;
    h += '[第' + stepNum + '步] 玩家：' + r.action + '\n';
    if (r.reactions) {
      r.reactions.forEach(function(rx) {
        if (rx.body) h += rx.name + '反应：' + rx.body.substring(0, 100) + '...\n';
        if (rx.talk) h += rx.name + '说：「' + rx.talk.substring(0, 50) + '」\n';
      });
    } else {
      if (r.body) h += '反应：' + r.body.substring(0, 100) + '...\n';
      if (r.talk) h += '说：「' + r.talk.substring(0, 50) + '」\n';
    }
  });
  return h;
}

function buildPrompt(actionName, customText) {
  var t = G.npcs[G.currentTarget];
  if (!t) return '';
  var preset = getActivePreset();
  var isMulti = G.npcs.length > 1;

  var p = '';
  if (isMulti) {
    p += '场景中有' + G.npcs.length + '个NPC。\n\n== 主要目标：' + t.name + ' ==\n' + npcDataStr(t) + '\n';
    G.npcs.forEach(function(n, i) {
      if (i !== G.currentTarget) p += '== 在场：' + n.name + ' ==\n' + npcDataStr(n) + '\n';
    });
  } else {
    p += '你正在扮演「' + t.name + '」。\n\n== 状态 ==\n' + npcDataStr(t) + '\n';
  }

  p += '== 当前 ==\n阶段：' + (PHASE_NAMES[G.phase] || G.phase) + '\n氛围：' + G.style + '\n场景：' + G.scene + '\n体位：' + t.position + '\n';
  var envType = G.envType || detectEnvType(G.scene);
  if (envType && envType !== '室内') p += '环境：' + envType + '\n';

  p += buildHistoryBlock();

  if (G.keyEvents.length) {
    p += '\n== 已发生 ==\n';
    G.keyEvents.slice(-8).forEach(function(e) { p += '- ' + e + '\n'; });
  }

  p += '\n== 玩家的行动 ==\n';
  if (customText) p += '玩家说了/做了：「' + customText + '」\n';
  else p += '玩家对' + t.name + '：' + actionName + '\n';
  p += '氛围要求：' + G.style + '\n';

  if (t.virginity === '处女' && G.phase === 'main' && (actionName === '进入' || (customText && customText.includes('进入'))))
    p += '\n【重要】这是' + t.name + '第一次被进入。必须描写撕裂感、疼痛、紧绷。\n';

  if (t.sensitive) {
    var sensWords = ['抚摸','亲吻','挑逗','口舌','手指','舔','吸','揉'];
    var hit = sensWords.some(function(w) { return (actionName && actionName.includes(w)) || (customText && customText.includes(w)); });
    if (hit) p += '\n提示：' + t.name + '的敏感部位是' + t.sensitive + '。碰到敏感部位反应更强烈。\n';
  }

  p += '\n== 请输出 ==\n';
  p += isMulti ? (preset.outputFormatMulti || DEFAULT_PRESET.outputFormatMulti) : (preset.outputFormatSingle || DEFAULT_PRESET.outputFormatSingle);
  return p;
}

function buildSkipPrompt() {
  var t = G.npcs[G.currentTarget];
  var phaseIdx = PHASE_ORDER.indexOf(G.phase);
  var nextPhase = phaseIdx < PHASE_ORDER.length - 1 ? PHASE_ORDER[phaseIdx + 1] : 'aftermath';
  var nextName = PHASE_NAMES[nextPhase] || '余韵';
  var preset = getActivePreset();
  var isMulti = G.npcs.length > 1;
  var p = '请推演当前阶段剩余并进入' + nextName + '。\n\n当前：' + (PHASE_NAMES[G.phase] || G.phase) + '，第' + G.step + '步\n氛围：' + G.style + '\n\n== ' + t.name + ' ==\n' + npcDataStr(t) + '\n';
  if (isMulti) G.npcs.forEach(function(n, i) { if (i !== G.currentTarget) p += '== ' + n.name + ' ==\n' + npcDataStr(n) + '\n'; });
  if (G.keyEvents.length) { p += '\n== 已发生 ==\n'; G.keyEvents.slice(-6).forEach(function(e) { p += '- ' + e + '\n'; }); }
  p += '\n用3-5句概括跳过部分，然后从' + nextName + '开始详细描写8-12句。\n\n格式：\n[跳过]\n（概括）\n[/跳过]\n\n';
  p += isMulti ? (preset.outputFormatMulti || DEFAULT_PRESET.outputFormatMulti) : (preset.outputFormatSingle || DEFAULT_PRESET.outputFormatSingle);
  return p;
}

function buildSkipToClimaxPrompt() {
  var t = G.npcs[G.currentTarget];
  var p = '请从当前推演到高潮。\n\n当前：' + (PHASE_NAMES[G.phase] || G.phase) + '，第' + G.step + '步\n氛围：' + G.style + '\n\n== ' + t.name + ' ==\n' + npcDataStr(t) + '\n';
  if (G.npcs.length > 1) G.npcs.forEach(function(n, i) { if (i !== G.currentTarget) p += '== ' + n.name + ' ==\n' + npcDataStr(n) + '\n'; });
  if (G.keyEvents.length) { p += '\n== 已发生 ==\n'; G.keyEvents.slice(-6).forEach(function(e) { p += '- ' + e + '\n'; }); }
  p += '\n用5-8句概括中间，然后详细描写高潮8-12句。\n\n格式：\n[过程]\n（中间概括+高潮详写）\n[/过程]\n[NPC高潮次数|数字]\n';
  var preset = getActivePreset();
  p += (G.npcs.length > 1) ? (preset.outputFormatMulti || DEFAULT_PRESET.outputFormatMulti) : (preset.outputFormatSingle || DEFAULT_PRESET.outputFormatSingle);
  return p;
}

function parseReactionSingle(text) {
  var r = { name:'', body:'', talk:'', mind:'', intentType:'无', excStage:'', psychState:'', phaseState:'', clothesRemoved:[] };
  var t = G.npcs[G.currentTarget];
  if (t) r.name = t.name;
  var bm = text.match(/[【\[]身体[】\]]([\s\S]*?)(?=[【\[]台词[】\]]|[【\[]内心[】\]]|[【\[]脱掉|[【\[]意图|[【\[]状态|$)/);
  if (bm) r.body = bm[1].trim();
  var tm = text.match(/[【\[]台词[】\]]([\s\S]*?)(?=[【\[]内心[】\]]|[【\[]脱掉|[【\[]意图|[【\[]状态|$)/);
  if (tm) { var t2 = tm[1].trim(); if (t2 !== '无' && t2) r.talk = t2; }
  var mm = text.match(/[【\[]内心[】\]]([\s\S]*?)(?=[【\[]脱掉|[【\[]意图|[【\[]状态|$)/);
  if (mm) r.mind = mm[1].trim();
  var clothesRe = /[【\[]脱掉[|｜]([^\]】]+)[】\]]/g;
  var cm; while ((cm = clothesRe.exec(text)) !== null) r.clothesRemoved.push(cm[1].trim());
  var im = text.match(/[【\[]意图[|｜]([^\]】]+)[】\]]/);
  if (im) r.intentType = im[1].trim();
  var smatch = text.match(/[【\[]状态[|｜]兴奋=([^|｜]*)[|｜]心理=([^|｜]*)[|｜]阶段=([^\]】]*)[】\]]/);
  if (smatch) { r.excStage = smatch[1].trim(); r.psychState = smatch[2].trim(); r.phaseState = smatch[3].trim(); }
  if (!r.body && text.length > 30) {
    r.body = text.substring(0, 1000);
    var quotes = text.match(/[「""]([^」""]+)[」""]/g);
    if (quotes && quotes.length) r.talk = quotes.slice(0, 3).map(function(q) { return q.replace(/[「」""]/g, ''); }).join('\n');
  }
  return r;
}

function parseReactionMulti(text) {
  var results = [];
  G.npcs.forEach(function(npc) {
    var r = { name: npc.name, body:'', talk:'', mind:'', intentType:'无', excStage:'', psychState:'', clothesRemoved:[] };
    var ne = npc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var bRe = new RegExp('[【\\[]' + ne + '[·.]身体[】\\]]([\\ s\\S]*?)(?=[【\\[]\\S+?[·.]身体|[【\\[]' + ne + '[·.]台词|[【\\[]' + ne + '[·.]内心|[【\\[]脱掉|[【\\[]' + ne + '[·.]意图|[【\\[]' + ne + '[·.]状态|[【\\[]阶段|$)');
    var bm2 = text.match(bRe); if (bm2) r.body = bm2[1].trim();
    var tRe = new RegExp('[【\\[]' + ne + '[·.]台词[】\\]]([\\ s\\S]*?)(?=[【\\[]\\S+?[·.]|[【\\[]脱掉|[【\\[]' + ne + '[·.]意图|[【\\[]' + ne + '[·.]状态|[【\\[]阶段|$)');
    var tm2 = text.match(tRe); if (tm2) { var t3 = tm2[1].trim(); if (t3 !== '无' && t3) r.talk = t3; }
    var mRe = new RegExp('[【\\[]' + ne + '[·.]内心[】\\]]([\\ s\\S]*?)(?=[【\\[]脱掉|[【\\[]\\S+?[·.]意图|[【\\[]\\S+?[·.]状态|[【\\[]阶段|$)');
    var mm2 = text.match(mRe); if (mm2) r.mind = mm2[1].trim();
    var cRe = new RegExp('[【\\[]脱掉[|｜]' + ne + '[|｜]([^\\]】]+)[】\\]]', 'g');
    var cm2; while ((cm2 = cRe.exec(text)) !== null) r.clothesRemoved.push(cm2[1].trim());
    var iRe = new RegExp('[【\\[]' + ne + '[·.]意图[|｜]([^\\]】]+)[】\\]]');
    var im2 = text.match(iRe); if (im2) r.intentType = im2[1].trim();
    var sRe = new RegExp('[【\\[]' + ne + '[·.]状态[|｜]兴奋=([^|｜]*)[|｜]心理=([^|｜]*)[】\\]]');
    var sm2 = text.match(sRe); if (sm2) { r.excStage = sm2[1].trim(); r.psychState = sm2[2].trim(); }
    results.push(r);
  });
  var phaseM = text.match(/[【\[]阶段=([^\]】]+)[】\]]/);
  var phaseState = phaseM ? phaseM[1].trim() : '';
  var hasContent = results.some(function(r) { return r.body || r.talk; });
  if (!hasContent) { var single = parseReactionSingle(text); single.name = G.npcs[G.currentTarget] ? G.npcs[G.currentTarget].name : ''; return { reactions: [single], phaseState: single.phaseState }; }
  return { reactions: results, phaseState: phaseState };
}

function mapPhase(s) {
  if (!s) return '';
  if (s.includes('准备')) return 'prepare'; if (s.includes('前戏')) return 'foreplay';
  if (s.includes('正式')) return 'main'; if (s.includes('高潮')) return 'climax';
  if (s.includes('余韵')) return 'aftermath'; return '';
}

function applyReactionToNpc(npcIdx, reaction) {
  var npc = G.npcs[npcIdx]; if (!npc) return;
  if (reaction.excStage) npc.excStage = reaction.excStage;
  if (reaction.psychState) npc.psychState = reaction.psychState;
  if (reaction.mind) npc.latestMind = reaction.mind;
  if (reaction.talk) npc.latestTalk = reaction.talk;
  if (reaction.clothesRemoved && reaction.clothesRemoved.length) {
    reaction.clothesRemoved.forEach(function(item) {
      var idx = npc.clothes.findIndex(function(c) { return c.includes(item) || item.includes(c); });
      if (idx >= 0) npc.clothes.splice(idx, 1);
    });
  }
  if (reaction.intentType === '即将高潮' && npc.excStage === '临界') {
    npc.orgCount++; npc.excStage = '升温';
    G.keyEvents.push(npc.name + '高潮（第' + npc.orgCount + '次）');
    appendSys('\u{1F338} ' + npc.name + ' 高潮了！');
  }
}

function findNpcByName(name) {
  return G.npcs.findIndex(function(n) { return n.name === name || n.name.includes(name) || name.includes(n.name); });
}

function checkLatestMessage() {
  var ctx = getSTContext();
  if (!ctx || !ctx.chat || !ctx.chat.length) return;
  var lastMsg = ctx.chat[ctx.chat.length - 1];
  if (!lastMsg || lastMsg.is_user) return;
  var text = lastMsg.mes || '';
  var match = text.match(/<nsfw_init>([\s\S]*?)<\/nsfw_init>/);
  if (!match) return;
  var parsed = parseNsfwData(match[1]);
  if (!parsed || parsed.npcs.length === 0) return;
  var msgId = lastMsg.send_date || lastMsg.mes_id || text.substring(0, 50);
  if (window.__nssLastTriggered === msgId) return;
  window.__nssLastTriggered = msgId;
  G.pendingData = parsed;
  G.envType = detectEnvType(parsed.scene);
  activateTrigger();
  log('检测到亲密数据', parsed);
}

function parseNsfwData(content) {
  var r = { scene:'', situation:'', mood:'', time:'', playerState:'', npcs:[] };
  var sm = content.match(/[【\[](场景)[】|]([^\]】]+)[】\]]?/); if (sm) r.scene = sm[2].trim();
  var si = content.match(/[【\[](情境)[】|]([^\]】]+)[】\]]?/); if (si) r.situation = si[2].trim();
  var mo = content.match(/[【\[](氛围)[】|]([^\]】]+)[】\]]?/); if (mo) r.mood = mo[2].trim();
  var ti = content.match(/[【\[](时间)[】|]([^\]】]+)[】\]]?/); if (ti) r.time = ti[2].trim();
  var ps = content.match(/[【\[](玩家状态)[】|]([^\]】]+)[】\]]?/); if (ps) r.playerState = ps[2].trim();

  var objP = /[【\[]对象[】|]([^|】]+)\|([^\]】]+)[】\]]/g;
  var om;
  while ((om = objP.exec(content)) !== null) {
    var rawNpc = { name: om[1].trim(), attitude: om[2].trim() };
    var blockStart = om.index + om[0].length;
    var blockEnd = content.length;
    var nextObj = content.indexOf('[对象|', blockStart);
    var nextObj2 = content.indexOf('【对象|', blockStart);
    if (nextObj > -1 && nextObj < blockEnd) blockEnd = nextObj;
    if (nextObj2 > -1 && nextObj2 < blockEnd) blockEnd = nextObj2;
    var block = content.substring(blockStart, blockEnd);
    var extract = function(label) {
      var re = new RegExp('[【\\[]' + label + '[】|]([^\\]】]+)[】\\]]?');
      var m = block.match(re); return m ? m[1].trim() : '';
    };
    rawNpc.emotion = extract('对象情绪');
    rawNpc.wearing = extract('对象穿着');
    rawNpc.body = extract('对象身体');
    rawNpc.mind = extract('对象内心');
    rawNpc.relation = extract('对象关系');
    rawNpc.personality = extract('对象性格');
    rawNpc.speechStyle = extract('对象说话风格');
    rawNpc.attitudeThisSex = extract('对象对本次态度');
    rawNpc.attitudeToPlayer = extract('对象对玩家态度');
    rawNpc.sexTendency = extract('对象性爱倾向');
    rawNpc.sensitive = extract('对象敏感部位');
    rawNpc.experience = extract('对象经验') || '无经验';
    rawNpc.virginity = extract('贞操') || '非处女';

    if (rawNpc.wearing) {
      rawNpc.clothes = rawNpc.wearing.split(/[、,，]/g).map(function(s) { return s.trim(); }).filter(Boolean);
      rawNpc.clothesOrig = rawNpc.clothes.slice();
    } else { rawNpc.clothes = []; rawNpc.clothesOrig = []; }

    rawNpc.psychState = rawNpc.attitude === '主动' ? '主动' : rawNpc.attitude === '抗拒' ? '抗拒' : '害羞';
    rawNpc.personalityType = inferPersonalityType(rawNpc);
    rawNpc.bodyType = inferBodyType(rawNpc);

    r.npcs.push(createNpc(rawNpc));
  }
  return r.npcs.length > 0 ? r : null;
}

/* ===== 新增：日/夜主题图标 ===== */
var SVG = {
  heart:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
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
  droplet:'<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  refresh:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  moon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  sun:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
};

/* ===== CSS - 新增light主题 ===== */
var styles = '<style id="' + P + '-styles">' +
':root{--ns-bg:#0a0e1a;--ns-bg2:#111827;--ns-sf:#1a1f35;--ns-sf2:#222842;--ns-ac:#d4587e;--ns-ac2:rgba(212,88,126,.12);--ns-t1:#e8e0d0;--ns-t2:#8090a0;--ns-t3:#4a5568;--ns-bd:rgba(212,88,126,.2);--ns-bd2:rgba(255,255,255,.08);--ns-r:14px;--ns-rs:8px;--ns-green:#2ecc71;--ns-red:#e74c3c}' +
'#' + P + '-trigger,.' + P + '-frame *{box-sizing:border-box}' +
'.' + P + '-trigger{position:fixed!important;top:58vh;left:18px;width:38px!important;height:38px!important;border-radius:50%!important;background:rgba(26,31,53,.9)!important;border:1.5px solid rgba(212,88,126,.3)!important;box-shadow:0 0 12px rgba(212,88,126,.1),0 4px 12px rgba(0,0,0,.4)!important;z-index:2147483645!important;cursor:grab;display:flex!important;align-items:center;justify-content:center;user-select:none;touch-action:none;transition:all .3s;color:rgba(212,88,126,.5)}' +
'.' + P + '-trigger:hover{transform:scale(1.08);color:var(--ns-ac)}' +
'.' + P + '-trigger.active{border-color:var(--ns-ac)!important;color:var(--ns-ac);animation:' + P + '-glow 2s ease-in-out infinite}' +
'.' + P + '-trigger.dragging{cursor:grabbing!important;opacity:.8;animation:none}' +
'@keyframes ' + P + '-glow{0%,100%{box-shadow:0 0 12px rgba(212,88,126,.15),0 4px 12px rgba(0,0,0,.4)}50%{box-shadow:0 0 20px rgba(212,88,126,.35),0 4px 12px rgba(0,0,0,.4)}}' +
'.' + P + '-overlay{position:fixed!important;inset:0;z-index:2147483644!important;display:none;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);pointer-events:none}' +
'.' + P + '-overlay.active{display:block!important;pointer-events:auto}' +
'.' + P + '-overlay.pinned{pointer-events:none;background:transparent;backdrop-filter:none}' +
'.' + P + '-overlay.pinned .' + P + '-frame{pointer-events:auto}' +
'.' + P + '-frame{position:absolute;width:370px;height:700px;max-width:95vw;max-height:92vh;background:var(--ns-bg);border-radius:18px;border:1px solid var(--ns-bd);box-shadow:0 0 30px rgba(212,88,126,.08),0 20px 60px rgba(0,0,0,.6);opacity:0;transform:scale(.95) translateY(15px);transition:opacity .35s,transform .35s;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif;color:var(--ns-t1);display:flex;flex-direction:column;overflow:hidden}' +
'.' + P + '-overlay.active .' + P + '-frame{opacity:1;transform:scale(1) translateY(0)}' +
/* ===== 日间主题 ===== */
'.' + P + '-frame.light{--ns-bg:#f5f0e8;--ns-bg2:#ede7dd;--ns-sf:#fff;--ns-sf2:#f8f4ee;--ns-ac:#c24a6e;--ns-ac2:rgba(194,74,110,.1);--ns-t1:#2a2520;--ns-t2:#6b6560;--ns-t3:#9a948e;--ns-bd:rgba(194,74,110,.25);--ns-bd2:rgba(0,0,0,.08)}' +
'.' + P + '-frame.light .' + P + '-narr{background:rgba(245,240,232,.6)}' +
'.' + P + '-frame.light .' + P + '-talk{background:rgba(194,74,110,.06)}' +
'.' + P + '-frame.light .' + P + '-header{background:rgba(237,231,221,.95)}' +
'.' + P + '-frame.light .' + P + '-panel-hd{background:rgba(237,231,221,.95)}' +
/* ===== 日间主题结束 ===== */
'.' + P + '-header{height:40px;flex-shrink:0;display:flex;align-items:center;padding:0 10px;border-bottom:1px solid var(--ns-bd2);background:rgba(17,24,39,.95);user-select:none;gap:6px}' +
'.' + P + '-header-title{flex:1;text-align:center;font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}' +
'.' + P + '-hbtn{width:26px;height:26px;border-radius:6px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ns-t2);transition:all .2s;flex-shrink:0}' +
'.' + P + '-hbtn:hover{background:rgba(255,255,255,.06);color:var(--ns-t1)}' +
'.' + P + '-body{flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column}' +
'.' + P + '-body::-webkit-scrollbar{width:3px}.' + P + '-body::-webkit-scrollbar-thumb{background:rgba(212,88,126,.2);border-radius:2px}' +
'.' + P + '-page{display:none;flex-direction:column;flex:1;min-height:0}.' + P + '-page.active{display:flex}' +
'.' + P + '-panel{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;background:var(--ns-bg2);transform:translateX(100%);transition:transform .3s cubic-bezier(.16,1,.3,1)}' +
'.' + P + '-panel.active{transform:translateX(0)}' +
'.' + P + '-panel-hd{height:40px;display:flex;align-items:center;padding:0 8px;flex-shrink:0;border-bottom:1px solid var(--ns-bd2);background:rgba(17,24,39,.95);gap:4px}' +
'.' + P + '-panel-back{border:none;background:none;cursor:pointer;padding:6px;display:flex;align-items:center;color:var(--ns-ac)}' +
'.' + P + '-panel-title{font-weight:600;font-size:13px;flex:1;text-align:center;margin-right:30px}' +
'.' + P + '-panel-body{flex:1;overflow-y:auto;padding:10px}' +
'.' + P + '-panel-body::-webkit-scrollbar{width:3px}.' + P + '-panel-body::-webkit-scrollbar-thumb{background:rgba(212,88,126,.2);border-radius:2px}' +
'.' + P + '-card{background:var(--ns-sf);border:1px solid var(--ns-bd2);border-radius:var(--ns-r);padding:10px 12px;margin-bottom:8px}' +
'.' + P + '-card-title{font-size:11px;font-weight:600;color:var(--ns-ac);margin-bottom:6px}' +
'.' + P + '-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}' +
'.' + P + '-row .k{color:var(--ns-t2)}.' + P + '-row .v{color:var(--ns-t1);text-align:right;max-width:60%}' +
'.' + P + '-btn{padding:7px 14px;border-radius:var(--ns-rs);border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t1);font-size:11px;font-weight:500;cursor:pointer;transition:all .2s;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:4px}' +
'.' + P + '-btn:hover{background:var(--ns-sf2);transform:translateY(-1px)}.' + P + '-btn:active{transform:scale(.96)}' +
'.' + P + '-btn.primary{background:var(--ns-ac2);border-color:var(--ns-ac);color:var(--ns-ac);font-weight:600}' +
'.' + P + '-btn.danger{border-color:var(--ns-red);color:var(--ns-red)}' +
'.' + P + '-btn:disabled{opacity:.3;cursor:not-allowed;transform:none}' +
'.' + P + '-tag{padding:2px 7px;border-radius:10px;font-size:9px;font-weight:500;background:var(--ns-ac2);color:var(--ns-ac)}' +
'.' + P + '-idle{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:30px;gap:16px;color:var(--ns-t2);text-align:center}' +
'.' + P + '-idle-icon{font-size:36px;opacity:.4}' +
'.' + P + '-prep{padding:12px;overflow-y:auto;flex:1}' +
'.' + P + '-scene-box{padding:8px 10px;border:1px solid var(--ns-bd2);border-radius:var(--ns-rs);background:var(--ns-sf);font-size:10px;color:var(--ns-t2);line-height:1.6;margin-bottom:8px}' +
'.' + P + '-npc-card{padding:10px 12px;margin-bottom:6px;background:var(--ns-sf);border-radius:var(--ns-r);border:1px solid var(--ns-bd2);border-left:3px solid var(--ns-ac)}' +
'.' + P + '-npc-name{font-size:12px;font-weight:700;margin-bottom:4px}' +
'.' + P + '-npc-info{font-size:10px;color:var(--ns-t2);line-height:1.7}.' + P + '-npc-info b{color:var(--ns-t1);font-weight:500}' +
'.' + P + '-style-row{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}' +
'.' + P + '-style-btn{padding:5px 12px;border-radius:16px;border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t2);font-size:10px;cursor:pointer;transition:all .2s}' +
'.' + P + '-style-btn:hover{border-color:var(--ns-ac)}' +
'.' + P + '-style-btn.active{background:var(--ns-ac2);border-color:var(--ns-ac);color:var(--ns-ac);font-weight:600}' +
'.' + P + '-mood-bar{padding:4px 12px;border-bottom:1px solid var(--ns-bd2);font-size:10px;color:var(--ns-ac);background:rgba(212,88,126,.04);display:flex;align-items:center;gap:4px;flex-shrink:0}' +
'.' + P + '-npc-bar{padding:4px 10px;border-bottom:1px solid var(--ns-bd2);display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap}' +
'.' + P + '-npc-btn{padding:4px 12px;border-radius:14px;border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t1);font-size:10px;font-weight:600;cursor:pointer;transition:all .2s}' +
'.' + P + '-npc-btn:hover{border-color:var(--ns-ac)}' +
'.' + P + '-npc-btn.active{border-color:var(--ns-ac);background:var(--ns-ac2);color:var(--ns-ac)}' +
'.' + P + '-npc-stat{padding:5px 12px;border-bottom:1px solid var(--ns-bd2);font-size:10px;color:var(--ns-t2);flex-shrink:0;cursor:pointer;transition:background .15s}' +
'.' + P + '-npc-stat:hover{background:rgba(255,255,255,.03)}' +
'.' + P + '-npc-stat-detail{display:none;padding:4px 0;font-size:9px;color:var(--ns-t2);line-height:1.7}' +
'.' + P + '-npc-stat.open .' + P + '-npc-stat-detail{display:block}' +
'.' + P + '-expand-icon{font-size:8px;color:var(--ns-t3);transition:transform .3s}' +
'.' + P + '-npc-stat.open .' + P + '-expand-icon{transform:rotate(180deg)}' +
'.' + P + '-narr{flex:1;overflow-y:auto;padding:10px 12px;font-size:11px;line-height:1.85;background:rgba(10,14,26,.6);color:var(--ns-t1);min-height:0}' +
'.' + P + '-narr::-webkit-scrollbar{width:3px}.' + P + '-narr::-webkit-scrollbar-thumb{background:rgba(212,88,126,.15);border-radius:2px}' +
'.' + P + '-seg{margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed var(--ns-bd2)}' +
'.' + P + '-seg:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}' +
'.' + P + '-seg-hd{font-size:9px;color:var(--ns-t3);margin-bottom:2px;font-weight:600}' +
'.' + P + '-seg-body{line-height:1.85}' +
'.' + P + '-talk{color:var(--ns-ac);font-weight:500;margin:3px 0;padding:3px 8px;border-left:2px solid var(--ns-ac);background:rgba(212,88,126,.06);border-radius:0 5px 5px 0;font-size:10px;line-height:1.7}' +
'.' + P + '-talk-name{font-size:8px;color:var(--ns-t3);font-weight:600}' +
'.' + P + '-sys{color:var(--ns-t3);font-size:9px;text-align:center;margin:5px 0;font-weight:500}' +
'.' + P + '-intent{margin:6px 0;padding:8px 10px;border:1px solid rgba(212,88,126,.2);border-radius:var(--ns-rs);background:rgba(212,88,126,.04);animation:' + P + '-fi .3s ease-out}' +
'.' + P + '-intent.resolved{opacity:.3;pointer-events:none}' +
'.' + P + '-intent-hd{font-size:10px;font-weight:600;color:var(--ns-ac);margin-bottom:4px}' +
'.' + P + '-intent-body{font-size:9px;color:var(--ns-t1);line-height:1.6;margin-bottom:6px}' +
'.' + P + '-intent-btns{display:flex;flex-wrap:wrap;gap:3px}' +
'.' + P + '-intent-btn{padding:4px 10px;border:1px solid var(--ns-bd2);border-radius:5px;background:var(--ns-sf);color:var(--ns-t1);font-size:9px;cursor:pointer;transition:all .15s}' +
'.' + P + '-intent-btn:hover{background:var(--ns-ac2);border-color:var(--ns-ac)}' +
'.' + P + '-intent-inp{width:100%;padding:4px 8px;border:1px solid var(--ns-bd2);border-radius:5px;background:rgba(26,31,53,.5);color:var(--ns-t1);font-size:9px;outline:none;margin-top:3px;font-family:inherit}' +
'.' + P + '-intent-inp:focus{border-color:var(--ns-ac)}' +
'@keyframes ' + P + '-fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}' +
'.' + P + '-mind{padding:4px 12px;border-bottom:1px solid var(--ns-bd2);cursor:pointer;flex-shrink:0}' +
'.' + P + '-mind:hover{background:rgba(255,255,255,.03)}' +
'.' + P + '-mind-tog{font-size:8px;color:var(--ns-t3);text-align:center}' +
'.' + P + '-mind-ct{display:none;padding:3px 0;font-size:9px;color:var(--ns-ac);font-style:italic;line-height:1.6}' +
'.' + P + '-mind.open .' + P + '-mind-ct{display:block}' +
'.' + P + '-acts{padding:6px 10px;flex-shrink:0;overflow-y:auto;max-height:140px;border-top:1px solid var(--ns-bd2)}' +
'.' + P + '-act-grp{margin-bottom:4px}.' + P + '-act-grp:last-child{margin-bottom:0}' +
'.' + P + '-act-lbl{font-size:8px;font-weight:600;color:var(--ns-t3);margin-bottom:2px;text-transform:uppercase;letter-spacing:.3px}' +
'.' + P + '-act-wrap{display:flex;flex-wrap:wrap;gap:3px}' +
'.' + P + '-ab{padding:5px 9px;border:1px solid var(--ns-bd2);border-radius:5px;background:var(--ns-sf);color:var(--ns-t1);font-size:9px;font-weight:500;cursor:pointer;transition:all .2s}' +
'.' + P + '-ab:hover{background:var(--ns-sf2);transform:translateY(-1px)}.' + P + '-ab:active{transform:scale(.96)}' +
'.' + P + '-ab.mood{border-color:rgba(212,88,126,.2);background:rgba(212,88,126,.04)}' +
'.' + P + '-ab.mood.active{background:var(--ns-ac2);border-color:var(--ns-ac);color:var(--ns-ac);font-weight:600}' +
'.' + P + '-ab.ctrl{border-color:rgba(46,204,113,.2);background:rgba(46,204,113,.04)}' +
'.' + P + '-ab.ej{border-color:rgba(231,76,60,.2);background:rgba(231,76,60,.04);color:var(--ns-red)}' +
'.' + P + '-ab.end{border-color:rgba(100,100,120,.2);background:rgba(80,80,100,.04)}' +
'.' + P + '-ab.speech{border-color:rgba(52,152,219,.2);background:rgba(52,152,219,.04);color:#3498db}' +
'.' + P + '-ej-row{display:none;padding:4px 10px;border-top:1px solid var(--ns-bd2);flex-shrink:0}' +
'.' + P + '-ej-row.active{display:block}' +
'.' + P + '-ej-cat{font-size:8px;color:var(--ns-t3);font-weight:600;margin:3px 0 2px}' +
'.' + P + '-inp{padding:5px 10px;border-top:1px solid var(--ns-bd2);flex-shrink:0;display:flex;gap:5px;align-items:flex-end}' +
'.' + P + '-inp-ta{flex:1;min-height:28px;max-height:48px;padding:5px 8px;border:1px solid var(--ns-bd2);border-radius:6px;background:rgba(26,31,53,.5);color:var(--ns-t1);font-size:10px;font-family:inherit;outline:none;resize:none;line-height:1.4}' +
'.' + P + '-inp-ta:focus{border-color:var(--ns-ac)}.' + P + '-inp-ta::placeholder{color:var(--ns-t3)}' +
'.' + P + '-inp-send{padding:5px 10px;border:1px solid var(--ns-ac);border-radius:6px;background:var(--ns-ac2);color:var(--ns-ac);font-size:9px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:3px}' +
'.' + P + '-inp-send:hover{background:var(--ns-ac);color:#fff}' +
'.' + P + '-wait{text-align:center;padding:14px;color:var(--ns-t3);font-size:10px;display:none}' +
'.' + P + '-dots span{display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--ns-ac);margin:0 2px;animation:' + P + '-db 1.4s ease-in-out infinite}' +
'.' + P + '-dots span:nth-child(2){animation-delay:.2s}.' + P + '-dots span:nth-child(3){animation-delay:.4s}' +
'@keyframes ' + P + '-db{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-5px);opacity:1}}' +
'.' + P + '-stop{margin-top:6px;padding:4px 12px;border:1px solid rgba(231,76,60,.3);border-radius:6px;background:rgba(231,76,60,.08);color:var(--ns-red);font-size:9px;font-weight:600;cursor:pointer}' +
'.' + P + '-retry{display:inline-flex;align-items:center;gap:2px;padding:2px 8px;border:1px solid var(--ns-bd2);border-radius:5px;background:var(--ns-sf);color:var(--ns-ac);font-size:8px;cursor:pointer;margin-left:4px}' +
'.' + P + '-retry:hover{background:var(--ns-ac2);border-color:var(--ns-ac)}' +
'.' + P + '-result{padding:16px 14px;text-align:center}' +
'.' + P + '-result-icon{font-size:28px;margin-bottom:8px}' +
'.' + P + '-result-title{font-size:14px;font-weight:700;color:var(--ns-ac);margin-bottom:10px}' +
'.' + P + '-result-stats{font-size:11px;color:var(--ns-t2);line-height:1.8;margin-bottom:12px}.' + P + '-result-stats b{color:var(--ns-t1);font-weight:600}' +
'.' + P + '-result-btns{display:flex;flex-direction:column;gap:6px;align-items:center}' +
'.' + P + '-setting-grp{margin-bottom:12px}' +
'.' + P + '-setting-lbl{font-size:10px;color:var(--ns-ac);margin-bottom:4px;font-weight:600}' +
'.' + P + '-setting-ta{width:100%;min-height:80px;max-height:200px;padding:7px 10px;border-radius:6px;border:1px solid var(--ns-bd2);background:var(--ns-sf);color:var(--ns-t1);font-size:10px;font-family:inherit;outline:none;resize:vertical;line-height:1.5}' +
'.' + P + '-setting-ta:focus{border-color:var(--ns-ac)}' +
'.' + P + '-setting-hint{font-size:9px;color:var(--ns-t3);margin-top:2px}' +
'.' + P + '-setting-btns{display:flex;gap:5px;flex-wrap:wrap}' +
'.' + P + '-preset-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--ns-bd2);border-radius:var(--ns-rs);margin-bottom:5px;cursor:pointer;transition:all .15s}' +
'.' + P + '-preset-item:hover{background:rgba(255,255,255,.03)}' +
'.' + P + '-preset-item.active{border-color:var(--ns-ac);background:var(--ns-ac2)}' +
'.' + P + '-preset-radio{width:14px;height:14px;border-radius:50%;border:2px solid var(--ns-t3);flex-shrink:0;display:flex;align-items:center;justify-content:center}' +
'.' + P + '-preset-item.active .' + P + '-preset-radio{border-color:var(--ns-ac)}' +
'.' + P + '-preset-item.active .' + P + '-preset-radio::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--ns-ac)}' +
'.' + P + '-preset-info{flex:1;overflow:hidden}' +
'.' + P + '-preset-name{font-size:11px;font-weight:600}' +
'.' + P + '-preset-author{font-size:9px;color:var(--ns-t3)}' +
'.' + P + '-edit-tabs{display:flex;border-bottom:1px solid var(--ns-bd2);margin-bottom:8px;flex-wrap:wrap}' +
'.' + P + '-edit-tab{flex:1;padding:6px;text-align:center;font-size:9px;cursor:pointer;color:var(--ns-t2);border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;min-width:50px}' +
'.' + P + '-edit-tab:hover{color:var(--ns-t1)}.' + P + '-edit-tab.active{color:var(--ns-ac);border-bottom-color:var(--ns-ac)}' +
'.' + P + '-edit-content{display:none}.' + P + '-edit-content.active{display:block}' +
'.' + P + '-status{padding:6px 10px;border-radius:6px;font-size:10px;margin-top:6px}' +
'.' + P + '-status.ok{border:1px solid rgba(46,204,113,.2);color:var(--ns-green);background:rgba(46,204,113,.05)}' +
'@media(max-width:400px){.' + P + '-frame{padding:0}.' + P + '-ab{padding:6px 10px;font-size:10px}}' +
'</style>';

/* ===== HTML - 新增theme-btn ===== */
var html = '<div id="' + P + '-trigger" class="' + P + '-trigger">' + SVG.heart + '</div>' +
'<div id="' + P + '-overlay" class="' + P + '-overlay"><div id="' + P + '-frame" class="' + P + '-frame">' +
'<div class="' + P + '-header" id="' + P + '-header">' +
'<button class="' + P + '-hbtn" id="' + P + '-close">' + SVG.x + '</button>' +
'<div class="' + P + '-header-title" id="' + P + '-htitle">\u{1F495} 亲密模拟</div>' +
'<button class="' + P + '-hbtn" id="' + P + '-settings-btn">' + SVG.settings + '</button>' +
'<button class="' + P + '-hbtn" id="' + P + '-theme-btn">' + SVG.moon + '</button>' +
'<button class="' + P + '-hbtn" id="' + P + '-pin-btn">' + SVG.pin + '</button></div>' +
'<div class="' + P + '-body" id="' + P + '-body">' +
'<div class="' + P + '-page active" id="' + P + '-page-idle"><div class="' + P + '-idle">' +
'<div class="' + P + '-idle-icon">\u{1F495}</div>' +
'<div style="font-size:12px;line-height:1.6">等待剧情触发…<br><span style="font-size:10px;color:var(--ns-t3)">AI输出亲密场景标签后自动激活</span></div>' +
'<div class="' + P + '-card" style="width:100%;text-align:left"><div class="' + P + '-card-title">\u{1F4CB} 状态</div>' +
'<div class="' + P + '-row"><span class="k">预设</span><span class="v" id="' + P + '-idle-preset">--</span></div>' +
'<div class="' + P + '-row"><span class="k">API</span><span class="v" id="' + P + '-idle-api">未配置</span></div></div></div></div>' +
'<div class="' + P + '-page" id="' + P + '-page-prep"><div class="' + P + '-prep" id="' + P + '-prep-content"></div></div>' +
'<div class="' + P + '-page" id="' + P + '-page-interact">' +
'<div class="' + P + '-mood-bar" id="' + P + '-mood-bar">\u{1F4AB} 温柔 · 准备 · 第0步</div>' +
'<div class="' + P + '-npc-bar" id="' + P + '-npc-bar"></div>' +
'<div class="' + P + '-npc-stat" id="' + P + '-npc-stat"><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;align-items:center;gap:5px;flex:1;overflow:hidden"><b id="' + P + '-npc-name" style="font-size:10px;font-weight:600">--</b><div id="' + P + '-npc-tags" style="display:flex;gap:3px"></div></div><span class="' + P + '-expand-icon">\u25BC</span></div><div class="' + P + '-npc-stat-detail" id="' + P + '-npc-detail"></div></div>' +
'<div class="' + P + '-narr" id="' + P + '-narr"><div class="' + P + '-sys">等待你的行动…</div></div>' +
'<div class="' + P + '-mind" id="' + P + '-mind-area"><div class="' + P + '-mind-tog">\u25BC NPC内心</div><div class="' + P + '-mind-ct" id="' + P + '-mind-ct">…</div></div>' +
'<div class="' + P + '-acts" id="' + P + '-acts"></div>' +
'<div class="' + P + '-ej-row" id="' + P + '-ej-row"></div>' +
'<div class="' + P + '-inp" id="' + P + '-inp-area"><textarea class="' + P + '-inp-ta" id="' + P + '-inp-ta" placeholder="想做什么？说什么？直接输入…" rows="1"></textarea><div class="' + P + '-inp-send" id="' + P + '-inp-send">' + SVG.send + '</div></div>' +
'<div class="' + P + '-wait" id="' + P + '-wait">等待中 <span class="' + P + '-dots"><span></span><span></span><span></span></span><br><button class="' + P + '-stop" id="' + P + '-stop-btn">' + SVG.stop + ' 停止</button></div></div>' +
'<div class="' + P + '-page" id="' + P + '-page-result"><div class="' + P + '-result" id="' + P + '-result-content"></div></div></div>' +
'<div class="' + P + '-panel" id="' + P + '-panel-settings"><div class="' + P + '-panel-hd"><button class="' + P + '-panel-back" id="' + P + '-settings-back">' + SVG.back + '</button><div class="' + P + '-panel-title">\u2699 设置</div></div><div class="' + P + '-panel-body" id="' + P + '-settings-content"></div></div>' +
'</div></div>';

function showPage(id) { qa('.' + P + '-page').forEach(function(p) { p.classList.remove('active'); }); var page = qs('#' + P + '-page-' + id); if (page) page.classList.add('active'); }
function openPanel() {
  var overlay = qs('#' + P + '-overlay'); if (!overlay) return;
  overlay.classList.add('active');
  if (G.pendingData && !G.ended && G.step === 0) { renderPrepPage(G.pendingData); showPage('prep'); }
  else if (G.step > 0 && !G.ended) showPage('interact');
  else { renderIdlePage(); showPage('idle'); }
}
function closePanel() { var overlay = qs('#' + P + '-overlay'); if (overlay && !overlay.classList.contains('pinned')) overlay.classList.remove('active'); }

function renderIdlePage() {
  var preset = getActivePreset(); var apiCfg = getApiConfig();
  var el1 = qs('#' + P + '-idle-preset'); var el2 = qs('#' + P + '-idle-api');
  if (el1) el1.textContent = preset.name || '--';
  if (el2) el2.textContent = apiCfg.model ? ('\u2705 ' + apiCfg.model) : '\u274C 未配置';
}

function renderPrepPage(data) {
  var container = qs('#' + P + '-prep-content'); if (!container) return;
  var h = '';
  if (data.scene) {
    h += '<div class="' + P + '-scene-box">\u{1F4CD} ' + esc(data.scene);
    if (data.situation) h += '<br>\u{1F4DD} ' + esc(data.situation);
    if (data.time) h += '<br>\u{1F550} ' + esc(data.time);
    var envType = detectEnvType(data.scene);
    if (envType) h += '<br>\u{1F30D} 环境：' + esc(envType);
    h += '</div>';
  }
  data.npcs.forEach(function(n) {
    h += '<div class="' + P + '-npc-card"><div class="' + P + '-npc-name">' + esc(n.name) + '</div><div class="' + P + '-npc-info">';
    h += '态度：<b>' + esc(n.attitude) + '</b>';
    if (n.emotion) h += ' · ' + esc(n.emotion);
    h += '<br>';
    if (n.wearing) h += '穿着：<b>' + esc(n.wearing) + '</b><br>';
    if (n.body) h += '身体：<b>' + esc(n.body) + '</b><br>';
    if (n.relation) h += '关系：<b>' + esc(n.relation) + '</b><br>';
    if (n.attitudeThisSex) h += '本次：<b>' + esc(n.attitudeThisSex) + '</b><br>';
    if (n.virginity === '处女') h += '<b style="color:var(--ns-ac)">处女</b> · ';
    h += esc(n.experience);
    h += '</div></div>';
  });
  h += '<div class="' + P + '-card"><div class="' + P + '-card-title">\u{1F4AB} 风格</div><div class="' + P + '-style-row" id="' + P + '-style-row">';
  MOODS.forEach(function(m) { h += '<div class="' + P + '-style-btn' + (m === (data.mood || '温柔') ? ' active' : '') + '" data-style="' + m + '">' + m + '</div>'; });
  h += '</div></div>';
  h += '<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">';
  h += '<button class="' + P + '-btn primary" id="' + P + '-start-btn" style="padding:12px;font-size:12px">' + SVG.play + ' 开始互动</button>';
  h += '<button class="' + P + '-btn" id="' + P + '-cancel-prep" style="padding:8px;font-size:11px">' + SVG.x + ' 取消</button></div>';
  container.innerHTML = h;
  container.querySelectorAll('[data-style]').forEach(function(el) {
    el.addEventListener('click', function() {
      container.querySelectorAll('.' + P + '-style-btn').forEach(function(b) { b.classList.remove('active'); });
      el.classList.add('active'); G.style = el.dataset.style;
    });
  });
  qs('#' + P + '-start-btn').addEventListener('click', function() { startInteraction(data); });
  qs('#' + P + '-cancel-prep').addEventListener('click', function() { sendCancelToMainAI(); showPage('idle'); deactivateTrigger(); });
}

function startInteraction(data) {
  resetGameState();
  G.scene = data.scene; G.situation = data.situation; G.mood = data.mood || '温柔';
  G.time = data.time; G.playerState = data.playerState;
  G.npcs = data.npcs; G.currentTarget = 0; G.style = data.mood || '温柔';
  G.pendingData = data; G.envType = detectEnvType(data.scene);
  var narr = qs('#' + P + '-narr'); if (narr) narr.innerHTML = '<div class="' + P + '-sys">等待你的行动…</div>';
  var mind = qs('#' + P + '-mind-ct'); if (mind) mind.textContent = '…';
  /* ===== 修复：场景名截取缩短 ===== */
  var ht = qs('#' + P + '-htitle');
  if (ht) {
    var short = data.scene.length > 8 ? data.scene.substring(0, 8) + '…' : data.scene;
    ht.textContent = '\u{1F495} ' + short;
  }
  renderNpcBar(); updateNpcStat(); renderActions(); showPage('interact');
}

function renderNpcBar() {
  var bar = qs('#' + P + '-npc-bar'); if (!bar) return;
  if (G.npcs.length <= 1) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  var h = '';
  G.npcs.forEach(function(n, i) { h += '<div class="' + P + '-npc-btn' + (i === G.currentTarget ? ' active' : '') + '" data-idx="' + i + '">' + esc(n.name) + '</div>'; });
  bar.innerHTML = h;
  bar.querySelectorAll('.' + P + '-npc-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      G.currentTarget = parseInt(btn.dataset.idx);
      renderNpcBar(); updateNpcStat(); renderActions();
      appendSys('\u2500\u2500 切换目标：' + G.npcs[G.currentTarget].name + ' \u2500\u2500');
    });
  });
}

/* ===== 修改：删除excStage和psychState标签 ===== */
function updateNpcStat() {
  var t = G.npcs[G.currentTarget]; if (!t) return;
  var nameEl = qs('#' + P + '-npc-name'); if (nameEl) nameEl.textContent = t.name;
  var tagsEl = qs('#' + P + '-npc-tags');
  if (tagsEl) {
    var tags = '';
    if (t.orgCount > 0) tags += '<span class="' + P + '-tag">\u{1F338}\u00d7' + t.orgCount + '</span>';
    tags += '<span class="' + P + '-tag">\u{1F4D0}' + t.position + '</span>';
    tagsEl.innerHTML = tags;
  }
  var detailEl = qs('#' + P + '-npc-detail');
  if (detailEl) {
    var d = '\u{1F457} ' + (t.clothes.length ? t.clothes.join('、') : '全裸');
    if (t.body) d += '<br>\u{1F4D0} ' + t.body;
    if (t.virginity === '处女') d += '<br>\u2B50 处女';
    d += '<br>\u{1F3AD} ' + t.experience;
    if (t.sensitive) d += '<br>\u{1F497} 敏感：' + t.sensitive;
    detailEl.innerHTML = d;
  }
  var moodBar = qs('#' + P + '-mood-bar');
  if (moodBar) moodBar.textContent = '\u{1F4AB} ' + G.style + ' \u00b7 ' + (PHASE_NAMES[G.phase] || G.phase) + ' \u00b7 第' + G.step + '步';
}

function appendSys(text) { var narr = qs('#' + P + '-narr'); if (!narr) return; narr.insertAdjacentHTML('beforeend', '<div class="' + P + '-sys">' + text + '</div>'); narr.scrollTop = narr.scrollHeight; }

function appendSegment(action, npcName, body, talk) {
  var narr = qs('#' + P + '-narr'); if (!narr) return;
  var h = '<div class="' + P + '-seg"><div class="' + P + '-seg-hd">\u2500\u2500 ' + esc(action) + ' \u2500\u2500</div>';
  if (body) h += '<div class="' + P + '-seg-body">' + body.replace(/\n/g, '<br>') + '</div>';
  if (talk) { h += '<div class="' + P + '-talk">'; if (npcName) h += '<div class="' + P + '-talk-name">' + esc(npcName) + '</div>'; h += talk.replace(/\n/g, '<br>') + '</div>'; }
  h += '</div>';
  narr.insertAdjacentHTML('beforeend', h); narr.scrollTop = narr.scrollHeight;
}

function appendMultiSegment(action, reactions) {
  var narr = qs('#' + P + '-narr'); if (!narr) return;
  var h = '<div class="' + P + '-seg"><div class="' + P + '-seg-hd">\u2500\u2500 ' + esc(action) + ' \u2500\u2500</div>';
  reactions.forEach(function(r) {
    if (r.body) h += '<div class="' + P + '-seg-body">' + r.body.replace(/\n/g, '<br>') + '</div>';
    if (r.talk) h += '<div class="' + P + '-talk"><div class="' + P + '-talk-name">' + esc(r.name) + '</div>' + r.talk.replace(/\n/g, '<br>') + '</div>';
  });
  h += '</div>';
  narr.insertAdjacentHTML('beforeend', h); narr.scrollTop = narr.scrollHeight;
}

function showRetryInline(msg, retryFn) {
  var narr = qs('#' + P + '-narr'); if (!narr) return;
  var rid = 'rt' + Date.now();
  narr.insertAdjacentHTML('beforeend', '<div class="' + P + '-sys">' + msg + ' <span class="' + P + '-retry" id="' + rid + '">' + SVG.refresh + ' 重试</span></div>');
  narr.scrollTop = narr.scrollHeight;
  var retryEl = qs('#' + rid); if (retryEl) retryEl.addEventListener('click', function() { retryEl.parentElement.remove(); if (retryFn) retryFn(); });
}

function showWait() { var w = qs('#' + P + '-wait'); if (w) w.style.display = 'block'; var a = qs('#' + P + '-acts'); if (a) a.style.display = 'none'; var inp = qs('#' + P + '-inp-area'); if (inp) inp.style.display = 'none'; }
function hideWait() { var w = qs('#' + P + '-wait'); if (w) w.style.display = 'none'; var a = qs('#' + P + '-acts'); if (a) a.style.display = ''; var inp = qs('#' + P + '-inp-area'); if (inp) inp.style.display = ''; }

function renderActions() {
  var container = qs('#' + P + '-acts'); if (!container) return;
  container.innerHTML = '';
  var acts = ACTIONS[G.phase] || [];
  if (acts.length) {
    var h = '<div class="' + P + '-act-grp"><div class="' + P + '-act-lbl">' + (PHASE_NAMES[G.phase] || G.phase) + '</div><div class="' + P + '-act-wrap">';
    acts.forEach(function(a) { h += '<div class="' + P + '-ab" data-act="' + a.id + '">' + a.n + '</div>'; });
    h += '</div></div>'; container.insertAdjacentHTML('beforeend', h);
  }
  var hs = '<div class="' + P + '-act-grp"><div class="' + P + '-act-lbl">说话</div><div class="' + P + '-act-wrap">';
  SPEECH_TYPES.forEach(function(st) { hs += '<div class="' + P + '-ab speech" data-speech="' + st.id + '">' + st.n + '</div>'; });
  hs += '</div></div>'; container.insertAdjacentHTML('beforeend', hs);
  var hm = '<div class="' + P + '-act-grp"><div class="' + P + '-act-lbl">氛围</div><div class="' + P + '-act-wrap">';
  MOODS.forEach(function(m) { hm += '<div class="' + P + '-ab mood' + (m === G.style ? ' active' : '') + '" data-mood="' + m + '">' + m + '</div>'; });
  hm += '</div></div>'; container.insertAdjacentHTML('beforeend', hm);
  var hc = '<div class="' + P + '-act-grp"><div class="' + P + '-act-lbl">控制</div><div class="' + P + '-act-wrap">';
  if (G.phase !== 'aftermath') {
    hc += '<div class="' + P + '-ab ctrl" data-ctrl="skip_phase">\u23E9下阶段</div>';
    hc += '<div class="' + P + '-ab ctrl" data-ctrl="skip_climax">\u23ED高潮</div>';
  }
  if (G.phase === 'main') hc += '<div class="' + P + '-ab ej" data-ctrl="ejaculate">' + SVG.droplet + ' 射精</div>';
  if (G.phase === 'aftermath') hc += '<div class="' + P + '-ab ctrl" data-ctrl="again">\u{1F504} 再来</div>';
  hc += '<div class="' + P + '-ab end" data-ctrl="finish">' + SVG.stop + ' 结束</div></div></div>';
  container.insertAdjacentHTML('beforeend', hc);

  container.querySelectorAll('[data-act]').forEach(function(el) { el.addEventListener('click', function() { handleAction(el.dataset.act, null); }); });
  container.querySelectorAll('[data-speech]').forEach(function(el) {
    el.addEventListener('click', function() {
      var t = G.npcs[G.currentTarget];
      var map = { 'sweet_talk':'对' + (t?t.name:'她') + '说甜言蜜语', 'dirty_talk':'对' + (t?t.name:'她') + '说脏话', 'command':'命令' + (t?t.name:'她'), 'comfort':'安慰' + (t?t.name:'她'), 'praise':'夸奖' + (t?t.name:'她') };
      handleAction(null, map[el.dataset.speech] || '说话');
    });
  });
  container.querySelectorAll('[data-mood]').forEach(function(el) {
    el.addEventListener('click', function() {
      G.style = el.dataset.mood;
      container.querySelectorAll('[data-mood]').forEach(function(b) { b.classList.remove('active'); });
      el.classList.add('active'); updateNpcStat();
    });
  });
  container.querySelectorAll('[data-ctrl]').forEach(function(el) { el.addEventListener('click', function() { handleControl(el.dataset.ctrl); }); });
}

/* ===== 修复：重新开始时重置NPC状态 ===== */
function handleControl(ctrl) {
  switch(ctrl) {
    case 'skip_phase': doSkipPhase(); break;
    case 'skip_climax': doSkipToClimax(); break;
    case 'ejaculate': toggleEjRow(); break;
    case 'again':
      G.phase = 'foreplay';
      G.npcs.forEach(function(n) {
        n.excStage = '平静';
        n.psychState = n.attitude === '主动' ? '主动' : n.attitude === '抗拒' ? '抗拒' : '害羞';
        n.position = '面对面';
        n.clothes = n.clothesOrig.slice();
      });
      updateNpcStat(); renderActions();
      appendSys('\u2500\u2500 重新开始 \u2500\u2500');
      G.keyEvents.push('【重新开始】');
      break;
    case 'finish': showResult(); break;
  }
}

function toggleEjRow() {
  var row = qs('#' + P + '-ej-row'); if (!row) return;
  G.ejExpanded = !G.ejExpanded;
  if (!G.ejExpanded) { row.classList.remove('active'); return; }
  var h = '';
  EJ_OPTIONS.forEach(function(cat) {
    h += '<div class="' + P + '-ej-cat">' + cat.cat + '</div><div class="' + P + '-act-wrap">';
    cat.locs.forEach(function(loc) { h += '<div class="' + P + '-ab ej" data-ejloc="' + loc + '" data-ejcat="' + cat.cat + '">' + loc + '</div>'; });
    h += '</div>';
  });
  row.innerHTML = h;
  row.classList.add('active');
  row.querySelectorAll('[data-ejloc]').forEach(function(btn) {
    btn.addEventListener('click', function() { doEjaculate(btn.dataset.ejcat, btn.dataset.ejloc); });
  });
}

/* ===== 修复：射精计步 ===== */
async function doEjaculate(cat, loc) {
  var locText = cat === '体内' ? ('体内射精（' + loc + '）') : cat === '口内' ? ('口内射精（' + loc + '）') : ('射在' + loc);
  G.ejCount++; G.keyEvents.push('玩家' + locText);
  var ejRow = qs('#' + P + '-ej-row'); if (ejRow) ejRow.classList.remove('active');
  G.ejExpanded = false;
  appendSys('\u{1F4A7} ' + locText);
  G.step++;
  showWait();
  try {
    var text = await callAI(buildPrompt(locText, null));
    hideWait();
    if (text) {
      processAIResponse(locText, text);
    } else {
      G.step--;
      showRetryInline('\u26A0 射精描写生成失败');
    }
  } catch(e) {
    hideWait();
    G.step--;
    showRetryInline('\u26A0 ' + e.message);
  }
  G.phase = 'aftermath'; updateNpcStat(); renderActions();
}

async function handleAction(actionId, customText) {
  if (G.ended) return;
  var t = G.npcs[G.currentTarget]; if (!t) return;
  var actionName = customText || '观察';
  if (actionId) {
    var allActs = [].concat(ACTIONS.prepare, ACTIONS.foreplay, ACTIONS.main, ACTIONS.climax, ACTIONS.aftermath);
    var found = allActs.find(function(a) { return a.id === actionId; });
    if (found) actionName = found.n;
  }
  G.step++; updateNpcStat(); showWait();
  var prompt = buildPrompt(actionName, (customText && !actionId) ? customText : null);
  try {
    var text = await callAI(prompt);
    hideWait();
    if (!text) {
      G.step--;
      showRetryInline('\u26A0 AI未响应', function() {
        handleAction(actionId, customText);
      });
      return;
    }
    processAIResponse(actionName, text);
  } catch(e) {
    hideWait();
    G.step--;
    showRetryInline('\u26A0 ' + e.message, function() { handleAction(actionId, customText); });
    return;
  }

  if (t.virginity === '处女' && G.phase === 'main' && (actionName === '进入' || actionName.includes('进入'))) {
    t.virginity = '非处女'; G.keyEvents.push(t.name + '失去处女之身');
  }
  if (t.excStage === '临界') appendSys('\u2661 ' + t.name + ' 快到了…');
  updateNpcStat(); renderActions();
}

function processAIResponse(actionName, text) {
  var isMulti = G.npcs.length > 1;
  if (isMulti) {
    var parsed = parseReactionMulti(text);
    parsed.reactions.forEach(function(r) {
      var idx = findNpcByName(r.name);
      if (idx >= 0) applyReactionToNpc(idx, r);
    });
    if (parsed.phaseState) { var mp = mapPhase(parsed.phaseState); if (mp && mp !== G.phase) { var oldP = G.phase; G.phase = mp; appendSys('\u2500\u2500 ' + (PHASE_NAMES[oldP]||oldP) + ' \u2192 ' + (PHASE_NAMES[G.phase]||G.phase) + ' \u2500\u2500'); G.keyEvents.push('【' + (PHASE_NAMES[oldP]||oldP) + '\u2192' + (PHASE_NAMES[G.phase]||G.phase) + '】'); } }
    G.history.push({ action: actionName, reactions: parsed.reactions.map(function(r) { return { name: r.name, body: r.body, talk: r.talk }; }) });
    G.keyEvents.push(actionName);
    appendMultiSegment(actionName, parsed.reactions);
    var mainReact = parsed.reactions.find(function(r) { return r.name === G.npcs[G.currentTarget].name; });
    if (mainReact && mainReact.mind) { var mc = qs('#' + P + '-mind-ct'); if (mc) mc.textContent = mainReact.mind; }
    parsed.reactions.forEach(function(r) { if (r.intentType && r.intentType !== '无') renderIntentCard(r); });
  } else {
    var react = parseReactionSingle(text);
    applyReactionToNpc(G.currentTarget, react);
    if (react.phaseState) { var mp2 = mapPhase(react.phaseState); if (mp2 && mp2 !== G.phase) { var oldP2 = G.phase; G.phase = mp2; appendSys('\u2500\u2500 ' + (PHASE_NAMES[oldP2]||oldP2) + ' \u2192 ' + (PHASE_NAMES[G.phase]||G.phase) + ' \u2500\u2500'); G.keyEvents.push('【' + (PHASE_NAMES[oldP2]||oldP2) + '\u2192' + (PHASE_NAMES[G.phase]||G.phase) + '】'); } }
    G.history.push({ action: actionName, body: react.body, talk: react.talk, mind: react.mind });
    G.keyEvents.push(actionName + (react.talk ? (' 「' + react.talk.substring(0, 30) + '」') : ''));
    appendSegment(actionName, react.name, react.body, react.talk);
    if (react.mind) { var mc2 = qs('#' + P + '-mind-ct'); if (mc2) mc2.textContent = react.mind; }
    if (react.intentType && react.intentType !== '无') renderIntentCard(react);
  }
}

function renderIntentCard(react) {
  var it = react.intentType; if (!it || it === '无') return;
  var npcName = react.name || (G.npcs[G.currentTarget] ? G.npcs[G.currentTarget].name : '');
  G.intentCounter++; var cid = P + '-ic' + G.intentCounter;
  var narr = qs('#' + P + '-narr'); if (!narr) return;
  var configs = {
    '想说话': { hd: '\u{1F4AC} ' + npcName + '说：', btns: [['温柔回应','温柔回应'],['不理会','不理会']], hasInput: true },
    '想换体位': { hd: '\u{1F504} ' + npcName + '想换姿势', btns: [['让她来','让她来'],['拒绝','拒绝'],['你来换','你来换']] },
    '感到疼痛': { hd: '\u26A0 ' + npcName + '感到疼痛', btns: [['放慢','放慢'],['停下安慰','停下安慰'],['继续','继续']] },
    '即将高潮': { hd: '\u{1F338} ' + npcName + '快到了', btns: [['继续','继续'],['吊着不让她到','吊着不让她到'],['一起','一起']] },
    '请求停下': { hd: '\u270B ' + npcName + '请求停下', btns: [['停下','停下'],['放慢','放慢'],['不理会','不理会']] },
    '主动索要': { hd: '\u{1F495} ' + npcName + '想要…', btns: [['满足她','满足她'],['拒绝','拒绝'],['让她自己来','让她自己来']] }
  };
  var cfg = configs[it]; if (!cfg) return;
  var body = react.talk || '…';
  var h = '<div class="' + P + '-intent" id="' + cid + '"><div class="' + P + '-intent-hd">' + cfg.hd + '</div><div class="' + P + '-intent-body">' + esc(body) + '</div><div class="' + P + '-intent-btns">';
  cfg.btns.forEach(function(b) { h += '<div class="' + P + '-intent-btn" data-r="' + b[1] + '">' + b[0] + '</div>'; });
  h += '</div>';
  if (cfg.hasInput) h += '<input class="' + P + '-intent-inp" placeholder="或者自己说…">';
  h += '</div>';
  narr.insertAdjacentHTML('beforeend', h); narr.scrollTop = narr.scrollHeight;
  var card = qs('#' + cid); if (!card) return;
  card.querySelectorAll('.' + P + '-intent-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var inp = card.querySelector('.' + P + '-intent-inp');
      var custom = inp ? inp.value.trim() : '';
      var response = custom || btn.dataset.r;
      G.keyEvents.push('玩家回应' + npcName + '：' + response);
      card.classList.add('resolved');
      handleAction(null, response);
    });
  });
}

/* ===== 修复：快进计步 ===== */
async function doSkipPhase() {
  G.step++;
  showWait();
  try {
    var text = await callAI(buildSkipPrompt());
    hideWait();
    if (!text) { G.step--; showRetryInline('\u26A0 快进失败', doSkipPhase); return; }
    var skipM = text.match(/\[跳过\]([\s\S]*?)\[\/跳过\]/);
    if (skipM) appendSys(skipM[1].trim().replace(/\n/g, '<br>'));
    var oldPhase = G.phase;
    processAIResponse('快进', text);
    if (G.phase === oldPhase) {
      var phaseIdx = PHASE_ORDER.indexOf(G.phase);
      if (phaseIdx < PHASE_ORDER.length - 1) G.phase = PHASE_ORDER[phaseIdx + 1];
    }
    G.keyEvents.push('快进到' + (PHASE_NAMES[G.phase] || G.phase));
    appendSys('\u2500\u2500 ' + (PHASE_NAMES[G.phase] || G.phase) + ' \u2500\u2500');
    updateNpcStat(); renderActions();
  } catch(e) { hideWait(); G.step--; showRetryInline('\u26A0 ' + e.message, doSkipPhase); }
}

/* ===== 修复：快进到高潮计步 ===== */
async function doSkipToClimax() {
  G.step++;
  showWait();
  try {
    var text = await callAI(buildSkipToClimaxPrompt(), 3000);
    hideWait();
    if (!text) { G.step--; showRetryInline('\u26A0 快进失败', doSkipToClimax); return; }
    var procM = text.match(/\[过程\]([\s\S]*?)\[\/过程\]/);
    var narrText = procM ? procM[1].trim() : text.substring(0, 1500);
    var ocM = text.match(/\[NPC高潮次数[|｜]([^\]]+)\]/);
    var orgC = ocM ? (parseInt(ocM[1]) || 1) : 1;
    var t = G.npcs[G.currentTarget];
    t.orgCount += orgC; G.phase = 'climax';
    G.keyEvents.push('快进到高潮，' + t.name + '高潮' + orgC + '次');
    appendSys('\u2500\u2500 快进到高潮 \u2500\u2500');
    appendSegment('高潮', t.name, narrText, '');
    appendSys('\u{1F338} ' + t.name + ' 高潮了！');
    G.phase = 'main'; updateNpcStat(); renderActions();
    toggleEjRow();
  } catch(e) { hideWait(); G.step--; showRetryInline('\u26A0 ' + e.message, doSkipToClimax); }
}

function generateSummary() {
  var parts = [];
  parts.push('地点：' + G.scene);
  if (G.envType && G.envType !== '室内') parts.push('环境：' + G.envType);
  parts.push('对象：' + G.npcs.map(function(n) { return n.name; }).join('、'));
  var phases = G.keyEvents.filter(function(e) { return e.startsWith('【'); }).map(function(e) { return e.replace(/[【】]/g, ''); }).join('\u2192');
  if (phases) parts.push('过程：' + phases);
  var keyActs = G.keyEvents.filter(function(e) { return !e.startsWith('【') && !e.startsWith('快进') && !e.startsWith('玩家回应'); }).slice(-6);
  if (keyActs.length) parts.push('关键：' + keyActs.join('；'));
  G.npcs.forEach(function(n) {
    var desc = [];
    desc.push('穿着' + (n.clothes.length ? n.clothes.join('、') : '全裸'));
    desc.push('心理' + n.psychState);
    desc.push('体位' + n.position);
    if (n.orgCount > 0) desc.push('高潮' + n.orgCount + '次');
    parts.push(n.name + '最终状态：' + desc.join('，'));
  });
  if (G.ejCount > 0) {
    var ejEvents = G.keyEvents.filter(function(e) { return e.includes('射'); });
    parts.push('射精' + G.ejCount + '次（' + ejEvents.map(function(e) { return e.replace('玩家', ''); }).join('、') + '）');
  }
  return parts.join('。');
}

function showResult() {
  G.ended = true;
  var summary = generateSummary();
  var h = '<div class="' + P + '-result-icon">\u{1F4AB}</div><div class="' + P + '-result-title">亲密互动结束</div>';
  h += '<div class="' + P + '-result-stats">步数：<b>' + G.step + '</b><br>';
  G.npcs.forEach(function(n) { h += esc(n.name) + ' 高潮：<b>' + n.orgCount + '次</b><br>'; });
  h += '射精：<b>' + G.ejCount + '次</b></div>';
  h += '<div class="' + P + '-card" style="text-align:left;margin:10px 0"><div class="' + P + '-card-title">\u{1F4C4} 摘要</div>';
  h += '<div style="font-size:9px;color:var(--ns-t2);line-height:1.7">' + esc(summary).replace(/。/g, '。<br>') + '</div></div>';
  h += '<div class="' + P + '-result-btns">';
  h += '<button class="' + P + '-btn primary" id="' + P + '-res-send" style="width:100%;padding:12px;font-size:12px">\u{1F4E4} 发送结果，继续剧情</button>';
  h += '<button class="' + P + '-btn danger" id="' + P + '-res-cancel" style="width:100%;padding:10px;font-size:11px">\u2715 取消本次模拟</button></div>';
  var container = qs('#' + P + '-result-content'); if (container) container.innerHTML = h;
  showPage('result');
  var sendBtn = qs('#' + P + '-res-send');
  if (sendBtn) sendBtn.addEventListener('click', function() { sendResultToMainAI(); closePanel(); resetAfterEnd(); });
  var cancelBtn = qs('#' + P + '-res-cancel');
  if (cancelBtn) cancelBtn.addEventListener('click', function() { sendCancelToMainAI(); closePanel(); resetAfterEnd(); });
}

function resetAfterEnd() {
  G = createGameState(); deactivateTrigger(); window.__nssLastTriggered = null;
  var ht = qs('#' + P + '-htitle'); if (ht) ht.textContent = '\u{1F495} 亲密模拟';
}

function sendResultToMainAI() {
  var summary = generateSummary();
  var msg = '（亲密互动已在模拟器中完成，以下是摘要。请从事后场景直接继续推进剧情，不要重复描写亲密过程。）\n\n' + summary + '\n\n请直接从事后场景推进剧情。';
  trySendMessage(msg);
}
function sendCancelToMainAI() {
  var msg = '（玩家取消了亲密模拟。请从上一条消息中断处继续正常输出正文，亲密场景未发生。）';
  trySendMessage(msg);
}
/* ===== 修复：trySendMessage斜杠命令 ===== */
function trySendMessage(msg) {
  try {
    var win = window.top || window;
    if (typeof win.triggerSlash === 'function') { win.triggerSlash('/send ' + msg); return; }
    var textarea = qs('#send_textarea');
    if (textarea) { textarea.value = msg; var sendBtn = qs('#send_but'); if (sendBtn) sendBtn.click(); }
  } catch(e) { log('发送消息失败', e); }
}

function renderSettingsPanel() {
  var container = qs('#' + P + '-settings-content'); if (!container) return;
  var data = loadPresets(); var active = getActivePreset(); var apiCfg = getApiConfig();
  var h = '';
  h += '<div class="' + P + '-setting-grp"><div class="' + P + '-setting-lbl">\u{1F4CB} 预设</div>';
  data.presets.forEach(function(p) {
    h += '<div class="' + P + '-preset-item' + (p.id === data.activeId ? ' active' : '') + '" data-pid="' + p.id + '"><div class="' + P + '-preset-radio"></div><div class="' + P + '-preset-info"><div class="' + P + '-preset-name">' + esc(p.name) + '</div><div class="' + P + '-preset-author">' + esc(p.author || '未知') + ' · v' + esc(p.version || '?') + '</div></div></div>';
  });
  h += '<div class="' + P + '-setting-btns" style="margin-top:6px"><button class="' + P + '-btn" id="' + P + '-preset-new">' + SVG.plus + ' 新建</button><button class="' + P + '-btn" id="' + P + '-preset-import">' + SVG.upload + ' 导入</button><input type="file" id="' + P + '-preset-file" accept=".json" style="display:none"></div></div>';
  h += '<div class="' + P + '-setting-grp"><div class="' + P + '-setting-lbl">\u270F\uFE0F 编辑: ' + esc(active.name) + '</div>';
  h += '<div class="' + P + '-edit-tabs"><div class="' + P + '-edit-tab active" data-etab="sys">系统指令</div><div class="' + P + '-edit-tab" data-etab="cot">思维链</div><div class="' + P + '-edit-tab" data-etab="ban">禁止词</div><div class="' + P + '-edit-tab" data-etab="fmt">输出格式</div></div>';
  h += '<div class="' + P + '-edit-content active" data-econtent="sys"><textarea class="' + P + '-setting-ta" id="' + P + '-edit-sys" style="min-height:140px">' + esc(active.systemPrompt || '') + '</textarea></div>';
  h += '<div class="' + P + '-edit-content" data-econtent="cot"><textarea class="' + P + '-setting-ta" id="' + P + '-edit-cot" style="min-height:100px">' + esc(active.cotTemplate || '') + '</textarea></div>';
  h += '<div class="' + P + '-edit-content" data-econtent="ban"><textarea class="' + P + '-setting-ta" id="' + P + '-edit-ban" style="min-height:60px">' + esc(typeof active.bannedWords === 'string' ? active.bannedWords : (active.bannedWords || []).join(',')) + '</textarea></div>';
  h += '<div class="' + P + '-edit-content" data-econtent="fmt"><div class="' + P + '-setting-lbl" style="font-size:9px">单人格式</div><textarea class="' + P + '-setting-ta" id="' + P + '-edit-fmt-s" style="min-height:100px">' + esc(active.outputFormatSingle || '') + '</textarea><div class="' + P + '-setting-lbl" style="font-size:9px;margin-top:6px">多人格式</div><textarea class="' + P + '-setting-ta" id="' + P + '-edit-fmt-m" style="min-height:100px">' + esc(active.outputFormatMulti || '') + '</textarea></div>';
  h += '<div class="' + P + '-setting-btns" style="margin-top:8px"><button class="' + P + '-btn primary" id="' + P + '-preset-save">' + SVG.save + ' 保存</button><button class="' + P + '-btn" id="' + P + '-preset-export">' + SVG.download + ' 导出</button>';
  if (active.id !== 'default_v3') h += '<button class="' + P + '-btn danger" id="' + P + '-preset-delete">' + SVG.trash + ' 删除</button>';
  h += '</div><div class="' + P + '-status" id="' + P + '-preset-status" style="display:none"></div></div>';
  h += '<div class="' + P + '-setting-grp"><div class="' + P + '-setting-lbl">\u{1F50C} API</div><div class="' + P + '-row"><span class="k">状态</span><span class="v">' + (apiCfg.model ? ('\u2705 ' + apiCfg.model) : '\u274C 未配置') + '</span></div><div class="' + P + '-setting-hint">API在魂导通讯器设置中配置</div></div>';
  h += '<div class="' + P + '-setting-grp"><div class="' + P + '-setting-lbl">\u{1F39B} 温度</div><div style="display:flex;align-items:center;gap:6px;margin:4px 0"><input type="range" id="' + P + '-temp-range" min="0.1" max="1.5" step="0.05" value="' + (active.temperature || 0.75) + '" style="flex:1;accent-color:var(--ns-ac)"><span id="' + P + '-temp-val" style="font-size:10px;min-width:30px;text-align:right">' + (active.temperature || 0.75).toFixed(2) + '</span></div></div>';
  container.innerHTML = h;

  container.querySelectorAll('.' + P + '-preset-item').forEach(function(item) { item.addEventListener('click', function() { setActivePreset(item.dataset.pid); renderSettingsPanel(); toast('预设已切换'); }); });
  var newBtn = qs('#' + P + '-preset-new');
  if (newBtn) newBtn.addEventListener('click', function() { var np = JSON.parse(JSON.stringify(DEFAULT_PRESET)); np.id = 'custom_' + Date.now(); np.name = '新预设'; np.author = '用户'; savePreset(np); setActivePreset(np.id); renderSettingsPanel(); toast('新预设已创建'); });
  var importBtn = qs('#' + P + '-preset-import');
  if (importBtn) importBtn.addEventListener('click', function() { var f = qs('#' + P + '-preset-file'); if (f) f.click(); });
  var fileInput = qs('#' + P + '-preset-file');
  if (fileInput) fileInput.addEventListener('change', async function(e) {
    var file = e.target.files[0]; if (!file) return;
    try { var preset = await importPresetFromFile(file); setActivePreset(preset.id); renderSettingsPanel(); toast('预设「' + preset.name + '」导入成功'); }
    catch(err) { toast(err.message, 'err'); }
    e.target.value = '';
  });
  container.querySelectorAll('.' + P + '-edit-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      container.querySelectorAll('.' + P + '-edit-tab').forEach(function(t) { t.classList.remove('active'); });
      container.querySelectorAll('.' + P + '-edit-content').forEach(function(c) { c.classList.remove('active'); });
      tab.classList.add('active');
      var content = container.querySelector('[data-econtent="' + tab.dataset.etab + '"]');
      if (content) content.classList.add('active');
    });
  });
  var saveBtn = qs('#' + P + '-preset-save');
  if (saveBtn) saveBtn.addEventListener('click', function() {
    var p = getActivePreset();
    var sysEl = qs('#' + P + '-edit-sys'); if (sysEl) p.systemPrompt = sysEl.value;
    var cotEl = qs('#' + P + '-edit-cot'); if (cotEl) p.cotTemplate = cotEl.value;
    var banEl = qs('#' + P + '-edit-ban'); if (banEl) p.bannedWords = banEl.value;
    var fmtSEl = qs('#' + P + '-edit-fmt-s'); if (fmtSEl) p.outputFormatSingle = fmtSEl.value;
    var fmtMEl = qs('#' + P + '-edit-fmt-m'); if (fmtMEl) p.outputFormatMulti = fmtMEl.value;
    var tempEl = qs('#' + P + '-temp-range'); if (tempEl) p.temperature = parseFloat(tempEl.value);
    savePreset(p);
    var status = qs('#' + P + '-preset-status');
    if (status) { status.style.display = 'block'; status.className = P + '-status ok'; status.textContent = '\u2705 已保存'; setTimeout(function() { status.style.display = 'none'; }, 2000); }
    toast('预设已保存');
  });
  var exportBtn = qs('#' + P + '-preset-export');
  if (exportBtn) exportBtn.addEventListener('click', function() { exportPreset(getActivePreset()); toast('预设已导出'); });
  var deleteBtn = qs('#' + P + '-preset-delete');
  if (deleteBtn) deleteBtn.addEventListener('click', function() { var p = getActivePreset(); if (confirm('确定删除预设「' + p.name + '」？')) { deletePreset(p.id); renderSettingsPanel(); toast('预设已删除'); } });
  var tempRange = qs('#' + P + '-temp-range');
  if (tempRange) tempRange.addEventListener('input', function() { var valEl = qs('#' + P + '-temp-val'); if (valEl) valEl.textContent = parseFloat(this.value).toFixed(2); });
}

function initDrag(target, options) {
  options = options || {};
  var handle = options.handle ? target.querySelector(options.handle) : target;
  if (!handle) return;
  var sx, sy, ix, iy, moving = false, moved = false;
  handle.style.touchAction = 'none';
  handle.onpointerdown = function(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (options.ignore && e.target.closest(options.ignore)) return;
    moving = true; moved = false;
    sx = e.clientX; sy = e.clientY;
    var r = target.getBoundingClientRect(); ix = r.left; iy = r.top;
    handle.setPointerCapture(e.pointerId);
    target.classList.add('dragging');
  };
  handle.onpointermove = function(e) {
    if (!moving) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) moved = true;
    if (moved) {
      var w = (window.top || window).innerWidth, h2 = (window.top || window).innerHeight;
      target.style.left = Math.max(-target.offsetWidth / 2, Math.min(ix + dx, w - target.offsetWidth / 2)) + 'px';
      target.style.top = Math.max(0, Math.min(iy + dy, h2 - 50)) + 'px';
      target.style.right = 'auto'; target.style.bottom = 'auto';
    }
  };
  handle.onpointerup = function(e) {
    if (!moving) return; moving = false;
    target.classList.remove('dragging');
    handle.releasePointerCapture(e.pointerId);
    if (!moved && options.onClick) options.onClick();
  };
  handle.onpointercancel = function() { moving = false; target.classList.remove('dragging'); };
}

function initPlugin() {
  log('亲密模拟器 v3.0 初始化...');
  var doc = getDoc();
  qa('#' + P + '-trigger,#' + P + '-overlay,#' + P + '-styles', doc).forEach(function(el) { el.remove(); });
  if (doc !== document) { try { qa('#' + P + '-trigger,#' + P + '-overlay,#' + P + '-styles', document).forEach(function(el) { el.remove(); }); } catch(e) {} }
  doc.head.insertAdjacentHTML('beforeend', styles);
  doc.body.insertAdjacentHTML('beforeend', html);
  window.__nssActive = true;

  var trigger = doc.getElementById(P + '-trigger');
  var overlay = doc.getElementById(P + '-overlay');
  var frame = doc.getElementById(P + '-frame');
  var winW = (window.top || window).innerWidth, winH = (window.top || window).innerHeight;
  frame.style.left = (winW / 2 - 185) + 'px';
  frame.style.top = (winW <= 1024 ? '50px' : ((winH / 2 - 350) + 'px'));

  initDrag(trigger, { onClick: function() { if (overlay.classList.contains('active')) closePanel(); else openPanel(); } });
  initDrag(frame, { handle: '.' + P + '-header', ignore: '.' + P + '-hbtn' });

  overlay.addEventListener('click', function(e) { if (e.target === overlay && !overlay.classList.contains('pinned')) closePanel(); });
  qs('#' + P + '-close').addEventListener('click', closePanel);
  qs('#' + P + '-settings-btn').addEventListener('click', function() { renderSettingsPanel(); var sp = qs('#' + P + '-panel-settings'); if (sp) sp.classList.add('active'); });
  qs('#' + P + '-settings-back').addEventListener('click', function() { var sp = qs('#' + P + '-panel-settings'); if (sp) sp.classList.remove('active'); });
  qs('#' + P + '-pin-btn').addEventListener('click', function() { overlay.classList.toggle('pinned'); });

  /* ===== 新增：日/夜主题切换 ===== */
  var themeBtn = qs('#' + P + '-theme-btn');
  if (themeBtn) {
    var isLight = localStorage.getItem(P + '_theme') === 'light';
    if (isLight) { frame.classList.add('light'); themeBtn.innerHTML = SVG.sun; }
    themeBtn.addEventListener('click', function() {
      var light = frame.classList.toggle('light');
      themeBtn.innerHTML = light ? SVG.sun : SVG.moon;
      localStorage.setItem(P + '_theme', light ? 'light' : 'dark');
    });
  }

  qs('#' + P + '-npc-stat').addEventListener('click', function() { this.classList.toggle('open'); });
  qs('#' + P + '-mind-area').addEventListener('click', function() { this.classList.toggle('open'); });
  qs('#' + P + '-inp-send').addEventListener('click', function() {
    var ta = qs('#' + P + '-inp-ta'); if (!ta) return;
    var text = ta.value.trim(); if (!text) return;
    ta.value = ''; handleAction(null, text);
  });
  qs('#' + P + '-inp-ta').addEventListener('keypress', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); qs('#' + P + '-inp-send').click(); } });
  qs('#' + P + '-stop-btn').addEventListener('click', function() { G.currentGenId++; hideWait(); appendSys('\u23F9 已停止'); });

  checkLatestMessage();
  renderIdlePage();
  log('\u2705 亲密模拟器 v3.0 就绪');
}

setupTriggerSystem();
if (isTargetCard()) initPlugin();
else { log('当前角色卡不匹配，插件待命'); window.__nssActive = false; }
log('亲密模拟器 v3.0 已加载');

})();
