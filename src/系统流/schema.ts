const 数字 = (init = 0) =>
  z.coerce
    .number()
    .prefault(init)
    .transform(v => (_.isNaN(v) || !_.isFinite(v) ? init : v));

export const Schema = z.object({
  初始化完成: z.boolean().prefault(false),
  R18模式: z.boolean().prefault(false),

  世界: z
    .object({
      当前时间: z.string().prefault(''),
      周几: z.string().prefault(''),
      天气: z.string().prefault(''),
      地点: z.string().prefault(''),
    })
    .prefault({}),

  宿主: z
    .object({
      姓名: z.string().prefault(''),
      性别: z.string().prefault(''),
      年龄: 数字(),
      身份: z.string().prefault(''),
      外貌: z.string().prefault(''),
      当前状态: z.string().prefault(''),
    })
    .prefault({}),

  系统: z
    .object({
      等级: 数字(1),
      经验: 数字(),
      升级所需经验: 数字(100),
      称号: z.string().prefault(''),
      积分: 数字(),
      抽奖次数: 数字(),
    })
    .prefault({}),

  属性: z
    .object({
      力量: 数字(10),
      敏捷: 数字(10),
      体质: 数字(10),
      智力: 数字(10),
      精神: 数字(10),
      魅力: 数字(10),
      幸运: 数字(10),
      自由属性点: 数字(),
    })
    .prefault({}),

  状态: z
    .object({
      生命: 数字(100),
      生命上限: 数字(100),
      能量: 数字(100),
      能量上限: 数字(100),
      饱食度: 数字(100),
      精力: 数字(100),
    })
    .prefault({}),

  技能: z
    .record(
      z.string(),
      z.object({
        等级: 数字(1),
        品阶: z.string().prefault('普通'),
        类型: z.string().prefault(''),
        描述: z.string().prefault(''),
        消耗: z.string().prefault(''),
        冷却: z.string().prefault(''),
        熟练度: 数字(),
      }),
    )
    .prefault({}),

  背包: z
    .record(
      z.string(),
      z.object({
        数量: 数字(1),
        品阶: z.string().prefault('普通'),
        类型: z.string().prefault(''),
        描述: z.string().prefault(''),
        效果: z.string().prefault(''),
        可否使用: z.boolean().prefault(true),
      }),
    )
    .prefault({}),

  装备: z
    .object({
      武器: z.string().prefault(''),
      头部: z.string().prefault(''),
      衣服: z.string().prefault(''),
      鞋子: z.string().prefault(''),
      饰品: z.string().prefault(''),
    })
    .prefault({}),

  任务: z
    .record(
      z.string(),
      z.object({
        类型: z.string().prefault('日常'),
        描述: z.string().prefault(''),
        要求: z.string().prefault(''),
        进度: z.string().prefault(''),
        奖励: z.string().prefault(''),
        惩罚: z.string().prefault(''),
        状态: z.string().prefault('进行中'),
        限时: z.string().prefault(''),
      }),
    )
    .prefault({}),

  人物: z
    .record(
      z.string(),
      z.object({
        身份: z.string().prefault(''),
        关系: z.string().prefault(''),
        好感度: 数字(),
        当前状态: z.string().prefault(''),
        备注: z.string().prefault(''),
      }),
    )
    .prefault({}),
});
