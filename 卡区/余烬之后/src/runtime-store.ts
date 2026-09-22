import type { Session } from './engine';

/** 新楼层通过stat_data继承账本；旧开发档仍可读外层存储，不写回历史。 */
export function readRuntime(data: {
  stat_data?: Record<string, any>;
  death_adaptation_runtime?: unknown;
}): Session['death_adaptation_runtime'] | undefined {
  return (data.stat_data?._运行账本 ?? data.death_adaptation_runtime ?? undefined) as
    Session['death_adaptation_runtime'] | undefined;
}
