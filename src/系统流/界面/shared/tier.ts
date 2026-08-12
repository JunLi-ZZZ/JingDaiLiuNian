// 品阶元数据（供各 DLC 界面共用）：颜色、光晕、品阶等级
// 未知品阶回退到「普通」，后续新增品阶只改这里
export interface TierMeta {
  color: string;
  deep: string;
}

const TIER_TABLE: Record<string, TierMeta> = {
  残破: { color: '#6e7686', deep: '#3d424d' },
  普通: { color: '#a8b3c2', deep: '#5f6b7d' },
  精良: { color: '#3dd68c', deep: '#14532d' },
  优秀: { color: '#2dd4bf', deep: '#0f766e' },
  稀有: { color: '#38bdf8', deep: '#1e40af' },
  史诗: { color: '#a78bfa', deep: '#5b21b6' },
  传说: { color: '#fbbf24', deep: '#92400e' },
  神话: { color: '#fb923c', deep: '#9a3412' },
  不朽: { color: '#f43f5e', deep: '#881337' },
  唯一: { color: '#e879f9', deep: '#701a75' },
};

// 品阶高低排序（保底、概率校验用），未知品阶按普通算
const TIER_ORDER = ['残破', '普通', '精良', '优秀', '稀有', '史诗', '传说', '神话', '不朽', '唯一'];

const DEFAULT_TIER: TierMeta = TIER_TABLE['普通'];

export function tierMeta(品阶: string | undefined | null): TierMeta {
  if (!品阶) return DEFAULT_TIER;
  return TIER_TABLE[品阶] ?? DEFAULT_TIER;
}

export function tierRank(品阶: string | undefined | null): number {
  const i = TIER_ORDER.indexOf(品阶 ?? '');
  return i < 0 ? 1 : i;
}

// 卡片用的 CSS 变量：边框/光晕/渐变两端
export function tierVars(品阶: string | undefined | null): Record<string, string> {
  const m = tierMeta(品阶);
  return {
    '--tier': m.color,
    '--tier-deep': m.deep,
  };
}

export const ALL_TIERS = TIER_ORDER;
