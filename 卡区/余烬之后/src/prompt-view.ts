import type { Schema } from './schema';

/** 可序列化到EJS的独立函数。完整资料留在存档，按场景、查询和手动重点取回。 */
export function projectPromptState(state: Schema, query = '') {
  // 此函数直接序列化进EJS，筛选逻辑保持自包含。
  const hidden=(category:string,id:string):boolean=>{
    if(state._档案整理?.[category+':'+id])return true;
    if(category==='character')return !!state._档案整理?.['entity:'+(state.叙事.人物档案[id]?.实体ID||id)];
    if(category==='entity')return Object.entries(state.叙事.人物档案).some(([key,p])=>(p.实体ID||key)===id && state._档案整理?.['character:'+key]);
    return false;
  };
  const entries = (value: any) => Object.entries(value || {}) as [string, any][];
  const take = (value: any, count: number) => Object.fromEntries(entries(value).slice(-count));
  const text = (value: any, limit = 500) => String(value || '').slice(0, limit);
  const place = state._时空?.当前地点;
  const playerId = state._开局?.主角ID || 'player';
  const player = state._实体?.[playerId];
  const matching = (id: string, name: string) => query.includes(id) || (name?.length > 1 && query.includes(name));
  const dossiers=entries(state.叙事?.人物档案).filter(([id])=>!hidden('character',id));
  const group=(id:string,p:any)=>state._人物分组?.[p?.实体ID||id]||state._人物分组?.[id]||p?.分组||'同伴';
  const present=(p:any)=>p.在场 && p.位面ID===place?.位面ID && (!p.地点ID||p.地点ID===place?.地点ID);
  const linked=(id:string)=>dossiers.find(([key,p])=>(p.实体ID||key)===id);
  const active=(id:string,e:any)=>{
    const pair=linked(id);
    return pair?present(pair[1]):e.位面ID===place?.位面ID && e.地点ID===place?.地点ID;
  };
  const companions=dossiers.filter(([id,p])=>group(id,p)==='同伴');
  const companionEntities=entries(state._实体).filter(([id])=>id!==playerId && !hidden('entity',id) && state._人物分组?.[id]==='同伴');
  const selectedDossiers=[...dossiers.filter(([id,p])=>present(p) || (group(id,p)==='同伴' && (matching(id,p.名称)||p.别名?.some((n:string)=>matching(id,n))))),...companions].filter((entry,index,all)=>all.findIndex(([id])=>id===entry[0])===index).slice(0,8);
  const onsite = entries(state._实体).filter(([id,e])=>id!==playerId && !hidden('entity',id) && e.类别!=='危险源' &&
    (active(id,e)||selectedDossiers.some(([key,p])=>(p.实体ID||key)===id)||companionEntities.some(([key])=>key===id))).slice(0,16);
  const relevant=(id:string)=>{
    if(id===playerId)return true;
    const p=dossiers.find(([key,p])=>key===id||(p.实体ID||key)===id);
    if(p)return group(p[0],p[1])==='同伴'||present(p[1]);
    const e=state._实体?.[id];
    return !e || state._人物分组?.[id]==='同伴'||active(id,e);
  };
  const owned = entries(state._能力).filter(([id]) => player?.能力ID[id] && !hidden('ability',id));
  const picked = new Set([
    ...owned.filter(([id, a]) => matching(id, a.名称)).slice(-6).map(([id]) => id),
    ...(state._查阅?.能力 || []).filter(id=>!hidden('ability',id)),
    ...owned.filter(([, a]) => a.品阶 === '本源' || a.品阶 === '原初本源').map(([id]) => id),
    ...owned.slice(-4).map(([id]) => id),
  ].slice(0, 14));
  const abilities = Object.fromEntries(entries(state._能力).filter(([id]) => !hidden('ability',id)).filter(([id]) => picked.has(id) || onsite.some(([, e]) => e.能力ID[id])).slice(0, 20).map(([id, a]) => [id, {
    名称: a.名称, 品阶: a.品阶, 等级: a.等级, 熟练度: a.熟练度, 进化次数: a.进化次数, 进化方向: a.进化方向,
    来源: { ...a.来源, 说明: text(a.来源?.说明, 300) }, 最近成长: take(a.成长记录, 2),
    用法: a.用法, 规则状态: a.规则状态, 描述: a.描述, 触发条件: a.触发条件, 效果: a.效果,
    消耗: a.消耗, 冷却本地秒: a.冷却本地秒, 限制: a.限制,
  }]));
  const entities = Object.fromEntries([[playerId, player], ...onsite].filter(([, e]) => !!e).map(([id, e]) => [id, {
    名称: e.名称, 类别: e.类别, 档案: id === playerId ? undefined : e.档案,
    位面ID: e.位面ID, 地点ID: e.地点ID, 生命阶段: e.生命阶段, 生命: e.生命, 战斗: e.战斗,
    资源: Object.fromEntries(entries(e.资源).filter(([key]) => key === 'energy' || picked.has(key) || (id !== playerId && abilities[key])).slice(0, 16)),
    能力ID: Object.fromEntries(entries(e.能力ID).filter(([key]) => abilities[key])),
    状态: take(e.状态, 8), 装备: take(e.装备, 12),
  }]));
  const allKnowledge = { ...state._见闻档案, ...state.叙事?.见闻 };
  const knowledge = entries(allKnowledge).filter(([id, info]) => !hidden('note',id) && !hidden('entity',info.对象ID) && !hidden('character',info.对象ID) && !hidden('ability',info.对象ID) && !hidden('item',info.对象ID) && info.知情者ID?.[playerId] && relevant(info.对象ID));
  const noteIds = new Set([
    ...(state._查阅?.见闻 || []).filter(id=>knowledge.some(([key])=>key===id)),
    ...knowledge.filter(([id, info]) => matching(id, info.标题)).slice(-4).map(([id]) => id),
    ...entries(state.叙事?.见闻).filter(([, info]) => info.知情者ID?.[playerId] && (info.对象ID === place?.位面ID || info.对象ID === place?.地点ID || entities[info.对象ID])).slice(-4).map(([id]) => id),
    ...entries(state.叙事?.见闻).slice(-4).map(([id]) => id),
  ].slice(0, 10));
  const notes = Object.fromEntries(knowledge.filter(([id]) => noteIds.has(id)).map(([id, info]) => [id, { ...info, 内容: text(info.内容, 800) }]));
  const plane = state._时空?.位面目录?.[place?.位面ID];
  const narrative = state.叙事 || {};
  return {
    ...(state._更新错误 ? { 上轮结算反馈: text(state._更新错误), 待修复操作: (state._待修复?.输入 as any)?.叙事?.本轮结算 } : {}),
    _开局: { 主角ID: playerId, 起源涅槃已获得: state._开局?.起源涅槃已获得, 伴生灵ID: state._开局?.伴生灵ID,
      档案: Object.fromEntries(entries(state._开局?.档案).filter(([, value]) => value).map(([key,value]) => [key,text(value,500)])) },
    _时空: { 起源时刻秒: state._时空?.起源时刻秒, 当前地点: place,
      位面目录: plane ? { [place.位面ID]: { 名称: plane.名称, 简介: text(plane.简介,600), 时钟: plane.时钟 } } : {} },
    _实体: entities, _能力: abilities,
    _任务: take(Object.fromEntries(entries(state._任务).filter(([id])=>!hidden('quest',id)).filter(([id,t]) => ['进行中','待结算'].includes(t.状态) || matching(id,t.名称))),8),
    能力索引: owned.filter(([id]) => !picked.has(id)).slice(-24).map(([ID,a]) => ({ID,名称:a.名称,品阶:a.品阶,等级:a.等级})),
    档案概况: { 能力总数: owned.length, 见闻总数:knowledge.length, 同伴总数:companions.length+companionEntities.filter(([id])=>!linked(id)).length, 检索:'行动中提及名称或ID可调入详情。完整内容留在档案。' },
    _物品: take(Object.fromEntries(entries(state._物品).filter(([id])=>!hidden('item',id)).filter(([, item]) => item.所在?.ID === playerId || item.所在?.ID === place?.地点ID)), 16),
    _结算: {...state._结算, 遭遇ID:state._结算?.遭遇ID && !hidden('entity',state._结算.遭遇ID)?state._结算.遭遇ID:null, 冷却结束:Object.fromEntries(entries(state._结算?.冷却结束).filter(([id,end]) => end > (state._时空?.起源时刻秒 || 0) && id.startsWith(playerId + ':')).slice(0,16))},
    _复苏: state._复苏, _死亡记录: take(state._死亡记录, 1),
    最近结果: entries((state._运行账本 as any)?.events).slice(-4).map(([id,event]) => ({ID:id,结果:text(event.result,600)})),
    叙事: { 首次资料完成:narrative.首次资料完成, 天气:text(narrative.天气,120), 场景描述:text(narrative.场景描述,600), 记忆摘要:narrative.记忆摘要, 见闻:notes,
      同伴索引:[...companions.map(([id,p])=>({ID:id,名称:p.名称,在场:present(p)})),...companionEntities.filter(([id])=>!linked(id)).map(([id,e])=>({ID:id,名称:e.名称,在场:active(id,e)}))].slice(-48),
      人物档案:Object.fromEntries(selectedDossiers.map(([id,p])=>[id,{...p,分组:group(id,p),属性:undefined}])),
      关系:take(Object.fromEntries(entries(narrative.关系).filter(([,r])=>!hidden('entity',r.对象ID) && !hidden('entity',r.主体ID) && !hidden('character',r.对象ID) && !hidden('character',r.主体ID)).filter(([,r]) => relevant(r.对象ID) && relevant(r.主体ID) && (entities[r.对象ID] || entities[r.主体ID]))),8),
      外界事件:take(Object.fromEntries(entries(narrative.外界事件).filter(([,e]) => e.位面ID === place?.位面ID)),6) },
    待审提案: take(state.待审提案,4),
  };
}
