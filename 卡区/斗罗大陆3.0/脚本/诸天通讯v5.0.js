(async function() {
'use strict';

/* ==================== 诸天通讯 v5.0 ==================== */
const VERSION = '5.0';
const P = 'ztc';
const CONFIG_KEY = 'dlgd_api_config';
const DATA_KEY = 'ztc_data_v5';
const PRESET_KEY = 'ztc_presets_v5';
const GROUP_LIMIT = 20;

/* [v5] 热门作品标签（替代硬编码的WORKS下拉框） */
const POPULAR_WORKS = [
    '斗罗大陆','绝世唐门','龙王传说','终极斗罗',
    '火影忍者','海贼王','遮天','凡人修仙传',
    '原神','崩坏：星穹铁道','哈利·波特',
    '鬼灭之刃','咒术回战','全职高手','诡秘之主',
    '盗墓笔记','仙逆','斗破苍穹'
];

const AV_COLORS = ['#7c5ce0','#6366f1','#8b5cf6','#a78bfa','#c084fc','#e879f9','#f472b6','#fb7185','#f97316','#facc15','#4ade80','#2dd4bf','#22d3ee','#38bdf8','#818cf8'];
const ECO_TYPES = ['水群龙王','活跃分子','正常发言','偶尔冒泡','潜水怪','交易党','气氛组'];
const ATTITUDE_STAGES = ['警惕/敬畏','利益绑定','私人依赖'];

/* [v5] 动态活动状态池 */
const ACTIVITIES = {
    morning: ['刚起床还没清醒','在吃早饭','刚洗漱完','准备出门'],
    daytime: ['在忙正事','在修炼','在训练','在工作','在上课','在处理杂务','在巡逻','在赶路'],
    afternoon: ['午休刚醒','在发呆','在看书','在散步'],
    evening: ['在吃晚饭','在放松','在闲逛','在和人聊天','在喝酒'],
    night: ['准备睡了','躺在床上','在想事情','睡不着','在夜里独处'],
    random: ['正在打架','受了点伤在休息','心情不好','刚遇到麻烦事','在躲人','突然很无聊']
};

/* [v5] 情绪标签 */
const EMOTIONS = ['平静','开心','烦躁','疲惫','警惕','放松','焦虑','兴奋','低落','无聊'];

function getActivity() {
    const h = new Date().getHours();
    let pool;
    if (h >= 6 && h < 9) pool = ACTIVITIES.morning;
    else if (h >= 9 && h < 12) pool = ACTIVITIES.daytime;
    else if (h >= 12 && h < 14) pool = ACTIVITIES.afternoon;
    else if (h >= 14 && h < 18) pool = ACTIVITIES.daytime;
    else if (h >= 18 && h < 22) pool = ACTIVITIES.evening;
    else pool = ACTIVITIES.night;
    if (Math.random() < 0.15) pool = ACTIVITIES.random;
    return pool[Math.floor(Math.random() * pool.length)];
}

/* ===== SVG图标库 ===== */
const IC = {
    chat:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
    contacts:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
    discover:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/></svg>`,
    me:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    plus:`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    search:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    refresh:`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
    save:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    signal:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>`,
    test:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    check:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    edit:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    camera:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
    addUser:`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
    msgSend:`<svg viewBox="0 0 24 24" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#fff"/></svg>`,
    note:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    chatEmpty:`<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".2"><path d="M42 30a4 4 0 01-4 4H14l-8 8V10a4 4 0 014-4h28a4 4 0 014 4z"/><line x1="14" y1="16" x2="34" y2="16"/><line x1="14" y1="22" x2="28" y2="22"/></svg>`,
    cameraEmpty:`<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".2"><path d="M44 38a4 4 0 01-4 4H8a4 4 0 01-4-4V18a4 4 0 014-4h6l4-6h12l4 6h6a4 4 0 014 4z"/><circle cx="24" cy="27" r="7"/></svg>`,
    download:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upload:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    users:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
    heart:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    preset:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    trash:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
    sun:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
    star:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    sparkle:`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    trial:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>`,
};

const BK_SVG=`<svg viewBox="0 0 10 16" width="10" height="16"><path d="M9 1L2 8l7 7" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ===== 工具 ===== */
const log = (m, d) => d !== undefined ? console.log(`[诸天通讯] ${m}`, d) : console.log(`[诸天通讯] ${m}`);
const esc = s => { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; };
function toast(msg, t='ok') { try { ({ok:toastr.success,err:toastr.error,warn:toastr.warning,info:toastr.info})[t]?.(msg); } catch { log(msg); } }
function getDoc() { try { return window.top?.document || document; } catch { return document; } }
function qsel(s, c) { return (c || getDoc()).querySelector(s); }
function uName() { try { return (window.top||window).SillyTavern?.getContext()?.name1 || '旅行者'; } catch { return '旅行者'; } }
function aCh(n) { return n ? n.charAt(n.length > 1 ? n.length-1 : 0) : '?'; }
function tStr() { return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}); }
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }
function rDelay(min=300,max=800) { return min + Math.random()*(max-min); }
function scrollToBottom(area) { if (!area) return; requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; setTimeout(() => { area.scrollTop = area.scrollHeight; }, 60); }); }

/* ===== 主题 ===== */
const THEME_KEY = 'ztc_theme';
let curTheme = 'dark';
function loadTheme() { curTheme = localStorage.getItem(THEME_KEY) || 'dark'; }
function saveTheme() { localStorage.setItem(THEME_KEY, curTheme); }
function applyTheme() {
    const inner = qsel(`.${P}-inner`);
    if (!inner) return;
    if (curTheme === 'light') inner.classList.add(`${P}-light`);
    else inner.classList.remove(`${P}-light`);
}
function toggleTheme() {
    curTheme = curTheme === 'dark' ? 'light' : 'dark';
    saveTheme(); applyTheme(); render();
}

/* [v5] ===== 角色卡检测 — 全局启用 ===== */
function isTargetCard() { return true; }
function cName() { try { return (window.top||window).SillyTavern?.getContext()?.name2||''; } catch { return ''; } }
function cId() { try { return (window.top||window).SillyTavern?.getContext()?.chatId||'def'; } catch { return 'def'; } }

/* ===== MVU（可选） ===== */
function getMvuData() { try { const win = window.top || window; if (typeof win.Mvu === 'undefined' && win.parent?.Mvu) win.Mvu = win.parent.Mvu; return win.Mvu?.getMvuData({type:'message', message_id:'latest'})?.stat_data || null; } catch { return null; } }
function getPlayerInfo() {
    const d = getMvuData(); if (!d) return null;
    const p = d['玩家'] || d['player'];
    if (!p) return null;
    return { name:p['基础信息']?.['姓名']||uName(), age:p['基础信息']?.['年龄']||'?', gender:p['基础信息']?.['性别']||'?', level:p['修炼状态']?.['魂力等级']||p['等级']||'?', spirit:p['主武魂']?.['名称']||p['能力']||'未知', gold:p['经济']?.['金魂币']||p['金币']||0, faction:p['势力']?.['所属势力']||'无', fame:p['名声']?.['大陆名声']||'无名小卒', hp:p['身体状态']?.['体力百分比']||100 };
}

/* ===== 销毁/监听 ===== */
function destroy() { log('🧹 销毁'); window.__ztcActive=false; const doc=getDoc(); doc.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove()); if(doc!==document)try{document.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());}catch{} try{const w=window.top||window;if(w.eventSource&&window.__ztcH){w.eventSource.removeListener(w.event_types.CHAT_CHANGED,window.__ztcH);window.__ztcH=null;}}catch{} if(window.__ztcPoll){clearInterval(window.__ztcPoll);window.__ztcPoll=null;} }
window.removeEventListener('pagehide', destroy); window.addEventListener('pagehide', destroy);
function setupWatcher() { if(window.__ztcPoll)clearInterval(window.__ztcPoll); let li=cId();window.__ztcPoll=setInterval(()=>{const ci=cId();if(ci!==li){li=ci;onChange();}},2000); }
function onChange() { if(!window.__ztcActive)setTimeout(init,400); }

/* ===== API ===== */
const api={url:'',key:'',model:'',models:[]};
function saveApi(){try{localStorage.setItem(CONFIG_KEY,JSON.stringify({apiUrl:api.url,apiKey:api.key,model:api.model,savedModels:api.models}));}catch{}}
function loadApi(){try{const d=JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');api.url=d.apiUrl||'';api.key=d.apiKey||'';api.model=d.model||'';api.models=d.savedModels||[];}catch{}}
function apiOk(){return !!(api.url&&api.model)}
function normUrl(u){return u.trim().replace(/\/+$/,'').replace(/\/v1(\/chat\/completions|\/models)?\/?$/,'')}
async function fetchModels(url,key){const base=normUrl(url);if(!base)throw new Error('API地址为空');const h={};if(key)h['Authorization']=`Bearer ${key}`;const ac=new AbortController(),t=setTimeout(()=>ac.abort(),15000);try{const r=await fetch(`${base}/v1/models`,{headers:h,signal:ac.signal});clearTimeout(t);if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();return(d.data||d).map(m=>m.id||m.name||'').filter(Boolean).sort();}catch(e){clearTimeout(t);throw e.name==='AbortError'?new Error('获取模型超时'):e;}}
async function apiChat(messages,maxTk=1500){if(!api.url||!api.model)throw new Error('请先配置API');const h={'Content-Type':'application/json'};if(api.key)h['Authorization']=`Bearer ${api.key}`;const ac=new AbortController(),t=setTimeout(()=>ac.abort(),30000);try{const r=await fetch(`${normUrl(api.url)}/v1/chat/completions`,{method:'POST',headers:h,body:JSON.stringify({model:api.model,messages,temperature:0.9,max_tokens:maxTk}),signal:ac.signal});clearTimeout(t);if(!r.ok){let em=`API错误:${r.status}`;try{const ed=await r.json();if(ed.error?.message)em+=` ${ed.error.message}`;}catch{}throw new Error(em);}const d=await r.json();return d.choices?.[0]?.message?.content||'';}catch(e){clearTimeout(t);throw e.name==='AbortError'?new Error('请求超时(30s)'):e;}}

/* ===== 数据层 ===== */
let D={friends:{},groups:{},messages:{},presets:{},moments:{posts:[],lastAutoGen:0,autoEnabled:false},settings:{autoSummarize:false,autoThreshold:80,autoSumCount:50}};
let _saveTimer;
function saveD(){clearTimeout(_saveTimer);_saveTimer=setTimeout(()=>{try{localStorage.setItem(`${DATA_KEY}_${cId()}`,JSON.stringify(D));}catch{}},300);}
function saveDNow(){clearTimeout(_saveTimer);try{localStorage.setItem(`${DATA_KEY}_${cId()}`,JSON.stringify(D));}catch{}}
function loadD(){try{const d=JSON.parse(localStorage.getItem(`${DATA_KEY}_${cId()}`)||'{}');D.friends=d.friends||{};D.groups=d.groups||{};D.messages=d.messages||{};D.presets=d.presets||{};D.moments=Object.assign({posts:[],lastAutoGen:0,autoEnabled:false},d.moments||{});D.settings=Object.assign({autoSummarize:false,autoThreshold:80,autoSumCount:50},d.settings||{});}catch{}}
function addFriend(profile){const id=`f_${uid()}`;D.friends[id]={id,profile,addedAt:new Date().toISOString(),avatarColor:AV_COLORS[Math.floor(Math.random()*AV_COLORS.length)],ecoType:'正常发言',attitudeStage:'警惕/敬畏',chatCount:0,unread:0,emotionState:'平静'};saveD();return id;}
function delFriend(id){delete D.friends[id];delete D.messages[id];for(const gid of Object.keys(D.groups)){const g=D.groups[gid];g.members=g.members.filter(m=>m!==id);if(g.members.length===0){delete D.groups[gid];delete D.messages[gid];}}if(D.moments?.posts){D.moments.posts=D.moments.posts.filter(p=>p.authorId!==id);}saveD();}
function createGroup(name,members){const id=`g_${uid()}`;D.groups[id]={id,name,members,createdAt:new Date().toISOString(),unread:0};saveD();return id;}
function getMsgs(id){if(!D.messages[id])D.messages[id]={memory:'',messages:[],emotionState:'平静'};return D.messages[id];}
function lastMsg(id){const m=D.messages[id]?.messages;return m?.length?m[m.length-1]:null;}
function totalUnread(){let n=0;for(const f of Object.values(D.friends))n+=(f.unread||0);for(const g of Object.values(D.groups))n+=(g.unread||0);return n;}

function exportData(){const blob=new Blob([JSON.stringify(D,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`诸天通讯_${cId()}_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);toast('数据已导出');}
function importData(){const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.friends||d.groups||d.messages){D.friends=d.friends||{};D.groups=d.groups||{};D.messages=d.messages||{};D.moments=d.moments||{posts:[],lastAutoGen:0,autoEnabled:false};D.settings=Object.assign({autoSummarize:false,autoThreshold:80,autoSumCount:50},d.settings||{});saveDNow();render();toast('数据已导入');}else{toast('文件格式不正确','err');}}catch(ex){toast('解析失败: '+ex.message,'err');}};reader.readAsText(file);};input.click();}
function clearAllData(){D.friends={};D.groups={};D.messages={};D.moments={posts:[],lastAutoGen:0,autoEnabled:false};saveDNow();render();toast('全部数据已清空');}
function clearMessages(){D.messages={};saveDNow();render();toast('聊天记录已清空');}

function updateAttitude(fid){const f=D.friends[fid];if(!f)return;f.chatCount=(f.chatCount||0)+1;if(f.chatCount>=30&&f.attitudeStage==='利益绑定'){f.attitudeStage='私人依赖';}else if(f.chatCount>=10&&f.attitudeStage==='警惕/敬畏'){f.attitudeStage='利益绑定';}saveD();}

/* ===== 记忆系统 ===== */
async function summarize(chatId,count){const data=getMsgs(chatId);if(data.messages.length<=count)count=data.messages.length-1;if(count<=0)return;const toSum=data.messages.slice(0,count);const text=toSum.map(m=>`${m.name||(m.role==='user'?uName():'角色')}: ${m.content}`).join('\n');const prompt=`请将以下聊天记录总结为简洁的记忆摘要(150字内)。保留关键事件、情感变化、重要承诺，去掉日常寒暄。\n${data.memory?`已有的旧摘要：${data.memory}\n请将旧摘要和新内容合并。`:''}\n\n聊天记录：\n${text}\n\n直接输出摘要，不要任何前缀。`;const result=await apiChat([{role:'user',content:prompt}],500);data.memory=result.trim();data.messages=data.messages.slice(count);saveDNow();return result;}
async function checkAutoSum(chatId){if(!D.settings.autoSummarize||!apiOk())return;const data=getMsgs(chatId);if(data.messages.length>=D.settings.autoThreshold){try{await summarize(chatId,D.settings.autoSumCount);}catch(e){log('自动总结失败',e);}}}

function getGroupMemoryForFriend(fid){
    let memories=[];
    for(const [gid,g] of Object.entries(D.groups)){
        if(g.members.includes(fid)){
            const gm=D.messages[gid];
            if(gm?.memory)memories.push(`群聊「${g.name}」的记忆：${gm.memory}`);
            if(gm?.messages?.length){
                const recent=gm.messages.slice(-8);
                const summary=recent.map(m=>`${m.name||'?'}:${m.content}`).join('；');
                memories.push(`群「${g.name}」最近的对话：${summary}`);
            }
        }
    }
    let result=memories.join('\n');
    if(result.length>400)result=result.substring(0,400)+'...';
    return result;
}

function getPrivateMemoryForGroup(fid){
    const f=D.friends[fid]; if(!f)return '';
    const pm=D.messages[fid]; if(!pm)return '';
    let result='';
    if(pm.memory){
        const mem=pm.memory.length>200?pm.memory.substring(0,200)+'...':pm.memory;
        result+=`${f.profile.name}和${uName()}私下聊过的内容摘要：${mem}\n`;
    }
    const recent=pm.messages?.slice(-5);
    if(recent?.length){
        result+=`${f.profile.name}最近和${uName()}私聊：${recent.map(m=>`${m.role==='user'?uName():f.profile.name}:${m.content}`).join('；')}\n`;
    }
    return result;
}

/* [v5] ===== 预设系统 — 全面重写Prompt ===== */
const DEFAULT_PRESET={id:'default_v5',name:'通用默认v5',author:'系统',
sysPrompt:`你现在在一个跨时空通讯器的聊天软件里和别人聊天。你就是{name}本人。

【你的身份】{identity}
【你的性格调色盘】{personality}
【你的聊天人格】{chat_persona}
【你的说话风格与消息习惯】{speech_style}
【你知道的事】{knows}
【你不知道的事】{not_knows}
【你的敏感话题与反应】{sensitive_topics}
【你的人物关系】{relationships}
【你现在的状态】{current_state}
【你现在在做什么】{current_activity}
【你上次聊天后的心情】{last_emotion}
【你对对方的态度阶段】{attitude}
【关于你的二次解释（作者注释）】{reinterpretation}

== 死规则 ==
1. 你在手机通讯器上打字聊天。只输出纯文本消息。
2. 绝对不写动作（*笑了笑*）、不写心理、不写旁白、不写括号注释。
3. 你的每条消息必须短。日常闲聊3-15个字。认真说事情最多30个字。
4. 可以连发多条短消息。格式：["消息1","消息2","消息3"]
5. 可以用语气词：嗯、啊、草、哈、哦、额、emmm、？、。。。
6. 可以发语气表达：哈哈哈、笑死、无语、6、牛、啊这
7. emoji使用遵循你的消息习惯设定。
8. 你只知道"你知道的事"里的内容。别人提到你不知道的事，你要困惑或无视。
9. 你是活人不是客服。你可以不回、可以敷衍、可以已读不回。你有自己的情绪。
10. 不要自我介绍。不要解释世界观。
11. 如果你"现在在做什么"显示你很忙/在睡觉，你的回复要体现这个状态——回复更短、更慢、更不耐烦、或者直接不想理人。

== 态度阶段说明 ==
- 警惕/敬畏：你刚认识对方，保持距离感，不会随便交心
- 利益绑定：你和对方有了合作或利益关系，态度务实但不亲密
- 私人依赖：你把对方当重要的人，会主动关心，会说心里话

== 认知边界 ==
有人提到你不知道的世界、不知道的人物、不知道的技术：
- 第一反应是困惑或警惕
- 不会假装知道
- 可以好奇地追问
- 绝对不会主动联想到自己不知道的事

== 消息的不完美 ==
你是在手机上打字的活人，不是写作文：
- 可以打错字然后更正："不是，我说嘴""我说的是"
- 可以话说一半不说了
- 可以突然换话题
- 可以发完一条觉得不对劲再补一条
- 不需要每条消息都有明确的信息量
- 可以发废话

== 连发示例 ==
["在干嘛","出来玩不"]
["啊？","什么意思","没听懂"]
["哦","好吧"]
单条就直接发文本，不用数组。

== 重要 ==
回复最后另起一行，用[emotion:情绪词]标记你现在的情绪状态。
例如：[emotion:开心] 或 [emotion:烦躁]
这个标记不算消息内容，只是记录你的状态。`,

groupPrompt:`你现在模拟一个群聊里多个角色的发言。

群名：{groupName}
群成员信息：
{memberProfiles}

== 死规则 ==
1. 判断谁会回复：跟自己无关的不回。有人@必回。话题感兴趣才回。冷场时活跃分子找话题。
2. 每个角色严格按自己的说话风格。
3. 只输出纯文本聊天消息。禁止动作描写（*...*）、心理描写、旁白。
4. 每条消息3-20字。可以连发。
5. 返回JSON数组：[{"name":"角色名","msgs":["消息1","消息2"]}]
6. 没人想说话就返回空数组 []
7. 本轮最多2-3个人回复。不要所有人都说话。
8. 每个角色只知道自己认知范围内的事。

== 生态位 ==
{ecoRoles}

== 生态位行为约束 ==
- 水群龙王：几乎每轮都发言，爱灌水
- 活跃分子：经常发言，喜欢接话
- 正常发言：话题相关时参与
- 偶尔冒泡：大部分时候潜水，偶尔冒出来说一句
- 潜水怪：除非被@或涉及核心利益，否则不说话
- 气氛组：发表情、接梗、捧场
- 交易党：只在涉及交易/利益时发言

== 群聊生态 ==
- 不是所有人都回复每一条消息
- 可以出现冷场（返回空数组 []）
- 可以出现两个人吵起来其他人围观
- 可以有人发了一条消息被所有人无视
- 有人可能在聊别的话题突然岔开
- 可以有人说了句废话然后没人理`,

greetPrompt:`{sysPrompt}

【情境】你手边突然出现一个奇怪的通讯装置，上面有个叫"{userName}"的人的聊天窗口。你完全不知道这是什么东西。
根据你的性格做出反应。不要自我介绍。不要像客服打招呼。
如果你性格警惕就表现警惕，好奇就表现好奇，冷淡就冷淡。
输出格式：直接输出消息文本，或者用JSON数组连发。
最后用[emotion:情绪词]标记情绪。`,

/* [v5] 两步生成Prompt */
genPromptStep1:`你是一个角色档案生成器。为以下角色生成核心档案。

角色名：{name}
来源作品：{work}
时间线/处境：{timeline}
{impressionLine}

严格按JSON输出，不要其他文字。
要求：
1. personality必须用"性格调色盘"格式：写底色、主色调、点缀，每个下面有2-3个针对聊天行为的衍生
2. 衍生必须是聊天场景中的具体行为，不是抽象定义
3. 每个性格至少包含一个矛盾衍生（例如：沉稳的人偶尔暴躁、热情的人有时冷漠）
4. 禁止标签化——"沉稳"的衍生不能是"说话不急不慢"，而应该是具体的聊天行为
5. knows和not_knows必须严格基于时间线

错误示例（禁止）：
- "性格温和，偶尔会生气" ← 标签化
- "说话带有古风韵味" ← 模糊

正确示例：
- "底色-孤傲：别人找他聊天如果没有正事，他可能直接不回。但如果对方说了他感兴趣的话题，会突然变得话多。" ← 具体行为+矛盾

JSON格式：
{"name":"{name}","work":"{work}","timeline":"{timeline}","identity":"身份(60字内)","personality":"性格调色盘(底色+主色调+点缀，每个带2-3个聊天行为衍生，含矛盾衍生)(300字内)","knows":"该时间点已知的事(120字内)","not_knows":"还没发生的事(120字内)","sensitive_topics":"敏感话题及触碰后的具体反应行为(80字内)","relationships":"人物关系(120字内)","current_state":"当前处境和心理(100字内)"}`,

genPromptStep2:`基于以下角色核心档案，生成行为档案。

核心档案：
{coreProfile}

{styleHints}

严格按JSON输出，不要其他文字。
要求：
1. speech_style包含说话风格和消息习惯
2. chat_persona描述三个聊天模式（日常/认真/防备）的触发条件和风格特征
3. sample_lines必须像真实的聊天截图，不是文学台词
4. sample_lines分场景标注，至少13条
5. 禁止完整优美的句子，允许废话、不完整、口语化
6. reinterpretation必须用"AI可能以为…但实际上…"格式

错误示例（禁止）：
- "我向来不喜欢多管闲事" ← 太文学
- "hmm，这件事我需要好好想想" ← 太工整

正确示例：
- "啊？" ← 真实
- "不是 你说什么" ← 真实
- "哦" ← 真实
- "草 真的假的" ← 真实
- "行吧" ← 真实

JSON格式：
{"speech_style":"说话风格与消息习惯(含消息长度偏好、回复速度、emoji使用习惯、连发习惯、主动性)(80字内)","chat_persona":"聊天人格三模式(日常闲聊/认真说事/防备警惕，每个写触发条件和风格特征)(150字内)","sample_lines":{"日常闲聊":["台词1","台词2","台词3"],"被打扰时":["台词1","台词2"],"感兴趣时":["台词1","台词2"],"生气时":["台词1","台词2"],"主动找人":["台词1","台词2"],"群聊发言":["台词1","台词2"]},"reinterpretation":"二次解释(用'AI可能以为…但实际上…'格式，至少2条)(150字内)","eco_type":"群聊生态位(水群龙王/活跃分子/正常发言/偶尔冒泡/潜水怪/气氛组，选一个)"}`,

momentPrompt:`你是{name}。根据你的身份和当前状态，发一条朋友圈动态。

【你的身份】{identity}
【你的性格】{personality}
【说话风格】{speech_style}
【当前状态】{current_state}
{memory_context}

规则：
1. 像真人发朋友圈一样。可以是日常感想、吐槽、记录、心情、风景描述。
2. 内容15-80字。可以带1-3个emoji，也可以不带。
3. 不要自我介绍。不要解释世界观。不要用"今天我..."这种流水账开头。
4. 基于你当前的处境和心理状态来发。
5. 只输出朋友圈文本，不要任何前缀和解释。`,
commentPrompt:`你是{commenterName}。你看到{authorName}发了一条朋友圈：
"{postContent}"

你的性格：{commenterPersonality}
你的说话风格：{commenterStyle}

根据你的性格，决定是否评论。
- 如果你想评论，直接输出评论内容（3-20字），可以用emoji。
- 如果你不想评论，输出 [skip]。
- 不要前缀。不要解释。`,
replyCommentPrompt:`你是{authorName}。你发了一条朋友圈：
"{postContent}"

{commenterName}评论了："{commentContent}"

你的性格：{authorPersonality}
你的说话风格：{authorStyle}

根据你的性格决定是否回复这条评论。
- 想回复就直接输出回复内容（3-20字），可以用emoji。
- 不想回复输出 [skip]。
- 不要前缀。不要解释。`};

function loadPresets(){try{const s=localStorage.getItem(PRESET_KEY);if(s){const d=JSON.parse(s);if(!d.list.find(p=>p.id==='default_v5'))d.list.unshift({...DEFAULT_PRESET});return d;}}catch{}return{list:[{...DEFAULT_PRESET}],activeId:'default_v5'};}
function savePresets(d){try{localStorage.setItem(PRESET_KEY,JSON.stringify(d));}catch{}}
function getPreset(){const d=loadPresets();return d.list.find(p=>p.id===d.activeId)||d.list[0]||{...DEFAULT_PRESET};}

function exportPreset(preset){const blob=new Blob([JSON.stringify(preset,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`预设_${preset.name}.json`;a.click();URL.revokeObjectURL(url);toast('预设已导出');}
function importPreset(){const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const p=JSON.parse(ev.target.result);if(!p.sysPrompt&&!p.groupPrompt){toast('不是有效的预设文件','err');return;}if(!p.id)p.id=`preset_${uid()}`;if(!p.name)p.name='导入的预设';const d=loadPresets();if(d.list.find(x=>x.id===p.id))p.id=`preset_${uid()}`;d.list.push(p);savePresets(d);render();toast(`预设「${p.name}」已导入`);}catch(ex){toast('解析失败: '+ex.message,'err');}};reader.readAsText(file);};input.click();}

/* ===== Prompt构建 ===== */
function fillTemplate(tpl,vars){let s=tpl;for(const[k,v]of Object.entries(vars))s=s.replace(new RegExp(`\\{${k}\\}`,'g'),v||'');return s;}
function buildSysPrompt(profile,fid){
    const preset=getPreset();
    const friend=fid?D.friends[fid]:null;
    const attitude=friend?.attitudeStage||'警惕/敬畏';
    const emotionState=D.messages[fid]?.emotionState||friend?.emotionState||'平静';
    const activity=getActivity();
    return fillTemplate(preset.sysPrompt,{
        name:profile.name, identity:profile.identity||'',
        personality:profile.personality||'', chat_persona:profile.chat_persona||'',
        speech_style:profile.speech_style||'', knows:profile.knows||'',
        not_knows:profile.not_knows||'', sensitive_topics:profile.sensitive_topics||'',
        relationships:profile.relationships||'', current_state:profile.current_state||'',
        current_activity:activity, last_emotion:emotionState,
        attitude, reinterpretation:profile.reinterpretation||''
    });
}
function buildGroupSysPrompt(group){const preset=getPreset();let memberProfiles='';let ecoRoles='';for(const fid of group.members){const f=D.friends[fid];if(f){const p=f.profile;memberProfiles+=`\n【${p.name}】身份：${p.identity}。性格：${p.personality}。说话风格：${p.speech_style}。认知范围：${p.knows}。不知道的事：${p.not_knows}\n`;ecoRoles+=`${p.name}：${f.ecoType||'正常发言'}\n`;const pm=getPrivateMemoryForGroup(fid);if(pm)memberProfiles+=pm;}}return fillTemplate(preset.groupPrompt,{groupName:group.name,memberProfiles,ecoRoles});}

/* [v5] 两步生成 */
function buildGenPromptStep1(name,work,tl,impression){
    const preset=getPreset();
    const tpl=preset.genPromptStep1||DEFAULT_PRESET.genPromptStep1;
    const impressionLine=impression?`玩家对这个角色的印象：${impression}`:'';
    return fillTemplate(tpl,{name,work,timeline:tl,impressionLine});
}
function buildGenPromptStep2(coreProfile,styleHints){
    const preset=getPreset();
    const tpl=preset.genPromptStep2||DEFAULT_PRESET.genPromptStep2;
    return fillTemplate(tpl,{coreProfile:JSON.stringify(coreProfile,null,2),styleHints:styleHints||''});
}

/* ===== 朋友圈生成 ===== */
async function generateMoment(fid){const friend=D.friends[fid];if(!friend||!apiOk())return null;const p=friend.profile;const preset=getPreset();let memCtx='';const pm=D.messages[fid];if(pm?.memory)memCtx=`\n【最近和${uName()}聊过的事】${pm.memory.substring(0,150)}`;const prompt=fillTemplate(preset.momentPrompt||DEFAULT_PRESET.momentPrompt,{name:p.name,identity:p.identity,personality:p.personality,speech_style:p.speech_style,current_state:p.current_state,memory_context:memCtx});const content=await apiChat([{role:'user',content:prompt}],200);const clean=content.trim().replace(/^["']|["']$/g,'');const post={id:`m_${uid()}`,authorId:fid,authorName:p.name,content:clean,time:tStr(),ts:Date.now(),likes:[],comments:[]};await generateReactions(post);if(!D.moments)D.moments={posts:[],lastAutoGen:0,autoEnabled:false};D.moments.posts.unshift(post);if(D.moments.posts.length>50)D.moments.posts=D.moments.posts.slice(0,50);saveDNow();return post;}
async function generateReactions(post){const otherFriends=Object.keys(D.friends).filter(id=>id!==post.authorId);if(!otherFriends.length)return;const preset=getPreset();for(const fid of otherFriends){const f=D.friends[fid];if(!f)continue;if(Math.random()<0.4)post.likes.push(fid);if(Math.random()<0.3&&apiOk()){try{const prompt=fillTemplate(preset.commentPrompt||DEFAULT_PRESET.commentPrompt,{commenterName:f.profile.name,authorName:post.authorName,postContent:post.content,commenterPersonality:f.profile.personality,commenterStyle:f.profile.speech_style});const reply=await apiChat([{role:'user',content:prompt}],100);const clean=reply.trim();if(clean&&!clean.includes('[skip]'))post.comments.push({authorId:fid,authorName:f.profile.name,content:clean.replace(/^["']|["']$/g,'')});}catch{}}}}
async function checkAutoMoment(){if(!D.moments?.autoEnabled||!apiOk())return;const now=Date.now();if(now-(D.moments.lastAutoGen||0)<180000)return;const keys=Object.keys(D.friends);if(!keys.length)return;try{const fid=keys[Math.floor(Math.random()*keys.length)];await generateMoment(fid);D.moments.lastAutoGen=now;saveDNow();}catch(e){log('自动朋友圈失败',e);}}

async function generateAuthorReply(post,commentContent){
    if(!apiOk())return null;
    const author=D.friends[post.authorId];
    if(!author)return null;
    const preset=getPreset();
    const tpl=preset.replyCommentPrompt||DEFAULT_PRESET.replyCommentPrompt;
    const prompt=fillTemplate(tpl,{authorName:post.authorName,postContent:post.content,commenterName:uName(),commentContent:commentContent,authorPersonality:author.profile.personality,authorStyle:author.profile.speech_style});
    try{const reply=await apiChat([{role:'user',content:prompt}],100);const clean=reply.trim();if(clean&&!clean.includes('[skip]')){const replyComment={authorId:post.authorId,authorName:post.authorName,content:clean.replace(/^["']|["']$/g,''),replyTo:uName()};post.comments.push(replyComment);saveDNow();return replyComment;}}catch(e){log('角色回复评论失败',e);}
    return null;
}

/* ===== 解析/连发 ===== */
function extractEmotion(text){const match=text.match(/\[emotion:([^\]]+)\]/);return match?match[1].trim():null;}
function cleanEmotionTag(text){return text.replace(/\[emotion:[^\]]+\]/g,'').trim();}

function parseAIReply(text){const trimmed=cleanEmotionTag(text.trim());try{if(trimmed.startsWith('[')&&trimmed.endsWith(']')){const arr=JSON.parse(trimmed);if(Array.isArray(arr)&&arr.length>0){if(typeof arr[0]==='string')return{type:'multi',msgs:arr};if(arr[0].name)return{type:'group',data:arr};}}}catch{}try{const jm=trimmed.match(/\[[\s\S]*\]/);if(jm){const fixed=jm[0].replace(/,\s*([}\]])/g,'$1').replace(/'/g,'"');const arr=JSON.parse(fixed);if(Array.isArray(arr)&&arr.length>0){if(typeof arr[0]==='string')return{type:'multi',msgs:arr};if(arr[0].name)return{type:'group',data:arr};}}}catch{}let clean=trimmed.replace(/\*[^*]+\*/g,'').replace(/（[^）]+）/g,'').replace(/\([^)]+\)/g,'').trim();return{type:'single',msgs:[clean||trimmed]};}
function parseGroupReply(text){try{const jm=text.match(/\[[\s\S]*\]/);if(jm){const fixed=jm[0].replace(/,\s*([}\]])/g,'$1');return JSON.parse(fixed);}}catch{}try{const items=[];const regex=/"name"\s*:\s*"([^"]+)"[\s\S]*?"msgs"\s*:\s*\[([^\]]*?)\]/g;let match;while((match=regex.exec(text))!==null){const name=match[1];const msgsRaw=match[2];const msgs=[];const msgRegex=/"([^"]+)"/g;let mm;while((mm=msgRegex.exec(msgsRaw))!==null)msgs.push(mm[1]);if(msgs.length)items.push({name,msgs});}return items;}catch{}return[];}
async function sendMsgsWithDelay(area,msgs,name,color,chatId,isUser=false){const data=getMsgs(chatId);for(let i=0;i<msgs.length;i++){const content=msgs[i].trim();if(!content)continue;if(i>0)await new Promise(r=>setTimeout(r,rDelay(300,900)));const m={role:isUser?'user':'assistant',name:isUser?uName():name,content,time:tStr(),ts:Date.now()};data.messages.push(m);saveD();const bubble=createBubbleEl(m,color,name,!isUser&&i===msgs.length-1);area.appendChild(bubble);requestAnimationFrame(()=>{bubble.style.opacity='1';bubble.style.transform='translateY(0) scale(1)';});scrollToBottom(area);}}

/* ===== 拖拽 ===== */
function initDrag(el,opts={}){const hd=opts.handle?el.querySelector(opts.handle):el;if(!hd)return;let on=false,moved=false,sx,sy,ox,oy;hd.addEventListener('pointerdown',e=>{if(e.button!==0||(opts.ignore&&e.target.closest(opts.ignore)))return;e.preventDefault();on=true;moved=false;sx=e.clientX;sy=e.clientY;const r=el.getBoundingClientRect();ox=r.left;oy=r.top;hd.setPointerCapture(e.pointerId);},{passive:false});hd.addEventListener('pointermove',e=>{if(!on)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&Math.abs(dx)<3&&Math.abs(dy)<3)return;moved=true;e.preventDefault();const W=(window.top||window).innerWidth,H=(window.top||window).innerHeight;el.style.left=Math.max(0,Math.min(ox+dx,W-el.offsetWidth))+'px';el.style.top=Math.max(0,Math.min(oy+dy,H-40))+'px';el.style.right='auto';el.style.bottom='auto';},{passive:false});hd.addEventListener('pointerup',e=>{if(!on)return;on=false;try{hd.releasePointerCapture(e.pointerId);}catch{}if(!moved&&opts.onClick)opts.onClick(e);});hd.addEventListener('pointercancel',()=>{on=false;});}

/* ===== 导航 ===== */
let curTab='chats';const navStack=[];let navData={};let tmpProfile=null,tmpInput={name:'',work:'',timeline:'',impression:''};
function pushPage(pg,data){navData=data||{};navStack.push(pg);render();}
function popPage(){if(navStack.length)navStack.pop();render();}
function curPage(){return navStack.length?navStack[navStack.length-1]:null;}

/* [v5] ===== CSS — 方案D全面重写 ===== */
const CSS = `<style id="${P}-css">
#${P}-trigger,#${P}-overlay,#${P}-overlay *{box-sizing:border-box;margin:0;padding:0}
#${P}-trigger{position:fixed!important;top:40vh;left:18px;width:44px!important;height:44px!important;border-radius:15px!important;background:linear-gradient(135deg,#7c5ce0 0%,#6366f1 50%,#818cf8 100%)!important;border:1px solid rgba(255,255,255,.15)!important;box-shadow:0 4px 24px rgba(124,92,224,.5),0 0 40px rgba(99,102,241,.15)!important;z-index:2147483647!important;cursor:grab;display:flex!important;align-items:center;justify-content:center;user-select:none;touch-action:none;transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}
#${P}-trigger:hover{transform:scale(1.12);box-shadow:0 6px 32px rgba(124,92,224,.6),0 0 60px rgba(99,102,241,.2)!important}
#${P}-trigger svg{pointer-events:none}
#${P}-trigger .${P}-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #0a0a0a;box-shadow:0 2px 6px rgba(239,68,68,.4)}
#${P}-overlay{position:fixed!important;inset:0;z-index:2147483646!important;display:none;background:rgba(0,0,0,.55);backdrop-filter:blur(16px)}
#${P}-overlay.show{display:block!important}
.${P}-phone{position:absolute;width:390px;height:760px;max-width:96vw;max-height:95vh;background:#080810;border-radius:28px;padding:8px;box-shadow:0 30px 100px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.06),0 0 80px rgba(124,92,224,.08);opacity:0;transform:scale(.9) translateY(20px);transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1);display:flex;position:relative}
#${P}-overlay.show .${P}-phone{opacity:1;transform:scale(1) translateY(0)}
.${P}-phone::before{content:'';position:absolute;right:-3px;top:160px;width:3px;height:40px;background:linear-gradient(180deg,#333,#222);border-radius:0 3px 3px 0}
.${P}-phone::after{content:'';position:absolute;left:-3px;top:130px;width:3px;height:28px;background:linear-gradient(180deg,#333,#222);border-radius:3px 0 0 3px;box-shadow:0 44px 0 0 #282828}

.${P}-inner{width:100%;height:100%;background:linear-gradient(170deg,#0f0a1e 0%,#161030 35%,#0e1a2e 70%,#0a0f1a 100%);border-radius:22px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",sans-serif;color:#e8e4f0;font-size:15px;position:relative}
.${P}-inner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 20% 10%,rgba(124,92,224,.08),transparent),radial-gradient(ellipse 50% 50% at 80% 80%,rgba(56,189,248,.04),transparent);pointer-events:none;z-index:0}

.${P}-drag{height:44px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:move;user-select:none;touch-action:none;z-index:1}
.${P}-drag-pill{width:36px;height:4px;background:rgba(255,255,255,.1);border-radius:2px}
.${P}-home-bar{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:120px;height:4px;background:rgba(255,255,255,.1);border-radius:2px;z-index:50}

.${P}-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;position:relative;z-index:1}

/* Tab Bar */
.${P}-tab-bar{height:72px;flex-shrink:0;display:flex;background:rgba(8,6,18,.92);backdrop-filter:blur(30px);border-top:1px solid rgba(255,255,255,.04);padding-bottom:18px}
.${P}-tab-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:rgba(255,255,255,.2);font-size:10px;font-weight:500;transition:color .25s;-webkit-tap-highlight-color:transparent;position:relative}
.${P}-tab-item.on{color:#a78bfa}
.${P}-tab-item.on::after{content:'';position:absolute;bottom:0;width:4px;height:4px;border-radius:50%;background:#a78bfa;box-shadow:0 0 8px rgba(167,139,250,.6)}
.${P}-tab-item .ico{display:flex;align-items:center;justify-content:center;height:26px;transition:transform .2s}
.${P}-tab-item.on .ico{transform:scale(1.1)}
.${P}-tab-item .tab-badge{position:absolute;top:4px;right:calc(50% - 20px);min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px}

/* Main Area */
.${P}-main{flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0}
.${P}-hdr{height:56px;flex-shrink:0;display:flex;align-items:center;padding:0 28px;position:relative;justify-content:center}
.${P}-hdr-t{font-size:22px;font-weight:800;color:#fff;letter-spacing:.5px;text-align:center;background:linear-gradient(135deg,#fff 60%,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.${P}-hdr-a{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);cursor:pointer;color:#c4b5fd;font-size:17px;padding:0;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all .2s;position:absolute;right:28px}
.${P}-hdr-a:hover{background:rgba(167,139,250,.15);border-color:rgba(167,139,250,.3)}

/* Nav Bar */
.${P}-nav{height:52px;flex-shrink:0;display:flex;align-items:center;padding:0 20px;background:rgba(10,8,22,.85);backdrop-filter:blur(30px);border-bottom:1px solid rgba(255,255,255,.05);position:relative}
.${P}-bk{background:none;border:none;cursor:pointer;color:#a78bfa;font-size:14px;padding:0 6px;display:flex;align-items:center;gap:4px;z-index:1;font-weight:500;transition:opacity .15s}
.${P}-bk:active{opacity:.6}
.${P}-nt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:700;white-space:nowrap;max-width:50%;overflow:hidden;text-overflow:ellipsis;color:#fff}
.${P}-nra{position:absolute;right:20px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,.35);font-size:18px;padding:4px 8px;letter-spacing:3px}

/* Scroll area */
.${P}-pg{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;padding:4px 20px}
.${P}-pg::-webkit-scrollbar{width:0}

/* Lists */
.${P}-ls{background:rgba(255,255,255,.03);border-radius:16px;margin:10px 0;overflow:hidden;border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(8px)}
.${P}-li{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .15s;-webkit-tap-highlight-color:transparent}
.${P}-li:last-child{border-bottom:none}
.${P}-li:active{background:rgba(255,255,255,.04)}

/* Avatar */
.${P}-av{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:600;color:#fff;flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,.25);position:relative}
.${P}-av.round{border-radius:50%}
.${P}-av.ic{background:none;box-shadow:none;color:#c4b5fd}
.${P}-av .online-dot{position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-radius:50%;background:#4ade80;border:2px solid #0f0a1e;box-shadow:0 0 6px rgba(74,222,128,.4)}
.${P}-av .unread-dot{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #0f0a1e}

/* List Info */
.${P}-linfo{flex:1;min-width:0}
.${P}-lnm{font-size:15px;font-weight:600;color:rgba(255,255,255,.92)}
.${P}-lsub{font-size:12px;color:rgba(255,255,255,.3);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${P}-larr{color:rgba(255,255,255,.12);font-size:16px}
.${P}-ltm{font-size:11px;color:rgba(255,255,255,.2);flex-shrink:0}
.${P}-sec{font-size:11px;color:rgba(167,139,250,.5);padding:20px 12px 8px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px}

/* Forms */
.${P}-form{padding:16px 14px}
.${P}-fg{margin-bottom:18px}
.${P}-fl{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:6px;padding-left:2px;font-weight:600;letter-spacing:.5px}
.${P}-inp,.${P}-ta,.${P}-sel{width:100%;padding:14px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);font-size:14px;color:#e8e4f0;outline:none;font-family:inherit;transition:all .25s}
.${P}-inp::placeholder,.${P}-ta::placeholder{color:rgba(255,255,255,.25)}
.${P}-inp:focus,.${P}-ta:focus,.${P}-sel:focus{border-color:rgba(167,139,250,.5);box-shadow:0 0 0 3px rgba(167,139,250,.1),0 0 20px rgba(167,139,250,.05);background:rgba(255,255,255,.06)}
.${P}-ta{min-height:72px;resize:vertical;line-height:1.5}
.${P}-sel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.3)' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;padding-right:40px}
.${P}-sel option{background:#161030;color:#e8e4f0}

/* Buttons */
.${P}-btn{display:flex;width:100%;padding:14px;border-radius:14px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s cubic-bezier(.34,1.56,.64,1);align-items:center;justify-content:center;gap:7px}
.${P}-btn:active{transform:scale(.97)}
.${P}-btn:disabled{opacity:.3;cursor:not-allowed;transform:none}
.${P}-btn.gn{background:linear-gradient(135deg,#7c5ce0 0%,#6366f1 50%,#818cf8 100%);color:#fff;box-shadow:0 4px 20px rgba(124,92,224,.3),0 0 40px rgba(99,102,241,.08);border:1px solid rgba(255,255,255,.1)}
.${P}-btn.gn:hover:not(:disabled){box-shadow:0 6px 28px rgba(124,92,224,.45),0 0 60px rgba(99,102,241,.12)}
.${P}-btn.gy{background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08)}
.${P}-btn.gy:hover:not(:disabled){background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12)}
.${P}-btn.rd{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.${P}-brow{display:flex;gap:10px}
.${P}-brow .${P}-btn{flex:1}
.${P}-bsm{display:inline-flex;width:auto;padding:8px 16px;font-size:12px;border-radius:10px}

/* [v5] Tags */
.${P}-tags{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.${P}-tag{padding:6px 14px;border-radius:20px;border:1px solid rgba(167,139,250,.2);background:rgba(167,139,250,.06);color:rgba(167,139,250,.8);font-size:12px;cursor:pointer;transition:all .2s;font-weight:500}
.${P}-tag:hover{background:rgba(167,139,250,.15);border-color:rgba(167,139,250,.4)}
.${P}-tag.on{background:linear-gradient(135deg,rgba(124,92,224,.3),rgba(99,102,241,.2));border-color:rgba(167,139,250,.5);color:#c4b5fd;box-shadow:0 0 12px rgba(167,139,250,.15)}

/* [v5] Collapsible */
.${P}-collapse-btn{background:none;border:none;color:rgba(167,139,250,.6);font-size:12px;cursor:pointer;padding:8px 0;font-family:inherit;display:flex;align-items:center;gap:4px;transition:color .2s}
.${P}-collapse-btn:hover{color:#a78bfa}
.${P}-collapse-content{max-height:0;overflow:hidden;transition:max-height .35s ease}
.${P}-collapse-content.open{max-height:800px}

/* Chat */
.${P}-chat-w{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.${P}-ca{flex:1;overflow-y:auto;padding:16px 24px;-webkit-overflow-scrolling:touch;min-height:0}
.${P}-ca::-webkit-scrollbar{width:0}
.${P}-bw{display:flex;margin-bottom:20px;align-items:flex-start;gap:10px;opacity:0;transform:translateY(12px) scale(.96);transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1)}
.${P}-bw.u{flex-direction:row-reverse}
.${P}-bav{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;flex-shrink:0;cursor:pointer;transition:transform .15s;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.${P}-bav:active{transform:scale(.9)}
.${P}-bcol{max-width:72%;display:flex;flex-direction:column}
.${P}-bw.u .${P}-bcol{align-items:flex-end}
.${P}-bnm{font-size:11px;color:rgba(255,255,255,.25);margin-bottom:5px;padding-left:4px;font-weight:500}
.${P}-bw.u .${P}-bnm{padding-right:4px;padding-left:0;text-align:right}
.${P}-bb{padding:14px 20px;font-size:14px;line-height:1.65;word-break:break-word;white-space:pre-wrap}
.${P}-bb.o{background:rgba(255,255,255,.06);backdrop-filter:blur(12px);border-radius:2px 16px 16px 16px;color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.06)}
.${P}-bb.me{background:linear-gradient(135deg,rgba(124,92,224,.35),rgba(99,102,241,.25));backdrop-filter:blur(12px);border-radius:16px 2px 16px 16px;color:rgba(255,255,255,.95);border:1px solid rgba(167,139,250,.15)}
.${P}-bact{margin-top:4px}
.${P}-bw.u .${P}-bact{text-align:right}
.${P}-rg{background:none;border:none;cursor:pointer;font-size:11px;color:rgba(255,255,255,.18);padding:2px 4px;transition:color .15s;display:inline-flex;align-items:center;gap:3px}
.${P}-rg:hover{color:#a78bfa}

/* Typing Animation */
.${P}-typ{padding:6px 16px 6px 64px;font-size:13px;color:rgba(167,139,250,.5);display:none;flex-shrink:0;align-items:center;gap:8px}
.${P}-typ.on{display:flex}
.${P}-typ-dots{display:flex;gap:3px}
.${P}-typ-dots span{width:6px;height:6px;border-radius:50%;background:rgba(167,139,250,.4);animation:${P}-dotPulse 1.4s infinite}
.${P}-typ-dots span:nth-child(2){animation-delay:.2s}
.${P}-typ-dots span:nth-child(3){animation-delay:.4s}
@keyframes ${P}-dotPulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}

/* Input Bar */
.${P}-ibar{display:flex;gap:8px;padding:12px 24px 68px;background:rgba(8,6,18,.92);backdrop-filter:blur(30px);border-top:1px solid rgba(255,255,255,.04);align-items:flex-end;flex-shrink:0}
.${P}-mi{flex:1;padding:12px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);font-size:14px;outline:none;font-family:inherit;resize:none;max-height:68px;min-height:36px;line-height:1.4;color:#e8e4f0;transition:all .25s}
.${P}-mi::placeholder{color:rgba(255,255,255,.25)}
.${P}-mi:focus{border-color:rgba(167,139,250,.5);box-shadow:0 0 0 3px rgba(167,139,250,.1);background:rgba(255,255,255,.06)}
.${P}-sd{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#7c5ce0,#6366f1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 12px rgba(124,92,224,.3);transition:all .15s}
.${P}-sd:active{transform:scale(.9)}
.${P}-sd:disabled{background:rgba(255,255,255,.05);box-shadow:none}

/* Profile Cards */
.${P}-pf{padding:14px 16px}
.${P}-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:22px 24px;margin-bottom:14px;backdrop-filter:blur(8px);transition:border-color .3s}
.${P}-card:hover{border-color:rgba(167,139,250,.12)}
.${P}-card-t{font-size:12px;color:rgba(167,139,250,.5);font-weight:700;letter-spacing:.5px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:7px}
.${P}-pff{margin-bottom:14px}
.${P}-pff:last-child{margin-bottom:0}
.${P}-pfl{font-size:11px;color:rgba(255,255,255,.35);margin-bottom:5px;letter-spacing:.5px;font-weight:600}
.${P}-pfv{font-size:13px;line-height:1.7;color:rgba(255,255,255,.75);white-space:pre-wrap;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);border-radius:10px;padding:14px 20px}

/* Empty State */
.${P}-empty{text-align:center;padding:60px 24px;color:rgba(255,255,255,.2);font-size:14px;display:flex;flex-direction:column;align-items:center;gap:12px}
.${P}-empty .${P}-empty-title{font-size:16px;font-weight:600;color:rgba(255,255,255,.3)}
.${P}-empty .${P}-empty-sub{font-size:12px;color:rgba(255,255,255,.15)}

/* Status Tags */
.${P}-st{padding:12px 18px;border-radius:12px;font-size:12px;margin-top:8px;line-height:1.5}
.${P}-st.ok{background:rgba(74,222,128,.06);color:#4ade80;border:1px solid rgba(74,222,128,.12)}
.${P}-st.er{background:rgba(248,113,113,.06);color:#f87171;border:1px solid rgba(248,113,113,.12)}
.${P}-st.in{background:rgba(167,139,250,.06);color:#a78bfa;border:1px solid rgba(167,139,250,.12)}

/* Checkbox / Switch */
.${P}-chk-row{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer}
.${P}-chk-row:last-child{border-bottom:none}
.${P}-chk{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;font-size:11px}
.${P}-chk.on{border-color:#7c5ce0;background:#7c5ce0;color:#fff}
.${P}-switch-row{display:flex;align-items:center;justify-content:space-between;padding:16px 20px}
.${P}-switch-row span{color:rgba(255,255,255,.75);font-size:14px}
.${P}-sw{position:relative;width:44px;height:24px;cursor:pointer}
.${P}-sw input{opacity:0;width:0;height:0}
.${P}-sw-sl{position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:12px;transition:.3s}
.${P}-sw-sl::before{content:'';position:absolute;width:20px;height:20px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:.3s;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.${P}-sw input:checked+.${P}-sw-sl{background:linear-gradient(135deg,#7c5ce0,#6366f1)}
.${P}-sw input:checked+.${P}-sw-sl::before{transform:translateX(20px)}

/* Range */
.${P}-range-row{display:flex;align-items:center;gap:10px;padding:4px 0}
.${P}-range-row input[type=range]{flex:1;accent-color:#7c5ce0}
.${P}-range-val{font-size:13px;font-weight:600;color:#a78bfa;min-width:28px;text-align:center}

/* Memory */
.${P}-mem-box{margin:8px 0;padding:16px 20px;background:rgba(255,255,255,.03);border-radius:14px;font-size:13px;line-height:1.6;border:1px solid rgba(255,255,255,.06)}
.${P}-mem-text{color:rgba(255,255,255,.6);white-space:pre-wrap;max-height:110px;overflow-y:auto}

/* Player Header */
.${P}-player-header{background:rgba(255,255,255,.03);backdrop-filter:blur(12px);padding:20px;display:flex;align-items:center;gap:16px;margin:8px 0;border-radius:16px;border:1px solid rgba(255,255,255,.06);cursor:pointer;transition:all .2s}
.${P}-player-header:hover{border-color:rgba(167,139,250,.15);background:rgba(255,255,255,.05)}
.${P}-player-av{width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#7c5ce0,#6366f1,#818cf8);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;font-weight:700;flex-shrink:0;box-shadow:0 4px 16px rgba(124,92,224,.3)}
.${P}-player-info{flex:1}
.${P}-player-name{font-size:18px;font-weight:700;color:#fff}
.${P}-player-sub{font-size:12px;color:rgba(255,255,255,.3);margin-top:3px}
.${P}-time-sep{text-align:center;padding:12px 0;font-size:11px;color:rgba(255,255,255,.15)}

/* ===== 日间模式 ===== */
.${P}-light{background:linear-gradient(170deg,#f5f2fc 0%,#ede8f7 35%,#edf2f9 70%,#f8f9fc 100%)!important;color:#1a1a2e}
.${P}-light::before{background:radial-gradient(ellipse 60% 40% at 20% 10%,rgba(124,92,224,.05),transparent),radial-gradient(ellipse 50% 50% at 80% 80%,rgba(56,189,248,.03),transparent)}
.${P}-light .${P}-hdr-t{background:linear-gradient(135deg,#1a1a2e 60%,#7c5ce0);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.${P}-light .${P}-hdr-a{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.08);color:#7c5ce0}
.${P}-light .${P}-tab-bar{background:rgba(250,248,255,.95);border-top-color:rgba(0,0,0,.06)}
.${P}-light .${P}-tab-item{color:rgba(0,0,0,.25)}
.${P}-light .${P}-tab-item.on{color:#7c5ce0}
.${P}-light .${P}-tab-item.on::after{background:#7c5ce0;box-shadow:0 0 8px rgba(124,92,224,.4)}
.${P}-light .${P}-nav{background:rgba(250,248,255,.92);border-bottom-color:rgba(0,0,0,.06)}
.${P}-light .${P}-bk{color:#7c5ce0}
.${P}-light .${P}-nt{color:#1a1a2e}
.${P}-light .${P}-ls{background:rgba(255,255,255,.7);border-color:rgba(0,0,0,.06)}
.${P}-light .${P}-li{border-bottom-color:rgba(0,0,0,.04)}
.${P}-light .${P}-li:active{background:rgba(0,0,0,.03)}
.${P}-light .${P}-lnm{color:rgba(0,0,0,.85)}
.${P}-light .${P}-lsub{color:rgba(0,0,0,.35)}
.${P}-light .${P}-ltm{color:rgba(0,0,0,.25)}
.${P}-light .${P}-sec{color:rgba(124,92,224,.45)}
.${P}-light .${P}-fl{color:rgba(0,0,0,.45)}
.${P}-light .${P}-inp,.${P}-light .${P}-ta,.${P}-light .${P}-sel{background:rgba(255,255,255,.8);border-color:rgba(0,0,0,.1);color:#1a1a2e}
.${P}-light .${P}-inp::placeholder,.${P}-light .${P}-ta::placeholder{color:rgba(0,0,0,.3)}
.${P}-light .${P}-inp:focus,.${P}-light .${P}-ta:focus,.${P}-light .${P}-sel:focus{border-color:rgba(124,92,224,.4);box-shadow:0 0 0 3px rgba(124,92,224,.08);background:#fff}
.${P}-light .${P}-btn.gy{background:rgba(0,0,0,.04);color:rgba(0,0,0,.6);border-color:rgba(0,0,0,.08)}
.${P}-light .${P}-card{background:rgba(255,255,255,.6);border-color:rgba(0,0,0,.06)}
.${P}-light .${P}-card-t{color:rgba(124,92,224,.45);border-bottom-color:rgba(0,0,0,.04)}
.${P}-light .${P}-pfl{color:rgba(0,0,0,.4)}
.${P}-light .${P}-pfv{color:rgba(0,0,0,.7);background:rgba(0,0,0,.02);border-color:rgba(0,0,0,.04)}
.${P}-light .${P}-empty{color:rgba(0,0,0,.25)}
.${P}-light .${P}-bnm{color:rgba(0,0,0,.3)}
.${P}-light .${P}-bb.o{background:rgba(255,255,255,.75);color:rgba(0,0,0,.8);border-color:rgba(0,0,0,.06)}
.${P}-light .${P}-bb.me{background:linear-gradient(135deg,rgba(124,92,224,.55),rgba(99,102,241,.4));color:#fff}
.${P}-light .${P}-rg{color:rgba(0,0,0,.2)}
.${P}-light .${P}-typ{color:rgba(124,92,224,.4)}
.${P}-light .${P}-ibar{background:rgba(250,248,255,.95);border-top-color:rgba(0,0,0,.06)}
.${P}-light .${P}-mi{background:rgba(255,255,255,.8);border-color:rgba(0,0,0,.1);color:#1a1a2e}
.${P}-light .${P}-mi:focus{border-color:rgba(124,92,224,.4);box-shadow:0 0 0 3px rgba(124,92,224,.08);background:#fff}
.${P}-light .${P}-player-header{background:rgba(255,255,255,.6);border-color:rgba(0,0,0,.06)}
.${P}-light .${P}-player-name{color:#1a1a2e}
.${P}-light .${P}-player-sub{color:rgba(0,0,0,.35)}
.${P}-light .${P}-switch-row span{color:rgba(0,0,0,.7)}
.${P}-light .${P}-sw-sl{background:rgba(0,0,0,.12)}
.${P}-light .${P}-mem-box{background:rgba(255,255,255,.55);border-color:rgba(0,0,0,.06)}
.${P}-light .${P}-mem-text{color:rgba(0,0,0,.55)}
.${P}-light .${P}-time-sep{color:rgba(0,0,0,.15)}
.${P}-light .${P}-tag{border-color:rgba(124,92,224,.15);background:rgba(124,92,224,.04);color:rgba(124,92,224,.7)}
.${P}-light .${P}-tag.on{background:rgba(124,92,224,.12);border-color:rgba(124,92,224,.3);color:#7c5ce0}
.${P}-light .${P}-home-bar{background:rgba(0,0,0,.08)}
.${P}-light .${P}-drag-pill{background:rgba(0,0,0,.08)}
.${P}-light .${P}-nra{color:rgba(0,0,0,.3)}
.${P}-light .${P}-av .online-dot{border-color:#f5f2fc}
.${P}-light .${P}-av .unread-dot{border-color:#f5f2fc}
@media(max-width:400px){.${P}-phone{border-radius:18px;padding:4px}.${P}-inner{border-radius:16px}}
</style>`;

/* ===== 卡片标题SVG ===== */
const CT = {
    info:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>`,
    personality:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    brain:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    link:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`,
    sword:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    heart:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    chat2:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>`,
    reinterpret:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
};

/* ===== 气泡DOM ===== */
function createBubbleEl(msg,color,name,showRegen=false){
    const isUser=msg.role==='user';const div=document.createElement('div');
    div.className=`${P}-bw${isUser?' u':''}`;div.style.opacity='0';div.style.transform='translateY(12px) scale(.96)';
    let h='';
    if(!isUser){
        h+=`<div class="${P}-bav" style="background:${color}" data-action="view-profile" data-name="${esc(name)}">${esc(aCh(name))}</div>`;
        h+=`<div class="${P}-bcol"><div class="${P}-bnm">${esc(name)}</div><div class="${P}-bb o">${esc(msg.content)}</div>`;
        if(showRegen)h+=`<div class="${P}-bact"><button class="${P}-rg" data-act="regen">${IC.refresh} 重试</button></div>`;
        h+=`</div>`;
    }else{
        h+=`<div class="${P}-bav round" style="background:linear-gradient(135deg,#7c5ce0,#6366f1)" data-action="view-player">${esc(aCh(uName()))}</div>`;
        h+=`<div class="${P}-bcol"><div class="${P}-bb me">${esc(msg.content)}</div></div>`;
    }
    div.innerHTML=h;return div;
}
function createTimeSep(timeStr){const div=document.createElement('div');div.className=`${P}-time-sep`;div.textContent=timeStr;return div;}

/* ===== 渲染 ===== */
function render(){const body=qsel(`#${P}-body`);if(!body)return;const sub=curPage();if(sub){renderSub(body,sub);applyTheme();return;}body.innerHTML=renderTab(curTab)+renderTabBar();bindTab(body);applyTheme();updateTriggerBadge();}

function updateTriggerBadge(){const trigger=qsel(`#${P}-trigger`);if(!trigger)return;const n=totalUnread();let badge=trigger.querySelector(`.${P}-badge`);if(n>0){if(!badge){badge=document.createElement('span');badge.className=`${P}-badge`;trigger.appendChild(badge);}badge.textContent=n>99?'99+':n;}else if(badge){badge.remove();}}

function renderTabBar(){
    const un=totalUnread();
    const tabs=[['chats',IC.chat,'消息',un],['contacts',IC.contacts,'通讯录',0],['discover',IC.discover,'发现',0],['settings',IC.me,'我',0]];
    return `<div class="${P}-tab-bar">${tabs.map(([k,ic,nm,badge])=>`<div class="${P}-tab-item ${curTab===k?'on':''}" data-tab="${k}"><span class="ico">${ic}</span>${badge>0?`<span class="tab-badge">${badge>99?'99+':badge}</span>`:''}${nm}</div>`).join('')}</div>`;
}

function renderTab(tab){
    if(tab==='chats')return renderChatsTab();
    if(tab==='contacts')return renderContactsTab();
    if(tab==='discover')return renderDiscoverTab();
    if(tab==='settings')return renderSettingsTab();
    return '';
}

function renderChatsTab(){
    let items=[];
    for(const[id,f]of Object.entries(D.friends)){const lm=lastMsg(id);items.push({id,type:'f',name:f.profile.name,color:f.avatarColor,ch:aCh(f.profile.name),preview:lm?lm.content.substring(0,28):'',time:lm?.time||'',ts:lm?.ts||0,unread:f.unread||0});}
    for(const[id,g]of Object.entries(D.groups)){const lm=lastMsg(id);items.push({id,type:'g',name:g.name,color:'#6366f1',ch:'群',preview:lm?`${lm.name||''}:${lm.content.substring(0,20)}`:'',time:lm?.time||'',ts:lm?.ts||0,unread:g.unread||0});}
    items.sort((a,b)=>b.ts-a.ts);
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">消息</span><button class="${P}-hdr-a" data-act="new-group" title="创建群聊">${IC.plus}</button></div><div class="${P}-pg">`;
    if(items.length===0){h+=`<div class="${P}-empty">${IC.chatEmpty}<span class="${P}-empty-title">还没有消息</span><span class="${P}-empty-sub">去通讯录添加你的第一个联系人</span><button class="${P}-btn gn ${P}-bsm" data-act="add-friend" style="margin-top:12px">${IC.sparkle} 添加好友</button></div>`;}
    else{h+=`<div class="${P}-ls">`;for(const it of items){h+=`<div class="${P}-li" data-act="open-${it.type==='g'?'group':'chat'}" data-id="${it.id}"><div class="${P}-av" style="background:${it.color}">${esc(it.ch)}${it.unread>0?`<span class="unread-dot">${it.unread>99?'99+':it.unread}</span>`:''}<span class="online-dot"></span></div><div class="${P}-linfo"><div class="${P}-lnm">${esc(it.name)}</div>${it.preview?`<div class="${P}-lsub">${esc(it.preview)}</div>`:''}</div>${it.time?`<span class="${P}-ltm">${esc(it.time)}</span>`:`<span class="${P}-larr">›</span>`}</div>`;}h+='</div>';}
    h+='</div></div>';return h;
}

function renderContactsTab(){
    const keys=Object.keys(D.friends);
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">通讯录</span><button class="${P}-hdr-a" data-act="add-friend" title="添加好友">${IC.plus}</button></div><div class="${P}-pg">`;
    h+=`<div class="${P}-ls"><div class="${P}-li" data-act="add-friend"><div class="${P}-av" style="background:linear-gradient(135deg,#f97316,#facc15)">${IC.addUser}</div><div class="${P}-linfo"><div class="${P}-lnm">添加新好友</div><div class="${P}-lsub">跨越时空寻找联系人</div></div><span class="${P}-larr">›</span></div></div>`;
    if(keys.length){h+=`<div class="${P}-sec">好友 · ${keys.length}</div><div class="${P}-ls">`;for(const id of keys){const f=D.friends[id];h+=`<div class="${P}-li" data-act="open-contact" data-id="${id}" data-name="${esc(f.profile.name)}"><div class="${P}-av" style="background:${f.avatarColor}">${esc(aCh(f.profile.name))}<span class="online-dot"></span></div><div class="${P}-linfo"><div class="${P}-lnm">${esc(f.profile.name)}</div><div class="${P}-lsub">${esc(f.profile.work||'未知作品')}·${esc(f.profile.timeline||'').substring(0,18)}</div></div><span class="${P}-larr">›</span></div>`;}h+='</div>';}
    h+='</div></div>';return h;
}

function renderDiscoverTab(){
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">发现</span></div><div class="${P}-pg">`;
    h+=`<div class="${P}-ls"><div class="${P}-li" data-act="moments"><div class="${P}-av" style="background:linear-gradient(135deg,#38bdf8,#818cf8)">${IC.camera}</div><div class="${P}-linfo"><div class="${P}-lnm">朋友圈</div><div class="${P}-lsub">查看好友动态</div></div><span class="${P}-larr">›</span></div></div>`;
    h+=`</div></div>`;
    return h;
}

function renderSettingsTab(){
    const pi=getPlayerInfo();const s=D.settings;
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">我</span></div><div class="${P}-pg">`;
    h+=`<div class="${P}-player-header" data-act="view-player"><div class="${P}-player-av">${esc(aCh(pi?.name||uName()))}</div><div class="${P}-player-info"><div class="${P}-player-name">${esc(pi?.name||uName())}</div><div class="${P}-player-sub">${pi?`Lv.${pi.level} · ${pi.spirit}`:'点击查看详情'}</div></div><span class="${P}-larr">›</span></div>`;
    /* 外观 */
    h+=`<div class="${P}-sec">外观</div><div class="${P}-ls"><div class="${P}-switch-row"><span>${curTheme==='dark'?'🌙 深色模式':'☀️ 浅色模式'}</span><label class="${P}-sw"><input type="checkbox" id="${P}-s-theme" ${curTheme==='light'?'checked':''}><span class="${P}-sw-sl"></span></label></div></div>`;
    /* API */
    h+=`<div class="${P}-sec">API 配置</div><div class="${P}-ls">
        <div class="${P}-li" style="cursor:default;flex-wrap:wrap"><div class="${P}-linfo" style="width:100%"><div class="${P}-fl">API 地址</div><input class="${P}-inp" id="${P}-s-url" placeholder="https://api.example.com" value="${esc(api.url)}" style="margin-top:4px"></div></div>
        <div class="${P}-li" style="cursor:default;flex-wrap:wrap"><div class="${P}-linfo" style="width:100%"><div class="${P}-fl">API 密钥</div><input class="${P}-inp" id="${P}-s-key" type="password" placeholder="sk-..." value="${esc(api.key)}" style="margin-top:4px"></div></div>
        <div class="${P}-li" style="cursor:default;flex-wrap:wrap"><div class="${P}-linfo" style="width:100%"><div class="${P}-fl">模型</div><select class="${P}-sel" id="${P}-s-model" style="margin-top:4px">${api.models.length?api.models.map(m=>`<option value="${esc(m)}" ${m===api.model?'selected':''}>${esc(m)}</option>`).join(''):(api.model?`<option value="${esc(api.model)}" selected>${esc(api.model)}</option>`:'<option value="">请先获取模型列表</option>')}</select></div></div>
    </div>`;
    h+=`<div style="padding:6px 0;display:flex;gap:6px"><button class="${P}-btn gy ${P}-bsm" id="${P}-s-fetch">${IC.signal} 获取</button><button class="${P}-btn gy ${P}-bsm" id="${P}-s-test">${IC.test} 测试</button><button class="${P}-btn gn ${P}-bsm" id="${P}-s-save">${IC.save} 保存</button></div>`;
    h+=`<div id="${P}-s-st" class="${P}-st" style="display:none;margin:0"></div>`;
    /* 预设 */
    h+=`<div class="${P}-sec">预设管理</div><div class="${P}-ls"><div class="${P}-li" data-act="preset-manage"><div class="${P}-av ic">${IC.preset}</div><div class="${P}-linfo"><div class="${P}-lnm">Prompt预设</div><div class="${P}-lsub">管理和切换聊天预设</div></div><span class="${P}-larr">›</span></div></div>`;
    /* 记忆 */
    h+=`<div class="${P}-sec">记忆管理</div><div class="${P}-ls"><div class="${P}-switch-row"><span>自动总结</span><label class="${P}-sw"><input type="checkbox" id="${P}-s-auto" ${s.autoSummarize?'checked':''}><span class="${P}-sw-sl"></span></label></div>`;
    if(s.autoSummarize){h+=`<div class="${P}-li" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px"><div class="${P}-fl" style="padding:0">触发阈值</div><div class="${P}-range-row"><input type="range" id="${P}-s-threshold" min="30" max="200" value="${s.autoThreshold}"><span class="${P}-range-val" id="${P}-s-th-val">${s.autoThreshold}</span></div><div class="${P}-fl" style="padding:0">总结条数</div><div class="${P}-range-row"><input type="range" id="${P}-s-sumcount" min="10" max="150" value="${s.autoSumCount}"><span class="${P}-range-val" id="${P}-s-sc-val">${s.autoSumCount}</span></div></div>`;}
    h+=`</div>`;
    /* 数据 */
    h+=`<div class="${P}-sec">数据管理</div><div class="${P}-ls">
        <div class="${P}-li" id="${P}-s-export"><div class="${P}-av ic">${IC.download}</div><div class="${P}-linfo"><div class="${P}-lnm">导出数据</div></div><span class="${P}-larr">›</span></div>
        <div class="${P}-li" id="${P}-s-import"><div class="${P}-av ic">${IC.upload}</div><div class="${P}-linfo"><div class="${P}-lnm">导入数据</div></div><span class="${P}-larr">›</span></div>
        <div class="${P}-li" id="${P}-s-clear-msg"><div class="${P}-av ic" style="color:#f87171">${IC.trash}</div><div class="${P}-linfo"><div class="${P}-lnm">清空聊天记录</div></div><span class="${P}-larr">›</span></div>
        <div class="${P}-li" id="${P}-s-clear-all"><div class="${P}-av ic" style="color:#ef4444">${IC.trash}</div><div class="${P}-linfo"><div class="${P}-lnm" style="color:#f87171">清空全部数据</div></div><span class="${P}-larr">›</span></div>
    </div>`;
    /* 状态 */
    h+=`<div class="${P}-sec">状态</div><div class="${P}-ls">
        <div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">API</div></div><span style="color:${apiOk()?'#4ade80':'#f87171'};font-size:13px">${apiOk()?'● 已连接':'○ 未配置'}</span></div>
        <div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">好友 / 群聊</div></div><span style="color:rgba(255,255,255,.4);font-size:13px">${Object.keys(D.friends).length}人 / ${Object.keys(D.groups).length}群</span></div>
        <div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">版本</div></div><span style="color:rgba(167,139,250,.5);font-size:13px">v${VERSION}</span></div>
    </div><div style="height:16px"></div></div></div>`;
    return h;
}

/* ===== 子页面 ===== */
function renderSub(body,page){
    if(page==='chat'){renderChatSub(body);return;}
    if(page==='group-chat'){renderGroupChatSub(body);return;}
    if(page==='profile'){renderProfileSub(body);return;}
    if(page==='player-info'){renderPlayerInfoSub(body);return;}
    if(page==='group-detail'){renderGroupDetailSub(body);return;}
    if(page==='preset-manage'){renderPresetManageSub(body);return;}
    if(page==='preset-edit'){renderPresetEditSub(body);return;}
    let html='';
    if(page==='add-friend')html=subAddFriend();
    else if(page==='preview')html=subPreview();
    else if(page==='new-group')html=subNewGroup();
    else if(page==='memory')html=subMemory();
    else if(page==='moments')html=subMoments();
    body.innerHTML=html;bindSub(body,page);
}
function navBar(title,rightBtn=''){return `<div class="${P}-nav"><button class="${P}-bk" data-act="back">${BK_SVG} 返回</button><span class="${P}-nt">${esc(title)}</span>${rightBtn}</div>`;}

function renderProfileSub(body){
    const fid=navData.fid;const friend=D.friends[fid];if(!friend){popPage();return;}const p=friend.profile;
    const f=(l,v)=>`<div class="${P}-pff"><div class="${P}-pfl">${l}</div><div class="${P}-pfv">${esc(v||'暂无')}</div></div>`;
    let h=`${navBar(p.name)}<div class="${P}-pg"><div class="${P}-pf">`;
    h+=`<div style="text-align:center;margin-bottom:20px"><div class="${P}-av" style="background:${friend.avatarColor};width:68px;height:68px;font-size:28px;margin:0 auto;border-radius:20px;box-shadow:0 6px 24px rgba(0,0,0,.3)">${esc(aCh(p.name))}</div><div style="font-size:20px;font-weight:800;margin-top:12px;color:#fff">${esc(p.name)}</div><div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:4px">${esc(p.work||'未知作品')} · ${esc(p.timeline||'').substring(0,30)}</div><div style="font-size:11px;color:rgba(167,139,250,.45);margin-top:5px">态度：${esc(friend.attitudeStage||'警惕/敬畏')} · ${esc(friend.ecoType||'正常发言')} · 情绪：${esc(friend.emotionState||'平静')}</div></div>`;
    h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.info} 基础信息</div>${f('身份',p.identity)}${f('作品·时间线',(p.work||'')+' · '+(p.timeline||''))}</div>`;
    h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.personality} 性格调色盘</div>${f('性格',p.personality)}${f('说话风格与消息习惯',p.speech_style)}</div>`;
    if(p.chat_persona){h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.chat2} 聊天人格</div>${f('三模式',p.chat_persona)}</div>`;}
    if(p.sample_lines){
        let linesText='';
        if(typeof p.sample_lines==='object'&&!Array.isArray(p.sample_lines)){
            for(const[scene,lines]of Object.entries(p.sample_lines)){linesText+=`【${scene}】\n${(lines||[]).map((l,i)=>`  ${i+1}. ${l}`).join('\n')}\n`;}
        }else if(Array.isArray(p.sample_lines)){linesText=p.sample_lines.map((l,i)=>`${i+1}. ${l}`).join('\n');}
        h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.chat2} 语料库</div><div class="${P}-pff"><div class="${P}-pfv">${esc(linesText)}</div></div></div>`;
    }
    h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.brain} 认知范围</div>${f('已知信息',p.knows)}${f('未知信息',p.not_knows)}${f('敏感话题',p.sensitive_topics)}</div>`;
    h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.link} 社会关系</div>${f('人物关系',p.relationships)}${f('当前状态',p.current_state)}</div>`;
    if(p.reinterpretation){h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.reinterpret} 二次解释</div>${f('作者注释',p.reinterpretation)}</div>`;}
    h+=`<div class="${P}-brow" style="margin-top:4px;gap:10px"><button class="${P}-btn gn" data-act="goto-chat" data-fid="${fid}" style="flex:1">${IC.chat} 发消息</button><button class="${P}-btn gy" data-act="edit-friend" data-fid="${fid}" style="flex:0 0 auto;width:auto;padding:14px 20px">${IC.edit}</button></div></div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]').addEventListener('click',popPage);
    body.querySelector('[data-act="goto-chat"]')?.addEventListener('click',()=>{navStack.length=0;pushPage('chat',{fid});});
    body.querySelector('[data-act="edit-friend"]')?.addEventListener('click',()=>{
        const pg=body.querySelector(`.${P}-pg`);
        pg.innerHTML=`<div class="${P}-form"><div class="${P}-fl">编辑档案JSON</div><textarea class="${P}-ta" id="${P}-ej" style="min-height:280px;font-size:11px;font-family:monospace">${esc(JSON.stringify(friend.profile,null,2))}</textarea><div class="${P}-brow" style="margin-top:10px"><button class="${P}-btn gn" id="${P}-es">${IC.save} 保存</button><button class="${P}-btn gy" id="${P}-ec">取消</button></div><div id="${P}-est" class="${P}-st" style="display:none"></div></div>`;
        pg.querySelector(`#${P}-es`).addEventListener('click',()=>{
            const st=pg.querySelector(`#${P}-est`);
            try{friend.profile=JSON.parse(pg.querySelector(`#${P}-ej`).value);saveDNow();renderProfileSub(body);toast('档案已更新');}
            catch(e){st.style.display='block';st.className=`${P}-st er`;st.textContent=`格式错误：${e.message}`;}
        });
        pg.querySelector(`#${P}-ec`).addEventListener('click',()=>renderProfileSub(body));
    });
}

function renderPlayerInfoSub(body){
    const pi=getPlayerInfo();
    const f=(l,v)=>`<div class="${P}-pff"><div class="${P}-pfl">${l}</div><div class="${P}-pfv">${esc(v)}</div></div>`;
    let h=`${navBar('我的信息')}<div class="${P}-pg"><div class="${P}-pf">`;
    if(pi){
        h+=`<div style="text-align:center;margin-bottom:20px"><div class="${P}-player-av" style="margin:0 auto">${esc(aCh(pi.name))}</div><div style="font-size:20px;font-weight:800;margin-top:12px;color:#fff">${esc(pi.name)}</div><div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:4px">Lv.${pi.level} · ${esc(pi.spirit)}</div></div>`;
        h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.info} 基础信息</div>${f('年龄',String(pi.age))}${f('性别',pi.gender)}</div>`;
        h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.sword} 能力信息</div>${f('能力/武魂',pi.spirit)}${f('等级',`Lv.${pi.level}`)}</div>`;
        h+=`<div class="${P}-card"><div class="${P}-card-t">${CT.heart} 状态</div>${f('体力',`${pi.hp}%`)}${f('势力',pi.faction)}${f('名声',pi.fame)}</div>`;
    }else{h+=`<div class="${P}-empty">${IC.me}<span class="${P}-empty-title">${uName()}</span><span class="${P}-empty-sub">MVU未接入时显示基础信息</span></div>`;}
    h+=`</div></div>`;body.innerHTML=h;body.querySelector('[data-act="back"]').addEventListener('click',popPage);
}

function renderGroupDetailSub(body){
    const gid=navData.gid;const group=D.groups[gid];if(!group){popPage();return;}
    const canInvite=Object.keys(D.friends).filter(id=>!group.members.includes(id));
    let h=`${navBar(group.name)}<div class="${P}-pg">`;
    h+=`<div class="${P}-sec">群成员 · ${group.members.length}人</div><div class="${P}-ls">`;
    for(const fid of group.members){const f=D.friends[fid];if(!f)continue;h+=`<div class="${P}-li"><div class="${P}-av" style="background:${f.avatarColor};width:38px;height:38px;font-size:14px;border-radius:12px">${esc(aCh(f.profile.name))}</div><div class="${P}-linfo"><div class="${P}-lnm">${esc(f.profile.name)}</div><div class="${P}-lsub">${esc(f.ecoType||'正常发言')}</div></div><button class="${P}-btn rd ${P}-bsm" data-act="remove-member" data-fid="${fid}" data-gid="${gid}" style="width:auto;padding:5px 14px;font-size:11px">移除</button></div>`;}
    h+=`</div>`;
    if(canInvite.length>0){h+=`<div class="${P}-sec">邀请好友</div><div class="${P}-ls">`;for(const fid of canInvite){const f=D.friends[fid];h+=`<div class="${P}-li" data-act="invite-member" data-fid="${fid}" data-gid="${gid}"><div class="${P}-av" style="background:${f.avatarColor};width:38px;height:38px;font-size:14px;border-radius:12px">${esc(aCh(f.profile.name))}</div><div class="${P}-linfo"><div class="${P}-lnm">${esc(f.profile.name)}</div></div><span style="color:#4ade80;font-size:22px;padding:0 4px">+</span></div>`;}h+=`</div>`;}
    h+=`<div class="${P}-sec">管理</div><div class="${P}-ls"><div class="${P}-li" data-act="group-memory" data-gid="${gid}"><div class="${P}-av ic">${IC.note}</div><div class="${P}-linfo"><div class="${P}-lnm">记忆管理</div></div><span class="${P}-larr">›</span></div></div>`;
    h+=`<div style="padding:16px 0"><button class="${P}-btn rd" data-act="delete-group" data-gid="${gid}">解散群聊</button></div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]').addEventListener('click',popPage);
    body.querySelectorAll('[data-act="remove-member"]').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();const fid2=btn.dataset.fid,gid2=btn.dataset.gid,g=D.groups[gid2],fr=D.friends[fid2];if(!g||!fr)return;if(g.members.length<=1){toast('群里至少要有1个成员','err');return;}if(confirm(`确定移除「${fr.profile.name}」？`)){g.members=g.members.filter(m=>m!==fid2);saveDNow();renderGroupDetailSub(body);toast('已移除');}});});
    body.querySelectorAll('[data-act="invite-member"]').forEach(btn=>{btn.addEventListener('click',()=>{const fid2=btn.dataset.fid,gid2=btn.dataset.gid,g=D.groups[gid2],fr=D.friends[fid2];if(!g||!fr)return;g.members.push(fid2);saveDNow();renderGroupDetailSub(body);toast(`${fr.profile.name} 已加入`);});});
    body.querySelector('[data-act="group-memory"]')?.addEventListener('click',()=>{pushPage('memory',{chatId:gid});});
    body.querySelector('[data-act="delete-group"]')?.addEventListener('click',()=>{const g=D.groups[gid];if(!g)return;if(confirm(`确定解散「${g.name}」？`)){delete D.groups[gid];delete D.messages[gid];saveDNow();navStack.length=0;curTab='chats';render();toast('群聊已解散');}});
}

function renderPresetManageSub(body){
    const pd=loadPresets();const activeId=pd.activeId;
    let h=`${navBar('预设管理',`<button class="${P}-nra" data-act="import-preset" style="font-size:12px;color:#a78bfa">导入</button>`)}<div class="${P}-pg">`;
    h+=`<div class="${P}-sec">当前预设列表</div><div class="${P}-ls">`;
    for(const p of pd.list){
        const isActive=p.id===activeId;const isDefault=p.id==='default_v5';
        h+=`<div class="${P}-li" data-act="select-preset" data-pid="${esc(p.id)}"><div class="${P}-chk ${isActive?'on':''}">${isActive?'✓':''}</div><div class="${P}-linfo"><div class="${P}-lnm">${esc(p.name)}</div><div class="${P}-lsub">${esc(p.author||'自定义')}</div></div><button class="${P}-btn gy ${P}-bsm" data-act="edit-preset" data-pid="${esc(p.id)}" style="width:auto;padding:5px 10px;font-size:11px">${IC.edit}</button>${isDefault?'':`<button class="${P}-btn rd ${P}-bsm" data-act="delete-preset" data-pid="${esc(p.id)}" style="width:auto;padding:5px 10px;font-size:11px">${IC.trash}</button>`}</div>`;
    }
    h+=`</div><div style="padding:16px 0"><button class="${P}-btn gn" data-act="new-preset">${IC.plus} 新建预设</button></div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]').addEventListener('click',popPage);
    body.querySelector('[data-act="import-preset"]')?.addEventListener('click',()=>{importPreset();setTimeout(()=>renderPresetManageSub(body),500);});
    body.querySelectorAll('[data-act="select-preset"]').forEach(btn=>{btn.addEventListener('click',e=>{if(e.target.closest('[data-act="edit-preset"]')||e.target.closest('[data-act="delete-preset"]'))return;pd.activeId=btn.dataset.pid;savePresets(pd);renderPresetManageSub(body);toast('预设已切换');});});
    body.querySelectorAll('[data-act="edit-preset"]').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();pushPage('preset-edit',{presetId:btn.dataset.pid});});});
    body.querySelectorAll('[data-act="delete-preset"]').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();const pid=btn.dataset.pid;if(pid==='default_v5')return;if(!confirm('确定删除此预设？'))return;pd.list=pd.list.filter(x=>x.id!==pid);if(pd.activeId===pid)pd.activeId='default_v5';savePresets(pd);renderPresetManageSub(body);toast('预设已删除');});});
    body.querySelector('[data-act="new-preset"]')?.addEventListener('click',()=>{const newP={...DEFAULT_PRESET,id:`preset_${uid()}`,name:'新预设',author:uName()};const d2=loadPresets();d2.list.push(newP);savePresets(d2);pushPage('preset-edit',{presetId:newP.id});});
}

function renderPresetEditSub(body){
    const pd=loadPresets();const pid=navData.presetId;const preset=pd.list.find(x=>x.id===pid);if(!preset){popPage();return;}
    const fields=[{key:'name',label:'预设名称',type:'input'},{key:'author',label:'作者',type:'input'},{key:'sysPrompt',label:'私聊系统Prompt',type:'ta'},{key:'groupPrompt',label:'群聊系统Prompt',type:'ta'},{key:'greetPrompt',label:'打招呼Prompt',type:'ta'},{key:'genPromptStep1',label:'角色生成Prompt·第一步（核心档案）',type:'ta'},{key:'genPromptStep2',label:'角色生成Prompt·第二步（行为档案）',type:'ta'},{key:'momentPrompt',label:'朋友圈Prompt',type:'ta'},{key:'commentPrompt',label:'评论Prompt',type:'ta'},{key:'replyCommentPrompt',label:'评论回复Prompt',type:'ta'}];
    let h=`${navBar('编辑预设')}<div class="${P}-pg"><div class="${P}-form">`;
    for(const fld of fields){h+=`<div class="${P}-fg"><div class="${P}-fl">${fld.label}</div>${fld.type==='input'?`<input class="${P}-inp" data-field="${fld.key}" value="${esc(preset[fld.key]||'')}">`:`<textarea class="${P}-ta" data-field="${fld.key}" style="min-height:100px;font-size:12px">${esc(preset[fld.key]||'')}</textarea>`}</div>`;}
    h+=`<button class="${P}-btn gn" id="${P}-pe-save">${IC.save} 保存预设</button></div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]').addEventListener('click',popPage);
    body.querySelector(`#${P}-pe-save`).addEventListener('click',()=>{for(const fld of fields){const el=body.querySelector(`[data-field="${fld.key}"]`);if(el)preset[fld.key]=el.value;}savePresets(pd);toast('预设已保存');popPage();});
}

/* [v5] ===== 添加好友页面 — 自由输入 + 热门快选 + 高级选项 ===== */
function subAddFriend(){
    const tagsHtml=POPULAR_WORKS.map(w=>`<span class="${P}-tag${tmpInput.work===w?' on':''}" data-work="${esc(w)}">${esc(w)}</span>`).join('');
    return `${navBar('添加好友')}<div class="${P}-pg"><div class="${P}-form">
        <div class="${P}-fg"><div class="${P}-fl">角色名称</div><input class="${P}-inp" id="${P}-af-name" placeholder="输入任何虚拟角色名称" value="${esc(tmpInput.name)}"></div>
        <div class="${P}-fg"><div class="${P}-fl">来源作品</div><input class="${P}-inp" id="${P}-af-work" placeholder="输入作品名，或点击下方标签" value="${esc(tmpInput.work)}"><div class="${P}-tags" id="${P}-af-tags">${tagsHtml}</div></div>
        <div class="${P}-fg"><div class="${P}-fl">时间线 / 处境描述</div><textarea class="${P}-ta" id="${P}-af-tl" placeholder="描述角色在故事中的具体阶段和处境">${esc(tmpInput.timeline)}</textarea></div>
        <button class="${P}-collapse-btn" id="${P}-af-adv-btn">▶ 高级选项</button>
        <div class="${P}-collapse-content" id="${P}-af-adv">
            <div class="${P}-fg"><div class="${P}-fl">你对这个角色的印象（可选）</div><input class="${P}-inp" id="${P}-af-impression" placeholder="一句话描述你心中的印象" value="${esc(tmpInput.impression||'')}"></div>
        </div>
        <button class="${P}-btn gn" id="${P}-af-go" ${!apiOk()?'disabled':''}>${IC.sparkle} 跨时空搜索</button>
        ${!apiOk()?`<div class="${P}-st er" style="margin-top:8px">请先在「我」页面配置API</div>`:''}
    </div></div>`;
}

function subPreview(){
    if(!tmpProfile)return navBar('档案预览')+`<div class="${P}-pg"><div class="${P}-empty">暂无数据</div></div>`;
    const p=tmpProfile;
    const f=(l,v)=>`<div class="${P}-pff"><div class="${P}-pfl">${l}</div><div class="${P}-pfv">${esc(v||'暂无')}</div></div>`;
    let linesText='';
    if(p.sample_lines){
        if(typeof p.sample_lines==='object'&&!Array.isArray(p.sample_lines)){
            for(const[scene,lines]of Object.entries(p.sample_lines)){linesText+=`【${scene}】\n${(lines||[]).map((l2,i)=>`  ${i+1}. ${l2}`).join('\n')}\n`;}
        }else if(Array.isArray(p.sample_lines)){linesText=p.sample_lines.map((l2,i)=>`${i+1}. ${l2}`).join('\n');}
    }
    return `${navBar('档案预览')}<div class="${P}-pg"><div class="${P}-pf">
        <div class="${P}-card"><div class="${P}-card-t">${CT.info} 基础信息</div>${f('姓名',p.name)}${f('作品·时间线',`${p.work||''}·${p.timeline||''}`)}${f('身份',p.identity)}</div>
        <div class="${P}-card"><div class="${P}-card-t">${CT.personality} 性格调色盘</div>${f('性格',p.personality)}${f('说话风格与消息习惯',p.speech_style)}${p.chat_persona?f('聊天人格',p.chat_persona):''}</div>
        ${linesText?`<div class="${P}-card"><div class="${P}-card-t">${CT.chat2} 语料库</div><div class="${P}-pff"><div class="${P}-pfv">${esc(linesText)}</div></div></div>`:''}
        <div class="${P}-card"><div class="${P}-card-t">${CT.brain} 认知范围</div>${f('已知',p.knows)}${f('未知',p.not_knows)}${f('敏感话题',p.sensitive_topics)}</div>
        <div class="${P}-card"><div class="${P}-card-t">${CT.link} 社会关系</div>${f('关系',p.relationships)}${f('状态',p.current_state)}</div>
        ${p.reinterpretation?`<div class="${P}-card"><div class="${P}-card-t">${CT.reinterpret} 二次解释</div>${f('作者注释',p.reinterpretation)}</div>`:''}
        <div class="${P}-brow" style="margin-top:4px;gap:10px"><button class="${P}-btn gn" data-act="confirm-add">${IC.check} 添加</button><button class="${P}-btn gy" data-act="trial-chat">${IC.trial} 试聊</button></div>
        <div class="${P}-brow" style="margin-top:8px;gap:10px"><button class="${P}-btn gy" data-act="edit-profile">${IC.edit} 编辑</button><button class="${P}-btn gy" data-act="regen" ${!apiOk()?'disabled':''}>${IC.refresh} 重新生成</button></div>
    </div></div>`;
}

function subNewGroup(){
    if(Object.keys(D.groups).length>=GROUP_LIMIT)return navBar('创建群聊')+`<div class="${P}-pg"><div class="${P}-empty"><span class="${P}-empty-title">群聊数量已达上限</span></div></div>`;
    const keys=Object.keys(D.friends);
    if(!keys.length)return navBar('创建群聊')+`<div class="${P}-pg"><div class="${P}-empty"><span class="${P}-empty-title">请先添加好友</span></div></div>`;
    let h=`${navBar('创建群聊')}<div class="${P}-pg"><div class="${P}-form">
        <div class="${P}-fg"><div class="${P}-fl">群聊名称</div><input class="${P}-inp" id="${P}-ng-name" placeholder="输入群聊名称"></div>
        <div class="${P}-fl">选择成员 (<span id="${P}-ng-cnt">0</span>人)</div></div><div class="${P}-ls" style="margin-top:0">`;
    for(const id of keys){const fr=D.friends[id];h+=`<div class="${P}-chk-row" data-fid="${id}"><div class="${P}-chk" data-c="${id}"></div><div class="${P}-av" style="background:${fr.avatarColor};width:34px;height:34px;font-size:13px;border-radius:10px">${esc(aCh(fr.profile.name))}</div><div class="${P}-linfo"><div class="${P}-lnm" style="font-size:14px">${esc(fr.profile.name)}</div></div></div>`;}
    h+=`</div><div style="padding:16px 14px"><button class="${P}-btn gn" id="${P}-ng-go" disabled>${IC.check} 创建群聊</button></div></div>`;
    return h;
}

function subMemory(){
    const cid2=navData.chatId;const data=getMsgs(cid2);const total=data.messages.length;
    const maxSum=Math.max(1,total-1);const defVal=Math.min(Math.floor(total/2),maxSum);
    let h=`${navBar('记忆管理')}<div class="${P}-pg">`;
    h+=`<div class="${P}-sec">当前状态</div><div class="${P}-ls">
        <div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">消息总数</div></div><span style="color:rgba(255,255,255,.4);font-size:13px">${total}条</span></div>
        <div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">已有摘要</div></div><span style="color:rgba(255,255,255,.4);font-size:13px">${data.memory?'有':'无'}</span></div>
    </div>`;
    if(data.memory)h+=`<div class="${P}-sec">记忆摘要</div><div class="${P}-mem-box"><div class="${P}-mem-text">${esc(data.memory)}</div></div>`;
    if(total>1){h+=`<div class="${P}-sec">手动总结</div><div class="${P}-ls"><div class="${P}-li" style="cursor:default;flex-direction:column;align-items:stretch;gap:8px"><div class="${P}-fl" style="padding:0">总结前多少条</div><div class="${P}-range-row"><input type="range" id="${P}-mem-range" min="1" max="${maxSum}" value="${defVal}"><span class="${P}-range-val" id="${P}-mem-val">${defVal}</span></div><button class="${P}-btn gn" id="${P}-mem-go" ${!apiOk()?'disabled':''}>${IC.note} 开始总结</button></div></div>`;}
    else h+=`<div class="${P}-empty"><span class="${P}-empty-title">消息太少，无需总结</span></div>`;
    h+='</div>';return h;
}

function subMoments(){
    if(!D.moments)D.moments={posts:[],lastAutoGen:0,autoEnabled:false};
    const posts=D.moments.posts||[];
    let h=`${navBar('朋友圈')}<div class="${P}-pg">`;
    h+=`<div style="padding:12px 4px;display:flex;gap:8px;flex-wrap:wrap"><button class="${P}-btn gn ${P}-bsm" data-act="gen-one-moment">${IC.refresh} 刷新一条</button><button class="${P}-btn gy ${P}-bsm" data-act="gen-all-moments">${IC.refresh} 全部刷新</button></div>`;
    h+=`<div class="${P}-ls" style="margin-bottom:8px"><div class="${P}-switch-row"><span>自动发朋友圈</span><label class="${P}-sw"><input type="checkbox" data-act="toggle-auto-moment" ${D.moments.autoEnabled?'checked':''}><span class="${P}-sw-sl"></span></label></div></div>`;
    if(posts.length===0){h+=`<div class="${P}-empty" style="padding:40px 20px">${IC.cameraEmpty}<span class="${P}-empty-title">还没有朋友圈动态</span><span class="${P}-empty-sub">点击上方按钮生成</span></div>`;}
    else{for(const post of posts){const f=D.friends[post.authorId];const color=f?.avatarColor||'#6366f1';h+=`<div class="${P}-card" style="margin:8px 0"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div class="${P}-av" style="background:${color};width:40px;height:40px;font-size:15px;border-radius:12px">${esc(aCh(post.authorName))}</div><div style="flex:1"><div style="font-size:14px;font-weight:600;color:rgba(255,255,255,.9)">${esc(post.authorName)}</div><div style="font-size:11px;color:rgba(255,255,255,.25)">${esc(post.time)}</div></div></div>`;
    h+=`<div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.75);padding:0 4px;margin-bottom:10px">${esc(post.content)}</div>`;
    if(post.likes.length>0){const likeNames=post.likes.map(lid=>{if(lid==='player')return uName();return D.friends[lid]?.profile.name||'?';}).join('，');h+=`<div style="font-size:12px;color:rgba(255,255,255,.3);padding:10px 14px;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:6px">❤️ ${esc(likeNames)}</div>`;}
    if(post.comments.length>0){h+=`<div style="background:rgba(255,255,255,.03);border-radius:8px;padding:10px 14px">`;for(const c of post.comments){
        const replyPrefix=c.replyTo?`<span style="color:#a78bfa;font-weight:600">${esc(c.authorName)}</span><span style="color:rgba(255,255,255,.3)"> 回复 </span><span style="color:#a78bfa;font-weight:600">${esc(c.replyTo)}</span>`:`<span style="color:#a78bfa;font-weight:600">${esc(c.authorName)}</span>`;
        h+=`<div style="font-size:12px;margin-bottom:5px;line-height:1.5">${replyPrefix}<span style="color:rgba(255,255,255,.55)">：${esc(c.content)}</span></div>`;
    }h+=`</div>`;}
    h+=`<div style="display:flex;gap:8px;margin-top:8px"><button class="${P}-btn gy ${P}-bsm" data-act="like-moment" data-mid="${post.id}" style="font-size:11px;padding:5px 12px">${post.likes.includes('player')?'❤️ 已赞':'🤍 赞'}</button><button class="${P}-btn gy ${P}-bsm" data-act="comment-moment" data-mid="${post.id}" style="font-size:11px;padding:5px 12px">💬 评论</button></div></div>`;}}
    h+=`</div>`;return h;
}

/* ===== 聊天子页面 ===== */
function renderChatSub(body){
    const fid=navData.fid;const friend=D.friends[fid];if(!friend){popPage();return;}
    /* 清除未读 */
    if(friend.unread>0){friend.unread=0;saveD();updateTriggerBadge();}
    const msgs=getMsgs(fid);let bh='';
    let lastTs=0;
    msgs.messages.forEach((m,i)=>{
        if(m.ts&&lastTs&&m.ts-lastTs>300000){const sep=createTimeSep(m.time||'');bh+=sep.outerHTML;}
        lastTs=m.ts||0;
        const el=createBubbleEl(m,friend.avatarColor,friend.profile.name,i===msgs.messages.length-1&&m.role==='assistant');el.style.opacity='1';el.style.transform='translateY(0) scale(1)';bh+=el.outerHTML;
    });
    body.innerHTML=`<div class="${P}-nav"><button class="${P}-bk" data-act="back">${BK_SVG}</button><span class="${P}-nt">${esc(friend.profile.name)}</span><button class="${P}-nra" data-act="to-memory" data-cid="${fid}">···</button></div>
        <div class="${P}-chat-w"><div class="${P}-ca" id="${P}-ca">${bh}</div><div class="${P}-typ" id="${P}-typ"><span>${esc(friend.profile.name)}正在输入</span><div class="${P}-typ-dots"><span></span><span></span><span></span></div></div>
        <div class="${P}-ibar"><textarea class="${P}-mi" id="${P}-mi" placeholder="输入消息..." rows="1"></textarea><button class="${P}-sd" id="${P}-sd">${IC.msgSend}</button></div></div>`;
    const area=body.querySelector(`#${P}-ca`),input=body.querySelector(`#${P}-mi`),typing=body.querySelector(`#${P}-typ`);
    setTimeout(()=>scrollToBottom(area),80);
    input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,68)+'px';});
    body.querySelector('[data-act="back"]').addEventListener('click',popPage);
    body.querySelector('[data-act="to-memory"]').addEventListener('click',()=>pushPage('memory',{chatId:fid}));
    bindAvatarClicks(body);
    const doSend=async()=>{const text=input.value.trim();if(!text)return;if(!apiOk()){toast('请先配置API','err');return;}input.value='';input.style.height='auto';const um={role:'user',content:text,time:tStr(),ts:Date.now()};getMsgs(fid).messages.push(um);saveD();const userBubble=createBubbleEl(um,friend.avatarColor,friend.profile.name);area.appendChild(userBubble);requestAnimationFrame(()=>{userBubble.style.opacity='1';userBubble.style.transform='translateY(0) scale(1)';});scrollToBottom(area);typing.classList.add('on');try{const am=[{role:'system',content:buildSysPrompt(friend.profile,fid)}];const groupMem=getGroupMemoryForFriend(fid);if(groupMem)am.push({role:'system',content:`你在群聊里的一些记忆：\n${groupMem}`});if(getMsgs(fid).memory)am.push({role:'system',content:`之前的聊天记忆：${getMsgs(fid).memory}`});for(const m of getMsgs(fid).messages)am.push({role:m.role==='user'?'user':'assistant',content:m.content});const reply=await apiChat(am);typing.classList.remove('on');
    /* [v5] 提取情绪标签 */
    const emotion=extractEmotion(reply);if(emotion){const msgData=getMsgs(fid);msgData.emotionState=emotion;friend.emotionState=emotion;saveD();}
    const parsed=parseAIReply(reply);if(parsed.type==='multi'||parsed.type==='single'){await sendMsgsWithDelay(area,parsed.msgs,friend.profile.name,friend.avatarColor,fid);}updateAttitude(fid);bindAvatarClicks(body);bindRegen(area,fid,friend,typing,body);checkAutoSum(fid);checkAutoMoment();}catch(e){typing.classList.remove('on');toast(e.message,'err');}};
    body.querySelector(`#${P}-sd`).addEventListener('click',doSend);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}});
    if(msgs.messages.length===0)setTimeout(()=>triggerGreeting(fid,friend,area,typing,body),300);
    bindRegen(area,fid,friend,typing,body);
}

function renderGroupChatSub(body){
    const gid=navData.gid;const group=D.groups[gid];if(!group){popPage();return;}
    /* 清除未读 */
    if(group.unread>0){group.unread=0;saveD();updateTriggerBadge();}
    const msgs=getMsgs(gid);let bh='';let lastTs=0;
    msgs.messages.forEach(m=>{
        if(m.ts&&lastTs&&m.ts-lastTs>300000){const sep=createTimeSep(m.time||'');bh+=sep.outerHTML;}
        lastTs=m.ts||0;
        const f2=m.role==='user'?null:D.friends[group.members.find(mid=>D.friends[mid]?.profile.name===m.name)];const color=f2?f2.avatarColor:'#6366f1';const el=createBubbleEl(m,color,m.name||'?');el.style.opacity='1';el.style.transform='translateY(0) scale(1)';bh+=el.outerHTML;
    });
    body.innerHTML=`<div class="${P}-nav"><button class="${P}-bk" data-act="back">${BK_SVG}</button><span class="${P}-nt">${esc(group.name)}(${group.members.length})</span><button class="${P}-nra" data-act="group-detail" data-gid="${gid}">···</button></div>
        <div class="${P}-chat-w"><div class="${P}-ca" id="${P}-ca">${bh}</div><div class="${P}-typ" id="${P}-typ"><span>群成员正在回复</span><div class="${P}-typ-dots"><span></span><span></span><span></span></div></div>
        <div class="${P}-ibar"><textarea class="${P}-mi" id="${P}-mi" placeholder="输入消息..." rows="1"></textarea><button class="${P}-sd" id="${P}-sd">${IC.msgSend}</button></div></div>`;
    const area=body.querySelector(`#${P}-ca`),input=body.querySelector(`#${P}-mi`),typing=body.querySelector(`#${P}-typ`);
    setTimeout(()=>scrollToBottom(area),80);
    input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,68)+'px';});
    body.querySelector('[data-act="back"]').addEventListener('click',popPage);
    body.querySelector('[data-act="group-detail"]')?.addEventListener('click',()=>{pushPage('group-detail',{gid});});
    bindAvatarClicks(body);
    const doSend=async()=>{const text=input.value.trim();if(!text)return;if(!apiOk()){toast('请先配置API','err');return;}input.value='';input.style.height='auto';const um={role:'user',name:uName(),content:text,time:tStr(),ts:Date.now()};getMsgs(gid).messages.push(um);saveD();const userBubble=createBubbleEl(um,'#6366f1',uName());area.appendChild(userBubble);requestAnimationFrame(()=>{userBubble.style.opacity='1';userBubble.style.transform='translateY(0) scale(1)';});scrollToBottom(area);typing.classList.add('on');try{const am=[{role:'system',content:buildGroupSysPrompt(group)}];if(getMsgs(gid).memory)am.push({role:'system',content:`群聊记忆：${getMsgs(gid).memory}`});for(const m of getMsgs(gid).messages)am.push({role:m.role==='user'?'user':'assistant',content:m.role==='user'?m.content:`[${m.name}]: ${m.content}`});const reply=await apiChat(am,2000);typing.classList.remove('on');
    const parsed=parseGroupReply(reply);
    for(const p2 of parsed){const npcName=p2.name;const msgList=Array.isArray(p2.msgs)?p2.msgs:(p2.content?[p2.content]:[]);const f2=D.friends[group.members.find(mid=>D.friends[mid]?.profile.name===npcName)];const color=f2?f2.avatarColor:'#6366f1';await sendMsgsWithDelay(area,msgList,npcName,color,gid);}bindAvatarClicks(body);checkAutoSum(gid);checkAutoMoment();}catch(e){typing.classList.remove('on');toast(e.message,'err');}};
    body.querySelector(`#${P}-sd`).addEventListener('click',doSend);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}});
}

/* ===== 头像/重新生成/打招呼 ===== */
function bindAvatarClicks(container){container.querySelectorAll('[data-action="view-profile"]').forEach(av=>{if(av.__bound)return;av.__bound=true;av.addEventListener('click',e=>{e.stopPropagation();const name=av.dataset.name;const fid=Object.keys(D.friends).find(id=>D.friends[id].profile.name===name);if(fid)pushPage('profile',{fid});});});container.querySelectorAll('[data-action="view-player"]').forEach(av=>{if(av.__bound)return;av.__bound=true;av.addEventListener('click',e=>{e.stopPropagation();pushPage('player-info');});});}

function bindRegen(area,fid,friend,typing,container){area.querySelectorAll(`[data-act="regen"]`).forEach(btn=>{if(btn.__bound)return;btn.__bound=true;btn.onclick=async()=>{const msgs=getMsgs(fid);while(msgs.messages.length&&msgs.messages[msgs.messages.length-1].role==='assistant')msgs.messages.pop();saveDNow();const bubbles=area.querySelectorAll(`.${P}-bw:not(.u)`);for(let i=bubbles.length-1;i>=0;i--){bubbles[i].remove();const remaining=area.querySelectorAll(`.${P}-bw`);if(!remaining.length||remaining[remaining.length-1].classList.contains('u'))break;}typing.classList.add('on');scrollToBottom(area);try{const am=[{role:'system',content:buildSysPrompt(friend.profile,fid)}];const groupMem=getGroupMemoryForFriend(fid);if(groupMem)am.push({role:'system',content:`群聊记忆：\n${groupMem}`});if(msgs.memory)am.push({role:'system',content:`之前的聊天记忆：${msgs.memory}`});for(const m of msgs.messages)am.push({role:m.role==='user'?'user':'assistant',content:m.content});const reply=await apiChat(am);typing.classList.remove('on');const emotion=extractEmotion(reply);if(emotion){msgs.emotionState=emotion;friend.emotionState=emotion;saveD();}const parsed=parseAIReply(reply);await sendMsgsWithDelay(area,parsed.msgs,friend.profile.name,friend.avatarColor,fid);bindAvatarClicks(container);bindRegen(area,fid,friend,typing,container);}catch(e){typing.classList.remove('on');toast(e.message,'err');}};});}

async function triggerGreeting(fid,friend,area,typing,container){if(!apiOk())return;typing.classList.add('on');try{const preset=getPreset();const gp=fillTemplate(preset.greetPrompt,{sysPrompt:buildSysPrompt(friend.profile,fid),userName:uName()});const reply=await apiChat([{role:'system',content:gp},{role:'user',content:'（通讯器发出提示音）'}],500);typing.classList.remove('on');const emotion=extractEmotion(reply);if(emotion){const msgData=getMsgs(fid);msgData.emotionState=emotion;friend.emotionState=emotion;saveD();}const parsed=parseAIReply(reply);await sendMsgsWithDelay(area,parsed.msgs,friend.profile.name,friend.avatarColor,fid);bindAvatarClicks(container);bindRegen(area,fid,friend,typing,container);}catch(e){typing.classList.remove('on');toast(e.message,'err');}}

/* ===== 事件绑定 ===== */
function bindTab(el){
    el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{curTab=b.dataset.tab;render();}));
    el.querySelectorAll('[data-act="open-chat"]').forEach(b=>b.addEventListener('click',()=>pushPage('chat',{fid:b.dataset.id})));
    el.querySelectorAll('[data-act="open-group"]').forEach(b=>b.addEventListener('click',()=>pushPage('group-chat',{gid:b.dataset.id})));
    el.querySelectorAll('[data-act="new-group"]').forEach(b=>b.addEventListener('click',()=>pushPage('new-group')));
    el.querySelectorAll('[data-act="add-friend"]').forEach(b=>b.addEventListener('click',()=>pushPage('add-friend')));
    el.querySelectorAll('[data-act="moments"]').forEach(b=>b.addEventListener('click',()=>pushPage('moments')));
    el.querySelectorAll('[data-act="view-player"]').forEach(b=>b.addEventListener('click',()=>pushPage('player-info')));
    el.querySelectorAll('[data-act="preset-manage"]').forEach(b=>b.addEventListener('click',()=>pushPage('preset-manage')));
    el.querySelectorAll('[data-act="open-contact"]').forEach(b=>{let timer=null,longPressed=false;b.addEventListener('pointerdown',()=>{longPressed=false;timer=setTimeout(()=>{longPressed=true;const name=b.dataset.name,id=b.dataset.id;if(confirm(`确定删除好友「${name}」？\n聊天记录也会被删除`)){delFriend(id);render();toast('已删除');}},600);});b.addEventListener('pointerup',()=>clearTimeout(timer));b.addEventListener('pointerleave',()=>clearTimeout(timer));b.addEventListener('pointermove',()=>clearTimeout(timer));b.addEventListener('click',e=>{if(longPressed){longPressed=false;e.preventDefault();e.stopPropagation();return;}pushPage('profile',{fid:b.dataset.id});});});
    const stEl=el.querySelector(`#${P}-s-st`);const showSt=(c,m)=>{if(!stEl)return;stEl.style.display='block';stEl.className=`${P}-st ${c}`;stEl.textContent=m;};
    el.querySelector(`#${P}-s-fetch`)?.addEventListener('click',async function(){const url=el.querySelector(`#${P}-s-url`).value.trim(),key=el.querySelector(`#${P}-s-key`).value.trim();if(!url){showSt('er','请填写API地址');return;}this.disabled=true;showSt('in','获取中...');try{const models=await fetchModels(url,key);if(!models.length){showSt('er','未找到模型');this.disabled=false;return;}const sel=el.querySelector(`#${P}-s-model`);sel.innerHTML=models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');if(api.model&&models.includes(api.model))sel.value=api.model;api.models=models;showSt('ok',`找到 ${models.length} 个模型`);}catch(e){showSt('er',e.message);}this.disabled=false;});
    el.querySelector(`#${P}-s-test`)?.addEventListener('click',async function(){const url=el.querySelector(`#${P}-s-url`).value.trim(),key=el.querySelector(`#${P}-s-key`).value.trim(),model=el.querySelector(`#${P}-s-model`).value;if(!url||!model){showSt('er','请填写地址并选择模型');return;}this.disabled=true;showSt('in','测试中...');const old={u:api.url,k:api.key,m:api.model};api.url=url;api.key=key;api.model=model;try{const r=await apiChat([{role:'user',content:'回复OK两个字母。'}],50);showSt('ok',r.substring(0,30));}catch(e){showSt('er',e.message);api.url=old.u;api.key=old.k;api.model=old.m;}this.disabled=false;});
    el.querySelector(`#${P}-s-save`)?.addEventListener('click',()=>{api.url=el.querySelector(`#${P}-s-url`).value.trim();api.key=el.querySelector(`#${P}-s-key`).value.trim();api.model=el.querySelector(`#${P}-s-model`).value;if(!api.url){showSt('er','API地址不能为空');return;}if(!api.model){showSt('er','请选择模型');return;}saveApi();showSt('ok',`已保存 · ${api.model}`);});
    el.querySelector(`#${P}-s-theme`)?.addEventListener('change',function(){toggleTheme();});
    el.querySelector(`#${P}-s-auto`)?.addEventListener('change',function(){D.settings.autoSummarize=this.checked;saveDNow();render();});
    el.querySelector(`#${P}-s-threshold`)?.addEventListener('input',function(){D.settings.autoThreshold=parseInt(this.value);el.querySelector(`#${P}-s-th-val`).textContent=this.value;saveD();});
    el.querySelector(`#${P}-s-sumcount`)?.addEventListener('input',function(){D.settings.autoSumCount=parseInt(this.value);el.querySelector(`#${P}-s-sc-val`).textContent=this.value;saveD();});
    el.querySelector(`#${P}-s-export`)?.addEventListener('click',exportData);
    el.querySelector(`#${P}-s-import`)?.addEventListener('click',importData);
    el.querySelector(`#${P}-s-clear-msg`)?.addEventListener('click',()=>{if(confirm('确定清空所有聊天记录？\n好友和群聊会保留。'))clearMessages();});
    el.querySelector(`#${P}-s-clear-all`)?.addEventListener('click',()=>{if(confirm('⚠️ 确定清空全部数据？\n此操作不可恢复！'))clearAllData();});
}

function bindSub(el,page){
    el.querySelectorAll('[data-act="back"]').forEach(b=>b.addEventListener('click',popPage));
    if(page==='add-friend'){
        /* [v5] 热门标签点击 */
        el.querySelectorAll(`.${P}-tag`).forEach(tag=>{tag.addEventListener('click',()=>{const work=tag.dataset.work;const workInput=el.querySelector(`#${P}-af-work`);workInput.value=work;el.querySelectorAll(`.${P}-tag`).forEach(t=>t.classList.remove('on'));tag.classList.add('on');});});
        /* 高级选项折叠 */
        el.querySelector(`#${P}-af-adv-btn`)?.addEventListener('click',function(){const content=el.querySelector(`#${P}-af-adv`);if(content.classList.contains('open')){content.classList.remove('open');this.textContent='▶ 高级选项';}else{content.classList.add('open');this.textContent='▼ 高级选项';}});
        /* [v5] 两步生成 */
        const goBtn=el.querySelector(`#${P}-af-go`);if(goBtn)goBtn.addEventListener('click',async()=>{
            const name=el.querySelector(`#${P}-af-name`).value.trim();
            const work=el.querySelector(`#${P}-af-work`).value.trim();
            const tl=el.querySelector(`#${P}-af-tl`).value.trim();
            const impression=el.querySelector(`#${P}-af-impression`)?.value.trim()||'';
            if(!name){toast('请输入角色名称','err');return;}
            if(!work){toast('请输入来源作品','err');return;}
            if(!tl){toast('请描述时间线','err');return;}
            tmpInput={name,work,timeline:tl,impression};
            goBtn.disabled=true;goBtn.innerHTML=`${IC.sparkle} 第一步：生成核心档案...`;
            try{
                /* 第一步：核心档案 */
                const r1=await apiChat([{role:'user',content:buildGenPromptStep1(name,work,tl,impression)}],2000);
                const m1=r1.match(/\{[\s\S]*\}/);if(!m1)throw new Error('第一步AI返回格式错误');
                const coreProfile=JSON.parse(m1[0]);
                goBtn.innerHTML=`${IC.sparkle} 第二步：生成行为档案...`;
                /* 第二步：行为档案 */
                const r2=await apiChat([{role:'user',content:buildGenPromptStep2(coreProfile,'')}],2000);
                const m2=r2.match(/\{[\s\S]*\}/);if(!m2)throw new Error('第二步AI返回格式错误');
                const behaviorProfile=JSON.parse(m2[0]);
                /* 合并 */
                tmpProfile={...coreProfile,...behaviorProfile,work,timeline:tl};
                pushPage('preview');
            }catch(e){toast(e.message,'err');goBtn.disabled=false;goBtn.innerHTML=`${IC.sparkle} 跨时空搜索`;}
        });
    }
    if(page==='preview'){
        el.querySelectorAll('[data-act="confirm-add"]').forEach(b=>b.addEventListener('click',()=>{if(!tmpProfile)return;const id=addFriend(tmpProfile);if(tmpProfile.eco_type)D.friends[id].ecoType=tmpProfile.eco_type;saveDNow();tmpProfile=null;tmpInput={name:'',work:'',timeline:'',impression:''};navStack.length=0;pushPage('chat',{fid:id});toast('好友添加成功！');}));
        el.querySelectorAll('[data-act="edit-profile"]').forEach(b=>b.addEventListener('click',()=>{if(!tmpProfile)return;const pg=el.querySelector(`.${P}-pg`);pg.innerHTML=`<div class="${P}-form"><div class="${P}-fl">编辑档案JSON</div><textarea class="${P}-ta" id="${P}-ej" style="min-height:240px;font-size:11px;font-family:monospace">${esc(JSON.stringify(tmpProfile,null,2))}</textarea><button class="${P}-btn gn" id="${P}-es" style="margin-top:10px">${IC.save} 保存</button><div id="${P}-est" class="${P}-st" style="display:none"></div></div>`;el.querySelector(`#${P}-es`).addEventListener('click',()=>{const st=el.querySelector(`#${P}-est`);try{tmpProfile=JSON.parse(el.querySelector(`#${P}-ej`).value);render();toast('已更新');}catch(e2){st.style.display='block';st.className=`${P}-st er`;st.textContent=`格式错误：${e2.message}`;}});}));
        /* [v5] 试聊功能 */
        el.querySelectorAll('[data-act="trial-chat"]').forEach(b=>b.addEventListener('click',()=>{if(!tmpProfile)return;
            const pg=el.querySelector(`.${P}-pg`);
            pg.innerHTML=`<div style="padding:0 8px"><div class="${P}-nav" style="padding:0;background:none;border:none"><button class="${P}-bk" id="${P}-trial-back">${BK_SVG} 返回预览</button><span class="${P}-nt">试聊 · ${esc(tmpProfile.name)}</span></div><div class="${P}-ca" id="${P}-trial-ca" style="height:380px;overflow-y:auto;padding:14px 16px"></div><div class="${P}-typ" id="${P}-trial-typ"><span>${esc(tmpProfile.name)}正在输入</span><div class="${P}-typ-dots"><span></span><span></span><span></span></div></div><div style="display:flex;gap:8px;padding:8px 0"><textarea class="${P}-mi" id="${P}-trial-mi" placeholder="试着聊聊..." rows="1"></textarea><button class="${P}-sd" id="${P}-trial-sd">${IC.msgSend}</button></div><div style="text-align:center;padding:8px"><span style="font-size:11px;color:rgba(255,255,255,.2)">试聊记录不会保存</span></div></div>`;
            const trialArea=pg.querySelector(`#${P}-trial-ca`);const trialInput=pg.querySelector(`#${P}-trial-mi`);const trialTyping=pg.querySelector(`#${P}-trial-typ`);
            const trialMsgs=[];const trialColor=AV_COLORS[Math.floor(Math.random()*AV_COLORS.length)];
            pg.querySelector(`#${P}-trial-back`).addEventListener('click',()=>render());
            trialInput.addEventListener('input',()=>{trialInput.style.height='auto';trialInput.style.height=Math.min(trialInput.scrollHeight,68)+'px';});
            const doTrialSend=async()=>{const text=trialInput.value.trim();if(!text||!apiOk())return;trialInput.value='';trialInput.style.height='auto';
                const um={role:'user',content:text,time:tStr(),ts:Date.now()};trialMsgs.push(um);
                const ub=createBubbleEl(um,trialColor,tmpProfile.name);trialArea.appendChild(ub);requestAnimationFrame(()=>{ub.style.opacity='1';ub.style.transform='translateY(0) scale(1)';});scrollToBottom(trialArea);
                trialTyping.classList.add('on');
                try{const am=[{role:'system',content:buildSysPrompt(tmpProfile,null)}];for(const m of trialMsgs)am.push({role:m.role==='user'?'user':'assistant',content:m.content});
                    const reply=await apiChat(am);trialTyping.classList.remove('on');const parsed=parseAIReply(reply);
                    for(const msg of parsed.msgs){const clean=msg.trim();if(!clean)continue;const tm={role:'assistant',name:tmpProfile.name,content:clean,time:tStr(),ts:Date.now()};trialMsgs.push(tm);const bb=createBubbleEl(tm,trialColor,tmpProfile.name);trialArea.appendChild(bb);requestAnimationFrame(()=>{bb.style.opacity='1';bb.style.transform='translateY(0) scale(1)';});scrollToBottom(trialArea);}
                }catch(e2){trialTyping.classList.remove('on');toast(e2.message,'err');}
            };
            pg.querySelector(`#${P}-trial-sd`).addEventListener('click',doTrialSend);
            trialInput.addEventListener('keydown',e2=>{if(e2.key==='Enter'&&!e2.shiftKey){e2.preventDefault();doTrialSend();}});
        }));
        el.querySelectorAll('[data-act="regen"]').forEach(b=>b.addEventListener('click',async()=>{if(!tmpInput.name)return;b.disabled=true;b.innerHTML=`${IC.refresh} 生成中...`;try{const r1=await apiChat([{role:'user',content:buildGenPromptStep1(tmpInput.name,tmpInput.work||'',tmpInput.timeline,tmpInput.impression||'')}],2000);const m1=r1.match(/\{[\s\S]*\}/);if(!m1)throw new Error('格式错误');const core=JSON.parse(m1[0]);const r2=await apiChat([{role:'user',content:buildGenPromptStep2(core,'')}],2000);const m2=r2.match(/\{[\s\S]*\}/);if(!m2)throw new Error('格式错误');const beh=JSON.parse(m2[0]);tmpProfile={...core,...beh,work:tmpInput.work,timeline:tmpInput.timeline};render();toast('已重新生成');}catch(e2){toast(e2.message,'err');b.disabled=false;b.innerHTML=`${IC.refresh} 重新生成`;}}));
    }
    if(page==='new-group'){
        const sel=new Set();const cntEl=el.querySelector(`#${P}-ng-cnt`);const goBtn=el.querySelector(`#${P}-ng-go`);
        el.querySelectorAll(`.${P}-chk-row`).forEach(row=>{row.addEventListener('click',()=>{const fid2=row.dataset.fid,chk=row.querySelector(`.${P}-chk`);if(sel.has(fid2)){sel.delete(fid2);chk.classList.remove('on');chk.textContent='';}else{sel.add(fid2);chk.classList.add('on');chk.textContent='✓';}cntEl.textContent=sel.size;goBtn.disabled=sel.size<1;});});
        if(goBtn)goBtn.addEventListener('click',()=>{const name=el.querySelector(`#${P}-ng-name`).value.trim();if(!name){toast('请输入群名','err');return;}if(sel.size<1){toast('至少选择1个成员','err');return;}const gid=createGroup(name,[...sel]);navStack.length=0;pushPage('group-chat',{gid});toast('群聊创建成功！');});
    }
    if(page==='memory'){const range=el.querySelector(`#${P}-mem-range`);const val=el.querySelector(`#${P}-mem-val`);const goBtn=el.querySelector(`#${P}-mem-go`);if(range&&val)range.addEventListener('input',()=>{val.textContent=range.value;});if(goBtn)goBtn.addEventListener('click',async()=>{goBtn.disabled=true;goBtn.innerHTML=`${IC.note} 总结中...`;try{await summarize(navData.chatId,parseInt(range.value));toast('总结完成！');popPage();}catch(e2){toast(e2.message,'err');goBtn.disabled=false;goBtn.innerHTML=`${IC.note} 开始总结`;}});}
    if(page==='moments'){
        el.querySelector('[data-act="gen-one-moment"]')?.addEventListener('click',async function(){if(!apiOk()){toast('请先配置API','err');return;}const keys=Object.keys(D.friends);if(!keys.length){toast('请先添加好友','err');return;}this.disabled=true;this.innerHTML=`${IC.refresh} 生成中...`;try{const fid2=keys[Math.floor(Math.random()*keys.length)];await generateMoment(fid2);render();toast('新动态已生成');}catch(e2){toast(e2.message,'err');this.disabled=false;this.innerHTML=`${IC.refresh} 刷新一条`;}});
        el.querySelector('[data-act="gen-all-moments"]')?.addEventListener('click',async function(){if(!apiOk()){toast('请先配置API','err');return;}const keys=Object.keys(D.friends);if(!keys.length){toast('请先添加好友','err');return;}this.disabled=true;let count=0;this.innerHTML=`${IC.refresh} 生成中(0/${keys.length})...`;try{for(const fid2 of keys){await generateMoment(fid2);count++;this.innerHTML=`${IC.refresh} 生成中(${count}/${keys.length})...`;}render();toast(`已生成${count}条动态`);}catch(e2){toast(e2.message,'err');render();}});
        el.querySelector('[data-act="toggle-auto-moment"]')?.addEventListener('change',function(){if(!D.moments)D.moments={posts:[],lastAutoGen:0,autoEnabled:false};D.moments.autoEnabled=this.checked;saveDNow();});
        el.querySelectorAll('[data-act="like-moment"]').forEach(btn=>{btn.addEventListener('click',()=>{const mid=btn.dataset.mid;const post=D.moments.posts.find(p2=>p2.id===mid);if(!post)return;const idx=post.likes.indexOf('player');if(idx>=0)post.likes.splice(idx,1);else post.likes.push('player');saveDNow();render();});});
        el.querySelectorAll('[data-act="comment-moment"]').forEach(btn=>{btn.addEventListener('click',async()=>{const mid=btn.dataset.mid;const comment=prompt('输入评论：');if(!comment?.trim())return;const post=D.moments.posts.find(p2=>p2.id===mid);if(!post)return;post.comments.push({authorId:'player',authorName:uName(),content:comment.trim()});saveDNow();render();
            if(apiOk()){try{const replyResult=await generateAuthorReply(post,comment.trim());if(replyResult){render();toast(`${post.authorName}回复了你`);}}catch(e2){log('评论回复失败',e2);}}
        });});
    }
}

/* ===== 初始化 ===== */
function init(){
    log(`诸天通讯 v${VERSION} 初始化`);
    const doc=getDoc();
    doc.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());
    if(doc!==document)try{document.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());}catch{}
    loadApi();loadD();loadTheme();navStack.length=0;curTab='chats';navData={};

    doc.head.insertAdjacentHTML('beforeend',CSS);
    const un=totalUnread();
    doc.body.insertAdjacentHTML('beforeend',`
        <div id="${P}-trigger"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#a78bfa"/><path d="M7 9h10M7 13h7" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>${un>0?`<span class="${P}-badge">${un>99?'99+':un}</span>`:''}</div>
        <div id="${P}-overlay"><div class="${P}-phone" id="${P}-phone">
            <div class="${P}-inner">
                <div class="${P}-drag" id="${P}-drag"><div class="${P}-drag-pill"></div></div>
                <div class="${P}-body" id="${P}-body"></div>
                <div class="${P}-home-bar"></div>
            </div>
        </div></div>`);

    window.__ztcActive=true;
    const trigger=doc.getElementById(`${P}-trigger`);
    const overlay=doc.getElementById(`${P}-overlay`);
    const phone=doc.getElementById(`${P}-phone`);
    const W=(window.top||window).innerWidth,H=(window.top||window).innerHeight;
    phone.style.left=Math.max(10,(W/2-195))+'px';
    phone.style.top=Math.max(10,(H/2-380))+'px';

    initDrag(trigger,{onClick:()=>{overlay.classList.toggle('show');if(overlay.classList.contains('show'))render();}});
    initDrag(phone,{handle:`#${P}-drag`});
    overlay.addEventListener('click',e=>{if(e.target===overlay){overlay.classList.remove('show');navStack.length=0;}});

    render();
    log(`✅ 诸天通讯 v${VERSION} 就绪`);
}

/* ===== 启动 ===== */
setupWatcher();
if(isTargetCard())init();else{log('等待初始化');window.__ztcActive=false;}
log(`诸天通讯 v${VERSION} 已加载`);
})();
