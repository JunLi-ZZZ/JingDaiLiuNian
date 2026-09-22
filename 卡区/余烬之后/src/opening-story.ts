import { createOpening, openingScenario } from './opening';
import type { OpeningChoice, OpeningPort } from './opening';
import { presetPlanes } from './presets';

export const OpeningDraftSchema = z.object({
  正文: z.string().trim().min(40, '开场白过短，请补充可供接续的场景').max(24000),
  场景描述: z.string().trim().min(1).max(2000),
  天气: z.string().max(300),
});
export type OpeningDraft = z.infer<typeof OpeningDraftSchema>;
export type OpeningTask = '大纲' | '开场白';

export const defaultOpeningDraft: OpeningDraft = {
  正文: `轮胎摩擦路面的尖响已经远去。卡车撞碎护栏的震动，是主世界留下的最后一道声音。

归泊庭里，浅水正漫过灰白石阶，廊下有一盏暖灯。

“比我想的早了一点。”

墨色长发的女人坐在近水处，膝上搭着一件干燥的外衣。她的指尖停在水面倒影旁；倒影里，散开的光正缓慢聚成身体的轮廓。

“我是末墟。你可以先记住这个名字，其他的，我们有时间慢慢说。”

一颗蓝色晶角探出廊柱，紧接着是银发的少女。她看了一眼潮碑上尚未走完的刻度，才蹲到石阶另一侧。

“艾斯特瑞亚，你的伴生之灵。刚才的碰撞确实致命，起源涅槃已经接住了你。身体还要十分钟才能重构，外面也会经过十分钟。”

水中浮现出两道不同的纹路。一道向外生长，另一道在边缘安静地收拢。

末墟抬起眼。“衍生来自初微，终末来自我。我的那一份让生命更容易抵达尽头……也让你每次回来，都能找到这里。”她将外衣放到岸边空着的位置，“如果你不喜欢这份礼物，可以直接告诉我。”

“还有第三道。”艾斯特瑞亚指向水面。

一道细窄的裂口越过撞击留下的暗痕，另一端映着陌生的天空。

“越界。这次死因留下的回答，是离开碰撞所在的空间。等身体好了，你能循潮镜去另一个世界。”

庭中的镜面依次漾开：山城雨檐下，有人拿着一张通缉画像拦住渡口；荒野的巨兽脊背上，一队商旅正向熄灭的营火赶去；另一面镜子后，夜间列车停在无人报站的月台。

“这些只是恰好靠近的潮路。”少女伸手扶住镜框，“你也可以告诉我别的世界，或者先问问这里的事。”

末墟往旁边挪了半步，留下靠岸的位置。潮碑上的刻度仍在缓慢流动。`,
  场景描述: '归泊庭，末墟与艾斯特瑞亚在浅水石阶旁；身体重构中，潮镜可供查看和选择下一世界。',
  天气: '潮声轻缓',
};

/** 正文作为文字发送，禁止把生成结果变成脚本、MVU命令或另一个界面入口。 */
export function validateOpeningDraft(input: unknown): OpeningDraft {
  const draft = OpeningDraftSchema.parse(input);
  for (const text of Object.values(draft)) {
    if (/<\/?[a-zA-Z][^>]*>|\{\{|\}\}|```|!\[|\]\s*\(/i.test(text))
      throw Error('开场白请使用纯正文，不包含HTML、宏、变量指令、代码块或外部链接');
  }
  return draft;
}

export function parseOpeningDraft(text: string): OpeningDraft {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return validateOpeningDraft(JSON.parse(clean));
  } catch (error) {
    if (error instanceof SyntaxError) throw Error('AI未返回完整开场白档案，请重试；当前角色和构想仍保留');
    throw error;
  }
}

export function openingPrompt(task: OpeningTask, choice: OpeningChoice, worldContext: string): string {
  const state = createOpening(choice, 'opening-draft').stat_data;
  const scenario = openingScenario(choice);
  const world =
    scenario.位面ID === 'opening-world'
      ? scenario.世界名称
      : presetPlanes[scenario.位面ID as keyof typeof presetPlanes];
  return `你正在为文字角色扮演卡《余烬之后》准备${task}，这是尚未开始游玩的草稿。
玩家档案：${JSON.stringify(state._开局.档案)}
开局设定：${JSON.stringify(scenario)}
当前世界：${world}
世界资料：\n${worldContext}

虚海容纳多元位面。起源之母初微与终焉之母末墟维持生灭循环，默认主角由两者力量交融诞生；自定义身世采用档案。默认开局已在主世界因卡车事故死亡，现处归泊庭重构，已获得起源涅槃、终焉眷引与越界；自定义开局采用所填机缘与状态。
角色身份与身体特征采用本局档案。创作内容聚焦与玩家直接相关的现场、人物诉求、可接触的线索和行动机会。地点和起始时间采用开局设定，艾斯特瑞亚可说明已经苏醒的涅槃能力。
${
  task === '大纲'
    ? '输出约300至600字的中文纯文字大纲，写明既有背景、现场状况、出场人物的目的与可接触的线索。后续发展作为可能性，具体选择留给玩家。'
    : '输出JSON对象，包含“正文”“场景描述”“天气”三个纯文字字段。正文约500至900字，直接进入现场，以环境和人物言行留下回应空间；场景描述概括当前可见现场，天气记录正文呈现的情况。'
}
大纲是创作参考，故事事实以最终呈现的正文为准。`;
}

export type PublishedOpening = { messageId: number; data: Mvu.MvuData };
type StoryMessage = { message_id: number; message: string; data: Record<string, any>; extra: Record<string, any> };
export interface StoryPort extends Omit<OpeningPort, 'write'> {
  selection(): string;
  story(): StoryMessage | undefined;
  append(message: string, data: Mvu.MvuData, extra: Record<string, unknown>): Promise<void>;
}

/** 初始快照与开场白在同一新楼层一次创建；封面始终独立，不写成已开局状态。 */
export async function publishOpening(
  port: StoryPort,
  target: { chatId: string; messageId: number; selection: string },
  choice: OpeningChoice,
  input: OpeningDraft,
  branchId: string,
): Promise<PublishedOpening> {
  return port.exclusive(`embers-opening:${target.chatId}`, async () => {
    const checkSource = () => {
      if (!target.chatId || port.context().chatId !== target.chatId) throw Error('聊天已切换，请回到原聊天确认开局');
      if (target.messageId !== 0 || port.selection() !== target.selection)
        throw Error('封面已编辑或切换，请重新打开当前封面');
    };
    checkSource();
    const existing = port.story();
    if (existing?.extra?.embers_opening?.sourceSelection === target.selection) {
      if (!existing.data.stat_data?._初始化完成 || !existing.data.death_adaptation_runtime)
        throw Error('已有开场白存档不完整，请保留聊天检查，勿重复创建');
      return { messageId: existing.message_id, data: existing.data as Mvu.MvuData };
    }
    if (port.context().latestMessageId !== 0) throw Error('请在新聊天首楼开始；已有剧情时不能覆盖开局');
    const before = port.read();
    if (before.stat_data?._卡标识 !== 'death-adaptation') throw Error('此封面不是余烬之后存档');
    if (before.stat_data._初始化完成) throw Error('这是旧版已开局存档，请新建聊天使用独立封面');
    const draft = validateOpeningDraft(input);
    const session = createOpening(choice, branchId);
    session.stat_data.叙事.场景描述 = draft.场景描述;
    session.stat_data.叙事.天气 = draft.天气;
    const data = { ..._.cloneDeep(before), ...session };
    const message = `${draft.正文}\n\n<EmbersPanel/>`;
    checkSource();
    await port.append(message, data, { embers_opening: { sourceSelection: target.selection, branchId } });
    checkSource();
    const saved = port.story();
    if (
      saved?.message !== message ||
      !_.isEqual(saved.data.stat_data, data.stat_data) ||
      !_.isEqual(saved.data.death_adaptation_runtime, data.death_adaptation_runtime)
    )
      throw Error('开场白保存未通过回读，请保留聊天检查；再次确认会先检测已有开场白');
    return { messageId: saved.message_id, data: saved.data as Mvu.MvuData };
  });
}
