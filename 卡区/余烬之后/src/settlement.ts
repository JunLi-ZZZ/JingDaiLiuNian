import { readRuntime } from './runtime-store';
import { applyCommand, validateSession } from './engine';
import type { Command, Session } from './engine';
import { Schema } from './schema';
import type { OpeningPort } from './opening';
import type { Operation, EvolutionDesign } from './schema';
import { acceptNarrativeUpdate } from './mvu-policy';
import { applyRepairPatch } from './variable-repair';
import type { EvolutionDirection } from './grades';
import { storyRandom } from './progression';

export type Proposal = Schema['待审提案'][string];
export type SettlementPort = OpeningPort & { selection(): string };
export function proposalCommand(session: Session, id: string, proposal: Proposal): Command {
  if (!/^[\w-]+$/.test(id) || ['constructor', 'prototype', '__proto__'].includes(id))
    throw Error('提案ID需要使用字母、数字、下划线或短横线');
  if (!proposal.操作) throw Error('该提案尚未提供受支持的操作');
  if (!proposal.内容.trim()) throw Error('提案缺少可供确认的说明');
  const operation = proposal.操作;
  if ('targetId' in operation && operation.actorId === operation.targetId) throw Error('当前攻击规则不支持以自己为目标');
  return { ...operation, id, branchId: session.stat_data._结算.分支ID, expectedVersion: session.stat_data._结算.状态版本 };
}

export type ArchiveEdit =
  | { kind: 'repair'; operation: Extract<Operation, { kind: 'reconcile' }>; retry: boolean }
  | { kind: 'retry' }
  | { kind: 'regenerate'; patch: unknown; base: Schema }
  | { kind: 'library'; entry: Schema['_资料库'][string] }
  | { kind: 'character'; id: string; dossier: Schema['叙事']['人物档案'][string] }
  | { kind: 'evolve'; abilityId: string; direction: EvolutionDirection }
  | { kind: 'evolution'; abilityId:string; direction:string; design:EvolutionDesign; base:Schema }
  | { kind: 'focus'; category: '能力' | '见闻'; id: string; enabled: boolean };

export function editSession(input: Session, edit: ArchiveEdit): Session {
  let session = _.cloneDeep(input);
  const version = input.stat_data._结算.状态版本;
  const pending = session.stat_data._待修复;
  if(edit.kind==='evolution'){
    if(!_.isEqual(input.stat_data,edit.base))throw Error('存档已变化，请重新推演进化');
    return applyCommand(session,{kind:'evolve',abilityId:edit.abilityId,direction:edit.direction,design:edit.design,id:'evolution-'+version,branchId:input.stat_data._结算.分支ID,expectedVersion:version}).session;
  }
  if (edit.kind === 'regenerate') {
    if (!_.isEqual(session.stat_data, edit.base)) throw Error('存档已变化，请重新生成');
    return applyRepairPatch(session, edit.patch);
  }
  if (edit.kind === 'library') {
    if (session.stat_data._资料库[edit.entry.id] && session.stat_data._资料库[edit.entry.id].kind !== edit.entry.kind) throw Error('该ID已用于另一类档案，请更换ID');
    session.stat_data._资料库[edit.entry.id] = edit.entry;
    session.stat_data = Schema.parse(session.stat_data);
    return session;
  }
  if (edit.kind === 'character') {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(edit.id) || ['constructor','prototype','__proto__'].includes(edit.id)) throw Error('人物ID无效');
    session.stat_data.叙事.人物档案[edit.id] = edit.dossier;
    session.stat_data = Schema.parse(session.stat_data);
    return session;
  }
  if (edit.kind === 'focus') {
    const state = session.stat_data;
    const exists = edit.category === '能力' ? state._实体[state._开局.主角ID].能力ID[edit.id] : (state.叙事.见闻[edit.id] || state._见闻档案[edit.id]);
    if (!exists) throw Error('查阅对象不存在');
    const ids = state._查阅[edit.category].filter(id => id !== edit.id);
    if (edit.enabled) ids.push(edit.id);
    if (ids.length > (edit.category === '能力' ? 8 : 6)) throw Error('本轮查阅已满，请先取消其他条目');
    state._查阅[edit.category] = ids;
    return session;
  }
  if (edit.kind === 'repair' || edit.kind === 'evolve') {
    session = applyCommand(session, { ...(edit.kind === 'repair' ? edit.operation : edit), id: `manual-${version}`, branchId: input.stat_data._结算.分支ID, expectedVersion: version }).session;
  }
  if (pending && (edit.kind === 'retry' || (edit.kind === 'repair' && edit.retry))) {
    if (pending.版本 !== version) throw Error('待修复批次之后已有其他行动，请根据最新情况重新生成该轮');
    const proposed = _.cloneDeep(pending.输入) as { 叙事: Schema['叙事']; 待审提案: Schema['待审提案'] };
    if (proposed.叙事?.本轮结算) proposed.叙事.本轮结算.起算状态版本 = session.stat_data._结算.状态版本;
    const next = acceptNarrativeUpdate(session.stat_data, proposed, session.death_adaptation_runtime, pending.骰源版本 ?? pending.版本);
    session = { stat_data: next, death_adaptation_runtime: readRuntime({ stat_data: next })! };
  } else if (edit.kind === 'retry') throw Error('没有待重试的更新');
  else if (pending && edit.kind === 'repair' && pending.版本 === version) {
    session.stat_data._待修复!.骰源版本 = pending.骰源版本 ?? pending.版本;
    session.stat_data._待修复!.版本 = session.stat_data._结算.状态版本;
  }
  return session;
}

/** 编辑也固定聊天、楼层、消息页和所见版本；与确认提案共用互斥锁。 */
export async function editArchive(port: SettlementPort, target: { chatId: string; messageId: number; selection: string }, displayed: Schema, edit: ArchiveEdit): Promise<Mvu.MvuData> {
  return port.exclusive(`embers-settle:${target.chatId}`, async () => {
    const check = () => {
      if (port.context().chatId !== target.chatId || !target.chatId || port.context().latestMessageId !== target.messageId || port.selection() !== target.selection) throw Error('请在当前聊天的最新消息页编辑');
    };
    check();
    const before = port.read();
    if (!_.isEqual(Schema.parse(before.stat_data), displayed)) throw Error('存档已更新，请重新确认');
    const session = editSession({ stat_data: Schema.parse(before.stat_data), death_adaptation_runtime: readRuntime(before)! }, edit);
    validateSession(session);
    const next = { ..._.cloneDeep(before), ...session };
    check();
    if (!_.isEqual(port.read(), before)) throw Error('存档已变化，请重新确认');
    await port.write(next);
    check();
    const saved = port.read();
    if (!_.isEqual(saved.stat_data, next.stat_data)) throw Error('编辑未通过回读校验');
    return saved;
  });
}

/** 点击时以所见提案为凭据；固定聊天、楼层和消息页，数值与账本一次保存。 */
export async function settleProposal(
  port: SettlementPort,
  target: { chatId: string; messageId: number; selection: string },
  proposalId: string,
  displayed: Proposal,
  random?: () => number,
): Promise<Mvu.MvuData> {
  return port.exclusive(`embers-settle:${target.chatId}`, async () => {
    const check = () => {
      const context = port.context();
      if (context.chatId !== target.chatId || !target.chatId) throw Error('聊天已切换');
      if (context.latestMessageId !== target.messageId) throw Error('历史楼层仅供查看，请在最新回复结算');
      if (port.selection() !== target.selection) throw Error('消息已编辑或切换，请重新查看提案');
    };
    check();
    const before = port.read();
    const session: Session = {
      stat_data: Schema.parse(before.stat_data),
      death_adaptation_runtime: _.cloneDeep(readRuntime(before)!),
    };
    validateSession(session);
    const current = session.stat_data.待审提案[proposalId];
    if (!Object.hasOwn(session.stat_data.待审提案, proposalId) || !_.isEqual(current, displayed))
      throw Error('提案已变更或已经处理');
    const command = proposalCommand(session, `m${target.messageId}-${proposalId}`, current);
    const settled = applyCommand(session, command, random ?? storyRandom(session.stat_data._结算.状态版本, 0, session.stat_data._结算.分支ID)).session;
    delete settled.stat_data.待审提案[proposalId];
    const next = { ..._.cloneDeep(before), ...settled };
    check();
    if (!_.isEqual(port.read(), before)) throw Error('存档发生变化，请重新查看提案');
    await port.write(next);
    check();
    const saved = port.read();
    if (
      !_.isEqual(saved.stat_data, next.stat_data) ||
      !_.isEqual(saved.death_adaptation_runtime, next.death_adaptation_runtime)
    )
      throw Error('结算未通过回读校验，请保留当前聊天并检查变量');
    return saved;
  });
}
