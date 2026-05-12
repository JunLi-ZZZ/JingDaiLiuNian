import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// --- 工具函数 ---

// 布尔值预处理器，将"是"转换为true
const boolPreprocess = (defaultVal = false) => z.preprocess(
    v => 'string' == typeof v ? '是' === v : v,
    z.boolean()
).prefault(defaultVal);

// 数字范围限制器
const clampNum = (defaultVal, min, max) => z.coerce.number()
    .prefault(defaultVal)
    .transform(v => _.clamp(v, min, max));

// 字符串默认值工具
const str = (val = '') => z.string().prefault(val);

// 宽容输入工具：旧档字段类型不匹配时回退到安全默认值
const isPlainObject = v => !!v && 'object' === typeof v && !Array.isArray(v);
const safeStr = (val = '') => z.preprocess(v => 'string' === typeof v ? v : val, z.string());
const safeNum = (val = 0) => z.preprocess(v => {
    if ('number' === typeof v) return Number.isFinite(v) ? v : val;
    if ('string' === typeof v) {
        const trimmed = v.trim();
        if (!trimmed) return val;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : val;
    }
    return val;
}, z.number());
const safeStrArray = (val = []) => z.preprocess(
    v => Array.isArray(v) ? v.filter(item => 'string' === typeof item) : val,
    z.array(z.string())
);

// --- D&D 5e 六维属性基础 ---
const dndStats = {
    力量: 10,
    敏捷: 10,
    体质: 10,
    智力: 10,
    感知: 10,
    魅力: 10
};

// --- DNF 装备品质枚举 ---
const qualityEnum = z.enum(['普通', '精良', '稀有', '神器', '传说', '史诗', '神话']).prefault('普通');

// --- 技能阶位枚举 ---
const skillTierEnum = z.enum(['基础', '转职', '进阶', '必杀', '奥义', '觉醒一', '觉醒二', '觉醒三']);

// --- 单个技能 Schema ---
const skillSchema = z.object({
    名称: str(''),
    类型: z.enum(['主动', '召唤', '特殊', '职业特殊']).prefault('主动'),
    阶位: skillTierEnum.prefault('基础'),
    描述: str(''),
    召唤物名称: str('').optional(),
    特殊效果: z.record(z.string(), z.string()).prefault({ '无': '' }),
    习得等级: z.coerce.number().prefault(1),
    等级上限: z.coerce.number().prefault(15),
    SP消耗: z.coerce.number().prefault(10),
    冷却: z.coerce.number().prefault(0),
    伤害倍率: z.coerce.number().prefault(0),
    当前等级: clampNum(0, 0, 30),
    冷却计数: z.coerce.number().prefault(0),
    是否装备: boolPreprocess(false),
    组合模式启用: boolPreprocess(false)
});

// --- 装备槽技能 Schema（精简版，用于战斗） ---
const equippedSkillSchema = z.object({
    名称: str(''),
    类型: z.enum(['主动', '召唤', '特殊', '职业特殊']).prefault('主动'),
    技能等级: z.coerce.number().prefault(1),
    冷却中: boolPreprocess(false),
    伤害倍率: z.coerce.number().prefault(0),
    阶位: skillTierEnum.prefault('基础'),
    召唤物名称: str('').optional(),
    特殊效果: z.record(z.string(), z.string()).prefault({ '无': '' }),
    描述: str('')
});

// --- 召唤物 Schema（单体/集群统一） ---
const summonSchema = z.object({
    名称: str(''),
    HP: z.coerce.number().prefault(1),
    HP上限: z.coerce.number().prefault(1),
    AC: z.coerce.number().prefault(10),
    技能倍率: str(''),
    持续时间: str('永久')
});

// --- 连携奥义装备槽 Schema ---
const comboSlotSchema = z.object({
    伙伴: str(''),
    技能名: str(''),
    类型: str(''),
    效果: str(''),
    描述: str('')
}).prefault({});

// --- 完整技能树 Schema ---
const skillTreeSchema = z.object({
    技能列表: z.record(z.string(), skillSchema).prefault({}),
    总SP: z.coerce.number().prefault(0),
    已使用SP: z.coerce.number().prefault(0)
}).prefault({});

// --- 组合技能配置 Schema ---
const comboSlotArraySchema = z.tuple([str(''), str(''), str('')]).prefault(['', '', '']);
const comboGroupConfigSchema = z.object({
    alpha: comboSlotArraySchema,
    beta: comboSlotArraySchema,
    gamma: comboSlotArraySchema,
    ultimate: comboSlotArraySchema
}).prefault({});
const comboSkillStateSchema = z.object({
    当前高级组: z.enum(['alpha', 'beta', 'gamma']).prefault('alpha'),
    当前显示槽: z.enum(['advanced', 'ultimate']).prefault('advanced'),
    custom: boolPreprocess(false),
    基础技能槽: comboSlotArraySchema,
    转职技能槽: comboSlotArraySchema,
    高级技能组配置: comboGroupConfigSchema
}).prefault({});

// --- 资源技能 Schema ---
// 用于记录随短休/长休/自定义条件恢复的功能型技能资源
const resourceSkillSchema = z.object({
    品质: str('普通'),
    类型: str(''),
    消耗: str('无'),
    剩余次数: z.coerce.number().prefault(0),
    次数上限: z.coerce.number().prefault(0),
    恢复条件: str(''),
    标签: z.array(z.string()).prefault([]),
    效果: z.record(z.string(), z.string()).prefault({}),
    描述: str('')
}).transform(r => ({
    ...r,
    标签: _.uniq(r.标签 || [])
}));

const mythicLayerEntrySchema = z.preprocess(
    v => isPlainObject(v) ? v : {},
    z.object({
        溯源: safeStrArray([]),
        效果: safeStr('')
    })
);

const mythicLayerSchema = z.preprocess(
    v => isPlainObject(v) ? v : {},
    z.record(
        z.string().describe('道途层级项名称'),
        mythicLayerEntrySchema
    )
);

const mythicPathSchema = z.preprocess(
    v => isPlainObject(v) ? v : {},
    z.object({
        道途名称: safeStr(''),
        阶段: safeNum(0),
        当前源力: safeNum(0),
        源力上限: safeNum(0),
        要素: mythicLayerSchema,
        奇迹: mythicLayerSchema,
        权能: mythicLayerSchema,
        世界影响: z.preprocess(
            v => isPlainObject(v) ? v : {},
            z.object({
                概念标签: safeStrArray([]),
                特殊效果: safeStr('')
            })
        ),
        道途能力: safeStrArray([])
    }).transform(r => ({
        ...r,
        阶段: Math.max(0, Number.isFinite(Number(r.阶段)) ? Number(r.阶段) : 0),
        源力上限: Math.max(0, Number.isFinite(Number(r.源力上限)) ? Number(r.源力上限) : 0),
        当前源力: _.clamp(
            Number.isFinite(Number(r.当前源力)) ? Number(r.当前源力) : 0,
            0,
            Math.max(0, Number.isFinite(Number(r.源力上限)) ? Number(r.源力上限) : 0)
        ),
        道途能力: _.uniq(r.道途能力 || []),
        世界影响: {
            ...r.世界影响,
            概念标签: _.uniq(r.世界影响?.概念标签 || [])
        }
    }))
);

// --- 装备属性加成 Schema ---
// 属性加成: { "属性名": 数值 }
// 例: { "力量": 5, "暴击率": 3, "基础": 1 }
const equipBonusSchema = z.record(z.string(), z.coerce.number()).prefault({});

// --- 装备部位 ---
// 武器: 主手 | 副手  (副手仅巨人种可用)
// 防具: 护肩 | 上衣 | 腰带 | 下装 | 鞋子
// 首饰: 戒指 | 手镯 | 项链
// 「装备箱」字段为布尔值，true=未穿戴存放在装备箱中，false=已穿戴

// --- 统一装备 Schema ---
// 所有装备（武器/防具/首饰）统一存储，通过 类型+部位 区分
const equipmentSchema = z.object({
    类型: str('武器'),              // 武器 | 防具 | 首饰
    部位: str('主手'),              // 装备对应的槽位，始终保留真实部位
    装备箱: boolPreprocess(true),   // true=在装备箱中(未穿戴)，false=已穿戴
    名称: str(''),
    品质: str('普通'),              // 普通 | 精良 | 稀有 | 神器 | 传说 | 史诗 | 神话
    标签: z.array(z.string()).prefault([]),
    等级: clampNum(1, 1, 100),
    品级: z.coerce.number().nullable().prefault(null),
    强化等级: clampNum(0, 0, 20),   // 仅武器有意义
    属性加成: equipBonusSchema,
    效果: str(''),                  // 非枚举效果文本
    描述: str(''),
    // 武器专用 (脚本自动计算，AI无需提供)
    伤害骰: str('').optional(),
    等级系数: z.coerce.number().optional(),
    固定伤害: z.coerce.number().optional(),
    // 防具/首饰专用 (脚本自动计算，AI无需提供)
    防御力: z.coerce.number().optional()
});

// --- 种族棋子枚举 ---
const raceChessEnum = z.enum([
    '神灵种', '幻想种', '精灵种', '龙精种', '巨人种', '天翼种',
    '森精种', '妖魔种', '妖精种', '机凯种', '地精种', '吸血种',
    '月咏种', '兽人种', '海栖种', '人类种'
]);

// --- 道具类型枚举 ---
const itemTypeEnum = z.enum(['消耗品', '材料', '杂物', '任务物品', '唯一物品']).prefault('消耗品');

// --- 背包物品 Schema ---
const bagItemSchema = z.object({
    品质: qualityEnum,
    数量: clampNum(1, 0, 99999),
    类型: itemTypeEnum,
    标签: z.array(z.string()).prefault([]),
    效果: str(''),
    描述: str('')
}).transform(r => _.pick({
    ...r,
    标签: _.uniq(r.标签 || [])
}, ['品质', '数量', '类型', '标签', '效果', '描述']));

// --- 任务 Schema ---
const questSchema = z.object({
    委托方: str(''),
    标题: str(''),
    简介: str(''),
    目标: str(''),
    奖励: str(''),
    交付: str('')
});

// --- 附近的人 NPC Schema ---
const nearbyPersonSchema = z.object({
    性别: str(''),
    种族: str(''),
    等级: clampNum(1, 1, 100),
    外貌: str(''),
    着装: str(''),
    属性: z.object(
        _.mapValues(dndStats, () => z.coerce.number().prefault(10))
    ).prefault({}),
    装备列表: z.record(z.string(), equipmentSchema).prefault({})
});

// --- 羁绊角色技能 Schema ---
const bondSkillSchema = z.object({
    品质: str(''),
    类型: str(''),
    效果: str(''),
    描述: str('')
});

// --- 羁绊列表 Schema ---
const bondSchema = z.object({
    性别: str(''),
    附近: boolPreprocess(false),
    种族: str(''),
    等级: clampNum(1, 1, 100),
    当前总经验: z.coerce.number().prefault(0),
    升级阈值: z.coerce.number().prefault(100),
    生命值上限: z.coerce.number().prefault(0).transform(v => Math.max(v, 1)),
    当前生命值: z.coerce.number().prefault(0),
    属性: z.object(
        _.mapValues(dndStats, () => z.coerce.number().prefault(10))
    ).prefault({}),
    战斗属性: z.object({
        暴击率: clampNum(0, 0, 100).default(0),
        暴击伤害: z.coerce.number().default(1.2),
        暴击阈值: z.coerce.number().default(10),
        物理减伤: z.coerce.number().default(0),
        魔法减伤: z.coerce.number().default(0),
        武器面板: z.object({
            伤害骰: str(''),
            等级系数: z.coerce.number().prefault(1),
            固定伤害: z.coerce.number().prefault(0)
        }).optional()
    }).default({}),
    装备列表: z.record(z.string(), equipmentSchema).prefault({}),
    技能: z.record(z.string(), bondSkillSchema).prefault({}),
    外貌: str(''),
    着装: str(''),
    好感度: clampNum(0, -100, 100),
    同行誓约: boolPreprocess(false),
    分享经验: boolPreprocess(true),
    连携奥义: z.record(z.string(), bondSkillSchema).prefault({}),
    当前想法: str('')
});

// --- 主 Schema 定义 ---
export const Schema = z.object({

    // ===== 世界信息 =====
    世界信息: z.object({
        年历: str('阿拉德历990年3月1日'),
        时间: z.enum(['清晨', '上午', '中午', '下午', '傍晚', '入夜', '深夜', '凌晨', '黎明']).prefault('清晨'),
        世界剧情: str(''),
        位置: z.object({
            大陆: str('阿拉德大陆'),
            区域: str('艾尔文防线'),
            场所: str('')
        }).prefault({})
    }).prefault({}),

    // ===== 任务列表 =====
    任务列表: z.record(
        z.string().describe('任务名'),
        questSchema
    ).prefault({}),

    // ===== 附近的人 =====
    附近的人: z.record(
        z.string().describe('姓名'),
        nearbyPersonSchema
    ).prefault({}),

    // ===== 羁绊列表 =====
    羁绊列表: z.record(
        z.string().describe('角色名'),
        bondSchema
    ).prefault({}),

    // ===== 人物属性 =====
    人物: z.object({
        名称: str(''),
        种族: str('人类'),
        职业: str(''),
        背景设定: str(''),
        特质: z.record(
            z.string().describe('特质名'),
            z.object({
                标签: z.array(z.string()).prefault([]),
                描述: z.string().prefault('')
            })
        ).prefault({}),
        等级: clampNum(1, 1, 100),
        当前总经验: z.coerce.number().prefault(0),
        升级阈值: z.coerce.number().prefault(100),
        RP: z.coerce.number().prefault(0),
        额外特质槽: z.coerce.number().prefault(0),
        生命值上限: z.coerce.number().prefault(0).transform(v => Math.max(v, 1)),
        当前生命值: z.coerce.number().prefault(0),
        临时生命值: z.coerce.number().prefault(0),
        SP: z.coerce.number().prefault(0),
        AC: z.coerce.number().prefault(10),
        CP: clampNum(0, 0, 100),

        战斗属性: z.object({
            暴击率: clampNum(0, 0, 100).default(0),
            暴击伤害: z.coerce.number().default(1.2),
            暴击阈值: z.coerce.number().default(10),
            物理减伤: z.coerce.number().default(0),
            魔法减伤: z.coerce.number().default(0),
            武器面板: z.object({
                伤害骰: str(''),
                等级系数: z.coerce.number().prefault(1),
                固定伤害: z.coerce.number().prefault(0)
            }).optional()
        }).default({}),

        属性: z.object({
            ..._.mapValues(dndStats, () => z.coerce.number().prefault(10)),
            属性点: z.coerce.number().prefault(0)
        }).prefault({}),

        技能树: skillTreeSchema,

        资源技能: z.record(
            z.string().describe('技能名称'),
            resourceSkillSchema
        ).prefault({}),

        道途: mythicPathSchema,

        // ===== 召唤物 =====
        // 1个时用 summonSingleSchema，≥2个时合并为集群用 summonClusterSchema
        召唤物: z.record(z.string(), summonSchema).prefault({}),

        主动技能槽: z.record(z.string(), equippedSkillSchema).prefault({}),
        觉醒技能槽: z.record(z.string(), equippedSkillSchema).prefault({}),
        连携奥义槽: comboSlotSchema,

        状态效果: z.record(
            z.string().describe('状态名'),
            z.object({
                类型: z.enum(['BUFF', 'DEBUFF']).prefault('BUFF'),
                持续时间: str('永久'),
                描述: str(''),
                属性影响: z.record(z.string(), z.coerce.number()).prefault({}),
                特殊影响: str('')
            })
        ).prefault({}),

        // ===== 背包 =====
        背包: z.object({
            金币: z.coerce.number().prefault(0).transform(Math.floor),
            道具: z.record(
                z.string().describe('道具名'),
                bagItemSchema
            ).prefault({})
        }).prefault({}).transform(r => ({
            ...r,
            道具: _.pickBy(r.道具, item => item.数量 > 0)
        })),

        // ===== 装备列表 (统一存储所有装备) =====
        // key: 装备唯一标识 (装备名_序号)
        // 穿脱装备只需 replace 部位字段，无需移动数据
        装备列表: z.record(
            z.string().describe('装备唯一标识'),
            equipmentSchema
        ).prefault({}),

        // ===== 声望 =====
        // key: 阵营/组织名称
        // 记录角色在各个组织或地区的声望
        声望: z.record(
            z.string().describe('阵营名称'),
            z.object({
                阵营名称: str(''),
                声望值: z.coerce.number().prefault(0),
                声望等级: str('中立'),
                描述: str('')
            })
        ).prefault({})
    }).prefault({}),

    // ===== 核心资产与领地 =====
    核心资产: z.record(
        z.string().describe('资产名称'),
        z.object({
            类型: str('房产'),
            主体规模: clampNum(1, 1, 10),
            所在地: str(''),
            状态: str('空置中'),
            建设序列: z.record(
                z.string().describe('建设方向'),
                z.object({
                    建设阶段: str('基础'),
                    核心设施: z.array(z.string()).prefault([]),
                    功能: str(''),
                    产出: str(''),
                    下次产出日期: str('')
                })
            ).prefault({}),
            驻扎人员: z.record(
                z.string().describe('角色名'),
                str('')
            ).prefault({}),
            待办事件: z.array(z.string()).prefault([])
        })
    ).prefault({}),

    // ===== 种族棋子收藏 =====
    种族棋子收藏: z.object({
        神灵种: z.boolean().optional(),
        幻想种: z.boolean().optional(),
        精灵种: z.boolean().optional(),
        龙精种: z.boolean().optional(),
        巨人种: z.boolean().optional(),
        天翼种: z.boolean().optional(),
        森精种: z.boolean().optional(),
        妖魔种: z.boolean().optional(),
        妖精种: z.boolean().optional(),
        机凯种: z.boolean().optional(),
        地精种: z.boolean().optional(),
        吸血种: z.boolean().optional(),
        月咏种: z.boolean().optional(),
        兽人种: z.boolean().optional(),
        海栖种: z.boolean().optional(),
        人类种: z.boolean().optional()
    }).prefault({}),

    // ===== 传闻 =====
    传闻: z.object({
        街头巷议: z.record(
            z.string().describe('传闻标题'),
            z.object({
                说书人: str(''),
                内容: str(''),
                可信度: z.enum(['酒话', '可疑', '或许可信']).prefault('可疑')
            })
        ).prefault({}),
        情报交易: z.record(
            z.string().describe('情报名'),
            z.object({
                卖家: str(''),
                摘要: str(''),
                要价: z.coerce.number().prefault(0)
            })
        ).prefault({}),
        布告与檄文: z.record(
            z.string().describe('标题'),
            z.object({
                发布者: str(''),
                内容: str(''),
                张贴位置: str('')
            })
        ).prefault({})
    }).prefault({}),

    // ===== 战斗状态 =====
    战斗: z.object({
        是否战斗中: boolPreprocess(false),
        当前轮次: z.coerce.number().prefault(0),
    }).prefault({}),

    // ===== 当前事件 =====
    当前事件: z.record(
        z.string().describe('事件名称'),
        z.any()
    ).prefault({}),

    // ===== 系统配置 =====
    系统配置: z.object({
        技能系统模式: z.enum(['classic', 'combo']).prefault('classic'),
        组合技能状态: comboSkillStateSchema,
        世界观: str(''),
        对白美化: z.array(z.string()).prefault([]),
        敌人倍率: z.object({
            杂兵: z.object({ 伤害倍率: z.coerce.number().prefault(1), HP倍率: z.coerce.number().prefault(1) }).prefault({}),
            精锐: z.object({ 伤害倍率: z.coerce.number().prefault(1.5), HP倍率: z.coerce.number().prefault(2) }).prefault({}),
            首领: z.object({ 伤害倍率: z.coerce.number().prefault(2), HP倍率: z.coerce.number().prefault(5) }).prefault({}),
            领主: z.object({ 伤害倍率: z.coerce.number().prefault(2.5), HP倍率: z.coerce.number().prefault(10) }).prefault({}),
            传奇: z.object({ 伤害倍率: z.coerce.number().prefault(3), HP倍率: z.coerce.number().prefault(20) }).prefault({})
        }).prefault({})
    }).prefault({})

}).transform(data => {
    data.人物.当前生命值 = _.clamp(data.人物.当前生命值, 0, data.人物.生命值上限);
    Object.values(data.人物.资源技能 || {}).forEach(skill => {
        if (!skill) return;
        const maxCount = Number(skill.次数上限);
        const leftCount = Number(skill.剩余次数);
        const safeMax = Number.isFinite(maxCount) ? Math.max(0, maxCount) : 0;
        skill.次数上限 = safeMax;
        skill.剩余次数 = _.clamp(Number.isFinite(leftCount) ? leftCount : 0, 0, safeMax);
    });
    Object.values(data.羁绊列表 || {}).forEach(bond => {
        if (!bond) return;
        const curHp = Number(bond.当前生命值);
        const maxHp = Number(bond.生命值上限);
        bond.当前生命值 = _.clamp(Number.isFinite(curHp) ? curHp : 0, 0, Number.isFinite(maxHp) ? Math.max(maxHp, 1) : 1);
    });
    return data;
});

// 注册 Schema
$(() => {
    registerMvuSchema(Schema);
});
