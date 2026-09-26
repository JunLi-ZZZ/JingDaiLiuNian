import { createOpening, openingScenario, usesOriginOpening } from './opening';
import type { OpeningChoice, OpeningPort } from './opening';
import { presetPlanes } from './presets';

export function openingRequest(choice: OpeningChoice): string {
  const state = createOpening(choice, 'request-preview').stat_data;
  const scenario = openingScenario(choice);
  const originStart=usesOriginOpening(choice)&&scenario.模式==='默认';
  const abilities=Object.entries(state._能力).filter(([id])=>id!=='basic-attack'&&state._实体.player.能力ID[id]).map(([,a])=>`${a.名称}（${a.品阶}）：${a.描述}\n触发：${a.触发条件}\n代价与局限：${a.限制}`).join('\n\n')||'当前从日常生活中的技能与经历开始。';
  const world =
    scenario.位面ID === 'opening-world'
      ? scenario.世界名称
      : presetPlanes[scenario.位面ID as keyof typeof presetPlanes];
  const profile = Object.entries(state._开局.档案)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}：${value}`)
    .join('\n');
  return `请为《余烬之后》写出正式开场白，直接进入故事现场。

【本局角色】
我在本局扮演${state._开局.档案.姓名}，以下是我的角色档案。
${profile}

【初始能力】
${abilities}

【故事起点】
世界：${originStart ? '虚海 · 归泊庭（主世界事故之后）' : world}
地点：${originStart ? '归泊庭 · 中庭石阶' : [scenario.城市, scenario.场景].filter(Boolean).join(' · ')}
游戏时间：${scenario.起始时间}
经历与机缘：${scenario.机缘}
故事基调：${scenario.基调}
${scenario.世界设定 ? `世界设定：${scenario.世界设定}\n` : ''}${scenario.出场人物 ? `出场人物：${scenario.出场人物}\n` : ''}${scenario.构想 ? `开局构想：${scenario.构想}\n` : ''}${scenario.大纲 ? `参考大纲：\n${scenario.大纲}\n` : ''}${scenario.边界 ? `内容边界：${scenario.边界}\n` : ''}
请从这个时间与地点展开第一幕，描写周围环境和出场人物，让出场人物直接与我发生联系，留下可以询问、应对或探索的具体事情；结尾停在我能回应的时刻。`;
}

export function validateOpeningRequest(input: string): string {
  const text = input.trim();
  if (text.length < 20 || text.length > 24000) throw Error('开局要求应为20至24000字，请检查后再发送');
  if (/\{\{|```|<script\b|<UpdateVariable>/i.test(text)) throw Error('开局要求不能包含未替换的宏或可执行代码');
  return text;
}

type RequestMessage = {
  message_id: number;
  role: string;
  message: string;
  data: Record<string, any>;
  extra: Record<string, any>;
};
export interface OpeningRequestPort extends OpeningPort {
  selection(): string;
  request(): RequestMessage | undefined;
  append(message: string, data: Mvu.MvuData, extra: Record<string, unknown>): Promise<void>;
}

/** 先保存首楼初始化快照，再发送用户开局要求；后续AI回复从已初始化状态继承。 */
export async function sendOpeningRequest(
  port: OpeningRequestPort,
  target: { chatId: string; messageId: number; selection: string },
  choice: OpeningChoice,
  input: string,
  branchId: string,
): Promise<void> {
  const message = validateOpeningRequest(input);
  return port.exclusive(`embers-opening:${target.chatId}`, async () => {
    const check = () => {
      if (!target.chatId || port.context().chatId !== target.chatId) throw Error('聊天已切换，请回到原聊天确认开局');
      if (target.messageId !== 0 || port.selection() !== target.selection)
        throw Error('封面已切换，请重新打开当前封面');
    };
    check();
    const existing = port.request();
    if (existing?.extra?.embers_opening?.sourceSelection === target.selection && existing.role === 'user') {
      if (!existing.data.stat_data?._初始化完成 || !existing.data.death_adaptation_runtime)
        throw Error('开局要求已发送，但存档不完整，请保留聊天检查');
      return;
    }
    if (port.context().latestMessageId !== 0) throw Error('已有剧情时不能重新开局，请新建聊天');
    const before = port.read();
    if (before.stat_data?._卡标识 !== 'death-adaptation') throw Error('初始变量未就绪，请检查封面的环境检测');
    const session = createOpening(choice, branchId);
    const next = { ..._.cloneDeep(before), ...session };
    check();
    await port.write(next);
    check();
    const saved = port.read();
    if (
      !_.isEqual(saved.stat_data, next.stat_data) ||
      !_.isEqual(saved.death_adaptation_runtime, next.death_adaptation_runtime)
    )
      throw Error('开局存档未通过回读，尚未发送开局要求，请重试');
    await port.append(message, next, { embers_opening: { sourceSelection: target.selection, branchId } });
    check();
    const sent = port.request();
    if (
      sent?.role !== 'user' ||
      sent.message !== message ||
      !sent.data.stat_data?._初始化完成 ||
      !sent.data.death_adaptation_runtime
    )
      throw Error('开局要求发送后未通过回读，请保留聊天检查；重试会先检查已有消息');
  });
}
