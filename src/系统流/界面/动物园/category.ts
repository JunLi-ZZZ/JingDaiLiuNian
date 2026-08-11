// 兽员类别（神兽/凶兽/幻兽/魔兽/异种…）的配色与图标
export interface CatMeta {
  color: string;
  icon: string;
}

const CAT_TABLE: Record<string, CatMeta> = {
  神兽: { color: '#fbbf24', icon: 'fa-solid fa-dragon' },
  凶兽: { color: '#ef4444', icon: 'fa-solid fa-fire' },
  幻兽: { color: '#38bdf8', icon: 'fa-solid fa-feather' },
  魔兽: { color: '#a78bfa', icon: 'fa-solid fa-paw' },
  异种: { color: '#4ade80', icon: 'fa-solid fa-eye' },
};

const DEFAULT_CAT: CatMeta = { color: '#8ba196', icon: 'fa-solid fa-egg' };

export function catMeta(类别: string | undefined | null): CatMeta {
  if (!类别) return DEFAULT_CAT;
  return CAT_TABLE[类别] ?? DEFAULT_CAT;
}
