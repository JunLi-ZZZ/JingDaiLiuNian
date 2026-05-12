import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const schema = z.object({
  世界状态: z.object({
    当前时代: z.enum(['斗一', '斗二', '斗三']).or(z.literal('待初始化')).prefault('待初始化'),
    当前日期: z.string().prefault('待初始化'),
    当前区域: z.string().prefault('待初始化'),
    当前场景: z.string().prefault('待初始化'),
    当前场景类型: z.enum(['日常', '战斗', '修炼', '旅行', '猎魂', '亲密', '社交', '购物', '比赛', '考核', '拍卖']).prefault('日常'),
    剧情章节: z.string().prefault('待初始化'),
    年表时期: z.string().prefault('待初始化'),
  }).prefault({}),

  玩家: z.object({
    基础信息: z.object({
      姓名: z.string().prefault('待初始化'),
      年龄: z.coerce.number().prefault(12),
      性别: z.string().prefault('待初始化'),
      种族: z.enum(['人类', '魂兽']).or(z.literal('待初始化')).prefault('待初始化'),
      身份: z.string().prefault('待初始化'),
      所属势力: z.string().prefault('无'),
      先天魂力: z.coerce.number().transform(v => _.clamp(v, 0, 10)).prefault(0),
      魂师称号: z.string().prefault('待初始化'),
      魂导师等级: z.string().prefault('非魂导师'),
      封号: z.string().prefault('无'),
      外貌: z.string().prefault('待初始化'),
    }).prefault({}),

    魂兽信息: z.object({
      名字: z.string().prefault('无'),
      种族信息: z.string().prefault('无'),
      年限: z.string().prefault('无'),
      血脉等级: z.string().prefault('无'),
      兽形外貌: z.string().prefault('不适用'),
      属性: z.array(z.string()).transform(arr => _.uniq(arr)).prefault([]),
      化形状态: z.string().prefault('不适用'),
      天赋魂技: z.record(
        z.string().describe('魂技名称'),
        z.object({
          描述: z.string().prefault(''),
        }).prefault({})
      ).prefault({}),
    }).prefault({}),

    武魂信息: z.record(
      z.string().describe('武魂名称'),
      z.object({
        品质: z.string().prefault('待初始化'),
        体系: z.string().prefault('待初始化'),
        类别: z.string().prefault('待初始化'),
        元素属性: z.array(z.string()).transform(arr => _.uniq(arr)).prefault([]),
        先天领域: z.object({
          名称: z.string().prefault('无'),
          效果: z.string().prefault('无'),
        }).prefault({}),
        自创魂技: z.record(
          z.string().describe('魂技名称'),
          z.object({
            描述: z.string().prefault(''),
          }).prefault({})
        ).prefault({}),
        魂环: z.record(
          z.string().describe('魂环序号'),
          z.object({
            颜色: z.string().prefault(''),
            年限: z.string().prefault(''),
            来源魂兽: z.string().prefault(''),
            魂技: z.record(
              z.string().describe('魂技名称'),
              z.object({
                描述: z.string().prefault(''),
              }).prefault({})
            ).prefault({}),
          }).prefault({})
        ).prefault({}),
      }).prefault({})
    ).prefault({}),

    魂灵信息: z.record(
      z.string().describe('魂灵名称'),
      z.object({
        类型: z.string().prefault('人造魂灵'),
        当前年限: z.string().prefault(''),
        对应武魂: z.string().prefault(''),
        来源种族: z.string().prefault(''),
        外观: z.string().prefault(''),
        能力: z.string().prefault(''),
        描述: z.string().prefault(''),
      }).prefault({})
    ).prefault({}),

    功法: z.record(
      z.string().describe('功法名称'),
      z.object({
        描述: z.string().prefault(''),
      }).prefault({})
    ).prefault({}),

    修炼状态: z.object({
      魂力等级: z.coerce.number().transform(v => _.clamp(v, 0, 200)).prefault(0),
      当前魂力百分比: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(100),
    }).prefault({}),

    神位信息: z.object({
      神级等级: z.string().prefault('无'),
      法则掌控: z.array(z.string()).transform(arr => _.uniq(arr)).prefault([]),
      神位: z.record(
        z.string().describe('神位名称'),
        z.object({
          类型: z.string().prefault('传承'),
          描述: z.string().prefault(''),
          神装: z.string().prefault(''),
        }).prefault({})
      ).prefault({}),
      神技: z.record(
        z.string().describe('神技名称'),
        z.object({
          描述: z.string().prefault(''),
          所属神位: z.string().prefault(''),
        }).prefault({})
      ).prefault({}),
      神器: z.record(
        z.string().describe('神器名称'),
        z.object({
          等级: z.string().prefault('神器'),
          描述: z.string().prefault(''),
          所属神位: z.string().prefault(''),
        }).prefault({})
      ).prefault({}),
    }).prefault({}),

    精神力: z.object({
      精神力数值: z.coerce.number().prefault(0),
      精神力境界: z.string().prefault('不适用'),
    }).prefault({}),

    锻造信息: z.object({
      锻造师等级: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(0),
      锻造境界: z.string().prefault('不适用'),
    }).prefault({}),

    副职业: z.record(
      z.string().describe('职业名'),
      z.object({
        等级: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(0),
      }).prefault({})
    ).prefault({}),

    斗铠信息: z.object({
      斗铠名称: z.string().prefault('无'),
      斗铠等级: z.string().prefault('无'),
      斗铠外观: z.string().prefault('无'),
      斗铠部件: z.record(
        z.string().describe('部位名'),
        z.object({
          状态: z.string().prefault('未制作'),
          金属材质: z.string().prefault(''),
        }).prefault({})
      ).prefault({}),
    }).prefault({}),

    机甲信息: z.record(
      z.string().describe('机甲名称'),
      z.object({
        等级: z.string().prefault('无'),
        描述: z.string().prefault(''),
      }).prefault({})
    ).prefault({}),

    魂核: z.partialRecord(
      z.string(),
      z.object({
        属性: z.string().prefault(''),
        凝聚方式: z.string().prefault(''),
      }).prefault({})
    ).prefault({}),

    常规魂骨: z.partialRecord(
      z.string(),
      z.object({
        来源: z.string().prefault(''),
        年限: z.string().prefault(''),
        技能: z.record(
          z.string().describe('技能名称'),
          z.object({
            描述: z.string().prefault(''),
          }).prefault({})
        ).prefault({}),
      }).prefault({})
    ).prefault({}),

    外附魂骨: z.record(
      z.string().describe('魂骨名称'),
      z.object({
        来源: z.string().prefault(''),
        年限: z.string().prefault(''),
        技能: z.record(
          z.string().describe('技能名称'),
          z.object({
            描述: z.string().prefault(''),
          }).prefault({})
        ).prefault({}),
      }).prefault({})
    ).prefault({}),

    武魂融合技: z.record(
      z.string().describe('融合对象NPC名'),
      z.record(
        z.string().describe('融合技名称'),
        z.object({
          玩家武魂: z.string().prefault(''),
          NPC武魂: z.string().prefault(''),
          描述: z.string().prefault(''),
        }).prefault({})
      ).prefault({})
    ).prefault({}),

    金钱: z.object({
      金魂币: z.coerce.number().prefault(0),
      银魂币: z.coerce.number().prefault(0),
      铜魂币: z.coerce.number().prefault(0),
      联邦币: z.coerce.number().prefault(0),
      贡献点: z.coerce.number().prefault(0),
    }).prefault({}),

    物品栏: z.record(
      z.string().describe('物品名'),
      z.object({
        类型: z.string().prefault('其他'),
        描述: z.string().prefault(''),
        数量: z.coerce.number().prefault(1),
      }).prefault({})
    ).transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
     .prefault({}),
  }).transform(data => {
      if (data.基础信息.种族 !== '魂兽') {
        data.魂兽信息 = undefined;
      }
      return data;
    }).prefault({}),

  NPC列表: z.record(
    z.string().describe('NPC名称'),
    z.object({
      基础信息: z.object({
        性别: z.string().prefault('未知'),
        年龄: z.coerce.number().prefault(0),
        种族: z.string().prefault(''),
        身份: z.string().prefault(''),
        所属势力: z.string().prefault(''),
        当前动作: z.string().prefault(''),
        魂力等级: z.coerce.number().transform(v => _.clamp(v, 0, 200)).prefault(0),
        魂导师等级: z.string().prefault('非魂导师'),
        魂师称号: z.string().prefault(''),
        封号: z.string().prefault('无'),
        当前位置: z.string().prefault(''),
        外貌: z.string().prefault(''),
        是否在场: z.boolean().prefault(false),
      }).prefault({}),
      魂兽信息: z.object({
        种族信息: z.string().prefault('无'),
        年限: z.string().prefault('无'),
        血脉等级: z.string().prefault('无'),
        兽形外貌: z.string().prefault('不适用'),
        化形状态: z.string().prefault('不适用'),
      }).prefault({}),
      武魂信息: z.record(
        z.string().describe('武魂名称'),
        z.object({
          品质: z.string().prefault(''),
          系别: z.string().prefault(''),
          魂环: z.record(
            z.string().describe('魂环序号'),
            z.object({
              颜色: z.string().prefault(''),
              年限: z.string().prefault(''),
              来源魂兽: z.string().prefault(''),
              魂技: z.record(
                z.string().describe('魂技名称'),
                z.object({
                  描述: z.string().prefault(''),
                }).prefault({})
              ).prefault({}),
            }).prefault({})
          ).prefault({}),
        }).prefault({})
      ).prefault({}),
      魂灵信息: z.record(
        z.string().describe('魂灵名称'),
        z.object({
          类型: z.string().prefault('人造魂灵'),
          当前年限: z.string().prefault(''),
          外观: z.string().prefault(''),
        }).prefault({})
      ).prefault({}),
      神位信息: z.object({
        神位: z.array(z.string()).prefault([]),
        神级等级: z.string().prefault('无'),
        法则掌控: z.array(z.string()).prefault([]),
        神技: z.array(z.string()).prefault([]),
      }).prefault({}),
      关系列表: z.object({
        与玩家关系状态: z.string().prefault('路人'),
        对玩家好感度: z.coerce.number().transform(v => _.clamp(v, -100, 200)).prefault(0),
        与其他NPC关系: z.string().prefault('无'),
      }).prefault({}),
      私密档案: z.object({
        内心: z.object({
          性幻想: z.string().prefault('无'),
        }).prefault({}),
        服饰: z.object({
          上身: z.string().prefault(''),
          下身: z.string().prefault(''),
          内衣: z.string().prefault(''),
          内裤: z.string().prefault(''),
          袜子: z.string().prefault(''),
          鞋子: z.string().prefault(''),
        }).prefault({}),
        身体: z.object({
          乳房: z.string().prefault(''),
          乳头: z.string().prefault(''),
          小穴: z.string().prefault(''),
          菊穴: z.string().prefault(''),
          阴道: z.string().prefault(''),
          子宫: z.string().prefault(''),
          玉腿: z.string().prefault(''),
          玉足: z.string().prefault(''),
        }).prefault({}),
        生理状态: z.object({
          生理体质: z.string().prefault('无'),
          贞操状态: z.string().prefault('处女'),
          怀孕状态: z.string().prefault('未怀孕'),
          生理记录: z.string().prefault('无'),
        }).prefault({}),
      }).prefault({}),
    }).transform(npc => {
      if (npc.基础信息.性别 !== '女') {
        npc.私密档案 = undefined;
      }
      if (npc.基础信息.种族 !== '魂兽') {
        npc.魂兽信息 = undefined;
      }
      if (npc.基础信息.魂力等级 < 100) {
        npc.神位信息 = undefined;
      }
      return npc;
    })
  ).prefault({}),

  魂兽NPC: z.record(
    z.string().describe('NPC名称'),
    z.object({
      基础信息: z.object({
        种族信息: z.string().prefault(''),
        年限: z.string().prefault(''),
        血脉等级: z.string().prefault('普通魂兽'),
        元素属性: z.array(z.string()).transform(arr => _.uniq(arr)).prefault([]),
        当前动作: z.string().prefault(''),
        当前位置: z.string().prefault(''),
      }).prefault({}),
      兽形外貌: z.string().prefault(''),
      对玩家态度: z.string().prefault('中立'),
    }).prefault({})
  ).prefault({}),
});

$(() => {
  registerMvuSchema(schema);
})
