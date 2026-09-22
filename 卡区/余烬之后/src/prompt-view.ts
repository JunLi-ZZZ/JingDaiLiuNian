import type { Schema } from './schema';

/** 可序列化到EJS的独立函数。完整资料留在存档，按场景、查询和手动重点取回。 */
export function projectPromptState(state: Schema, query = '') {
  const entries = (value: any) => Object.entries(value || {}) as [string, any][];
  const take = (value: any, count: number) => Object.fromEntries(entries(value).slice(-count));
  const text = (value: any, limit = 500) => String(value || '').slice(0, limit);
  const place = state._时空?.当前地点;
  const playerId = state._开局?.主角ID || 'player';
  const player = state._实体?.[playerId];
  const matching = (id: string, name: string) => query.includes(id) || (name?.length > 1 && query.includes(name));
  const onsite = entries(state._实体).filter(([id, e]) => id !== playerId && e.类别 !== '危险源' && e.生命阶段 === '存活' && e.位面ID === place?.位面ID && e.地点ID === place?.地点ID).slice(-7);
  const owned = entries(state._能力).filter(([id]) => player?.能力ID[id]);
  const picked = new Set([
    ...owned.filter(([id, a]) => matching(id, a.名称)).slice(-6).map(([id]) => id),
    ...(state._查阅?.能力 || []),
    ...owned.filter(([, a]) => a.品阶 === '本源').map(([id]) => id),
    ...owned.slice(-4).map(([id]) => id),
  ].slice(0, 14));
  const abilities = Object.fromEntries(entries(state._能力).filter(([id]) => picked.has(id) || onsite.some(([, e]) => e.能力ID[id])).slice(0, 20).map(([id, a]) => [id, {
    名称: a.名称, 品阶: a.品阶, 等级: a.等级, 熟练度: a.熟练度, 进化次数: a.进化次数, 进化方向: a.进化方向,
    来源: { ...a.来源, 说明: text(a.来源?.说明, 300) }, 最近成长: take(a.成长记录, 2),
    用法: a.用法, 规则状态: a.规则状态, 描述: text(a.描述), 触发条件: text(a.触发条件, 200), 效果: a.效果,
    消耗: a.消耗, 冷却本地秒: a.冷却本地秒, 限制: text(a.限制, 300),
  }]));
  const entities = Object.fromEntries([[playerId, player], ...onsite].filter(([, e]) => !!e).map(([id, e]) => [id, {
    名称: e.名称, 类别: e.类别, 档案: id === playerId ? undefined : e.档案,
    位面ID: e.位面ID, 地点ID: e.地点ID, 生命阶段: e.生命阶段, 生命: e.生命, 战斗: e.战斗,
    资源: Object.fromEntries(entries(e.资源).filter(([key]) => key === 'energy' || picked.has(key) || (id !== playerId && abilities[key])).slice(0, 16)),
    能力ID: Object.fromEntries(entries(e.能力ID).filter(([key]) => abilities[key])),
    状态: take(e.状态, 8), 装备: take(e.装备, 12),
  }]));
  const allKnowledge = { ...state._见闻档案, ...state.叙事?.见闻 };
  const knowledge = entries(allKnowledge).filter(([, info]) => info.知情者ID?.[playerId]);
  const noteIds = new Set([
    ...(state._查阅?.见闻 || []),
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
    _任务: take(Object.fromEntries(entries(state._任务).filter(([id,t]) => ['进行中','待结算'].includes(t.状态) || matching(id,t.名称))),8),
    能力索引: owned.filter(([id]) => !picked.has(id)).slice(-24).map(([ID,a]) => ({ID,名称:a.名称,品阶:a.品阶,等级:a.等级})),
    档案概况: { 能力总数: owned.length, 见闻总数:knowledge.length, 检索:'行动中提及能力名、见闻标题或ID可调入详情。完整内容留在档案。' },
    _物品: take(Object.fromEntries(entries(state._物品).filter(([, item]) => item.所在?.ID === playerId || item.所在?.ID === place?.地点ID)), 16),
    _结算: {...state._结算, 冷却结束:Object.fromEntries(entries(state._结算?.冷却结束).filter(([id,end]) => end > (state._时空?.起源时刻秒 || 0) && id.startsWith(playerId + ':')).slice(0,16))},
    _复苏: state._复苏, _死亡记录: take(state._死亡记录, 1),
    最近结果: entries((state._运行账本 as any)?.events).slice(-4).map(([id,event]) => ({ID:id,结果:text(event.result,600)})),
    叙事: { 首次资料完成:narrative.首次资料完成, 天气:text(narrative.天气,120), 场景描述:text(narrative.场景描述,600), 记忆摘要:narrative.记忆摘要, 见闻:notes,
      人物档案: Object.fromEntries(entries(narrative.人物档案).filter(([id, p]) => matching(id, p.名称) || p.别名?.some((name:string) => matching(id,name)) || (p.在场 && p.位面ID === place?.位面ID)).slice(-6)),
      关系:take(Object.fromEntries(entries(narrative.关系).filter(([,r]) => entities[r.对象ID] || entities[r.主体ID])),8),
      外界事件:take(Object.fromEntries(entries(narrative.外界事件).filter(([,e]) => e.位面ID === place?.位面ID)),6) },
    待审提案: take(state.待审提案,4),
  };
}
