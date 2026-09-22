export const OpeningScenarioSchema = z.object({
  模式: z.enum(['默认', '自定义']).prefault('默认'),
  位面ID: z.string().prefault('main'),
  世界名称: z.string().max(200).prefault(''),
  世界设定: z.string().max(12000).prefault(''),
  城市: z.string().max(200).prefault('星见市'),
  场景: z.string().max(300).prefault('归泊庭 · 初次归来'),
  起始时间: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .prefault('17:50'),
  机缘: z.string().max(4000).prefault('在主世界遭遇失控卡车，第一次死亡唤醒起源涅槃。初微的衍生之力与末墟的终末之力在种核内交融，归泊庭接住了尚待重构的自我；为避开同类碰撞，种核衍生出越界能力。'),
  基调: z.string().max(300).prefault('异界探索、真实危险与死而复生'),
  出场人物: z.string().max(4000).prefault('伴生之灵艾斯特瑞亚；前来迎接第一次归来的末墟'),
  构想: z.string().max(12000).prefault('从归泊庭苏醒写起，以卡车撞击的最后客观片段交代死亡。末墟等在浅水石阶旁，艾斯特瑞亚解释身体尚需十分钟重构、起源涅槃与新生的越界。庭中潮镜映出不同世界的片段，给出两三个有具体人物与事件的去处，同时接受任意目的世界。停在等待我询问或选择去向的时刻。'),
  大纲: z.string().max(12000).prefault(''),
  边界: z.string().max(4000).prefault(''),
});
export type OpeningScenario = z.infer<typeof OpeningScenarioSchema>;
