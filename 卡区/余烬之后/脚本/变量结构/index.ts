import { turnReceipt } from '../../src/turn-receipt';
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { acceptNarrativeUpdate, formatUpdateError } from '../../src/mvu-policy';
import { MvuInputSchema } from '../../src/schema';
import { readRuntime } from '../../src/runtime-store';
import { bridgeUpdateCommands } from '../../src/update-protocol';

$(async () => {
  await waitGlobalInitialized('Mvu');
  registerMvuSchema(MvuInputSchema);
  const receipts = new WeakMap<object,string>();
  const protocolErrors = new WeakMap<object,string>();
  const parsed = eventOn(Mvu.events.COMMAND_PARSED, (variables, commands, content) => {
    if (variables.stat_data?._卡标识 !== 'death-adaptation') return;
    const error = bridgeUpdateCommands(content, commands);
    if (error) protocolErrors.set(variables, error);
    // 楼层+消息页+原文建立回执；同样15秒出现在下一楼仍是新的一轮。
    const last=getLastMessageId();
    const messages=getChatMessages(Math.max(0,last-2)+'-'+last,{include_swipes:true});
    const message=messages.reverse().find(m=>m.swipes[m.swipe_id]===content);
    if(message) {
      receipts.set(variables,turnReceipt(message.message_id,message.swipe_id,content));
    }
  });
  const listener = eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (next, previous) => {
    if (previous.stat_data?._卡标识 !== 'death-adaptation') return;
    const protocolError = protocolErrors.get(next);
    if (protocolError) {
      next.stat_data = _.cloneDeep(previous.stat_data);
      next.embers_update_error = protocolError;
      return;
    }
    if (previous.death_adaptation_runtime !== undefined)
      next.death_adaptation_runtime = _.cloneDeep(previous.death_adaptation_runtime);
    else delete next.death_adaptation_runtime;
    // 保留 MVU 自身元数据；只替换 stat_data。失败时回到完整旧状态，不部分提交。
    try {
      delete next.embers_update_error;
      next.stat_data = acceptNarrativeUpdate(previous.stat_data, next.stat_data, readRuntime(previous), undefined, receipts.get(next));
      if (next.stat_data._运行账本) next.death_adaptation_runtime = _.cloneDeep(next.stat_data._运行账本);
    } catch (error) {
      const failed = _.cloneDeep(next.stat_data);
      next.stat_data = _.cloneDeep(previous.stat_data);
      next.stat_data._更新错误 = formatUpdateError(error);
      next.stat_data._待修复 = { 版本: previous.stat_data._结算?.状态版本 || 0, 输入: { 叙事: failed.叙事, 待审提案: failed.待审提案 }, 原因: formatUpdateError(error) };
      console.warn('[余烬之后] 本轮变量结构无效，保留旧状态', error);
    }
  });
  const runtime = { active: true };
  initializeGlobal('EmbersRuntime', runtime);
  $(window).on('pagehide', () => {
    runtime.active = false;
    listener.stop();
    parsed.stop();
  });
});
