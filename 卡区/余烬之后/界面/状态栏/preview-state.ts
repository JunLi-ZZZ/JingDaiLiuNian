import { Schema } from '../../src/schema';
import { startSession, trialRules } from '../../src/engine';

export function createPreviewSession(profile?: Partial<Schema['_开局']['档案']>) {
  const session = startSession({
    branchId: 'preview',
    mode: profile ? '自定义' : '默认',
    profile,
    opportunity: '在星见市的位面潮汐中接触种核，获得起源涅槃。',
    location: Schema.shape._时空
      .unwrap()
      .shape.当前地点.parse({ 位面ID: 'main', 地点ID: 'courtyard', 城市: '星见市', 场景: '旧气象站庭院' }),
    localSecondsPerOriginSecond: 1,
    life: 100,
    rules: trialRules,
  });
  const clock = session.stat_data._时空.位面目录.main.时钟;
  session.stat_data._实体.player.战斗 = {
    攻击: 30,
    防御: 20,
    命中率: 0.95,
    闪避率: 0,
    暴击率: 0.2,
    暴击倍率: 1.5,
    抗性: {},
  };
  session.stat_data._实体.player.资源.energy = { 名称: '能量', 当前: 50, 上限: 50, 单位: '点' };
  session.stat_data._实体.player.能力ID.strike = true;
  clock.本地基准秒 = 17 * 3600 + 50 * 60;
  clock.历法 = { 名称: '星见历', 元年: 1, 每月天数: Array(12).fill(30), 每天小时: 24, 每小时分钟: 60, 每分钟秒: 60 };
  session.stat_data = Schema.parse({
    ...session.stat_data,
    _实体: {
      ...session.stat_data._实体,
      beast: {
        名称: '巡雷兽',
        类别: '生物',
        位面ID: 'main',
        地点ID: 'courtyard',
        种族ID: 'thunder-beast',
        生命: { 当前: 200, 上限: 200 },
        战斗: { 攻击: 144, 防御: 30, 命中率: 1, 闪避率: 0.05, 暴击率: 0, 暴击倍率: 1.5, 抗性: {} },
        能力ID: { arc: true },
        数值规则版本: 'trial-1',
        档案: { 外貌: '灰蓝皮毛下有细小电弧游走，弯角朝向积雨云。' },
      },
    },
    _能力: {
      ...session.stat_data._能力,
      strike: {
        名称: '凝力一击',
        描述: '集中力量，向同场景目标发动直接攻击。',
        来源: { 类型: '初始' },
        用法: '主动',
        规则状态: '可结算',
        消耗: { energy: 10 },
        冷却本地秒: 12,
        效果: { hit: { 规则ID: 'combat-strike-1', 参数: { 机制ID: 'impact', 倍率: 2, 固定伤害: 0, 耗时本地秒: 6 } } },
      },
      arc: {
        名称: '雷弧',
        用法: '主动',
        规则状态: '可结算',
        效果: { hit: { 规则ID: 'combat-strike-1', 参数: { 机制ID: 'electric', 倍率: 1, 固定伤害: 0, 耗时本地秒: 6 } } },
      },
    },
    _物品: {
      bag: { 名称: '旧旅行包', 描述: '帆布表面留着雨水洇开的深色痕迹。', 所在: { 类型: '实体', ID: 'player' } },
      pendant: {
        名称: '起源残片',
        描述: '静静贴着掌心的灰白晶体，一线微光在内部回环。',
        所在: { 类型: '实体', ID: 'player' },
        复苏绑定实体ID: 'player',
      },
    },
    _任务: {
      appointment: {
        名称: '赴桥头之约',
        描述: '在约定时间之前抵达桥头。',
        状态: '进行中',
        截止起源秒: 300,
        目标: { arrive: { 描述: '到达桥头', 所需: 1 } },
        后果说明: '约定的会面窗口结束。',
      },
    },
    叙事: {
      天气: '雨后 · 低云',
      场景描述: '电线在风里轻响。庭院尽头，潮湿的石阶通向废弃观测台。',
      见闻: {
        beast: {
          类别: '生物',
          对象ID: 'beast',
          标题: '巡雷兽',
          内容: '灰蓝皮毛间游动着电弧。它的角会在放电前亮起。',
          来源: '庭院中观察',
          可信度: '观察',
          知情者ID: { player: true },
        },
      },
    },
  });
  return session;
}
