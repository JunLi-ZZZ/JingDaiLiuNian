import { defineStore } from 'pinia';
import { BEAST_POOL, FOOD_POOL, NAME_POOLS, SHOP_POOL, mockZoo } from './mock';
import { tierRank } from '../shared/tier';
import type { 动物园数据, 卡池, 抽卡结果, 兽员 } from './types';

// ---- 预览模式说明 ----
// 主状态栏走 schema + MVU；动物园是 DLC 界面，数据结构还在试验期，
// 所以这里先用本地 mock + 完整程序逻辑（抽卡概率、保底、喂养、孵化、购物全在代码里跑，不经过 AI）。
// 做卡会话定稿 schema 后，把 data 来源换成 defineMvuDataStore 即可，组件不用动。

const SETTINGS_KEY = 'dlc_zoo_pool_settings_v2';

interface 持久化数据 {
  pools: Record<string, Pick<卡池, '概率' | '保底开启' | '保底抽数' | '保底品阶'>>; // 内置池的可调项
  custom: (卡池 & { 名称: string })[]; // 用户自建许愿池（完整结构 + 键名）
}

function 读取持久化(): 持久化数据 {
  try {
    const v = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { pools: v.pools ?? {}, custom: Array.isArray(v.custom) ? v.custom : [] };
  } catch {
    return { pools: {}, custom: [] };
  }
}

function 深拷贝<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

const 所有类别 = ['神兽', '凶兽', '幻兽', '魔兽', '异种'];

export const useZooStore = defineStore('dlc.动物园', () => {
  const data = ref<动物园数据>(深拷贝(mockZoo));

  // 恢复：内置池可调项 + 自建池
  const 存档 = 读取持久化();
  for (const [池名, 设置] of Object.entries(存档.pools)) {
    const 池 = data.value.卡池[池名];
    if (池 && !池.自定义) Object.assign(池, 深拷贝(设置));
  }
  for (const p of 存档.custom) {
    const { 名称, ...池 } = p;
    if (名称 && !data.value.卡池[名称]) data.value.卡池[名称] = 池;
  }

  // ---- 商店货架 ----
  const 货架格数 = 4;
  // 已达限购上限的建设不再刷出
  function 可刷商品() {
    return SHOP_POOL.filter(g => {
      if (!g.限购) return true;
      return (data.value.建设记录[g.名称] ?? 0) < g.限购;
    });
  }
  function 铺货() {
    const 池 = 可刷商品();
    const 货架: typeof SHOP_POOL = [];
    const 副本 = [...池];
    while (货架.length < 货架格数 && 副本.length > 0) {
      const i = Math.floor(Math.random() * 副本.length);
      货架.push(深拷贝(副本.splice(i, 1)[0]));
    }
    data.value.商店 = 货架;
  }
  function 刷新商店() {
    const 花费 = 30;
    if (data.value.愿力 < 花费) return 弹提示('愿力不足（刷新需 30）');
    data.value.愿力 -= 花费;
    铺货();
    弹提示('货架已更新');
  }
  铺货(); // 初始化货架

  const 抽卡结果 = ref<抽卡结果[] | null>(null);
  const 提示 = ref('');

  let 提示计时: ReturnType<typeof setTimeout> | undefined;
  function 弹提示(text: string) {
    提示.value = text;
    clearTimeout(提示计时);
    提示计时 = setTimeout(() => (提示.value = ''), 2400);
  }

  function 保存设置() {
    const out: 持久化数据 = { pools: {}, custom: [] };
    for (const [池名, 池] of Object.entries(data.value.卡池)) {
      if (池.自定义) {
        out.custom.push({ 名称: 池名, ...深拷贝(池) });
      } else {
        out.pools[池名] = {
          概率: 深拷贝(池.概率),
          保底开启: 池.保底开启,
          保底抽数: 池.保底抽数,
          保底品阶: 池.保底品阶,
        };
      }
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(out));
  }

  function 恢复默认设置() {
    localStorage.removeItem(SETTINGS_KEY);
    data.value.卡池 = 深拷贝(mockZoo.卡池);
    弹提示('已恢复默认（自建许愿池已清空）');
  }

  // ---- 命名 ----
  function 自动起名(类别: string): string {
    const 池 = NAME_POOLS[类别] ?? ['团子', '糯米', '芝麻', '元宝', '糖糖', '豆豆'];
    const 已有 = new Set(Object.keys(data.value.兽员));
    const 候选 = 池.filter(n => !已有.has(n));
    if (候选.length > 0) return 候选[Math.floor(Math.random() * 候选.length)];
    let 基名 = 池[Math.floor(Math.random() * 池.length)];
    let i = 2;
    while (已有.has(`${基名}${i}号`)) i++;
    return `${基名}${i}号`;
  }

  function 改名(旧名: string, 新名: string): boolean {
    const 名 = 新名.trim();
    if (!名 || 名 === 旧名) return false;
    if (data.value.兽员[名]) {
      弹提示(`「${名}」已被占用`);
      return false;
    }
    const 兽 = data.value.兽员[旧名];
    if (!兽) return false;
    data.value.兽员[名] = 兽;
    delete data.value.兽员[旧名];
    return true;
  }

  // ---- 抽卡 ----
  function 按概率抽品阶(概率: Record<string, number>): string {
    const 条目 = Object.entries(概率).filter(([, w]) => w > 0);
    const 总 = 条目.reduce((s, [, w]) => s + w, 0);
    if (总 <= 0) return '普通';
    let r = Math.random() * 总;
    for (const [品阶, w] of 条目) {
      r -= w;
      if (r <= 0) return 品阶;
    }
    return 条目[条目.length - 1][0];
  }

  // 从候选里挑指定品阶，没有就逐级往下找
  function 挑选<T extends { 品阶: string }>(候选: T[], 品阶: string): T {
    let rank = tierRank(品阶);
    while (rank > 0) {
      const 命中 = 候选.filter(x => tierRank(x.品阶) === rank);
      if (命中.length > 0) return 命中[Math.floor(Math.random() * 命中.length)];
      rank--;
    }
    return 候选[Math.floor(Math.random() * 候选.length)];
  }

  function 兽员入园(种族条目: (typeof BEAST_POOL)[number]): string {
    const 名字 = 自动起名(种族条目.类别);
    data.value.兽员[名字] = {
      种族: 种族条目.种族, 类别: 种族条目.类别, 品阶: 种族条目.品阶,
      兽形: 种族条目.兽形, 兽娘: 种族条目.兽娘,
      心情: 80, 饱食: 60, 产率: 种族条目.产率, 状态: '在园',
    };
    return 名字;
  }

  function 抽一次(池名: string): 抽卡结果 | string {
    const 池 = data.value.卡池[池名];
    if (!池) return '卡池不存在';
    if (data.value.愿力 < 池.单抽) return '愿力不足';

    data.value.愿力 -= 池.单抽;

    let 品阶 = 按概率抽品阶(池.概率);
    if (池.保底开启) {
      池.距保底++;
      if (池.距保底 >= 池.保底抽数) 品阶 = 池.保底品阶;
      if (tierRank(品阶) >= tierRank(池.保底品阶)) 池.距保底 = 0;
    }

    if (池.内容 === 'beast') {
      // 异种未解锁时不进入候选（除非卡池类别筛选明确圈了异种——那直接报未解锁）
      if (!data.value.解锁异种 && 池.类别筛选.includes('异种')) {
        return '异种未解锁：需要先在商店建造「异种展馆」';
      }
      let 候选 = BEAST_POOL.filter(b => data.value.解锁异种 || b.类别 !== '异种');
      if (池.类别筛选.length > 0) 候选 = 候选.filter(b => 池.类别筛选.includes(b.类别));
      if (候选.length === 0) return '该卡池类别筛选下无可用兽员';
      const 兽 = 挑选(候选, 品阶);
      const 名字 = 兽员入园(兽);
      return {
        种类: '兽员', 名称: 兽.名称, 类别: 兽.类别, 品阶: 兽.品阶,
        副文本: `得名「${名字}」· 产率 ${兽.产率}/时`, 重复: false,
      };
    }

    if (池.内容 === 'egg') {
      if (data.value.蛋.length >= 4) return '孵化位已满（4/4），请先孵化';
      const 蛋名池 = ['斑纹蛋', '温热的蛋', '微光蛋', '沉眠之卵', '风蚀蛋', '雷纹蛋'];
      const 类别 =
        池.类别筛选.length > 0 ? 池.类别筛选[Math.floor(Math.random() * 池.类别筛选.length)] : '随机';
      const 蛋 = { 名称: 蛋名池[Math.floor(Math.random() * 蛋名池.length)], 类别, 品阶, 进度: 0 };
      data.value.蛋.push(蛋);
      return { 种类: '兽蛋', 名称: 蛋.名称, 类别, 品阶, 副文本: '已放入孵化位', 重复: false };
    }

    // food
    const 食 = 挑选(FOOD_POOL, 品阶);
    const 现有 = data.value.食物[食.名称];
    if (现有) 现有.数量 += 1;
    else data.value.食物[食.名称] = { 数量: 1, 品阶: 食.品阶, 效果: 深拷贝(食.效果), 描述: 食.描述 };
    const 效果文本 = Object.entries(食.效果).map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`).join(' ');
    return { 种类: '食物', 名称: 食.名称, 品阶: 食.品阶, 副文本: 效果文本, 重复: false };
  }

  function 抽卡(池名: string, 次数: 1 | 10) {
    const 结果: 抽卡结果[] = [];
    for (let i = 0; i < 次数; i++) {
      const r = 抽一次(池名);
      if (typeof r === 'string') {
        if (结果.length === 0) 弹提示(r);
        else 弹提示(`第 ${i + 1} 抽中止：${r}`);
        break;
      }
      结果.push(r);
    }
    if (结果.length > 0) 抽卡结果.value = 结果;
  }

  // ---- 自定义许愿池 ----
  function 新建卡池(名: string, 配置: Omit<卡池, '距保底' | '自定义'>): string | null {
    const 名净 = 名.trim();
    if (!名净) {
      弹提示('起个名字吧');
      return '起个名字吧';
    }
    if (data.value.卡池[名净]) {
      弹提示('已有同名卡池');
      return '已有同名卡池';
    }
    data.value.卡池[名净] = { ...深拷贝(配置), 距保底: 0, 自定义: true };
    保存设置();
    弹提示(`许愿池「${名净}」已创建`);
    return null;
  }

  function 删除卡池(名: string) {
    if (!data.value.卡池[名]?.自定义) return;
    delete data.value.卡池[名];
    保存设置();
    弹提示(`已删除许愿池「${名}」`);
  }

  // ---- 养成互动 ----
  function 喂食(兽名: string, 食物名: string) {
    const 兽 = data.value.兽员[兽名];
    const 食 = data.value.食物[食物名];
    if (!兽 || !食 || 食.数量 <= 0) return;
    食.数量--;
    if (食.数量 <= 0) delete data.value.食物[食物名];
    const 夹 = (v: number) => Math.max(0, Math.min(100, v));
    if (食.效果.心情) 兽.心情 = 夹(兽.心情 + 食.效果.心情);
    if (食.效果.饱食) 兽.饱食 = 夹(兽.饱食 + 食.效果.饱食);
    if (食.效果.产率) 兽.产率 += 食.效果.产率;
    弹提示(`${兽名} 吃掉了 ${食物名}`);
  }

  function 抚摸(兽名: string) {
    const 兽 = data.value.兽员[兽名];
    if (!兽) return;
    兽.心情 = Math.min(100, 兽.心情 + 3);
  }

  // ---- 孵化 ----
  function 灌注(蛋序号: number) {
    const 蛋 = data.value.蛋[蛋序号];
    if (!蛋 || 蛋.进度 >= 100) return;
    const 花费 = 100;
    if (data.value.愿力 < 花费) return 弹提示('愿力不足（灌注需 100）');
    data.value.愿力 -= 花费;
    蛋.进度 = Math.min(100, 蛋.进度 + 8 + Math.floor(Math.random() * 7));
  }

  function 孵化(蛋序号: number) {
    const 蛋 = data.value.蛋[蛋序号];
    if (!蛋 || 蛋.进度 < 100) return;
    const 候选 =
      蛋.类别 && 蛋.类别 !== '随机' ? BEAST_POOL.filter(b => b.类别 === 蛋.类别) : BEAST_POOL;
    const 兽 = 挑选(候选.length > 0 ? 候选 : BEAST_POOL, 蛋.品阶);
    data.value.蛋.splice(蛋序号, 1);
    const 名字 = 兽员入园(兽);
    弹提示(`「${蛋.名称}」孵化成功：${兽.名称}「${名字}」入园！`);
  }

  // ---- 商店 ----
  function 购买(商品序号: number) {
    const 商品 = data.value.商店[商品序号];
    if (!商品) return;
    if (商品.已售) return 弹提示('该商品已售出，刷新货架试试');
    const 已购 = data.value.建设记录[商品.名称] ?? 0;
    if (商品.限购 && 已购 >= 商品.限购) return 弹提示('「' + 商品.名称 + '」已达限购次数');
    if (商品.解锁异种 && data.value.解锁异种) return 弹提示('异种展馆已建成');
    if (data.value.愿力 < 商品.价格) return 弹提示('愿力不足');
    if (商品.类型 === '兽蛋' && data.value.蛋.length >= 4) return 弹提示('孵化位已满（4/4）');
    data.value.愿力 -= 商品.价格;

    if (商品.类型 === '食物' && 商品.食物) {
      const 现有 = data.value.食物[商品.名称];
      const 份数 = 商品.数量 ?? 1;
      if (现有) 现有.数量 += 份数;
      else data.value.食物[商品.名称] = { 数量: 份数, 品阶: 商品.食物.品阶, 效果: 深拷贝(商品.食物.效果), 描述: 商品.食物.描述 };
    } else if (商品.类型 === '兽蛋' && 商品.蛋) {
      data.value.蛋.push(深拷贝(商品.蛋));
    } else if (商品.类型 === '建设') {
      if (商品.游客上限) data.value.游客上限 += 商品.游客上限;
      if (商品.解锁异种) data.value.解锁异种 = true;
      if (商品.概率加成) {
        const 池 = data.value.卡池[商品.概率加成.池];
        if (池) {
          for (const [品阶, 增量] of Object.entries(商品.概率加成.调整)) {
            池.概率[品阶] = Math.max(0, Math.round(((池.概率[品阶] ?? 0) + 增量) * 100) / 100);
          }
          保存设置();
        }
      }
      if (商品.限购) {
        data.value.建设记录[商品.名称] = 已购 + 1;
        if (data.value.建设记录[商品.名称] >= 商品.限购) 商品.已售 = true;
      }
    }
    弹提示(`已购入「${商品.名称}」`);
  }

  // ---- 创造模式（设置页）----
  function 设愿力(v: number) {
    data.value.愿力 = Math.max(0, Math.floor(v) || 0);
    弹提示('愿力已修改');
  }
  function 设园区等级(v: number) {
    data.value.园区等级 = Math.max(1, Math.floor(v) || 1);
  }
  function 设游客上限(v: number) {
    data.value.游客上限 = Math.max(1, Math.floor(v) || 1);
  }
  function 全体喂饱() {
    for (const 兽 of Object.values(data.value.兽员)) {
      兽.心情 = 100;
      兽.饱食 = 100;
    }
    弹提示('全体兽员已喂饱撸顺');
  }
  function 手动造兽(名字: string, 档案: 兽员): string | null {
    const 名 = 名字.trim();
    if (!名) {
      弹提示('得有个名字');
      return '得有个名字';
    }
    if (data.value.兽员[名]) {
      弹提示(`「${名}」已存在`);
      return `「${名}」已存在`;
    }
    data.value.兽员[名] = 深拷贝(档案);
    弹提示(`「${名}」已入园`);
    return null;
  }

  // ---- 派生数据 ----
  const 总产率 = computed(() => Object.values(data.value.兽员).reduce((s: number, b: 兽员) => s + b.产率, 0));

  return {
    data, 抽卡结果, 提示, 总产率, 所有类别,
    抽卡, 喂食, 抚摸, 改名, 灌注, 孵化, 购买, 刷新商店,
    新建卡池, 删除卡池, 保存设置, 恢复默认设置,
    设愿力, 设园区等级, 设游客上限, 全体喂饱, 手动造兽,
  };
});
