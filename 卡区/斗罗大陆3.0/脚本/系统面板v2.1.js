/* ========== 系统面板 v2.1 第1段/共2段 ========== */
(async function() {
'use strict';

const VERSION = '2.1';
const P = 'sysp';
const CONFIG_KEY = 'dlgd_api_config';
const DATA_KEY = 'syspanel_data_v1';
const PRESET_KEY = 'syspanel_presets_v1';
const TARGET_IDS = ['斗罗大陆','斗罗','Douluo','douluo','Soul Land','武魂殿','唐三','史莱克','魂导通讯器'];

const RARITY_TABLE = [
    { name:'白', color:'#c7c7cc', prob:0.40, desc:'普通品质' },
    { name:'黄', color:'#ffd60a', prob:0.28, desc:'良品品质' },
    { name:'紫', color:'#bf5af2', prob:0.18, desc:'稀有品质' },
    { name:'黑', color:'#48484a', textColor:'#f5f5f7', prob:0.09, desc:'史诗品质' },
    { name:'红', color:'#ff453a', prob:0.04, desc:'传说品质' },
    { name:'金', color:'#ffd700', prob:0.01, desc:'神级品质' }
];
const POINTS_TABLE = [
    { points:50,  star:1, label:'简单',  prob:0.30 },
    { points:100, star:2, label:'普通',  prob:0.25 },
    { points:200, star:3, label:'困难',  prob:0.20 },
    { points:500, star:4, label:'精英',  prob:0.15 },
    { points:1000,star:5, label:'传说',  prob:0.07 },
    { points:3000,star:6, label:'史诗',  prob:0.03 }
];
const CHECKIN_REWARDS = {
    1:10,2:10,3:10,4:10,5:10,6:10,7:30,8:15,9:15,10:15,11:15,12:15,13:15,14:40,
    15:20,16:20,17:20,18:20,19:20,20:20,21:50,22:25,23:25,24:25,25:25,26:25,27:25,28:25,29:25,30:100
};
const CHECKIN_BONUS_DAYS = [7,14,21,30];
const CHECKIN_BONUS_RARITY = { 7:'紫', 14:'紫', 21:'紫', 30:'黑' };

const ACHIEVEMENTS = [
    { id:'awaken_spirit',    name:'首次觉醒武魂',       points:100,  check: d => d?.玩家?.主武魂?.名称 && d.玩家.主武魂.名称 !== '待初始化' },
    { id:'first_ring',       name:'首次获得魂环',       points:200,  check: d => d?.玩家?.主武魂魂环 && Object.keys(d.玩家.主武魂魂环).length > 0 },
    { id:'enter_forest',     name:'首次进入星斗大森林', points:100,  check: d => (d?.世界状态?.当前位置||'').includes('星斗大森林') },
    { id:'meet_xiaowu',      name:'首次遇到小舞',       points:50,   check: d => d?.女性NPC?.['小舞'] != null },
    { id:'meet_tangs',       name:'首次遇到唐三',       points:50,   check: d => d?.男性NPC?.['唐三'] != null },
    { id:'meet_daimubai',    name:'首次遇到戴沐白',     points:50,   check: d => d?.男性NPC?.['戴沐白'] != null },
    { id:'meet_zhuqing',     name:'首次遇到朱竹清',     points:50,   check: d => d?.女性NPC?.['朱竹清'] != null },
    { id:'meet_ningrr',      name:'首次遇到宁荣荣',     points:50,   check: d => d?.女性NPC?.['宁荣荣'] != null },
    { id:'meet_oscar',       name:'首次遇到奥斯卡',     points:50,   check: d => d?.男性NPC?.['奥斯卡'] != null },
    { id:'meet_mahj',        name:'首次遇到马红俊',     points:50,   check: d => d?.男性NPC?.['马红俊'] != null },
    { id:'lv10',  name:'魂力突破10级', points:50,   check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 10 },
    { id:'lv20',  name:'魂力突破20级', points:100,  check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 20 },
    { id:'lv30',  name:'魂力突破30级', points:200,  check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 30 },
    { id:'lv40',  name:'魂力突破40级', points:300,  check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 40 },
    { id:'lv50',  name:'魂力突破50级', points:500,  check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 50 },
    { id:'lv60',  name:'魂力突破60级', points:800,  check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 60 },
    { id:'lv70',  name:'魂力突破70级', points:1200, check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 70 },
    { id:'lv80',  name:'魂力突破80级', points:2000, check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 80 },
    { id:'lv90',  name:'魂力突破90级', points:3000, check: d => (d?.玩家?.修炼状态?.魂力等级||0) >= 90 },
    { id:'first_bone',       name:'首次获得魂骨',       points:200,  check: d => d?.玩家?.常规魂骨 && Object.keys(d.玩家.常规魂骨).length > 0 },
    { id:'first_ext_bone',   name:'首次获得外附魂骨',   points:300,  check: d => d?.玩家?.外附魂骨 && Object.keys(d.玩家.外附魂骨).length > 0 },
    { id:'join_faction',     name:'加入势力',           points:100,  check: d => d?.玩家?.势力?.所属势力 && d.玩家.势力.所属势力 !== '无' },
    { id:'first_sex',        name:'首次发生性行为',     points:200,  check: d => (d?.玩家?.性爱记录?.总次数||0) > 0 },
    { id:'gold_1k',          name:'金魂币突破1000',     points:100,  check: d => (d?.玩家?.经济?.金魂币||0) >= 1000 },
    { id:'gold_10k',         name:'金魂币突破10000',    points:300,  check: d => (d?.玩家?.经济?.金魂币||0) >= 10000 },
];

/* ===== SVG 图标库 ===== */
const IC = {
    task:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>`,
    gacha:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    bag:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
    gear:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
    dice:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>`,
    pin:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    calendar:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    trophy:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 22V8a6 6 0 00-6-6h16a6 6 0 00-6 6v14"/></svg>`,
    trophyLg:`<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 22V8a6 6 0 00-6-6h16a6 6 0 00-6 6v14"/></svg>`,
    check:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkCircle:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    crossCircle:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    refresh:`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
    save:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    signal:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>`,
    test:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    download:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upload:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    trash:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
    preset:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    edit:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    plus:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    coin:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M15 9.5c0-1.38-1.34-2.5-3-2.5s-3 1.12-3 2.5 1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5"/></svg>`,
    sparkle:`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>`,
    sparkleSm:`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>`,
    sparkleLg:`<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>`,
    gift:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`,
    target:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    package:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    packageLg:`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    starFill:`<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    crown:`<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="none"><path d="M2 20h20v2H2zM4 18l-2-8 6 4 4-8 4 8 6-4-2 8z"/></svg>`,
    shield:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    fire:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4-2.5 7-6 7-10.5 0-3.5-2-5-4-7.5-1 2-2 3-4 3S8 6 7 4c-2 2.5-4 4-4 7.5C3 16 6 19.5 12 22z"/></svg>`,
    hourglass:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v5l-4 4 4 4v5H6v-5l4-4-4-4z"/></svg>`,
    sword:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5L21 10l-7 7-6.5-6.5"/><path d="M3 21l4-4"/><path d="M14.5 3.5l3-3"/><path d="M21 10l-3 3"/><path d="M3 21l3.5-3.5"/></svg>`,
    search:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
};
const BK_SVG=`<svg viewBox="0 0 10 16" width="10" height="16"><path d="M9 1L2 8l7 7" stroke="var(--sp-accent)" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* 星级渲染辅助 */
function renderStars(n) {
    if (n >= 6) return `<span style="display:inline-flex;align-items:center;color:var(--sp-warning)">${IC.crown}</span>`;
    let s = '';
    for (let i = 0; i < Math.min(n, 5); i++) s += IC.starFill;
    return `<span style="display:inline-flex;align-items:center;gap:1px;color:var(--sp-warning)">${s}</span>`;
}

/* ===== 工具函数 ===== */
const log = (m, d) => d !== undefined ? console.log(`[系统面板] ${m}`, d) : console.log(`[系统面板] ${m}`);
const esc = s => { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; };
function toast(msg, t='ok') { try { ({ok:toastr.success,err:toastr.error,warn:toastr.warning,info:toastr.info})[t]?.(msg); } catch { log(msg); } }
function getDoc() { try { return window.top?.document || document; } catch { return document; } }
function qsel(s, c) { return (c || getDoc()).querySelector(s); }
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }

/* ===== 角色卡检测 ===== */
function isTargetCard() {
    try {
        const ctx = (window.top||window).SillyTavern?.getContext(); if (!ctx) return false;
        const cn=ctx.name2||'', cd=ctx.characterDescription||'', gid=ctx.groupId||'';
        if (!cn && !gid) return false;
        if (ctx.groups && gid) { const g=ctx.groups.find(x=>x.id===gid); if (g?.name && TARGET_IDS.some(id=>g.name.includes(id))) return true; }
        return TARGET_IDS.some(id => cn.includes(id) || cd.includes(id));
    } catch { return false; }
}
function cName() { try { return (window.top||window).SillyTavern?.getContext()?.name2||''; } catch { return ''; } }
function cId() { try { return (window.top||window).SillyTavern?.getContext()?.chatId||'def'; } catch { return 'def'; } }

/* ===== MVU读写 ===== */
function getMvuRaw() {
    try {
        const win = window.top || window;
        if (typeof win.Mvu === 'undefined' && win.parent?.Mvu) win.Mvu = win.parent.Mvu;
        return win.Mvu?.getMvuData({type:'message', message_id:'latest'}) || null;
    } catch { return null; }
}
function getMvuData() { return getMvuRaw()?.stat_data || null; }
function getPlayer() { return getMvuData()?.玩家 || {}; }
function getWorld() { return getMvuData()?.世界状态 || {}; }
function getFemaleNPCs() { return getMvuData()?.女性NPC || {}; }
function getMaleNPCs() { return getMvuData()?.男性NPC || {}; }
function getNearbyNPCs() {
    const loc = getWorld().当前位置 || '';
    if (!loc) return { female:[], male:[] };
    const female = [], male = [];
    const fn = getFemaleNPCs();
    for (const [name, npc] of Object.entries(fn)) {
        const npcLoc = npc?.基础信息?.当前位置 || '';
        if (npcLoc === loc || npcLoc === '同行' || npcLoc === '跟随') female.push(name);
    }
    const mn = getMaleNPCs();
    for (const [name, npc] of Object.entries(mn)) {
        const npcLoc = npc?.基础信息?.当前位置 || '';
        if (npcLoc === loc || npcLoc === '同行' || npcLoc === '跟随') male.push(name);
    }
    return { female, male };
}
async function writeMvuItem(itemName, desc) {
    try {
        const mvuData = getMvuRaw();
        if (!mvuData?.stat_data?.玩家) return false;
        if (!mvuData.stat_data.玩家.物品栏) mvuData.stat_data.玩家.物品栏 = {};
        const inv = mvuData.stat_data.玩家.物品栏;
        if (inv[itemName]) { inv[itemName].数量 = (inv[itemName].数量 || 0) + 1; }
        else { inv[itemName] = { 描述: desc, 数量: 1 }; }
        const win = window.top || window;
        await win.Mvu.replaceMvuData(mvuData, {type:'message', message_id:'latest'});
        return true;
    } catch(e) { log('写入MVU失败', e); return false; }
}
async function addMvuGold(amount) {
    try {
        const mvuData = getMvuRaw();
        if (!mvuData?.stat_data?.玩家?.经济) return false;
        mvuData.stat_data.玩家.经济.金魂币 = (mvuData.stat_data.玩家.经济.金魂币 || 0) + amount;
        const win = window.top || window;
        await win.Mvu.replaceMvuData(mvuData, {type:'message', message_id:'latest'});
        return true;
    } catch(e) { log('写入金魂币失败', e); return false; }
}

/* ===== 日期 ===== */
function parseGameDate(str) {
    if (!str) return null;
    const m = str.match(/(\d+)年(\d+)月(\d+)日/);
    if (!m) return null;
    return { year:parseInt(m[1]), month:parseInt(m[2]), day:parseInt(m[3]) };
}
function gameDateToStr(d) { return `斗罗历${d.year}年${d.month}月${d.day}日`; }
function isSameGameDate(a, b) { if(!a||!b) return false; return a.year===b.year && a.month===b.month && a.day===b.day; }
function isNextGameDate(prev, cur) {
    if (!prev || !cur) return false;
    const dim = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    if (cur.year===prev.year && cur.month===prev.month && cur.day===prev.day+1) return true;
    if (cur.day===1) {
        if (cur.month===prev.month+1 && cur.year===prev.year && prev.day>=(dim[prev.month]||30)) return true;
        if (cur.month===1 && prev.month===12 && cur.year===prev.year+1 && prev.day>=31) return true;
    }
    return false;
}

/* ===== API ===== */
const api = { url:'', key:'', model:'', models:[] };
function saveApi() { try{localStorage.setItem(CONFIG_KEY,JSON.stringify({apiUrl:api.url,apiKey:api.key,model:api.model,savedModels:api.models}));}catch{} }
function loadApi() { try{const d=JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');api.url=d.apiUrl||'';api.key=d.apiKey||'';api.model=d.model||'';api.models=d.savedModels||[];}catch{} }
function apiOk() { return !!(api.url && api.model); }
function normUrl(u) { return u.trim().replace(/\/+$/,'').replace(/\/v1(\/chat\/completions|\/models)?\/?$/,''); }
async function fetchModels(url,key) {
    const base=normUrl(url); if(!base) throw new Error('API地址为空');
    const h={}; if(key) h['Authorization']=`Bearer ${key}`;
    const ac=new AbortController(), t=setTimeout(()=>ac.abort(),15000);
    try { const r=await fetch(`${base}/v1/models`,{headers:h,signal:ac.signal}); clearTimeout(t); if(!r.ok) throw new Error(`HTTP ${r.status}`); const d=await r.json(); return (d.data||d).map(m=>m.id||m.name||'').filter(Boolean).sort(); }
    catch(e) { clearTimeout(t); throw e.name==='AbortError'?new Error('获取模型超时'):e; }
}
async function apiChat(messages, maxTk=1500) {
    if(!api.url||!api.model) throw new Error('请先配置API');
    const h={'Content-Type':'application/json'}; if(api.key) h['Authorization']=`Bearer ${api.key}`;
    const ac=new AbortController(), t=setTimeout(()=>ac.abort(),30000);
    try {
        const r=await fetch(`${normUrl(api.url)}/v1/chat/completions`,{method:'POST',headers:h,body:JSON.stringify({model:api.model,messages,temperature:0.95,max_tokens:maxTk}),signal:ac.signal});
        clearTimeout(t); if(!r.ok){let em=`API错误:${r.status}`;try{const ed=await r.json();if(ed.error?.message)em+=` ${ed.error.message}`;}catch{}throw new Error(em);}
        const d=await r.json(); return d.choices?.[0]?.message?.content||'';
    } catch(e) { clearTimeout(t); throw e.name==='AbortError'?new Error('请求超时(30s)'):e; }
}

/* ===== 概率 ===== */
function weightedRandom(table) {
    let r=Math.random(), sum=0;
    for (const item of table) { sum+=item.prob; if(r<=sum) return item; }
    return table[table.length-1];
}

/* ===== 数据层 ===== */
let D = {
    points:0, totalEarned:0, totalSpent:0,
    checkin:{ lastDate:'', streak:0, history:[] },
    tasks:{ pool:[], active:[], completed:[] },
    gacha:{ history:[], totalPulls:0, pity:0 },
    achievements:{ completed:{} },
    inventory:[],
    settings:{ nsfwEnabled:false, autoCheckin:false }
};
let _saveTimer;
function saveD() { clearTimeout(_saveTimer); _saveTimer=setTimeout(()=>{try{localStorage.setItem(`${DATA_KEY}_${cId()}`,JSON.stringify(D));}catch{}},300); }
function saveDNow() { clearTimeout(_saveTimer); try{localStorage.setItem(`${DATA_KEY}_${cId()}`,JSON.stringify(D));}catch{} }
function loadD() {
    try {
        const d=JSON.parse(localStorage.getItem(`${DATA_KEY}_${cId()}`)||'{}');
        D.points=d.points||0; D.totalEarned=d.totalEarned||0; D.totalSpent=d.totalSpent||0;
        D.checkin=Object.assign({lastDate:'',streak:0,history:[]},d.checkin||{});
        D.tasks=Object.assign({pool:[],active:[],completed:[]},d.tasks||{});
        D.gacha=Object.assign({history:[],totalPulls:0,pity:0},d.gacha||{});
        D.achievements=Object.assign({completed:{}},d.achievements||{});
        D.inventory=d.inventory||[];
        D.settings=Object.assign({nsfwEnabled:false,autoCheckin:false},d.settings||{});
    } catch{}
}
function addPoints(n,r) { D.points+=n; D.totalEarned+=n; saveDNow(); return D.points; }
function spendPoints(n) { if(D.points<n) return false; D.points-=n; D.totalSpent+=n; saveDNow(); return true; }
function addInventoryItem(item) {
    const ex=D.inventory.find(i=>i.name===item.name);
    if(ex){ex.count=(ex.count||1)+1;} else{D.inventory.push({...item,count:1,obtainedAt:new Date().toISOString()});}
    saveDNow();
}
function exportData() {
    const blob=new Blob([JSON.stringify(D,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`系统面板_${cId()}_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url); toast('数据已导出');
}
function importData() {
    const input=document.createElement('input'); input.type='file'; input.accept='.json';
    input.onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();
    reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);
    if(d.points!==undefined||d.tasks||d.gacha){
        D.points=d.points||0;D.totalEarned=d.totalEarned||0;D.totalSpent=d.totalSpent||0;
        D.checkin=Object.assign({lastDate:'',streak:0,history:[]},d.checkin||{});
        D.tasks=Object.assign({pool:[],active:[],completed:[]},d.tasks||{});
        D.gacha=Object.assign({history:[],totalPulls:0,pity:0},d.gacha||{});
        D.achievements=Object.assign({completed:{}},d.achievements||{});
        D.inventory=d.inventory||[];D.settings=Object.assign({nsfwEnabled:false,autoCheckin:false},d.settings||{});
        saveDNow();render();toast('数据已导入');
    }else{toast('文件格式不正确','err');}}catch(ex){toast('解析失败: '+ex.message,'err');}};reader.readAsText(file);};input.click();
}

/* ===== 预设 ===== */
const DEFAULT_PRESET = { id:'default_system', name:'默认预设', author:'系统',
taskPrompt:`你是一个跨时空系统。根据以下信息生成{count}个随机任务。\n\n当前信息:\n- 玩家等级: {level}级\n- 当前位置: {location}\n- 当前章节: {chapter}\n- 武魂: {spirit}\n- 在场NPC: {npcs}\n\n任务要求:\n1. 每个任务的种类必须不同，从以下种类随机选择: 修炼/战斗/探索/社交/收集/护送/猎杀/调查/竞技/交易/救援/守护/伪装/潜入/恶作剧/捉弄原著角色/社死挑战/尴尬场景\n2. 每个任务描述要具体，包含具体的人名、地名或目标\n3. 搞怪类任务至少出现1个\n4. 任务描述30-50字\n\n已分配的积分档位（严格使用，不要修改）: {pointsList}\n\n严格按JSON数组输出，不要其他文字:\n[{"id":"t1","title":"任务标题","desc":"任务描述","points":{对应积分},"difficulty":"对应难度标签","type":"种类"}]`,
nsfwTaskPrompt:`你是一个邪恶的跨时空系统。生成{count}个NSFW任务。\n\n当前信息:\n- 玩家等级: {level}级\n- 当前位置: {location}\n- 在场女性NPC: {femaleNpcs}\n\nNSFW任务方向池（每个任务必须从不同方向选择）:\n偷窃(偷内衣/偷袜子/偷贴身衣物) / 偷窥(偷看洗澡/偷看换衣/偷看修炼) / 骚扰(言语调戏/肢体接触/故意暧昧) / 露出(特定场所裸露/故意走光) / 威胁(抓把柄/胁迫就范) / 强制(强吻/压制/强行脱衣/强奸) / 收集(收集体液/收集贴身衣物) / 诱惑(色诱/下药/让角色产生欲望) / 恶趣味(给角色穿情趣服装/在食物中下药/公共场合play)\n\n规则:\n1. 每个任务必须指定一个目标女性NPC\n2. 如果在场没有女性NPC，就自由发挥创造场景\n3. 任务描述要具体大胆，不要含糊\n4. 30-50字描述\n\n已分配的积分档位: {pointsList}\n\n严格按JSON数组输出:\n[{"id":"nt1","title":"标题","desc":"描述","points":{积分},"difficulty":"难度","type":"NSFW","targetNpc":"目标NPC名"}]`,
gachaPrompt:`你是一个跨时空抽奖系统。生成一个{rarity}级别的随机物品。\n\n等级含义: {rarityDesc}\n\n物品来源可以是（完全随机）:\n- 斗罗大陆: 丹药/魂导器/仙草/功法/暗器\n- 诸天万界: 仙丹/法宝/血脉/秘籍(遮天/斗破/完美世界/诛仙/凡人修仙传等)\n- 现代世界: 手机/可乐/方便面/零食/电器\n- 神话传说: 神器/仙丹/法宝\n- 日本动漫: 恶魔果实/写轮眼/查克拉道具\n- 西方奇幻: 魔法卷轴/龙晶/精灵之弓\n- 科幻世界: 纳米机器人/能量护盾/光剑\n- NSFW: 情趣道具/媚药/特殊服装/透视眼镜/隐身斗篷\n\n规则:\n1. 物品价值必须与{rarity}等级匹配\n2. 物品描述要有趣，20-40字\n3. 来源完全随机，不要总是斗罗世界的\n4. NSFW物品有一定概率出现\n\n严格按JSON输出:\n{"name":"物品名","desc":"物品描述","rarity":"{rarity}","source":"来源世界"}`,
gachaBatchPrompt:`你是一个跨时空抽奖系统。一次性生成{count}个随机物品。\n\n各物品等级:\n{itemList}\n\n规则:\n1. 每个物品价值必须与对应等级匹配\n2. 物品描述20-40字\n3. 来源完全随机，不要总是斗罗世界的\n4. NSFW物品有一定概率出现\n\n物品来源: 斗罗大陆/诸天万界/现代世界/神话传说/日本动漫/西方奇幻/科幻世界/NSFW\n\n严格按JSON数组输出:\n[{"name":"物品名","desc":"物品描述","rarity":"等级","source":"来源"}]`,
checkinRewardPrompt:`生成一个{rarity}级别的签到奖励物品。\n连签天数: {days}天\n玩家等级: {level}级\n当前位置: {location}\n\n要求:\n1. 物品与连签天数的成就感匹配\n2. {rarity}级品质，物品要有用\n3. 描述20-30字\n\n严格按JSON输出:\n{"name":"物品名","desc":"物品描述","rarity":"{rarity}"}`,
taskVerifyPrompt:`你是一个任务验证系统。判断以下任务是否在最近的剧情中被完成。\n\n任务信息:\n- 标题: {title}\n- 描述: {desc}\n- 类型: {type}\n\n最近剧情记录:\n{recentChat}\n\n判断规则:\n1. 只要剧情中出现了与任务目标相关的行为或事件就算完成\n2. 不需要完全一字一句匹配，意思到了即可\n3. 如果剧情中完全没有提及相关内容，则未完成\n\n严格按JSON输出:\n{"completed":true或false,"reason":"简要理由(20字内)"}`
};

function loadPresets() { try{const s=localStorage.getItem(PRESET_KEY);if(s){const d=JSON.parse(s);if(!d.list.find(p=>p.id==='default_system'))d.list.unshift({...DEFAULT_PRESET});return d;}}catch{}return{list:[{...DEFAULT_PRESET}],activeId:'default_system'}; }
function savePresets(d) { try{localStorage.setItem(PRESET_KEY,JSON.stringify(d));}catch{} }
function getPreset() { const d=loadPresets(); return d.list.find(p=>p.id===d.activeId)||d.list[0]||{...DEFAULT_PRESET}; }
function fillTemplate(tpl,vars) { let s=tpl; for(const[k,v]of Object.entries(vars)) s=s.replace(new RegExp(`\\{${k}\\}`,'g'),v||''); return s; }

/* ===== 主题 ===== */
const THEME_KEY = 'syspanel_theme';
let curTheme = 'dark';
function loadTheme() { curTheme = localStorage.getItem(THEME_KEY) || 'dark'; }
function saveTheme() { localStorage.setItem(THEME_KEY, curTheme); }
function applyTheme() { const inner = qsel(`.${P}-inner`); if(!inner)return; inner.className=`${P}-inner ${P}-${curTheme}`; }
function toggleTheme() { curTheme = curTheme==='dark'?'light':'dark'; saveTheme(); applyTheme(); render(); }

/* ===== 导航 ===== */
let curTab = 'tasks';
const navStack = [];
let navData = {};
function pushPage(pg, data) { navData = data || {}; navStack.push(pg); render(); }
function popPage() { if(navStack.length) navStack.pop(); render(); }
function curPage() { return navStack.length ? navStack[navStack.length-1] : null; }

/* ===== CSS ===== */
const CSS = `<style id="${P}-css">
:root{
--sp-bg-panel:rgba(28,28,30,0.95);--sp-bg-card:rgba(58,58,60,0.5);--sp-bg-card2:rgba(72,72,74,0.4);
--sp-bg-hover:rgba(255,255,255,0.06);--sp-text-1:#f5f5f7;--sp-text-2:#98989d;--sp-text-3:#636366;
--sp-border:rgba(255,255,255,0.08);--sp-border2:rgba(255,255,255,0.12);
--sp-accent:#0a84ff;--sp-accent-soft:rgba(10,132,255,0.15);
--sp-bar-bg:rgba(255,255,255,0.08);--sp-success:#30d158;--sp-warning:#ff9f0a;--sp-danger:#ff453a;--sp-purple:#bf5af2;
--sp-shadow:0 2px 20px rgba(0,0,0,0.25),0 0 1px rgba(255,255,255,0.05);
--sp-glass:blur(24px) saturate(180%)
}
#${P}-trigger,#${P}-overlay,#${P}-overlay *{box-sizing:border-box;margin:0;padding:0}
#${P}-trigger{position:fixed!important;top:52vh;left:18px;width:42px!important;height:42px!important;border-radius:50%!important;background:rgba(28,28,30,0.9)!important;border:1.5px solid rgba(10,132,255,0.4)!important;box-shadow:0 0 16px rgba(10,132,255,0.12),0 4px 16px rgba(0,0,0,0.4)!important;z-index:2147483647!important;cursor:grab;display:flex!important;align-items:center;justify-content:center;user-select:none;touch-action:none;transition:transform .2s,box-shadow .2s;color:#0a84ff;animation:${P}-pulse 3s ease-in-out infinite}
@keyframes ${P}-pulse{0%,100%{box-shadow:0 0 16px rgba(10,132,255,0.12),0 4px 16px rgba(0,0,0,0.4)}50%{box-shadow:0 0 24px rgba(10,132,255,0.25),0 4px 16px rgba(0,0,0,0.4)}}
#${P}-trigger:hover{transform:scale(1.1)}
#${P}-trigger svg{pointer-events:none}
#${P}-overlay{position:fixed!important;inset:0;z-index:2147483646!important;display:none;background:rgba(0,0,0,.55);backdrop-filter:blur(10px)}
#${P}-overlay.show{display:block!important}
.${P}-phone{position:absolute;width:380px;height:750px;max-width:96vw;max-height:95vh;background:#000;border-radius:24px;padding:6px;box-shadow:0 30px 90px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.05);opacity:0;transform:scale(.92);transition:opacity .35s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.16,1,.3,1);display:flex}
#${P}-overlay.show .${P}-phone{opacity:1;transform:scale(1)}
.${P}-inner{width:100%;height:100%;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue','PingFang SC',sans-serif;-webkit-font-smoothing:antialiased;font-size:14px;position:relative}
.${P}-dark{background:var(--sp-bg-panel);color:var(--sp-text-1)}
.${P}-light{--sp-bg-panel:rgba(255,255,255,0.92);--sp-bg-card:rgba(245,245,247,0.65);--sp-bg-card2:rgba(230,230,235,0.5);--sp-bg-hover:rgba(0,0,0,0.04);--sp-text-1:#1d1d1f;--sp-text-2:#6e6e73;--sp-text-3:#aeaeb2;--sp-border:rgba(0,0,0,0.08);--sp-border2:rgba(0,0,0,0.12);--sp-accent:#0071e3;--sp-accent-soft:rgba(0,113,227,0.1);--sp-bar-bg:rgba(0,0,0,0.06);--sp-success:#34c759;--sp-warning:#ff9f0a;--sp-danger:#ff3b30;--sp-purple:#af52de;--sp-shadow:0 2px 16px rgba(0,0,0,0.06),0 0 1px rgba(0,0,0,0.1);background:var(--sp-bg-panel);color:var(--sp-text-1)}
.${P}-drag{height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:move;user-select:none;touch-action:none}
.${P}-drag-pill{width:36px;height:4px;background:var(--sp-border2);border-radius:2px}
.${P}-home-bar{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:110px;height:4px;background:var(--sp-border);border-radius:2px;z-index:50}
.${P}-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.${P}-tab-bar{height:64px;flex-shrink:0;display:flex;background:var(--sp-bg-panel);backdrop-filter:var(--sp-glass);border-top:1px solid var(--sp-border);padding-bottom:12px}
.${P}-tab-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;color:var(--sp-text-3);font-size:10px;font-weight:500;transition:color .2s;-webkit-tap-highlight-color:transparent}
.${P}-tab-item.on{color:var(--sp-accent)}
.${P}-tab-item .ico{display:flex;align-items:center;justify-content:center;height:24px}
.${P}-main{flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0}
.${P}-hdr{height:48px;flex-shrink:0;display:flex;align-items:center;padding:0 24px;position:relative;justify-content:center}
.${P}-hdr-t{font-size:17px;font-weight:700;color:var(--sp-text-1);letter-spacing:-0.3px}
.${P}-hdr-pts{position:absolute;right:24px;font-size:13px;color:var(--sp-accent);font-weight:600;display:flex;align-items:center;gap:4px}
.${P}-nav{height:44px;flex-shrink:0;display:flex;align-items:center;padding:0 20px;background:var(--sp-bg-panel);backdrop-filter:var(--sp-glass);border-bottom:1px solid var(--sp-border);position:relative}
.${P}-bk{background:none;border:none;cursor:pointer;color:var(--sp-accent);font-size:14px;padding:0 4px;display:flex;align-items:center;gap:3px;z-index:1;font-weight:500;font-family:inherit}
.${P}-nt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:600;white-space:nowrap;max-width:55%;overflow:hidden;text-overflow:ellipsis;color:var(--sp-text-1)}
.${P}-pg{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;min-height:0;padding:10px 20px 16px}
.${P}-pg::-webkit-scrollbar{width:4px}
.${P}-pg::-webkit-scrollbar-track{background:transparent}
.${P}-pg::-webkit-scrollbar-thumb{background:var(--sp-border2);border-radius:2px}
.${P}-ls{background:var(--sp-bg-card);border-radius:12px;margin:8px 0;overflow:hidden;border:1px solid var(--sp-border)}
.${P}-li{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--sp-border);cursor:pointer;transition:background .15s;-webkit-tap-highlight-color:transparent}
.${P}-li:last-child{border-bottom:none}
.${P}-li:active{background:var(--sp-bg-hover)}
.${P}-av{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;background:var(--sp-accent-soft);color:var(--sp-accent)}
.${P}-linfo{flex:1;min-width:0}
.${P}-lnm{font-size:14px;font-weight:500;color:var(--sp-text-1)}
.${P}-lsub{font-size:12px;color:var(--sp-text-2);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${P}-larr{color:var(--sp-text-3);font-size:16px}
.${P}-sec{font-size:11px;color:var(--sp-text-2);padding:14px 4px 6px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.${P}-form{padding:12px 0}
.${P}-fg{margin-bottom:14px}
.${P}-fl{font-size:11px;color:var(--sp-text-2);margin-bottom:4px;padding-left:2px;font-weight:600;letter-spacing:.3px}
.${P}-inp,.${P}-ta,.${P}-sel{width:100%;padding:12px 14px;border-radius:10px;border:1px solid var(--sp-border2);background:var(--sp-bg-card);font-size:13px;color:var(--sp-text-1);outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
.${P}-inp::placeholder,.${P}-ta::placeholder{color:var(--sp-text-3)}
.${P}-inp:focus,.${P}-ta:focus,.${P}-sel:focus{border-color:var(--sp-accent);box-shadow:0 0 0 3px var(--sp-accent-soft)}
.${P}-ta{min-height:72px;resize:vertical;line-height:1.5}
.${P}-sel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2398989d' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
.${P}-btn{display:flex;width:100%;padding:11px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .15s,transform .1s;align-items:center;justify-content:center;gap:5px;box-sizing:border-box}
.${P}-btn:active{opacity:.8;transform:scale(.98)}
.${P}-btn:disabled{opacity:.3;cursor:not-allowed;transform:none}
.${P}-btn.gn{background:var(--sp-accent);color:#fff;box-shadow:0 2px 8px rgba(10,132,255,0.2)}
.${P}-btn.gy{background:var(--sp-bg-card);color:var(--sp-text-2);border:1px solid var(--sp-border2)}
.${P}-btn.rd{background:var(--sp-danger);color:#fff}
.${P}-brow{display:flex;gap:8px}
.${P}-brow .${P}-btn{flex:1}
.${P}-bsm{display:inline-flex;width:auto;padding:7px 12px;font-size:12px;border-radius:8px}
.${P}-card{background:var(--sp-bg-card);border:1px solid var(--sp-border);border-radius:12px;padding:14px 16px;margin-bottom:8px}
.${P}-card-t{font-size:11px;color:var(--sp-text-2);font-weight:700;letter-spacing:.5px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--sp-border);display:flex;align-items:center;gap:5px}
.${P}-empty{text-align:center;padding:40px 20px;color:var(--sp-text-3);font-size:13px;display:flex;flex-direction:column;align-items:center;gap:8px}
.${P}-st{padding:10px 14px;border-radius:8px;font-size:12px;margin-top:8px;line-height:1.5}
.${P}-st.ok{background:rgba(48,209,88,.1);color:var(--sp-success);border:1px solid rgba(48,209,88,.15)}
.${P}-st.er{background:rgba(255,69,58,.08);color:var(--sp-danger);border:1px solid rgba(255,69,58,.15)}
.${P}-st.in{background:var(--sp-accent-soft);color:var(--sp-accent);border:1px solid rgba(10,132,255,.15)}
.${P}-switch-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px}
.${P}-switch-row span{color:var(--sp-text-1);font-size:14px;display:flex;align-items:center;gap:6px}
.${P}-sw{position:relative;width:42px;height:24px;cursor:pointer;flex-shrink:0}
.${P}-sw input{opacity:0;width:0;height:0}
.${P}-sw-sl{position:absolute;inset:0;background:var(--sp-bg-card2);border-radius:12px;transition:.25s}
.${P}-sw-sl::before{content:'';position:absolute;width:20px;height:20px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.${P}-sw input:checked+.${P}-sw-sl{background:var(--sp-accent)}
.${P}-sw input:checked+.${P}-sw-sl::before{transform:translateX(18px)}
.${P}-task-card{background:var(--sp-bg-card);border:1px solid var(--sp-border);border-radius:12px;padding:14px 16px;margin-bottom:8px}
.${P}-task-card.nsfw{border-color:rgba(255,69,58,.2);background:rgba(255,69,58,.04)}
.${P}-task-hd{display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap}
.${P}-task-icon{display:flex;align-items:center;flex-shrink:0}
.${P}-task-title{font-size:14px;font-weight:600;color:var(--sp-text-1);flex:1;min-width:80px}
.${P}-task-tag{font-size:10px;padding:2px 6px;border-radius:4px;background:var(--sp-accent-soft);color:var(--sp-accent);white-space:nowrap}
.${P}-task-tag.nsfw{background:rgba(255,69,58,.1);color:var(--sp-danger)}
.${P}-task-tag.pts{background:rgba(255,159,10,.15);color:var(--sp-warning);font-weight:700;display:flex;align-items:center;gap:3px}
.${P}-task-desc{font-size:12px;color:var(--sp-text-2);margin-bottom:4px;line-height:1.5}
.${P}-task-acts{display:flex;gap:6px;margin-top:6px}
.${P}-task-btn{padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;border:1px solid var(--sp-border2);background:var(--sp-bg-card2);color:var(--sp-text-2);transition:all .2s;font-family:inherit;display:flex;align-items:center;gap:4px}
.${P}-task-btn:hover{background:var(--sp-bg-hover)}
.${P}-task-btn.accept{border-color:rgba(48,209,88,.3);color:var(--sp-success)}
.${P}-task-btn.complete{border-color:rgba(10,132,255,.3);color:var(--sp-accent)}
.${P}-task-btn.abandon{border-color:rgba(255,69,58,.3);color:var(--sp-danger)}
.${P}-checkin-cal{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:8px 0}
.${P}-cal-day{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--sp-text-3);background:var(--sp-bg-card);border:1px solid var(--sp-border)}
.${P}-cal-day.done{background:var(--sp-accent-soft);color:var(--sp-accent);border-color:rgba(10,132,255,.2)}
.${P}-cal-day.today{border-color:var(--sp-accent);box-shadow:0 0 8px rgba(10,132,255,.25)}
.${P}-cal-day.bonus{background:rgba(191,90,242,.08);border-color:rgba(191,90,242,.25);color:var(--sp-purple)}
.${P}-cal-day.bonus.done{background:rgba(191,90,242,.2);color:var(--sp-purple)}
.${P}-ach-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--sp-border)}
.${P}-ach-item:last-child{border-bottom:none}
.${P}-ach-chk{width:20px;height:20px;border-radius:50%;border:2px solid var(--sp-border2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.${P}-ach-chk.done{border-color:var(--sp-success);background:var(--sp-success);color:#fff}
.${P}-ach-info{flex:1}
.${P}-ach-name{font-size:13px;color:var(--sp-text-1)}
.${P}-ach-name.done{color:var(--sp-text-3);text-decoration:line-through}
.${P}-ach-pts{font-size:12px;color:var(--sp-warning);font-weight:600;flex-shrink:0}
.${P}-gacha-area{text-align:center;padding:16px 0}
.${P}-gacha-orb{width:76px;height:76px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;border:2.5px solid var(--sp-border2);background:var(--sp-bg-card);transition:all .3s;position:relative;overflow:visible;color:var(--sp-accent)}
.${P}-gacha-orb.spinning{animation:${P}-orbSpin .6s cubic-bezier(.4,0,.2,1) infinite}
@keyframes ${P}-orbSpin{0%{transform:rotate(0deg) scale(1);border-color:var(--sp-accent)}25%{transform:rotate(90deg) scale(1.05);border-color:var(--sp-purple)}50%{transform:rotate(180deg) scale(1);border-color:var(--sp-warning)}75%{transform:rotate(270deg) scale(1.05);border-color:var(--sp-danger)}100%{transform:rotate(360deg) scale(1);border-color:var(--sp-accent)}}
.${P}-gacha-orb.burst{animation:${P}-orbBurst .6s ease-out forwards}
@keyframes ${P}-orbBurst{0%{transform:scale(1.2);box-shadow:0 0 0 0 var(--burst-color)}50%{transform:scale(1.1);box-shadow:0 0 40px 10px var(--burst-color)}100%{transform:scale(1);box-shadow:0 0 20px 2px transparent}}
.${P}-gacha-particles{position:absolute;inset:-30px;pointer-events:none}
.${P}-particle{position:absolute;width:4px;height:4px;border-radius:50%;animation:${P}-particleFly .8s ease-out forwards}
@keyframes ${P}-particleFly{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--px),var(--py)) scale(0)}}
.${P}-gacha-result{background:var(--sp-bg-card);border:1px solid var(--sp-border);border-radius:12px;padding:14px 16px;margin:8px 0;text-align:left;animation:${P}-resultIn .4s ease-out}
@keyframes ${P}-resultIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.${P}-gacha-rarity{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;margin-bottom:4px}
.${P}-gacha-name{font-size:15px;font-weight:700;color:var(--sp-text-1);margin-bottom:2px;display:flex;align-items:center;gap:4px}
.${P}-gacha-desc{font-size:12px;color:var(--sp-text-2);line-height:1.5}
.${P}-gacha-src{font-size:11px;color:var(--sp-text-3);margin-top:3px}
.${P}-ten-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:8px 0}
.${P}-ten-cell{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:10px;background:var(--sp-bg-card);border:1.5px solid var(--sp-border);cursor:pointer;transition:transform .2s;animation:${P}-cellIn .3s ease-out both}
.${P}-ten-cell:hover{transform:translateY(-2px)}
@keyframes ${P}-cellIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.${P}-ten-cell .cell-icon{display:flex;align-items:center;justify-content:center}
.${P}-ten-cell .cell-name{font-size:9px;color:var(--sp-text-2);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.${P}-inv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px 0}
.${P}-inv-cell{display:flex;flex-direction:column;align-items:center;padding:10px 4px 8px;border-radius:10px;background:var(--sp-bg-card);border:1.5px solid var(--sp-border);cursor:pointer;transition:all .2s;position:relative;min-height:70px}
.${P}-inv-cell:hover{transform:translateY(-1px);border-color:var(--sp-accent)}
.${P}-inv-cell .cell-icon{display:flex;align-items:center;justify-content:center;margin-bottom:3px}
.${P}-inv-cell .cell-name{font-size:10px;color:var(--sp-text-1);text-align:center;word-break:break-all;line-height:1.2;max-height:2.4em;overflow:hidden}
.${P}-inv-cnt-badge{position:absolute;top:3px;right:3px;min-width:16px;height:16px;border-radius:8px;background:var(--sp-accent);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px}
.${P}-inv-filter{display:flex;gap:4px;padding:6px 0;flex-wrap:wrap}
.${P}-inv-fbtn{padding:5px 10px;border-radius:8px;font-size:11px;cursor:pointer;border:1px solid var(--sp-border);background:transparent;color:var(--sp-text-2);transition:all .15s;font-family:inherit}
.${P}-inv-fbtn.on{background:var(--sp-accent-soft);color:var(--sp-accent);border-color:var(--sp-accent)}
.${P}-modal-bg{position:absolute;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);z-index:100;display:none;align-items:center;justify-content:center;padding:20px;border-radius:20px;overflow:hidden}
.${P}-modal-bg.open{display:flex}
.${P}-modal-box{width:100%;max-width:340px;max-height:75%;background:var(--sp-bg-panel);border:1px solid var(--sp-border);border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.3);display:flex;flex-direction:column;animation:${P}-modalIn .3s ease-out}
@keyframes ${P}-modalIn{from{opacity:0;transform:scale(.9) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.${P}-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 8px}
.${P}-modal-name{font-size:16px;font-weight:700;color:var(--sp-text-1)}
.${P}-modal-x{width:26px;height:26px;border-radius:50%;border:none;background:var(--sp-bg-card);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--sp-text-2);font-size:14px}
.${P}-modal-x:hover{background:var(--sp-bg-hover);color:var(--sp-text-1)}
.${P}-modal-body{flex:1;overflow-y:auto;padding:8px 16px 16px}
.${P}-modal-field{margin-bottom:10px}
.${P}-modal-label{font-size:10px;font-weight:700;color:var(--sp-text-2);text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
.${P}-modal-val{font-size:13px;color:var(--sp-text-1);line-height:1.5;word-break:break-word}
.${P}-legend-dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:3px;vertical-align:middle}
@media(max-width:400px){.${P}-phone{border-radius:16px;padding:4px}.${P}-inner{border-radius:14px}}
</style>`;

/* ===== HTML ===== */
const HTML = `
<div id="${P}-trigger">${IC.sparkle}</div>
<div id="${P}-overlay"><div class="${P}-phone" id="${P}-phone">
<div class="${P}-inner ${P}-dark">
<div class="${P}-drag" id="${P}-drag"><div class="${P}-drag-pill"></div></div>
<div class="${P}-body" id="${P}-body"></div>
<div class="${P}-home-bar"></div>
</div>
</div></div>`;

/* ===== 拖拽 ===== */
function initDrag(el, opts={}) {
    const hd = opts.handle ? el.querySelector(opts.handle) : el; if(!hd) return;
    let on=false, moved=false, sx, sy, ox, oy;
    hd.addEventListener('pointerdown', e => {
        if(e.button!==0||(opts.ignore&&e.target.closest(opts.ignore))) return;
        e.preventDefault(); on=true; moved=false; sx=e.clientX; sy=e.clientY;
        const r=el.getBoundingClientRect(); ox=r.left; oy=r.top;
        hd.setPointerCapture(e.pointerId);
    }, {passive:false});
    hd.addEventListener('pointermove', e => {
        if(!on) return; const dx=e.clientX-sx, dy=e.clientY-sy;
        if(!moved && Math.abs(dx)<3 && Math.abs(dy)<3) return;
        moved=true; e.preventDefault();
        const W=(window.top||window).innerWidth, H=(window.top||window).innerHeight;
        el.style.left=Math.max(0,Math.min(ox+dx,W-el.offsetWidth))+'px';
        el.style.top=Math.max(0,Math.min(oy+dy,H-40))+'px';
        el.style.right='auto'; el.style.bottom='auto';
    }, {passive:false});
    hd.addEventListener('pointerup', e => {
        if(!on) return; on=false;
        try{hd.releasePointerCapture(e.pointerId);}catch{}
        if(!moved && opts.onClick) opts.onClick(e);
    });
    hd.addEventListener('pointercancel', () => { on=false; });
}

/* ===== 销毁/监听 ===== */
function destroy() {
    log('销毁'); window.__syspActive=false;
    const doc=getDoc();
    doc.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());
    if(doc!==document) try{document.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());}catch{}
    try{const w=window.top||window;if(w.eventSource&&window.__syspH){w.eventSource.removeListener(w.event_types.CHAT_CHANGED,window.__syspH);window.__syspH=null;}}catch{}
    if(window.__syspPoll){clearInterval(window.__syspPoll);window.__syspPoll=null;}
}
window.removeEventListener('pagehide', destroy);
window.addEventListener('pagehide', destroy);
function setupWatcher() {
    if(window.__syspPoll) clearInterval(window.__syspPoll);
    try{const w=window.top||window;if(w.eventSource&&w.event_types){if(window.__syspH)try{w.eventSource.removeListener(w.event_types.CHAT_CHANGED,window.__syspH);}catch{}window.__syspH=()=>setTimeout(onChange,200);w.eventSource.on(w.event_types.CHAT_CHANGED,window.__syspH);}}catch{}
    let lc=cName(), li=cId();
    window.__syspPoll=setInterval(()=>{const cn=cName(),ci=cId();if(cn!==lc||ci!==li){lc=cn;li=ci;onChange();}},1500);
}
function onChange() {
    const is=isTargetCard(), act=window.__syspActive===true;
    if(is && !act) setTimeout(init,400);
    else if(!is && act) destroy();
}

/* ===== navBar ===== */
function navBar(title) { return `<div class="${P}-nav"><button class="${P}-bk" data-act="back">${BK_SVG} 返回</button><span class="${P}-nt">${esc(title)}</span></div>`; }

/* ===== 获取最近聊天记录 ===== */
function getRecentMessages(count) {
    try {
        const ctx = (window.top||window).SillyTavern?.getContext();
        if (!ctx || !ctx.chat) return '';
        const msgs = ctx.chat.slice(-(count||5));
        return msgs.map(m => {
            const role = m.is_user ? '玩家' : 'AI';
            const text = (m.mes||'').replace(/<[^>]*>/g,'').substring(0,400);
            return `[${role}]: ${text}`;
        }).join('\n\n');
    } catch { return ''; }
}

/* ===== AI验证任务完成 ===== */
async function verifyTaskCompletion(task) {
    if (!apiOk()) return { completed:true, reason:'API未配置，跳过验证' };
    const recent = getRecentMessages(5);
    if (!recent) return { completed:true, reason:'无法获取聊天记录，跳过验证' };
    const preset = getPreset();
    const prompt = fillTemplate(preset.taskVerifyPrompt || '', {
        title: task.title || '', desc: task.desc || '', type: task.type || '', recentChat: recent
    });
    if (!prompt) return { completed:true, reason:'无验证模板，跳过' };
    try {
        const result = await apiChat([{ role:'user', content:prompt }], 300);
        const jm = result.match(/\{[\s\S]*\}/);
        if (!jm) return { completed:true, reason:'AI返回格式异常，默认通过' };
        const parsed = JSON.parse(jm[0]);
        return { completed:!!parsed.completed, reason:parsed.reason||'' };
    } catch(e) { log('任务验证失败', e); return { completed:true, reason:'验证请求失败，默认通过' }; }
}

/* ===== 统计chip ===== */
function statChip(label, value, color) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px"><span style="color:var(--sp-text-2)">${label}</span><span style="color:${color||'var(--sp-text-1)'};font-weight:600">${value}</span></div>`;
}
/* ========== 系统面板 v2.1 第2段/共2段 ========== */

/* ===== 任务类型图标映射 ===== */
function getTaskIcon(type) {
    const map = {
        '修炼': IC.sparkle, '战斗': IC.sword, '探索': IC.search, '社交': IC.target,
        '收集': IC.package, '护送': IC.shield, '猎杀': IC.sword, '调查': IC.search,
        '竞技': IC.trophy, '交易': IC.coin, '救援': IC.shield, '守护': IC.shield,
        '伪装': IC.target, '潜入': IC.search, '恶作剧': IC.dice, '捉弄': IC.dice,
        '社死': IC.fire, '尴尬': IC.fire, 'NSFW': IC.fire
    };
    for (const [k, v] of Object.entries(map)) { if (type && type.includes(k)) return v; }
    return IC.task;
}

/* ===== 任务生成 ===== */
function preAllocatePoints(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        const tier = weightedRandom(POINTS_TABLE);
        result.push({ points:tier.points, star:tier.star, label:tier.label });
    }
    return result;
}

async function generateTasks(count) {
    if (!apiOk()) throw new Error('请先配置API');
    const player = getPlayer(), world = getWorld(), nearby = getNearbyNPCs();
    const allNpcs = [...nearby.female, ...nearby.male];
    const allocated = preAllocatePoints(count);
    const pointsList = allocated.map((a,i) => `任务${i+1}: ${a.points}积分(${a.label})`).join(', ');
    const preset = getPreset();
    const prompt = fillTemplate(preset.taskPrompt, {
        count:String(count), level:String(player.修炼状态?.魂力等级||0),
        location:world.当前位置||'未知', chapter:world.剧情章节||'序章',
        spirit:player.主武魂?.名称||'未知',
        npcs:allNpcs.length?allNpcs.join('、'):'附近无NPC', pointsList
    });
    const result = await apiChat([{role:'user',content:prompt}], 2000);
    const jm = result.match(/\[\s*\S[\s\S]*\]/);
    if (!jm) throw new Error('AI返回格式错误');
    const tasks = JSON.parse(jm[0]);
    if (!Array.isArray(tasks)||tasks.length===0) throw new Error('任务列表为空');
    return tasks.map((t,i) => ({
        id:`t_${uid()}`, title:t.title||'未命名任务', desc:t.desc||'无描述',
        points:allocated[i]?.points||t.points||50, difficulty:allocated[i]?.label||t.difficulty||'简单',
        star:allocated[i]?.star||1, type:t.type||'未知', isNsfw:false,
        generatedAt:new Date().toISOString()
    }));
}

async function generateNsfwTasks(count) {
    if (!apiOk()) throw new Error('请先配置API');
    const player = getPlayer(), world = getWorld(), nearby = getNearbyNPCs();
    const allocated = preAllocatePoints(count);
    const pointsList = allocated.map((a,i) => `任务${i+1}: ${a.points}积分(${a.label})`).join(', ');
    const preset = getPreset();
    const prompt = fillTemplate(preset.nsfwTaskPrompt, {
        count:String(count), level:String(player.修炼状态?.魂力等级||0),
        location:world.当前位置||'未知',
        femaleNpcs:nearby.female.length?nearby.female.join('、'):'附近无女性NPC', pointsList
    });
    const result = await apiChat([{role:'user',content:prompt}], 2000);
    const jm = result.match(/\[\s*\S[\s\S]*\]/);
    if (!jm) throw new Error('AI返回格式错误');
    const tasks = JSON.parse(jm[0]);
    if (!Array.isArray(tasks)||tasks.length===0) throw new Error('任务列表为空');
    return tasks.map((t,i) => ({
        id:`nt_${uid()}`, title:t.title||'未命名暗任务', desc:t.desc||'无描述',
        points:allocated[i]?.points||t.points||50, difficulty:allocated[i]?.label||t.difficulty||'简单',
        star:allocated[i]?.star||1, type:t.type||'NSFW', targetNpc:t.targetNpc||'',
        isNsfw:true, generatedAt:new Date().toISOString()
    }));
}

function acceptTask(taskId) {
    if (D.tasks.active.length>=3){toast('最多同时接取3个任务','err');return false;}
    const idx=D.tasks.pool.findIndex(t=>t.id===taskId); if(idx===-1) return false;
    const task=D.tasks.pool.splice(idx,1)[0]; task.acceptedAt=new Date().toISOString();
    D.tasks.active.push(task); saveDNow(); return true;
}
function completeTask(taskId) {
    const idx=D.tasks.active.findIndex(t=>t.id===taskId); if(idx===-1) return false;
    const task=D.tasks.active.splice(idx,1)[0]; task.completedAt=new Date().toISOString();
    addPoints(task.points, `完成任务: ${task.title}`);
    D.tasks.completed.push(task); saveDNow(); toast(`+${task.points} 积分`); return true;
}
function abandonTask(taskId) {
    const idx=D.tasks.active.findIndex(t=>t.id===taskId); if(idx===-1) return false;
    D.tasks.pool.push(D.tasks.active.splice(idx,1)[0]); saveDNow(); return true;
}

/* ===== 签到 ===== */
function canCheckin() {
    const world=getWorld(), todayStr=world.当前日期||'';
    if(!todayStr) return {can:false,reason:'无法获取游戏日期'};
    const today=parseGameDate(todayStr); if(!today) return {can:false,reason:'日期格式无法解析'};
    if(D.checkin.lastDate===todayStr) return {can:false,reason:'今天已签到'};
    return {can:true,today,todayStr};
}
function doCheckin() {
    const check=canCheckin(); if(!check.can){toast(check.reason,'warn');return null;}
    const lastDate=parseGameDate(D.checkin.lastDate);
    if(lastDate&&isNextGameDate(lastDate,check.today)){D.checkin.streak+=1;}else{D.checkin.streak=1;}
    if(D.checkin.streak>30) D.checkin.streak=1;
    const day=D.checkin.streak, pts=CHECKIN_REWARDS[day]||10;
    addPoints(pts,`签到第${day}天`);
    D.checkin.lastDate=check.todayStr;
    D.checkin.history.push({date:check.todayStr,day,points:pts,ts:Date.now()});
    if(D.checkin.history.length>60) D.checkin.history=D.checkin.history.slice(-60);
    const result={day,points:pts,isBonus:CHECKIN_BONUS_DAYS.includes(day)};
    if(day>=30) D.checkin.streak=0;
    saveDNow(); return result;
}
async function generateCheckinBonus(day) {
    if(!apiOk()) return null;
    const rarity=CHECKIN_BONUS_RARITY[day]||'紫', player=getPlayer(), world=getWorld(), preset=getPreset();
    const prompt=fillTemplate(preset.checkinRewardPrompt,{
        rarity, days:String(day), level:String(player.修炼状态?.魂力等级||0), location:world.当前位置||'未知'
    });
    try {
        const result=await apiChat([{role:'user',content:prompt}],500);
        const jm=result.match(/\{[\s\S]*\}/); if(!jm) return null;
        const item=JSON.parse(jm[0]); item.rarity=rarity;
        addInventoryItem(item); await writeMvuItem(item.name,item.desc||'签到奖励'); return item;
    } catch(e){log('签到奖励生成失败',e);return null;}
}
function checkAchievements() {
    const data=getMvuData(); if(!data) return [];
    const newlyCompleted=[];
    for(const ach of ACHIEVEMENTS){
        if(D.achievements.completed[ach.id]) continue;
        try{if(ach.check(data)){D.achievements.completed[ach.id]=true;addPoints(ach.points,`成就: ${ach.name}`);newlyCompleted.push(ach);}}catch{}
    }
    if(newlyCompleted.length>0) saveDNow(); return newlyCompleted;
}
function tryAutoCheckin() {
    if(!D.settings.autoCheckin) return;
    const check=canCheckin(); if(check.can){const r=doCheckin();if(r)toast(`自动签到！+${r.points}积分 (第${r.day}天)`);}
}

/* ===== 抽奖 ===== */
let gachaSpinning=false, gachaResults=[], gachaMode='';

function rollRarity(guaranteed) {
    D.gacha.pity=(D.gacha.pity||0)+1;
    if(guaranteed||D.gacha.pity>=50){
        D.gacha.pity=0;
        const pool=RARITY_TABLE.filter(r=>['紫','黑','红','金'].includes(r.name));
        const total=pool.reduce((s,x)=>s+x.prob,0);
        return weightedRandom(pool.map(r=>({...r,prob:r.prob/total})));
    }
    return weightedRandom(RARITY_TABLE);
}

async function generateGachaItem(rarity) {
    const preset=getPreset();
    const prompt=fillTemplate(preset.gachaPrompt,{rarity:rarity.name,rarityDesc:rarity.desc});
    const result=await apiChat([{role:'user',content:prompt}],500);
    const jm=result.match(/\{[\s\S]*\}/); if(!jm) throw new Error('AI返回格式错误');
    const item=JSON.parse(jm[0]); item.rarity=rarity.name; item.color=rarity.color; return item;
}
async function generateGachaItemsBatch(rarities) {
    const preset=getPreset();
    const list=rarities.map((r,i)=>`物品${i+1}: ${r.name}级(${r.desc})`).join('\n');
    const prompt=fillTemplate(preset.gachaBatchPrompt,{count:String(rarities.length),itemList:list});
    const result=await apiChat([{role:'user',content:prompt}],3000);
    const jm=result.match(/\[\s*\S[\s\S]*\]/); if(!jm) throw new Error('AI返回格式错误');
    const items=JSON.parse(jm[0]);
    return items.map((item,i)=>({
        name:item.name||'未知物品', desc:item.desc||'', rarity:rarities[i].name,
        color:rarities[i].color, source:item.source||'未知'
    }));
}
async function doSinglePull() {
    if(!apiOk()) throw new Error('请先配置API');
    if(!spendPoints(50)) throw new Error('积分不足（需要50）');
    const rarity=rollRarity(false), item=await generateGachaItem(rarity);
    D.gacha.totalPulls+=1;
    D.gacha.history.unshift({...item,time:new Date().toISOString()});
    if(D.gacha.history.length>100) D.gacha.history=D.gacha.history.slice(0,100);
    addInventoryItem(item); await writeMvuItem(item.name,item.desc||'抽奖获得');
    saveDNow(); return item;
}
async function doTenPull() {
    if(!apiOk()) throw new Error('请先配置API');
    if(!spendPoints(450)) throw new Error('积分不足（需要450）');
    const rarities=[]; let hasPurple=false;
    for(let i=0;i<10;i++){
        const isLast=i===9&&!hasPurple;
        const rarity=rollRarity(isLast);
        if(['紫','黑','红','金'].includes(rarity.name)) hasPurple=true;
        rarities.push(rarity);
    }
    const items=await generateGachaItemsBatch(rarities);
    for(const item of items){
        D.gacha.history.unshift({...item,time:new Date().toISOString()});
        addInventoryItem(item); await writeMvuItem(item.name,item.desc||'抽奖获得');
    }
    D.gacha.totalPulls+=10;
    if(D.gacha.history.length>100) D.gacha.history=D.gacha.history.slice(0,100);
    saveDNow(); return items;
}

function getRarityColor(name) { return RARITY_TABLE.find(x=>x.name===name)?.color||'#888'; }
function getRarityTextColor(name) { return RARITY_TABLE.find(x=>x.name===name)?.textColor||'#fff'; }

function spawnParticles(container,color,count) {
    for(let i=0;i<count;i++){
        const angle=(Math.PI*2/count)*i+(Math.random()-0.5)*0.5;
        const dist=30+Math.random()*40, px=Math.cos(angle)*dist, py=Math.sin(angle)*dist;
        const p=document.createElement('div'); p.className=`${P}-particle`;
        p.style.cssText=`left:50%;top:50%;background:${color};--px:${px}px;--py:${py}px;animation-delay:${i*30}ms`;
        container.appendChild(p); setTimeout(()=>p.remove(),1000);
    }
}
function startSpinAnimation(el) { el.classList.remove('burst'); el.classList.add('spinning'); el.innerHTML=IC.sparkleLg; }
function stopSpinAnimation(el,rarity) {
    el.classList.remove('spinning');
    const color=getRarityColor(rarity);
    el.style.setProperty('--burst-color',color+'66'); el.style.borderColor=color;
    el.style.boxShadow=`0 0 24px ${color}44`; el.classList.add('burst');
    const particles=el.querySelector(`.${P}-gacha-particles`)||(()=>{
        const d=document.createElement('div'); d.className=`${P}-gacha-particles`; el.appendChild(d); return d;
    })();
    spawnParticles(particles,color,12);
}

/* ===== 渲染辅助 ===== */
function renderTaskCard(t, mode) {
    const isNsfw=t.isNsfw;
    const icon=getTaskIcon(t.type);
    let h=`<div class="${P}-task-card ${isNsfw?'nsfw':''}">`;
    h+=`<div class="${P}-task-hd">`;
    h+=`<span class="${P}-task-icon">${icon}</span>`;
    h+=`<span class="${P}-task-title">${esc(t.title)}</span>`;
    h+=`<span class="${P}-task-tag ${isNsfw?'nsfw':''}">${esc(t.type)}</span>`;
    h+=`<span class="${P}-task-tag pts">${renderStars(t.star||1)} ${t.points}</span>`;
    h+=`</div>`;
    h+=`<div class="${P}-task-desc">${esc(t.desc)}</div>`;
    if(t.targetNpc){
        h+=`<div style="font-size:11px;color:var(--sp-purple);margin-bottom:2px;display:flex;align-items:center;gap:4px">${IC.target} ${esc(t.targetNpc)}</div>`;
    }
    h+=`<div class="${P}-task-acts">`;
    if(mode==='pool'){
        h+=`<button class="${P}-task-btn accept" data-act="accept-task" data-tid="${t.id}">${IC.plus} 接取</button>`;
    }else if(mode==='active'){
        h+=`<button class="${P}-task-btn complete" data-act="complete-task" data-tid="${t.id}">${IC.check} 完成</button>`;
        h+=`<button class="${P}-task-btn abandon" data-act="abandon-task" data-tid="${t.id}">${IC.crossCircle} 放弃</button>`;
    }else if(mode==='done'){
        h+=`<span style="font-size:11px;color:var(--sp-success);display:flex;align-items:center;gap:3px">${IC.checkCircle} 已完成</span>`;
    }
    h+=`</div></div>`;
    return h;
}

/* ===== 任务Tab ===== */
function renderTasksTab() {
    const activeCount=D.tasks.active.length;
    const todayChecked=D.checkin.lastDate===(getWorld().当前日期||'');
    const streak=D.checkin.streak;
    const completedAch=Object.keys(D.achievements.completed).length, totalAch=ACHIEVEMENTS.length;
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">任务</span><div class="${P}-hdr-pts">${IC.coin} ${D.points}</div></div><div class="${P}-pg">`;
    h+=`<div class="${P}-ls">`;
    h+=`<div class="${P}-li" data-act="goto-gen"><div class="${P}-av">${IC.dice}</div><div class="${P}-linfo"><div class="${P}-lnm">生成任务</div><div class="${P}-lsub">随机生成各种任务</div></div><span class="${P}-larr">›</span></div>`;
    h+=`<div class="${P}-li" data-act="goto-active"><div class="${P}-av">${IC.pin}</div><div class="${P}-linfo"><div class="${P}-lnm">进行中</div><div class="${P}-lsub">已接取 ${activeCount}/3</div></div><span class="${P}-larr">›</span></div>`;
    h+=`<div class="${P}-li" data-act="goto-checkin"><div class="${P}-av">${IC.calendar}</div><div class="${P}-linfo"><div class="${P}-lnm">每日签到</div><div class="${P}-lsub">${todayChecked?IC.checkCircle+' 今日已签':IC.crossCircle+' 未签到'} · 连签${streak}天</div></div><span class="${P}-larr">›</span></div>`;
    h+=`<div class="${P}-li" data-act="goto-achieve"><div class="${P}-av">${IC.trophy}</div><div class="${P}-linfo"><div class="${P}-lnm">成就</div><div class="${P}-lsub">${completedAch}/${totalAch} 已完成</div></div><span class="${P}-larr">›</span></div>`;
    h+=`</div>`;
    h+=`<div class="${P}-sec">统计</div><div class="${P}-card">`;
    h+=statChip('当前积分',D.points,'var(--sp-accent)');
    h+=statChip('总获取',D.totalEarned,'var(--sp-success)');
    h+=statChip('总消耗',D.totalSpent,'var(--sp-danger)');
    h+=statChip('已完成任务',D.tasks.completed.length+'个','var(--sp-text-1)');
    h+=`</div></div></div>`;
    return h;
}
function bindTasksTabEvents(el) {
    el.querySelector('[data-act="goto-gen"]')?.addEventListener('click',()=>pushPage('gen-task'));
    el.querySelector('[data-act="goto-active"]')?.addEventListener('click',()=>pushPage('active-task'));
    el.querySelector('[data-act="goto-checkin"]')?.addEventListener('click',()=>pushPage('checkin'));
    el.querySelector('[data-act="goto-achieve"]')?.addEventListener('click',()=>pushPage('achieve'));
}

/* ===== 生成任务子页面 ===== */
let genCount=3, genLoading=false;
function renderGenTaskSub(body) {
    let h=`${navBar('生成任务')}<div class="${P}-pg">`;
    h+=`<div class="${P}-card"><div class="${P}-card-t">${IC.dice} 生成设置</div>`;
    h+=`<div class="${P}-fl">数量</div><div style="display:flex;gap:6px;margin-bottom:12px">`;
    for(let i=1;i<=5;i++){
        h+=`<button class="${P}-btn ${genCount===i?'gn':'gy'} ${P}-bsm" data-act="set-count" data-n="${i}" style="flex:1;padding:8px 0">${i}</button>`;
    }
    h+=`</div>`;
    h+=`<div class="${P}-ls" style="margin:0 0 12px"><div class="${P}-switch-row"><span>${IC.fire} NSFW</span><label class="${P}-sw"><input type="checkbox" data-act="toggle-nsfw" ${D.settings.nsfwEnabled?'checked':''}><span class="${P}-sw-sl"></span></label></div></div>`;
    if(D.settings.nsfwEnabled){
        h+=`<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">`;
        h+=`<button class="${P}-btn gn" data-act="gen-normal" ${!apiOk()||genLoading?'disabled':''}>${genLoading?IC.hourglass+' 生成中...':IC.dice+' 普通任务'}</button>`;
        h+=`<button class="${P}-btn rd" data-act="gen-nsfw" ${!apiOk()||genLoading?'disabled':''}>${genLoading?IC.hourglass+' 生成中...':IC.fire+' NSFW任务'}</button>`;
        h+=`</div>`;
    }else{
        h+=`<button class="${P}-btn gn" data-act="gen-normal" ${!apiOk()||genLoading?'disabled':''} style="margin-bottom:12px">${genLoading?IC.hourglass+' 生成中...':IC.dice+' 生成任务'}</button>`;
    }
    if(!apiOk()) h+=`<div class="${P}-st er">请先在设置中配置API</div>`;
    h+=`</div>`;
    if(D.tasks.pool.length>0){
        h+=`<div class="${P}-sec">任务池 · ${D.tasks.pool.length}</div>`;
        for(const t of D.tasks.pool) h+=renderTaskCard(t,'pool');
    }else if(!genLoading){
        h+=`<div class="${P}-empty"><span>${IC.sparkleLg}</span><span>任务池为空</span><span style="font-size:11px">点击上方按钮生成</span></div>`;
    }
    h+=`</div>`;
    body.innerHTML=h;
    bindGenTaskEvents(body);
}
function bindGenTaskEvents(body) {
    body.querySelector('[data-act="back"]')?.addEventListener('click',popPage);
    body.querySelectorAll('[data-act="set-count"]').forEach(btn=>{
        btn.addEventListener('click',()=>{genCount=parseInt(btn.dataset.n);renderGenTaskSub(body);});
    });
    body.querySelector('[data-act="toggle-nsfw"]')?.addEventListener('change',function(){
        D.settings.nsfwEnabled=this.checked;saveDNow();renderGenTaskSub(body);
    });
    body.querySelector('[data-act="gen-normal"]')?.addEventListener('click',async function(){
        genLoading=true;renderGenTaskSub(body);
        try{const tasks=await generateTasks(genCount);D.tasks.pool.push(...tasks);saveDNow();toast(`${tasks.length}个任务已生成`);}
        catch(e){toast(e.message,'err');}
        genLoading=false;renderGenTaskSub(body);
    });
    body.querySelector('[data-act="gen-nsfw"]')?.addEventListener('click',async function(){
        genLoading=true;renderGenTaskSub(body);
        try{const tasks=await generateNsfwTasks(genCount);D.tasks.pool.push(...tasks);saveDNow();toast(`${tasks.length}个NSFW任务已生成`);}
        catch(e){toast(e.message,'err');}
        genLoading=false;renderGenTaskSub(body);
    });
    body.querySelectorAll('[data-act="accept-task"]').forEach(btn=>{
        btn.addEventListener('click',()=>{if(acceptTask(btn.dataset.tid)){toast('任务已接取');renderGenTaskSub(body);}});
    });
}

/* ===== 进行中子页面 ===== */
function renderActiveSub(body) {
    let h=`${navBar('进行中 ('+D.tasks.active.length+'/3)')}<div class="${P}-pg">`;
    if(D.tasks.active.length===0){
        h+=`<div class="${P}-empty"><span>${IC.sparkleLg}</span><span>暂无进行中的任务</span><span style="font-size:11px">去任务池接取任务</span></div>`;
    }else{
        for(const t of D.tasks.active) h+=renderTaskCard(t,'active');
    }
    if(D.tasks.completed.length>0){
        h+=`<div class="${P}-sec">已完成 · ${D.tasks.completed.length}</div>`;
        const recent=D.tasks.completed.slice(-8).reverse();
        for(const t of recent) h+=`<div style="opacity:.5">${renderTaskCard(t,'done')}</div>`;
    }
    h+=`</div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]')?.addEventListener('click',popPage);
    body.querySelectorAll('[data-act="complete-task"]').forEach(btn=>{
        btn.addEventListener('click',async()=>{
            const tid=btn.dataset.tid;
            const task=D.tasks.active.find(t=>t.id===tid); if(!task) return;
            btn.disabled=true; btn.innerHTML=IC.hourglass+' 验证中...';
            const result=await verifyTaskCompletion(task);
            if(result.completed){if(completeTask(tid))renderActiveSub(body);}
            else{toast(`任务未完成：${result.reason}`,'warn');btn.disabled=false;btn.innerHTML=IC.check+' 完成';}
        });
    });
    body.querySelectorAll('[data-act="abandon-task"]').forEach(btn=>{
        btn.addEventListener('click',()=>{if(abandonTask(btn.dataset.tid)){toast('已放弃','warn');renderActiveSub(body);}});
    });
}

/* ===== 签到子页面 ===== */
let checkinLoading=false;
function renderCheckinSub(body) {
    const world=getWorld(), todayStr=world.当前日期||'未知', streak=D.checkin.streak;
    const checked=canCheckin(), alreadyChecked=!checked.can&&checked.reason==='今天已签到';
    const todayDay=alreadyChecked?streak:streak+1;
    const todayReward=CHECKIN_REWARDS[todayDay>30?1:todayDay]||10;
    const isBonus=CHECKIN_BONUS_DAYS.includes(todayDay>30?1:todayDay);

    let h=`${navBar('每日签到')}<div class="${P}-pg">`;
    h+=`<div class="${P}-card" style="text-align:center">`;
    h+=`<div style="font-size:12px;color:var(--sp-text-3);margin-bottom:4px">游戏日期</div>`;
    h+=`<div style="font-size:17px;font-weight:700;color:var(--sp-accent);margin-bottom:12px">${esc(todayStr)}</div>`;
    h+=`<div style="display:flex;justify-content:center;gap:28px;margin-bottom:14px">`;
    h+=`<div><div style="font-size:22px;font-weight:700;color:var(--sp-text-1)">${streak}</div><div style="font-size:11px;color:var(--sp-text-3)">连签</div></div>`;
    h+=`<div><div style="font-size:22px;font-weight:700;color:var(--sp-warning)">${todayReward}</div><div style="font-size:11px;color:var(--sp-text-3)">积分</div></div>`;
    h+=`</div>`;
    if(alreadyChecked){
        h+=`<button class="${P}-btn gy" disabled style="opacity:.4">${IC.checkCircle} 今日已签到</button>`;
    }else if(checked.can){
        h+=`<button class="${P}-btn gn" data-act="do-checkin" ${checkinLoading?'disabled':''}>${checkinLoading?IC.hourglass+' 签到中...':IC.calendar+' 签到 +'+todayReward}</button>`;
    }else{
        h+=`<div class="${P}-st er">${esc(checked.reason)}</div>`;
    }
    if(isBonus&&!alreadyChecked){
        h+=`<div style="margin-top:6px;font-size:12px;color:var(--sp-purple);display:flex;align-items:center;justify-content:center;gap:4px">${IC.gift} 第${todayDay}天大奖: ${CHECKIN_BONUS_RARITY[todayDay]||'紫'}级物品</div>`;
    }
    h+=`</div>`;

    h+=`<div class="${P}-ls" style="margin-bottom:6px"><div class="${P}-switch-row"><span>自动签到</span><label class="${P}-sw"><input type="checkbox" data-act="toggle-auto-checkin" ${D.settings.autoCheckin?'checked':''}><span class="${P}-sw-sl"></span></label></div></div>`;

    h+=`<div class="${P}-sec">签到日历</div><div class="${P}-card">`;
    h+=`<div class="${P}-checkin-cal">`;
    for(let d=1;d<=30;d++){
        const isDone=d<=streak||(alreadyChecked&&d<=streak);
        const isToday=d===(alreadyChecked?streak:streak+1);
        const isBonusDay=CHECKIN_BONUS_DAYS.includes(d);
        let cls=`${P}-cal-day`;
        if(isDone) cls+=' done'; if(isToday) cls+=' today'; if(isBonusDay) cls+=' bonus';
        h+=`<div class="${cls}">${d}</div>`;
    }
    h+=`</div>`;
    h+=`<div style="display:flex;gap:12px;font-size:10px;color:var(--sp-text-3);margin-top:6px;justify-content:center">`;
    h+=`<span style="display:flex;align-items:center;gap:3px"><span class="${P}-legend-dot" style="background:var(--sp-accent)"></span>已签</span>`;
    h+=`<span style="display:flex;align-items:center;gap:3px"><span class="${P}-legend-dot" style="background:var(--sp-purple)"></span>大奖</span>`;
    h+=`<span style="display:flex;align-items:center;gap:3px"><span class="${P}-legend-dot" style="background:var(--sp-border2)"></span>未签</span>`;
    h+=`</div></div>`;

    h+=`<div class="${P}-sec">奖励说明</div><div class="${P}-card" style="font-size:12px;line-height:1.8;color:var(--sp-text-2)">`;
    h+=`第1-6天: 每天10积分<br>`;
    h+=`<span style="color:var(--sp-purple)">第7天: 30积分 + 紫级物品</span><br>`;
    h+=`第8-13天: 每天15积分<br>`;
    h+=`<span style="color:var(--sp-purple)">第14天: 40积分 + 紫级物品</span><br>`;
    h+=`第15-20天: 每天20积分<br>`;
    h+=`<span style="color:var(--sp-purple)">第21天: 50积分 + 紫级物品</span><br>`;
    h+=`第22-29天: 每天25积分<br>`;
    h+=`<span style="color:var(--sp-text-1);font-weight:600">第30天: 100积分 + 黑级物品 · 重置</span>`;
    h+=`</div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]')?.addEventListener('click',popPage);
    body.querySelector('[data-act="toggle-auto-checkin"]')?.addEventListener('change',function(){D.settings.autoCheckin=this.checked;saveDNow();});
    body.querySelector('[data-act="do-checkin"]')?.addEventListener('click',async function(){
        checkinLoading=true;renderCheckinSub(body);
        const result=doCheckin();
        if(result){
            toast(`签到成功！+${result.points}积分 (第${result.day}天)`);
            if(result.isBonus&&apiOk()){toast('正在生成大奖物品...','info');const bi=await generateCheckinBonus(result.day);if(bi)toast(`获得${bi.rarity}级: ${bi.name}`);}
        }
        checkinLoading=false;renderCheckinSub(body);
    });
}

/* ===== 成就子页面 ===== */
function renderAchieveSub(body) {
    const newOnes=checkAchievements();
    if(newOnes.length>0) for(const a of newOnes) toast(`${a.name} (+${a.points}积分)`);
    const completedCount=Object.keys(D.achievements.completed).length;
    const pctW=ACHIEVEMENTS.length>0?(completedCount/ACHIEVEMENTS.length*100).toFixed(1):0;
    let h=`${navBar('成就')}<div class="${P}-pg">`;
    h+=`<div class="${P}-card" style="text-align:center">`;
    h+=`<div style="margin-bottom:6px;color:var(--sp-warning)">${IC.trophyLg}</div>`;
    h+=`<div style="font-size:17px;font-weight:700;color:var(--sp-text-1)">${completedCount} / ${ACHIEVEMENTS.length}</div>`;
    h+=`<div style="font-size:11px;color:var(--sp-text-3);margin-top:2px">已完成</div>`;
    h+=`<div style="width:100%;height:4px;background:var(--sp-bar-bg);border-radius:2px;margin-top:10px;overflow:hidden"><div style="width:${pctW}%;height:100%;background:var(--sp-accent);border-radius:2px;transition:width .5s"></div></div>`;
    h+=`</div>`;
    h+=`<div style="text-align:right;padding:2px 0"><button class="${P}-btn gy ${P}-bsm" data-act="refresh-ach">${IC.refresh} 刷新</button></div>`;
    h+=`<div class="${P}-ls">`;
    for(const ach of ACHIEVEMENTS){
        const done=!!D.achievements.completed[ach.id];
        h+=`<div class="${P}-ach-item">`;
        h+=`<div class="${P}-ach-chk ${done?'done':''}">${done?IC.check:''}</div>`;
        h+=`<div class="${P}-ach-info"><div class="${P}-ach-name ${done?'done':''}">${esc(ach.name)}</div></div>`;
        h+=`<div class="${P}-ach-pts">${done?'<span style="color:var(--sp-success)">'+IC.checkCircle+'</span>':ach.points}</div>`;
        h+=`</div>`;
    }
    h+=`</div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]')?.addEventListener('click',popPage);
    body.querySelector('[data-act="refresh-ach"]')?.addEventListener('click',()=>{renderAchieveSub(body);toast('已刷新');});
}

/* ===== 抽奖Tab ===== */
function renderGachaTab() {
    const pity=D.gacha.pity||0, pityPct=Math.min(pity/50*100,100);
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">抽奖</span><div class="${P}-hdr-pts">${IC.coin} ${D.points}</div></div><div class="${P}-pg">`;
    h+=`<div class="${P}-gacha-area">`;
    h+=`<div class="${P}-gacha-orb" id="${P}-orb">${IC.sparkleLg}</div>`;
    h+=`<div style="font-size:12px;color:var(--sp-text-3);margin-bottom:14px">消耗积分，获得诸天万界物品</div>`;
    h+=`<div style="display:flex;flex-direction:column;gap:8px;max-width:200px;margin:0 auto 14px">`;
    h+=`<button class="${P}-btn gn" data-act="pull-1" ${!apiOk()||D.points<50||gachaSpinning?'disabled':''} style="padding:10px 0;font-size:13px">${IC.sparkleSm} 单抽 · 50积分</button>`;
    h+=`<button class="${P}-btn gy" data-act="pull-10" ${!apiOk()||D.points<450||gachaSpinning?'disabled':''} style="padding:10px 0;font-size:13px">${IC.sparkleSm} 十连 · 450积分</button>`;
    h+=`</div>`;
    h+=`<div style="max-width:200px;margin:0 auto">`;
    h+=`<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--sp-text-3);margin-bottom:2px"><span>保底进度</span><span>${pity}/50</span></div>`;
    h+=`<div style="width:100%;height:3px;background:var(--sp-bar-bg);border-radius:2px;overflow:hidden"><div style="width:${pityPct}%;height:100%;background:var(--sp-purple);border-radius:2px;transition:width .5s"></div></div>`;
    h+=`</div>`;
    if(!apiOk()) h+=`<div class="${P}-st er" style="margin-top:8px">请先配置API</div>`;
    h+=`</div>`;

    if(gachaResults.length>0){
        if(gachaMode==='single'){
            h+=renderGachaResultCard(gachaResults[0]);
        }else{
            h+=`<div class="${P}-sec">十连结果</div><div class="${P}-ten-grid">`;
            for(let i=0;i<gachaResults.length;i++){
                const item=gachaResults[i], c=getRarityColor(item.rarity);
                h+=`<div class="${P}-ten-cell" style="border-color:${c}44;animation-delay:${i*60}ms" data-act="show-ten-detail" data-idx="${i}">`;
                h+=`<span class="cell-icon" style="color:${c}">${IC.packageLg}</span>`;
                h+=`<span class="cell-name">${esc(item.name)}</span>`;
                h+=`</div>`;
            }
            h+=`</div>`;
        }
    }

    if(D.gacha.history.length>0){
        h+=`<div class="${P}-sec">最近记录</div><div class="${P}-ls">`;
        const recent=D.gacha.history.slice(0,12);
        for(const item of recent){
            const c=getRarityColor(item.rarity);
            h+=`<div class="${P}-li" style="cursor:default;padding:10px 14px">`;
            h+=`<div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${c}18;border:1px solid ${c}33;flex-shrink:0;color:${c}">${IC.package}</div>`;
            h+=`<div class="${P}-linfo"><div class="${P}-lnm" style="font-size:13px">${esc(item.name)}</div><div class="${P}-lsub">${esc(item.source||'')}</div></div>`;
            h+=`<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${c}18;color:${c};border:1px solid ${c}33">${esc(item.rarity)}</span>`;
            h+=`</div>`;
        }
        h+=`</div>`;
    }
    h+=`<div style="text-align:center;padding:10px;font-size:10px;color:var(--sp-text-3)">50抽保底紫+ · 十连至少一紫 · 已抽${D.gacha.totalPulls}次</div>`;
    h+=`</div></div>`;
    return h;
}
function renderGachaResultCard(item) {
    const c=getRarityColor(item.rarity), tc=getRarityTextColor(item.rarity);
    let h=`<div class="${P}-gacha-result" style="border-color:${c}44">`;
    h+=`<span class="${P}-gacha-rarity" style="background:${c};color:${tc}">${esc(item.rarity)}级</span>`;
    h+=`<div class="${P}-gacha-name"><span style="color:${c}">${IC.package}</span> ${esc(item.name)}</div>`;
    h+=`<div class="${P}-gacha-desc">${esc(item.desc)}</div>`;
    h+=`<div class="${P}-gacha-src">来源: ${esc(item.source||'未知')}</div>`;
    h+=`</div>`;
    return h;
}

/* ===== 背包Tab ===== */
let invFilter='全部';
function getInvCategories() {
    const cats=new Set(['全部']); D.inventory.forEach(i=>{if(i.rarity)cats.add(i.rarity);});
    return ['全部','白','黄','紫','黑','红','金'].filter(c=>cats.has(c));
}
function renderBagTab() {
    const cats=getInvCategories();
    const items=invFilter==='全部'?D.inventory:D.inventory.filter(i=>i.rarity===invFilter);
    const totalCount=D.inventory.reduce((s,i)=>s+(i.count||1),0);
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">背包</span><div class="${P}-hdr-pts">${IC.coin} ${D.points}</div></div><div class="${P}-pg">`;
    h+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 2px"><span style="font-size:12px;color:var(--sp-text-3)">物品 ${D.inventory.length}种 · ${totalCount}个</span></div>`;
    h+=`<div class="${P}-inv-filter">`;
    for(const f of cats){
        const c=f==='全部'?'':getRarityColor(f);
        const style=invFilter===f&&f!=='全部'?`border-color:${c};color:${c};background:${c}15`:'';
        h+=`<button class="${P}-inv-fbtn ${invFilter===f?'on':''}" data-act="inv-filter" data-f="${f}" style="${style}">${f}</button>`;
    }
    h+=`</div>`;
    if(items.length===0){
        h+=`<div class="${P}-empty"><span style="color:var(--sp-text-3)">${IC.packageLg}</span><span>${D.inventory.length===0?'背包空空如也':'当前筛选无结果'}</span></div>`;
    }else{
        h+=`<div class="${P}-inv-grid">`;
        for(const item of items){
            const c=getRarityColor(item.rarity), cnt=item.count||1;
            h+=`<div class="${P}-inv-cell" data-act="show-item" data-iname="${esc(item.name)}" style="border-color:${c}33">`;
            if(cnt>1) h+=`<div class="${P}-inv-cnt-badge">${cnt}</div>`;
            h+=`<div class="cell-icon" style="color:${c}">${IC.packageLg}</div>`;
            h+=`<div class="cell-name">${esc(item.name)}</div>`;
            h+=`</div>`;
        }
        h+=`</div>`;
    }
    h+=`</div>`;
    h+=`<div class="${P}-modal-bg" id="${P}-item-modal"><div class="${P}-modal-box">`;
    h+=`<div class="${P}-modal-head"><span class="${P}-modal-name" id="${P}-im-name"></span><button class="${P}-modal-x" data-act="close-item-modal">✕</button></div>`;
    h+=`<div class="${P}-modal-body" id="${P}-im-body"></div>`;
    h+=`</div></div></div>`;
    return h;
}
function showItemModal(el,name) {
    const item=D.inventory.find(i=>i.name===name); if(!item) return;
    const c=getRarityColor(item.rarity), tc=getRarityTextColor(item.rarity);
    const nameEl=el.querySelector(`#${P}-im-name`), bodyEl=el.querySelector(`#${P}-im-body`);
    if(!nameEl||!bodyEl) return;
    nameEl.textContent=item.name;
    let h=`<div style="text-align:center;margin:8px 0;color:${c}">${IC.sparkleLg}</div>`;
    h+=`<div style="text-align:center;margin-bottom:12px"><span class="${P}-gacha-rarity" style="background:${c};color:${tc}">${esc(item.rarity)}级</span></div>`;
    h+=`<div class="${P}-modal-field"><div class="${P}-modal-label">描述</div><div class="${P}-modal-val">${esc(item.desc||'无描述')}</div></div>`;
    h+=`<div class="${P}-modal-field"><div class="${P}-modal-label">数量</div><div class="${P}-modal-val">${item.count||1}</div></div>`;
    if(item.source) h+=`<div class="${P}-modal-field"><div class="${P}-modal-label">来源</div><div class="${P}-modal-val">${esc(item.source)}</div></div>`;
    if(item.obtainedAt) h+=`<div class="${P}-modal-field"><div class="${P}-modal-label">获得时间</div><div class="${P}-modal-val">${new Date(item.obtainedAt).toLocaleString()}</div></div>`;
    bodyEl.innerHTML=h;
    el.querySelector(`#${P}-item-modal`).classList.add('open');
}

/* ===== 设置Tab ===== */
function renderSettingsTab() {
    let h=`<div class="${P}-main"><div class="${P}-hdr"><span class="${P}-hdr-t">设置</span></div><div class="${P}-pg">`;
    h+=`<div class="${P}-sec">外观</div><div class="${P}-ls"><div class="${P}-switch-row"><span>${curTheme==='dark'?'深色模式':'浅色模式'}</span><label class="${P}-sw"><input type="checkbox" data-act="toggle-theme" ${curTheme==='light'?'checked':''}><span class="${P}-sw-sl"></span></label></div></div>`;
    h+=`<div class="${P}-sec">API</div><div class="${P}-ls">`;
    h+=`<div class="${P}-li" style="cursor:default;flex-wrap:wrap"><div class="${P}-linfo" style="width:100%"><div class="${P}-fl">地址</div><input class="${P}-inp" id="${P}-s-url" placeholder="https://api.example.com" value="${esc(api.url)}" style="margin-top:4px"></div></div>`;
    h+=`<div class="${P}-li" style="cursor:default;flex-wrap:wrap"><div class="${P}-linfo" style="width:100%"><div class="${P}-fl">密钥</div><input class="${P}-inp" id="${P}-s-key" type="password" placeholder="sk-..." value="${esc(api.key)}" style="margin-top:4px"></div></div>`;
    h+=`<div class="${P}-li" style="cursor:default;flex-wrap:wrap"><div class="${P}-linfo" style="width:100%"><div class="${P}-fl">模型</div><select class="${P}-sel" id="${P}-s-model" style="margin-top:4px">${api.models.length?api.models.map(m=>`<option value="${esc(m)}" ${m===api.model?'selected':''}>${esc(m)}</option>`).join(''):(api.model?`<option value="${esc(api.model)}" selected>${esc(api.model)}</option>`:'<option value="">获取模型列表</option>')}</select></div></div>`;
    h+=`</div>`;
    h+=`<div style="padding:6px 0;display:flex;gap:6px"><button class="${P}-btn gy ${P}-bsm" id="${P}-s-fetch">${IC.signal} 获取</button><button class="${P}-btn gy ${P}-bsm" id="${P}-s-test">${IC.test} 测试</button><button class="${P}-btn gn ${P}-bsm" id="${P}-s-save">${IC.save} 保存</button></div>`;
    h+=`<div id="${P}-s-st" class="${P}-st" style="display:none;margin:0"></div>`;
    h+=`<div class="${P}-sec">预设</div><div class="${P}-ls"><div class="${P}-li" data-act="preset-manage"><div class="${P}-av">${IC.preset}</div><div class="${P}-linfo"><div class="${P}-lnm">Prompt预设</div><div class="${P}-lsub">管理生成预设</div></div><span class="${P}-larr">›</span></div></div>`;
    h+=`<div class="${P}-sec">数据</div><div class="${P}-ls">`;
    h+=`<div class="${P}-li" data-act="s-export"><div class="${P}-av">${IC.download}</div><div class="${P}-linfo"><div class="${P}-lnm">导出</div><div class="${P}-lsub">备份所有数据</div></div><span class="${P}-larr">›</span></div>`;
    h+=`<div class="${P}-li" data-act="s-import"><div class="${P}-av">${IC.upload}</div><div class="${P}-linfo"><div class="${P}-lnm">导入</div><div class="${P}-lsub">从备份恢复</div></div><span class="${P}-larr">›</span></div>`;
    h+=`<div class="${P}-li" data-act="s-clear-all"><div class="${P}-av" style="color:var(--sp-danger);background:rgba(255,69,58,.1)">${IC.trash}</div><div class="${P}-linfo"><div class="${P}-lnm" style="color:var(--sp-danger)">清空数据</div><div class="${P}-lsub">删除所有记录</div></div><span class="${P}-larr">›</span></div>`;
    h+=`</div>`;
    h+=`<div class="${P}-sec">状态</div><div class="${P}-ls">`;
    h+=`<div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">API</div></div><span style="color:${apiOk()?'var(--sp-success)':'var(--sp-danger)'};font-size:13px;display:flex;align-items:center;gap:4px">${apiOk()?IC.checkCircle+' 已连接':IC.crossCircle+' 未配置'}</span></div>`;
    h+=`<div class="${P}-li" style="cursor:default"><div class="${P}-linfo"><div class="${P}-lnm">版本</div></div><span style="color:var(--sp-text-3);font-size:13px">v${VERSION}</span></div>`;
    h+=`</div><div style="height:12px"></div></div></div>`;
    return h;
}

/* ===== 预设管理 ===== */
function renderPresetManageSub(body) {
    const pd=loadPresets(), activeId=pd.activeId;
    let h=`${navBar('预设管理')}<div class="${P}-pg">`;
    h+=`<div class="${P}-sec">预设列表</div><div class="${P}-ls">`;
    for(const p of pd.list){
        const isActive=p.id===activeId, isDefault=p.id==='default_system';
        h+=`<div class="${P}-li" data-act="select-preset" data-pid="${esc(p.id)}">`;
        h+=`<div class="${P}-ach-chk ${isActive?'done':''}">${isActive?IC.check:''}</div>`;
        h+=`<div class="${P}-linfo"><div class="${P}-lnm">${esc(p.name)}</div><div class="${P}-lsub">${esc(p.author||'自定义')}</div></div>`;
        h+=`<button class="${P}-btn gy ${P}-bsm" data-act="edit-preset" data-pid="${esc(p.id)}" style="width:auto;padding:5px 8px;font-size:11px">${IC.edit}</button>`;
        if(!isDefault) h+=`<button class="${P}-btn rd ${P}-bsm" data-act="delete-preset" data-pid="${esc(p.id)}" style="width:auto;padding:5px 8px;font-size:11px">${IC.trash}</button>`;
        h+=`</div>`;
    }
    h+=`</div>`;
    h+=`<div style="padding:14px 0"><button class="${P}-btn gn" data-act="new-preset">${IC.plus} 新建预设</button></div>`;
    h+=`</div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]')?.addEventListener('click',popPage);
    body.querySelectorAll('[data-act="select-preset"]').forEach(btn=>{
        btn.addEventListener('click',e=>{
            if(e.target.closest('[data-act="edit-preset"]')||e.target.closest('[data-act="delete-preset"]'))return;
            pd.activeId=btn.dataset.pid;savePresets(pd);renderPresetManageSub(body);toast('预设已切换');
        });
    });
    body.querySelectorAll('[data-act="edit-preset"]').forEach(btn=>{
        btn.addEventListener('click',e=>{e.stopPropagation();pushPage('preset-edit',{presetId:btn.dataset.pid});});
    });
    body.querySelectorAll('[data-act="delete-preset"]').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.stopPropagation(); if(!confirm('确定删除？'))return;
            pd.list=pd.list.filter(x=>x.id!==btn.dataset.pid);
            if(pd.activeId===btn.dataset.pid)pd.activeId='default_system';
            savePresets(pd);renderPresetManageSub(body);toast('已删除');
        });
    });
    body.querySelector('[data-act="new-preset"]')?.addEventListener('click',()=>{
        const newP={...DEFAULT_PRESET,id:`preset_${uid()}`,name:'新预设',author:'自定义'};
        const d=loadPresets();d.list.push(newP);savePresets(d);
        pushPage('preset-edit',{presetId:newP.id});
    });
}
function renderPresetEditSub(body) {
    const pd=loadPresets(), pid=navData.presetId;
    const preset=pd.list.find(x=>x.id===pid); if(!preset){popPage();return;}
    const fields=[
        {key:'name',label:'名称',type:'input'},{key:'author',label:'作者',type:'input'},
        {key:'taskPrompt',label:'任务生成Prompt',type:'ta'},
        {key:'nsfwTaskPrompt',label:'NSFW任务Prompt',type:'ta'},
        {key:'taskVerifyPrompt',label:'任务验证Prompt',type:'ta'},
        {key:'gachaPrompt',label:'单抽Prompt',type:'ta'},
        {key:'gachaBatchPrompt',label:'十连Prompt',type:'ta'},
        {key:'checkinRewardPrompt',label:'签到奖励Prompt',type:'ta'},
    ];
    let h=`${navBar('编辑预设')}<div class="${P}-pg"><div class="${P}-form">`;
    for(const f of fields){
        h+=`<div class="${P}-fg"><div class="${P}-fl">${f.label}</div>`;
        if(f.type==='input') h+=`<input class="${P}-inp" data-field="${f.key}" value="${esc(preset[f.key]||'')}">`;
        else h+=`<textarea class="${P}-ta" data-field="${f.key}" style="min-height:90px;font-size:12px">${esc(preset[f.key]||'')}</textarea>`;
        h+=`</div>`;
    }
    h+=`<button class="${P}-btn gn" id="${P}-pe-save">${IC.save} 保存</button>`;
    h+=`</div></div>`;
    body.innerHTML=h;
    body.querySelector('[data-act="back"]')?.addEventListener('click',popPage);
    body.querySelector(`#${P}-pe-save`)?.addEventListener('click',()=>{
        for(const f of fields){const el=body.querySelector(`[data-field="${f.key}"]`);if(el)preset[f.key]=el.value;}
        savePresets(pd);toast('已保存');popPage();
    });
}

/* ===== render 主函数 ===== */
function render() {
    const body=qsel(`#${P}-body`); if(!body) return;
    const sub=curPage();
    if(sub){renderSub(body,sub);applyTheme();return;}
    body.innerHTML=renderTab(curTab)+renderTabBar();
    bindTab(body); applyTheme();
}
function renderTabBar() {
    const tabs=[['tasks',IC.task,'任务'],['gacha',IC.gacha,'抽奖'],['bag',IC.bag,'背包'],['settings',IC.gear,'设置']];
    return `<div class="${P}-tab-bar">${tabs.map(([k,ic,nm])=>`<div class="${P}-tab-item ${curTab===k?'on':''}" data-tab="${k}"><span class="ico">${ic}</span>${nm}</div>`).join('')}</div>`;
}
function renderTab(tab) {
    if(tab==='tasks') return renderTasksTab();
    if(tab==='gacha') return renderGachaTab();
    if(tab==='bag') return renderBagTab();
    if(tab==='settings') return renderSettingsTab();
    return '';
}
function renderSub(body,page) {
    if(page==='gen-task'){renderGenTaskSub(body);return;}
    if(page==='active-task'){renderActiveSub(body);return;}
    if(page==='checkin'){renderCheckinSub(body);return;}
    if(page==='achieve'){renderAchieveSub(body);return;}
    if(page==='preset-manage'){renderPresetManageSub(body);return;}
    if(page==='preset-edit'){renderPresetEditSub(body);return;}
}
function bindTab(el) {
    el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{curTab=b.dataset.tab;render();}));
    bindTasksTabEvents(el); bindGachaTabEvents(el); bindBagTabEvents(el); bindSettingsTabEvents(el);
}

/* ===== 抽奖事件 ===== */
function bindGachaTabEvents(el) {
    el.querySelector('[data-act="pull-1"]')?.addEventListener('click',async function(){
        if(gachaSpinning)return;
        gachaSpinning=true;gachaMode='single';gachaResults=[];
        const orb=el.querySelector(`#${P}-orb`); if(orb) startSpinAnimation(orb);
        this.disabled=true;
        try{const item=await doSinglePull();gachaResults=[item];if(orb)stopSpinAnimation(orb,item.rarity);await new Promise(r=>setTimeout(r,600));}
        catch(e){toast(e.message,'err');}
        gachaSpinning=false;render();
    });
    el.querySelector('[data-act="pull-10"]')?.addEventListener('click',async function(){
        if(gachaSpinning)return;
        gachaSpinning=true;gachaMode='ten';gachaResults=[];
        const orb=el.querySelector(`#${P}-orb`); if(orb) startSpinAnimation(orb);
        this.disabled=true; toast('十连抽奖中...','info');
        try{
            const items=await doTenPull(); gachaResults=items;
            const best=items.reduce((a,b)=>{
                const ai=RARITY_TABLE.findIndex(r=>r.name===a.rarity);
                const bi=RARITY_TABLE.findIndex(r=>r.name===b.rarity);
                return bi>ai?b:a;
            });
            if(orb) stopSpinAnimation(orb,best.rarity); await new Promise(r=>setTimeout(r,600));
        }catch(e){toast(e.message,'err');}
        gachaSpinning=false;render();
    });
    el.querySelectorAll('[data-act="show-ten-detail"]').forEach(btn=>{
        btn.addEventListener('click',()=>{
            const idx=parseInt(btn.dataset.idx), item=gachaResults[idx]; if(!item)return;
            const modal=el.querySelector(`#${P}-item-modal`);
            if(!modal){toast(`${item.name} (${item.rarity}级) - ${item.desc}`);return;}
            const c=getRarityColor(item.rarity), tc=getRarityTextColor(item.rarity);
            const nameEl=el.querySelector(`#${P}-im-name`), bodyEl=el.querySelector(`#${P}-im-body`);
            if(nameEl) nameEl.textContent=item.name;
            if(bodyEl){
                let h=`<div style="text-align:center;margin:8px 0;color:${c}">${IC.sparkleLg}</div>`;
                h+=`<div style="text-align:center;margin-bottom:12px"><span class="${P}-gacha-rarity" style="background:${c};color:${tc}">${esc(item.rarity)}级</span></div>`;
                h+=`<div class="${P}-modal-field"><div class="${P}-modal-label">描述</div><div class="${P}-modal-val">${esc(item.desc||'无')}</div></div>`;
                if(item.source) h+=`<div class="${P}-modal-field"><div class="${P}-modal-label">来源</div><div class="${P}-modal-val">${esc(item.source)}</div></div>`;
                bodyEl.innerHTML=h;
            }
            modal.classList.add('open');
        });
    });
}

/* ===== 背包事件 ===== */
function bindBagTabEvents(el) {
    el.querySelectorAll('[data-act="inv-filter"]').forEach(btn=>{
        btn.addEventListener('click',()=>{invFilter=btn.dataset.f;render();});
    });
    el.querySelectorAll('[data-act="show-item"]').forEach(cell=>{
        cell.addEventListener('click',()=>{showItemModal(el,cell.dataset.iname);});
    });
    el.querySelector('[data-act="close-item-modal"]')?.addEventListener('click',()=>{
        el.querySelector(`#${P}-item-modal`)?.classList.remove('open');
    });
    el.querySelector(`#${P}-item-modal`)?.addEventListener('click',function(e){
        if(e.target===this) this.classList.remove('open');
    });
}

/* ===== 设置事件 ===== */
function bindSettingsTabEvents(el) {
    el.querySelector('[data-act="toggle-theme"]')?.addEventListener('change',toggleTheme);
    el.querySelector('[data-act="preset-manage"]')?.addEventListener('click',()=>pushPage('preset-manage'));
    el.querySelector('[data-act="s-export"]')?.addEventListener('click',exportData);
    el.querySelector('[data-act="s-import"]')?.addEventListener('click',importData);
    el.querySelector('[data-act="s-clear-all"]')?.addEventListener('click',()=>{
        if(confirm('确定清空全部数据？')){
            D={points:0,totalEarned:0,totalSpent:0,checkin:{lastDate:'',streak:0,history:[]},tasks:{pool:[],active:[],completed:[]},gacha:{history:[],totalPulls:0,pity:0},achievements:{completed:{}},inventory:[],settings:{nsfwEnabled:false,autoCheckin:false}};
            saveDNow();render();toast('数据已清空');
        }
    });
    const stEl=el.querySelector(`#${P}-s-st`);
    const showSt=(c,m)=>{if(!stEl)return;stEl.style.display='block';stEl.className=`${P}-st ${c}`;stEl.textContent=m;};
    el.querySelector(`#${P}-s-fetch`)?.addEventListener('click',async function(){
        const url=el.querySelector(`#${P}-s-url`).value.trim(),key=el.querySelector(`#${P}-s-key`).value.trim();
        if(!url){showSt('er','请填写API地址');return;}
        this.disabled=true;showSt('in','获取中...');
        try{const models=await fetchModels(url,key);if(!models.length){showSt('er','未找到模型');this.disabled=false;return;}
        const sel=el.querySelector(`#${P}-s-model`);sel.innerHTML=models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('');
        if(api.model&&models.includes(api.model))sel.value=api.model;api.models=models;showSt('ok',`找到 ${models.length} 个模型`);}
        catch(e){showSt('er',e.message);}this.disabled=false;
    });
    el.querySelector(`#${P}-s-test`)?.addEventListener('click',async function(){
        const url=el.querySelector(`#${P}-s-url`).value.trim(),key=el.querySelector(`#${P}-s-key`).value.trim(),model=el.querySelector(`#${P}-s-model`).value;
        if(!url||!model){showSt('er','请填写地址并选择模型');return;}
        this.disabled=true;showSt('in','测试中...');
        const old={u:api.url,k:api.key,m:api.model};api.url=url;api.key=key;api.model=model;
        try{const r=await apiChat([{role:'user',content:'回复OK两个字母。'}],50);showSt('ok',r.substring(0,30));}
        catch(e){showSt('er',e.message);api.url=old.u;api.key=old.k;api.model=old.m;}this.disabled=false;
    });
    el.querySelector(`#${P}-s-save`)?.addEventListener('click',()=>{
        api.url=el.querySelector(`#${P}-s-url`).value.trim();api.key=el.querySelector(`#${P}-s-key`).value.trim();api.model=el.querySelector(`#${P}-s-model`).value;
        if(!api.url){showSt('er','地址不能为空');return;}if(!api.model){showSt('er','请选择模型');return;}
        saveApi();showSt('ok',`已保存 · ${api.model}`);
    });
}

/* ===== 初始化 ===== */
function init() {
    log(`系统面板 v${VERSION} 初始化`);
    const doc=getDoc();
    doc.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());
    if(doc!==document) try{document.querySelectorAll(`#${P}-trigger,#${P}-overlay,#${P}-css`).forEach(e=>e.remove());}catch{}
    loadApi();loadD();loadTheme();
    navStack.length=0;curTab='tasks';navData={};
    gachaResults=[];gachaMode='';invFilter='全部';
    doc.head.insertAdjacentHTML('beforeend',CSS);
    doc.body.insertAdjacentHTML('beforeend',HTML);
    window.__syspActive=true;
    const trigger=doc.getElementById(`${P}-trigger`);
    const overlay=doc.getElementById(`${P}-overlay`);
    const phone=doc.getElementById(`${P}-phone`);
    const W=(window.top||window).innerWidth, H=(window.top||window).innerHeight;
    phone.style.left=Math.max(10,(W/2-190))+'px';
    phone.style.top=Math.max(10,(H/2-375))+'px';
    initDrag(trigger,{onClick:()=>{
        overlay.classList.toggle('show');
        if(overlay.classList.contains('show')){tryAutoCheckin();checkAchievements();render();}
    }});
    initDrag(phone,{handle:`#${P}-drag`});
    overlay.addEventListener('click',e=>{if(e.target===overlay){overlay.classList.remove('show');navStack.length=0;}});
    render();
    log(`系统面板 v${VERSION} 就绪`);
}

/* ===== 启动 ===== */
setupWatcher();
if(isTargetCard()) init();
else{log('当前角色卡不匹配');window.__syspActive=false;}
log(`系统面板 v${VERSION} 已加载`);

})();
