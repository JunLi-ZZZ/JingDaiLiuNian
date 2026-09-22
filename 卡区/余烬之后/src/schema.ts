import { GradeSchema, MAX_TURN_OPERATIONS } from './grades';
// stat_data 的唯一结构定义。下划线根字段由脚本维护，叙事字段允许 MVU 更新。
import { OpeningScenarioSchema } from './玩法/起源涅槃/schema';
export { OpeningScenarioSchema };
export type { OpeningScenario } from './玩法/起源涅槃/schema';
export const EvolutionDesignSchema=z.strictObject({
  name:z.string().min(1).max(80).optional(),
  principle:z.string().min(4).max(600),evidence:z.string().min(4).max(500),
  description:z.string().min(1).max(800),trigger:z.string().min(1).max(300),limitations:z.string().min(1).max(500),
  cost:z.number().min(0).max(100000).optional(),cooldown:z.number().min(0).max(86400).optional(),
  utility:z.strictObject({bonus:z.number().int().min(0).max(8)}).optional(),
  strike:z.strictObject({mechanism:z.string().min(1).max(80),power:z.number().positive().max(100),fixed:z.number().min(0).max(100000),seconds:z.number().positive().max(86400)}).optional(),
  conversion:z.strictObject({mechanism:z.string().min(1).max(80),capacity:z.number().positive().max(1000000),storage:z.number().positive().max(1000000),multiplier:z.number().positive().max(100)}).optional(),
});
export type EvolutionDesign=z.infer<typeof EvolutionDesignSchema>;
/** 模型提供场景与行动参数；数值变更由同一结算内核执行。 */
export const OperationSchema = z.discriminatedUnion('kind', [
  z.strictObject({kind:z.literal('acquire'),actorId:z.string(),abilityId:z.string(),name:z.string().min(1).max(80),grade:GradeSchema,source:z.enum(['学习','训练','天赋','传承','契约','改造','其他']),evidence:z.string().min(4).max(500),description:z.string().min(1).max(800),trigger:z.string().min(1).max(300),limitations:z.string().max(500),profile:z.enum(['技艺','攻击','转化']),mechanism:z.string().min(1).max(80).prefault('impact'),cost:z.number().min(0).max(100000).prefault(0),cooldown:z.number().min(0).max(86400).prefault(0),power:z.number().positive().max(100).prefault(1),capacity:z.number().positive().max(1000000).prefault(10)}),
  z.strictObject({kind:z.literal('train'),actorId:z.string(),abilityId:z.string(),seconds:z.number().min(600).max(86400),focus:z.string().min(4).max(400)}),
  z.strictObject({kind:z.literal('use'),actorId:z.string(),abilityId:z.string(),purpose:z.string().min(1).max(500)}),

  z.strictObject({ kind: z.literal('strike'), actorId: z.string(), targetId: z.string(), abilityId: z.string() }),
  z.strictObject({ kind: z.literal('release'), actorId: z.string(), targetId: z.string(), abilityId: z.string() }),
  z.strictObject({ kind: z.literal('advance'), seconds: z.number().positive().max(86400) }),
  z.strictObject({ kind: z.literal('revive') }),
  z.strictObject({ kind: z.literal('encounter'), name: z.string().min(1).max(80), tier: z.enum(['普通', '强敌', '致命']), mechanism: z.string().min(1).max(80) }),
  z.strictObject({ kind: z.literal('exposure'), source: z.string().min(1).max(80), mechanism: z.string().min(1).max(80), mechanismName: z.string().min(1).max(80), abilityName: z.string().trim().max(80).nullable().prefault(null), amount: z.number().positive().max(1000000), conditions: z.string().min(1).max(500) }),
  z.strictObject({ kind: z.literal('travel'), abilityId:z.string().nullable().optional(), planeId: z.string().min(1).max(80), name: z.string().min(1).max(200), description: z.string().max(3000), locationId: z.string().min(1).max(80), location: z.string().min(1).max(200), route: z.string().min(1).max(500), rate: z.number().positive().max(10000) }),
  z.strictObject({ kind: z.literal('channel'), abilityId: z.string(), amount: z.number().positive({ error: '消耗储能必须大于0' }), purpose: z.string().min(1).max(500) }),
  z.strictObject({ kind: z.literal('reconcile'), actorId: z.string(), resourceId: z.string(), before: z.number().nonnegative(), value: z.number().nonnegative().max(1000000), evidence: z.string().min(4).max(500) }),
  z.strictObject({ kind: z.literal('evolve'), abilityId: z.string(), direction: z.string().trim().min(1).max(80), actorId:z.string().optional(),design:EvolutionDesignSchema.optional() }),
  z.strictObject({ kind: z.literal('check'), actorId: z.string(), abilityId: z.string().nullable(), task: z.string().min(1).max(300), difficulty: z.number().int().min(5).max(30) }),
]);
export type Operation = z.infer<typeof OperationSchema>;
export const CharacterDossierSchema = z.object({
  名称: z.string().min(1).max(80), 别名: z.array(z.string().min(2).max(80)).max(6).prefault([]),
  位面ID: z.string().max(80).prefault(''), 在场: z.boolean().prefault(false),
  性别:z.string().max(80).prefault(''), 年龄:z.string().max(100).prefault(''), 种族:z.string().max(100).prefault(''),
  来源世界:z.string().max(150).prefault(''), 能力与局限:z.string().max(700).prefault(''), 背景经历:z.string().max(800).prefault(''), 日常喜好:z.string().max(400).prefault(''),
  身份: z.string().max(300).prefault(''), 外貌: z.string().max(400).prefault(''),
  性格: z.string().max(500).prefault(''), 动机: z.string().max(500).prefault(''),
  说话方式: z.string().max(300).prefault(''), 已知信息: z.string().max(800).prefault(''),
  关系经历: z.string().max(800).prefault(''), 近况: z.string().max(500).prefault(''),
});
export const LibraryEntrySchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), kind: z.enum(['character','plane']),
  name: z.string().min(2).max(80), aliases: z.array(z.string().min(2).max(80)).max(6).prefault([]),
  planeId: z.string().max(80).prefault(''), summary: z.string().max(500),
  content: z.string().min(20).max(6000),
});
export type LibraryEntry = z.infer<typeof LibraryEntrySchema>;
export const Schema = z.object({
  _资料库: z.record(z.string(), LibraryEntrySchema.omit({content:true}).extend({book:z.string(),entry:z.string()})).prefault({}),
  _叙事回执: z.string().prefault(''),
  _修复记录: z.object({原文:z.string(),补丁:z.unknown()}).nullable().prefault(null),
  // MVU仅跨楼层继承stat_data等规定字段；账本必须随权威快照保存。
  _运行账本: z.record(z.string(), z.unknown()).nullable().prefault(null),
  _卡标识: z.literal('death-adaptation').prefault('death-adaptation'),
  _更新错误: z.string().prefault(''),
  _待修复: z.object({ 版本: z.number(), 骰源版本: z.number().optional(), 输入: z.unknown(), 原因: z.string() }).nullable().prefault(null),
  _查阅: z.object({ 能力: z.array(z.string()).max(8).prefault([]), 见闻: z.array(z.string()).max(6).prefault([]) }).prefault({}),
  _结构版本: z.literal(1).prefault(1),
  _初始化完成: z.boolean().prefault(false),
  _见闻档案: z.record(z.string(), z.unknown()).prefault({}),
  _开局: z
    .object({
      模式: z.enum(['待选择', '默认', '自定义']).prefault('待选择'),
      主角ID: z.string().prefault('player'),
      场景设定: OpeningScenarioSchema.prefault({}),
      档案: z
        .object({
          姓名: z.string().prefault(''),
          性别: z.string().prefault(''),
          叙事代词: z.string().prefault(''),
          年龄描述: z.string().prefault(''),
          种族: z.string().prefault(''),
          外貌: z.string().prefault(''),
          原世界: z.string().prefault(''),
          身份: z.string().prefault(''),
          经历: z.string().prefault(''),
          持有者补充: z.string().optional(),
          玩家补充: z.string().optional(),
          称呼: z.string().prefault(''),
          体貌: z.string().prefault(''),
          发色发型: z.string().prefault(''),
          瞳色特征: z.string().prefault(''),
          衣着: z.string().prefault(''),
          性格标签: z.string().prefault(''),
          行事边界: z.string().prefault(''),
          擅长: z.string().prefault(''),
          局限: z.string().prefault(''),
          力量体系: z.string().prefault(''),
          原有能力: z.string().prefault(''),
          随身物品: z.string().prefault(''),
          关系牵挂: z.string().prefault(''),
          旅途意向: z.string().prefault(''),
        }).transform(({ 玩家补充, ...profile }) => ({ ...profile, 持有者补充: profile.持有者补充 ?? 玩家补充 ?? '' }))
        .prefault({}),
      机缘记录: z.string().prefault(''),
      起源涅槃已获得: z.boolean().prefault(false),
      伴生灵ID: z.string().nullable().prefault(null),
    })
    .prefault({}),
  _时空: z
    .object({
      起源时刻秒: z.coerce.number().prefault(0),
      当前地点: z
        .object({
          位面ID: z.string().prefault(''),
          地点ID: z.string().prefault(''),
          大陆: z.string().prefault(''),
          城市: z.string().prefault(''),
          区域: z.string().prefault(''),
          场景: z.string().prefault(''),
          具体位置: z.string().prefault(''),
        })
        .prefault({}),
      位面目录: z
        .record(
          z.string().describe('位面ID'),
          z.object({
            名称: z.string().prefault(''),
            来源: z.enum(['预设', '生成']).prefault('生成'),
            // 条目名由脚本登记；EJS 对预设位面使用静态映射。
            世界书条目: z.string().prefault(''),
            简介: z.string().max(3000).prefault(''),
            已发现: z.boolean().prefault(false),
            时钟: z
              .object({
                起源基准秒: z.coerce.number().prefault(0),
                本地基准秒: z.coerce.number().prefault(0),
                本地每起源秒: z.coerce.number().nullable().prefault(null),
                历法说明: z.string().prefault(''),
                历法: z
                  .object({
                    名称: z.string(),
                    元年: z.coerce.number(),
                    每月天数: z.array(z.coerce.number()),
                    每天小时: z.coerce.number(),
                    每小时分钟: z.coerce.number(),
                    每分钟秒: z.coerce.number(),
                  })
                  .nullable()
                  .prefault(null),
              })
              .prefault({}),
          }),
        )
        .prefault({}),
    })
    .prefault({}),
  _实体: z
    .record(
      z.string().describe('人物、生物或危险源ID'),
      z.object({
        名称: z.string().prefault(''),
        类别: z.enum(['主角', '人物', '生物', '危险源']).prefault('人物'),
        档案: z
          .object({
            种族: z.string().prefault(''),
            外貌: z.string().prefault(''),
            身份: z.string().prefault(''),
            本土境界: z.string().prefault(''),
            力量体系说明: z.string().prefault(''),
            世界书条目: z.string().prefault(''),
            背景补充: z.string().prefault(''),
          })
          .prefault({}),
        位面ID: z.string().prefault(''),
        地点ID: z.string().prefault(''),
        种族ID: z.string().nullable().prefault(null),
        当前形态ID: z.string().nullable().prefault(null),
        形态: z
          .record(
            z.string().describe('形态ID'),
            z.object({
              名称: z.string().prefault(''),
              描述: z.string().prefault(''),
              图片: z.string().prefault(''),
            }),
          )
          .prefault({}),
        生命阶段: z.enum(['存活', '死亡', '重构中', '无生命']).prefault('存活'),
        // 未定标不是零血量；只有数值配置完成的实体能进入数值结算。
        生命: z.object({ 当前: z.coerce.number(), 上限: z.coerce.number() }).nullable().prefault(null),
        资源: z
          .record(
            z.string().describe('资源ID'),
            z.object({
              名称: z.string().prefault(''),
              当前: z.coerce.number(),
              上限: z.coerce.number().nullable().prefault(null),
              单位: z.string().prefault('点'),
            }),
          )
          .prefault({}),
        属性: z.record(z.string().describe('已登记属性ID'), z.coerce.number()).prefault({}),
        战斗: z
          .object({
            攻击: z.coerce.number(),
            防御: z.coerce.number(),
            命中率: z.coerce.number(),
            闪避率: z.coerce.number(),
            暴击率: z.coerce.number(),
            暴击倍率: z.coerce.number(),
            抗性: z.record(z.string().describe('机制ID'), z.coerce.number()).prefault({}),
          })
          .nullable()
          .prefault(null),
        能力ID: z.record(z.string().describe('能力ID'), z.boolean()).prefault({}),
        状态: z
          .record(
            z.string().describe('状态实例ID'),
            z.object({
              规则ID: z.string().prefault(''),
              来源事件ID: z.string().prefault(''),
              层数: z.coerce.number().prefault(1),
              结束起源秒: z.coerce.number().nullable().prefault(null),
              参数: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).prefault({}),
            }),
          )
          .prefault({}),
        装备: z.record(z.string().describe('自定义装备位置'), z.string().describe('物品实例ID')).prefault({}),
        数值规则版本: z.string().prefault(''),
      }),
    )
    .prefault({}),
  _能力: z
    .record(
      z.string().describe('能力ID'),
      z.object({
        名称: z.string().prefault(''),
        品阶: GradeSchema.prefault('凡常'),
        等级: z.number().int().min(1).max(20).prefault(1),
        熟练度: z.number().int().min(0).prefault(0),
        进化次数: z.number().int().min(0).max(3).prefault(0),
        进化方向: z.string().prefault(''),
        描述: z.string().prefault(''),
        来源: z
          .object({
            类型: z.enum(['初始', '死亡', '学习', '训练', '天赋', '传承', '契约', '改造', '其他']).prefault('其他'),
            死亡事件ID: z.string().nullable().prefault(null),
            来源实体ID: z.string().nullable().prefault(null),
            说明: z.string().prefault(''),
          })
          .prefault({}),
        机制ID: z.record(z.string().describe('机制ID'), z.boolean()).prefault({}),
        用法: z.enum(['主动', '被动', '复合']).prefault('主动'),
        规则状态: z.enum(['待定标', '可结算']).prefault('待定标'),
        触发条件: z.string().prefault(''),
        效果: z
          .record(
            z.string().describe('效果ID'),
            z.object({
              规则ID: z.string().prefault(''),
              参数: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).prefault({}),
            }),
          )
          .prefault({}),
        消耗: z.record(z.string().describe('资源ID'), z.coerce.number()).prefault({}),
        冷却本地秒: z.coerce.number().prefault(0),
        限制: z.string().prefault(''),
        成长记录: z.record(z.string().describe('成长事件ID'), z.string()).prefault({}),
      }),
    )
    .prefault({}),
  _物品: z
    .record(
      z.string().describe('物品实例ID'),
      z.object({
        名称: z.string().prefault(''),
        品阶: GradeSchema.prefault('凡常'),
        类别: z.enum(['装备', '消耗品', '材料', '货币', '其他']).prefault('其他'),
        描述: z.string().prefault(''),
        数量: z.coerce.number().prefault(1),
        单位: z.string().prefault('件'),
        所在: z
          .object({
            类型: z.enum(['实体', '地点', '容器']).prefault('地点'),
            ID: z.string().prefault(''),
          })
          .prefault({}),
        复苏绑定实体ID: z.string().nullable().prefault(null),
        能力ID: z.record(z.string().describe('能力ID'), z.boolean()).prefault({}),
        耐久: z.object({ 当前: z.coerce.number(), 上限: z.coerce.number() }).nullable().prefault(null),
      }),
    )
    .prefault({}),
  _锚点: z
    .record(
      z.string().describe('锚点ID'),
      z.object({
        名称: z.string().prefault(''),
        位面ID: z.string().prefault(''),
        地点ID: z.string().prefault(''),
        状态: z.enum(['可用', '失效', '未确认']).prefault('未确认'),
        建立事件ID: z.string().prefault(''),
      }),
    )
    .prefault({}),
  _死亡记录: z
    .record(
      z.string().describe('死亡事件ID'),
      z.object({
        实体ID: z.string().prefault('player'),
        起源时刻秒: z.coerce.number().prefault(0),
        位面ID: z.string().prefault(''),
        地点ID: z.string().prefault(''),
        结算事件ID: z.string().prefault(''),
        因果链: z
          .record(
            z.string().describe('有序原因ID'),
            z.object({
              顺序: z.coerce.number().prefault(0),
              来源实体ID: z.string().nullable().prefault(null),
              机制ID: z.string().prefault(''),
              作用条件: z.string().prefault(''),
              实际伤害: z.coerce.number().nullable().prefault(null),
              直接致死: z.boolean().prefault(false),
            }),
          )
          .prefault({}),
        已参与防护: z.record(z.string().describe('能力ID'), z.string()).prefault({}),
        授予能力ID: z.record(z.string().describe('能力ID'), z.boolean()).prefault({}),
        能力授予状态: z.enum(['待解析', '已完成']).prefault('待解析'),
        复苏完成起源秒: z.coerce.number().nullable().prefault(null),
      }),
    )
    .prefault({}),
  _复苏: z
    .object({
      死亡事件ID: z.string(),
      锚点ID: z.string().nullable(),
      开始起源秒: z.coerce.number(),
      完成起源秒: z.coerce.number().nullable(),
      规则ID: z.string(),
      阶段: z.enum(['待确定', '重构中', '可复苏']),
    })
    .nullable()
    .prefault(null),
  _任务: z
    .record(
      z.string().describe('任务ID'),
      z.object({
        名称: z.string().prefault(''),
        来源实体ID: z.string().nullable().prefault(null),
        描述: z.string().prefault(''),
        目标: z
          .record(
            z.string().describe('目标ID'),
            z.object({
              描述: z.string().prefault(''),
              当前: z.coerce.number().prefault(0),
              所需: z.coerce.number().prefault(1),
              单位: z.string().prefault('次'),
            }),
          )
          .prefault({}),
        截止起源秒: z.coerce.number().nullable().prefault(null),
        状态: z.enum(['可接受', '进行中', '待结算', '已完成', '已失效', '已放弃']).prefault('可接受'),
        奖励说明: z.string().prefault(''),
        后果说明: z.string().prefault(''),
        结算事件ID: z.string().nullable().prefault(null),
      }),
    )
    .prefault({}),
  _结算: z
    .object({
      分支ID: z.string().prefault(''),
      状态版本: z.coerce.number().prefault(0),
      最近事件ID: z.string().nullable().prefault(null),
      遭遇ID: z.string().nullable().prefault(null),
      冷却结束: z.record(z.string().describe('实体ID与能力ID组成的冷却键'), z.coerce.number()).prefault({}),
    })
    .prefault({}),
  叙事: z
    .object({
      首次资料完成: z.boolean().prefault(false),
      人物档案: z.record(z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), CharacterDossierSchema).prefault({}),
      记忆摘要: z.string().max(1200).prefault(''),
      本轮结算: z.object({ 起算状态版本: z.number().int().nonnegative(), 操作: z.array(OperationSchema).max(MAX_TURN_OPERATIONS) }).nullable().prefault(null),
      本轮时间: z
        .object({
          起算起源秒: z.number().nonnegative(),
          经过本地秒: z.number().nonnegative().max(86400),
        })
        .nullable()
        .prefault(null),
      天气: z.string().prefault(''),
      场景描述: z.string().prefault(''),
      见闻: z
        .record(
          z.string().describe('见闻ID'),
          z.object({
            类别: z.enum(['人物', '生物', '地点', '位面', '能力', '物品', '事件']).prefault('事件'),
            对象ID: z.string().prefault(''),
            标题: z.string().prefault(''),
            内容: z.string().prefault(''),
            可信度: z.enum(['观察', '转述', '推测']).prefault('观察'),
            来源: z.string().prefault(''),
            知情者ID: z.record(z.string().describe('实体ID'), z.boolean()).prefault({}),
          }),
        )
        .prefault({}),
      关系: z
        .record(
          z.string().describe('关系ID'),
          z.object({
            主体ID: z.string().prefault(''),
            对象ID: z.string().prefault(''),
            已发生互动: z.string().prefault(''),
            已表达态度: z.string().prefault(''),
            已有约定: z.string().prefault(''),
          }),
        )
        .prefault({}),
      外界事件: z
        .record(
          z.string().describe('事件ID'),
          z.object({
            位面ID: z.string().prefault(''),
            地点ID: z.string().prefault(''),
            进展: z.string().prefault(''),
            因果依据: z.string().prefault(''),
            状态: z.enum(['进行中', '已结束', '未知']).prefault('进行中'),
          }),
        )
        .prefault({}),
    })
    .prefault({}),
  待审提案: z
    .record(
      z.string().describe('提案ID'),
      z.object({
        类型: z
          .enum(['行动', '时间推进', '移动', '能力定义', '实体定义', '物品变化', '位面定义', '任务变化'])
          .prefault('行动'),
        主体ID: z.string().prefault(''),
        目标ID: z.record(z.string(), z.boolean()).prefault({}),
        能力ID: z.string().nullable().prefault(null),
        原文引用: z.string().optional(),
        玩家原文引用: z.string().optional(),
        内容: z.string().prefault(''),
        操作: OperationSchema.nullable().prefault(null),
        预期状态版本: z.coerce.number().prefault(0),
      }).transform(({ 玩家原文引用, ...proposal }) => ({ ...proposal, 原文引用: proposal.原文引用 ?? 玩家原文引用 ?? '' })),
    )
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;

// 接收层保留原始批次，由本卡在提交前整体校验，避免MVU先丢弃无效操作却提交了时间。
export const MvuInputSchema = Schema.extend({
  叙事: Schema.shape.叙事.unwrap().extend({
    本轮时间: z.unknown().prefault(null),
    本轮结算: z.unknown().prefault(null),
  }).prefault({}),
});
