// 神兽动物园 DLC 的界面数据结构（预览用 mock 类型，做卡会话定 schema 时以此为准调整）
// 注意：兽员 record 的键是个体名字（不是种族名）——同名种族可养多只，个体以名字区分
export interface 兽员 {
  种族: string;
  类别: string; // 神兽 / 凶兽 / 幻兽 / 魔兽 / 异种
  品阶: string;
  兽形: string; // 兽形描述
  兽娘: string; // 兽娘形态描述
  立绘兽形?: string; // 立绘 URL，预留
  立绘兽娘?: string;
  心情: number; // 0-100
  饱食: number; // 0-100
  产率: number; // 愿力/小时
  状态: string; // 在园 / 休息 / 外出
}

export interface 兽蛋 {
  名称: string;
  类别: string;
  品阶: string;
  进度: number; // 0-100
}

export interface 食物效果 {
  心情?: number;
  饱食?: number;
  产率?: number;
}

export interface 食物 {
  数量: number;
  品阶: string;
  效果: 食物效果;
  描述: string;
}

export interface 商品 {
  名称: string;
  类型: '食物' | '兽蛋' | '建设';
  品阶: string;
  价格: number;
  效果文本: string;
  描述: string;
  食物?: { 品阶: string; 效果: 食物效果; 描述: string }; // 类型=食物
  数量?: number; // 类型=食物 时一份的个数
  蛋?: 兽蛋; // 类型=兽蛋
  // ---- 建设类效果（三选一） ----
  游客上限?: number; // 扩建：游客上限+N
  解锁异种?: boolean; // 异种展馆：开放异种类别（召唤池可出现）
  概率加成?: { 池: string; 调整: Record<string, number> }; // 祭坛类：直接改卡池概率
  限购?: number; // 建设类限购次数（达上限后货架标记已售/不再刷出）
  已售?: boolean; // 货架状态
}

export interface 卡池 {
  说明: string;
  内容: 'beast' | 'egg' | 'food';
  单抽: number;
  十连: number;
  概率: Record<string, number>; // 品阶 → 百分比
  保底开启: boolean;
  保底抽数: number;
  保底品阶: string;
  距保底: number; // 距上次出保底品阶及以上已过的抽数
  类别筛选: string[]; // 限定兽员类别（神兽/凶兽/幻兽/魔兽/异种），空数组=不限；仅内容=beast/egg 有效
  主题: string; // 卡池主题描述（如"龙娘限定""修仙灵兽"），正式版给 AI 当生成提示词
  自定义?: boolean; // 用户自建的许愿池
}

export interface 动物园数据 {
  园名: string;
  园区等级: number;
  愿力: number;
  今日游客: number;
  今日收益: number;
  游客上限: number;
  解锁异种: boolean; // 异种展馆建成后为 true
  建设记录: Record<string, number>; // 建设商品名 → 已购次数（限购判定）
  兽员: Record<string, 兽员>;
  蛋: 兽蛋[];
  食物: Record<string, 食物>;
  商店: 商品[]; // 当前货架（4 格，可刷新）
  卡池: Record<string, 卡池>;
}

export interface 抽卡结果 {
  种类: '兽员' | '兽蛋' | '食物';
  名称: string;
  类别?: string;
  品阶: string;
  副文本: string;
  重复: boolean;
}
