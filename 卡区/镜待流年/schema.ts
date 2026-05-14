export const Schema = z.object({
  _初始化完成: z.boolean().prefault(false),

  世界: z.object({
    当前时间: z.string().prefault(''),
    当前地点: z.object({
      位面: z.string().prefault(''),
      大陆: z.string().prefault(''),
      城市: z.string().prefault(''),
      区域: z.string().prefault(''),
      具体位置: z.string().prefault(''),
    }).prefault({}),
  }).prefault({}),

  主角: z.object({
    姓名: z.string().prefault(''),
    性别: z.string().prefault(''),
    年龄: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v),
    种族: z.string().prefault(''),
    喜好: z.string().prefault(''),
    厌恶: z.string().prefault(''),
    外貌特征: z.string().prefault(''),
    基础体型: z.string().prefault(''),
    天赋能力: z.string().prefault(''),
    财富: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v),
    境界: z.string().prefault('凡人'),
    所在位置: z.string().prefault(''),
    服装: z.object({
      上衣: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      内衣: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      下装: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      内裤: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      袜子: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      鞋子: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
    }).prefault({}),
    随身物品: z.record(z.string(), z.object({
      描述: z.string().prefault(''),
      数量: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v),
    })).prefault({}),
    人际关系: z.record(z.string(), z.string()).prefault({}),
  }).prefault({}),

  角色名录: z.record(z.string(), z.object({
    姓名: z.string().prefault(''),
    性别: z.string().prefault(''),
    年龄: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v),
    来源世界: z.string().prefault(''),
    种族: z.string().prefault(''),
    喜好: z.string().prefault(''),
    厌恶: z.string().prefault(''),
    外貌特征: z.string().prefault(''),
    基础体型: z.string().prefault(''),
    天赋能力: z.string().prefault(''),
    财富: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v),
    境界: z.string().prefault('凡人'),
    好感度: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v).transform(v => _.clamp(v, 0, 100)),
    所在位置: z.string().prefault(''),
    服装: z.object({
      上衣: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      内衣: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      下装: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      内裤: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      袜子: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
      鞋子: z.object({ 名称: z.string().prefault(''), 描述: z.string().prefault(''), 状态: z.string().prefault('') }).prefault({}),
    }).prefault({}),
    随身物品: z.record(z.string(), z.object({
      描述: z.string().prefault(''),
      数量: z.coerce.number().prefault(0).transform(v => _.isNaN(v) || !_.isFinite(v) ? 0 : v),
    })).prefault({}),
    人际关系: z.record(z.string(), z.string()).prefault({}),
    nsfw档案: z.object({
      初次存在与否: z.boolean().prefault(true),
      性对象: z.string().prefault(''),
      是否怀孕: z.boolean().prefault(false),
      子嗣列表: z.string().prefault(''),
    }).prefault({}),
  })).prefault({}),
});

export type Schema = z.output<typeof Schema>;
