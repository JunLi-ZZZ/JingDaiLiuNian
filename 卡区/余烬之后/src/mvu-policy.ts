import { normalizeOperations } from './operation-input';
import { Schema } from './schema';
import { applyCommand } from './engine';
import type { Session } from './engine';
import { readRuntime } from './runtime-store';
import { seededRandom } from './progression';
import { dossierRegistrations, syncDossierLocations } from './character-dossier';

export function formatUpdateError(error: unknown): string {
  if (error instanceof z.ZodError)
    return error.issues.slice(0, 3).map(issue => `${issue.path.join('/')}: ${issue.message}`).join('；');
  return error instanceof Error ? error.message : String(error);
}

/** MVU解析完成时接纳叙事，并将本轮已发生的耗时交给内核结算。展示快照不会调用此函数。 */
export function acceptNarrativeUpdate(
  previous: unknown,
  proposed: unknown,
  legacyRuntime?: Session['death_adaptation_runtime'],
  seedVersion?: number,
  receipt?: string,
): Schema {
  const before = Schema.parse(previous);
  if (receipt && before._叙事回执 === receipt) return before;
  const normalized = _.cloneDeep(proposed) as { 叙事?: Record<string, unknown> };
  if(normalized.叙事)normalized.叙事.本轮结算=normalizeOperations(normalized.叙事.本轮结算);
  for(const [id,record] of Object.entries(normalized.叙事?.人物档案 || {})){
    if(record && typeof record==='object' && !Array.isArray(record) && !Object.hasOwn(record,'分组'))
      Object.assign(record,{分组:before.叙事.人物档案[id]?.分组 || '附近的人'});
  }
  // 模型只提交经过秒数与操作数组；权威快照提供起算坐标。
  if (typeof normalized.叙事?.本轮时间 === 'number')
    normalized.叙事.本轮时间 = { 起算起源秒: before._时空.起源时刻秒, 经过本地秒: normalized.叙事.本轮时间 };
  if (Array.isArray(normalized.叙事?.本轮结算))
    normalized.叙事.本轮结算 = { 起算状态版本: before._结算.状态版本, 操作: normalized.叙事.本轮结算 };
  const input = z
    .object({
      叙事: Schema.shape.叙事.optional(),
      待审提案: Schema.shape.待审提案.optional(),
    })
    .parse(normalized);
  const next = Schema.parse({
    ...before,
    _更新错误: input.叙事?.本轮结算 && !_.isEqual(input.叙事.本轮结算, before.叙事.本轮结算) ? '' : before._更新错误,
    _待修复: input.叙事?.本轮结算 && !_.isEqual(input.叙事.本轮结算, before.叙事.本轮结算) ? null : before._待修复,
    叙事: input.叙事 ?? before.叙事,
    待审提案: input.待审提案 ?? before.待审提案,
  });
  // 常用见闻保持短小；旧资料仍可在本地档案查阅，不进入每轮提示词。
  for (const [id, info] of Object.entries(next.叙事.见闻)) {
    if (!_.isEqual(info, before.叙事.见闻[id])) {
      delete next.叙事.见闻[id];
      next.叙事.见闻[id] = info;
    }
    delete next._见闻档案[id];
  }
  for (const [id, info] of Object.entries(next.叙事.见闻).slice(0, -24)) {
    next._见闻档案[id] = info;
    delete next.叙事.见闻[id];
  }
  if (before.叙事.首次资料完成) next.叙事.首次资料完成 = true;
  if (!before._初始化完成) return next;
  const runtime = readRuntime({ stat_data: before, death_adaptation_runtime: legacyRuntime });
  if (!runtime) throw Error('剧情结算缺少结算账本');
  let session: Session = { stat_data: next, death_adaptation_runtime: runtime };
  const version = before._结算.状态版本;
  const run = (operation: Parameters<typeof applyCommand>[1], seed: number) => {
    // 相同楼层重解析得到同一随机序列；刷新不重新掷骰。
    session = applyCommand(session, operation, seededRandom(seed, before._结算.分支ID)).session;
  };
  const elapsed = next.叙事.本轮时间;
  for(const [index,operation] of dossierRegistrations(next).entries()){
    run({...operation,id:`dossier-${version}-${index}`,branchId:before._结算.分支ID,expectedVersion:session.stat_data._结算.状态版本},version+index);
  }
  syncDossierLocations(session.stat_data);
  if (elapsed && !_.isEqual(elapsed, before.叙事.本轮时间)) {
    if (elapsed.起算起源秒 !== before._时空.起源时刻秒) throw Error('本轮时间的起算值与当前存档不一致');
    if (elapsed.经过本地秒 > 0) {
      const rate = before._时空.位面目录[before._时空.当前地点.位面ID]?.时钟.本地每起源秒;
      if (!rate || !Number.isFinite(rate) || rate <= 0) throw Error('当前位面缺少有效时钟倍率');
      run({ kind: 'advance', seconds: elapsed.经过本地秒 / rate,
        id: `narrative-time-${version}`, branchId: before._结算.分支ID, expectedVersion: session.stat_data._结算.状态版本 }, version + 1);
    }
  }
  const batch = next.叙事.本轮结算;
  if (batch && !_.isEqual(batch, before.叙事.本轮结算)) {
    if (batch.起算状态版本 !== version) throw Error('本轮结算的起算版本与当前存档不一致');
    for (const [index, operation] of batch.操作.entries()) {
      try {
        run({ ...operation, id: `story-${version}-${index}`, branchId: before._结算.分支ID,
          expectedVersion: session.stat_data._结算.状态版本 }, ((seedVersion ?? version) + 1) * 7919 + index * 104729);
      } catch(error) { throw Error(`本轮结算/操作/${index}: ${formatUpdateError(error)}`); }
    }
  }
  const result = session.stat_data;
  for(const [id,p] of Object.entries(result.叙事.人物档案)){
    if(p.在场 && (p.位面ID!==result._时空.当前地点.位面ID || (p.地点ID && p.地点ID!==result._时空.当前地点.地点ID)))p.在场=false;
    const e=result._实体[p.实体ID||id];
    if(e?.生命 && e.战斗 && e.资源.energy)p.属性={生命:_.cloneDeep(e.生命),能量:{当前:e.资源.energy.当前,上限:e.资源.energy.上限 ?? e.资源.energy.当前},..._.cloneDeep(e.战斗)};
  }
  if (receipt) result._叙事回执 = receipt;
  // 本轮新提案随同一事务的时间和动作更新版本，旧提案保留原版本。
  for (const [id, proposal] of Object.entries(result.待审提案)) {
    if (proposal.预期状态版本 === version && !_.isEqual(proposal, before.待审提案[id]))
      proposal.预期状态版本 = result._结算.状态版本;
  }
  return result;
}
