import { Schema } from './schema';

/** 登记路由并不代表主角已发现这些世界。跨位面时间倍率尚未定案。 */
export const presetPlanes = {
  main: '主世界',
  cangming: '苍溟界',
  mangcang: '莽苍太古界',
  yanyun: '晏云界',
  xiguang: '曦光穹界',
  yunmiao: '云渺万灵界',
} as const;

/** 仅在玩家选择快速开始时应用的可修改预设，不是所有存档的 schema 默认值。 */
export const defaultProtagonist = {
  姓名: '归来者',
  性别: '未指定',
  年龄描述: '成年',
  种族: '人类',
  外貌: '日常便装，随身携带一个旅行包。',
  原世界: '主世界',
  身份: '星见市的普通居民',
  经历: '初微的衍生与末墟的终末交融所诞生的生命，在主世界以普通居民的身份成长。第一次死亡才让这段来源逐渐显现。',
  持有者补充: '',
};

export function createUninitializedState(): Schema {
  return Schema.parse({
    _时空: {
      位面目录: Object.fromEntries(
        Object.entries(presetPlanes).map(([id, name]) => [
          id,
          {
            名称: name,
            来源: '预设',
            世界书条目: `余烬之后_位面_${name}`,
          },
        ]),
      ),
    },
  });
}
