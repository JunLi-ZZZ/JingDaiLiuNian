import { Schema } from './schema';
import { createOpening } from './玩法/起源涅槃/开局';
import type { OpeningChoice } from './玩法/起源涅槃/开局';
export { createOpening, openingScenario } from './玩法/起源涅槃/开局';
export type { OpeningChoice } from './玩法/起源涅槃/开局';

export interface OpeningPort {
  exclusive<T>(key: string, action: () => Promise<T>): Promise<T>;
  context(): { chatId: string; latestMessageId: number };
  read(): Mvu.MvuData;
  write(data: Mvu.MvuData): Promise<void>;
}

/** 同一聊天开局互斥；只允许首楼且仍为最新楼层，不覆盖历史快照。 */
export async function initializeOpening(
  port: OpeningPort,
  target: { chatId: string; messageId: number },
  choice: OpeningChoice,
  branchId: string,
): Promise<Mvu.MvuData> {
  return port.exclusive(`embers-opening:${target.chatId}`, async () => {
    const check = () => {
      const current = port.context();
      if (!target.chatId || current.chatId !== target.chatId) throw Error('聊天已切换，请重新打开开局页');
      if (target.messageId !== 0 || current.latestMessageId !== target.messageId)
        throw Error('请在新聊天的首条消息选择开局，历史楼层不可覆盖');
    };
    check();
    const before = port.read();
    if (before.stat_data?._卡标识 !== 'death-adaptation') throw Error('此楼层不是余烬之后存档');
    const state = Schema.parse(before.stat_data);
    if (state._初始化完成) return before;
    const session = createOpening(choice, branchId);
    const next = { ..._.cloneDeep(before), ...session };
    check();
    // read + write 均针对固定楼层；MVU 单次替换同时包含 stat_data 与运行时账本。
    await port.write(next);
    check();
    const saved = port.read();
    if (
      !_.isEqual(saved.stat_data, next.stat_data) ||
      !_.isEqual(saved.death_adaptation_runtime, next.death_adaptation_runtime)
    )
      throw Error('开局存档未通过回读校验，请保留此聊天并检查变量');
    return saved;
  });
}
