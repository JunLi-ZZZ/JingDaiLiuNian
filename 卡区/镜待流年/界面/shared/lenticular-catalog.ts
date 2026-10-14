export const LENTICULAR_GRADES = [
  '残破',
  '普通',
  '精良',
  '优秀',
  '稀有',
  '史诗',
  '传说',
  '神话',
  '不朽',
  '唯一',
] as const;
export type LenticularGrade = (typeof LENTICULAR_GRADES)[number];
export type LenticularCategory = 'item' | 'bio' | 'skill';
export const LENTICULAR_CATEGORIES: Record<LenticularCategory, string> = { item: '物品', bio: '生物', skill: '技能' };
export type LenticularEntry = {
  id: string;
  category: LenticularCategory;
  name: string;
  aliases: readonly string[];
  grade: LenticularGrade;
  subtitle: string;
  description: string;
  edition: string;
  imageA: string;
  imageB: string;
  states: readonly [string, string];
};
// 独立预览在构建时指定本地素材根；正式卡只访问 CDN 静态素材。
declare const __JDNL_LENTICULAR_ASSET_BASE__: string | undefined;
const assetBase =
  typeof __JDNL_LENTICULAR_ASSET_BASE__ === 'string'
    ? __JDNL_LENTICULAR_ASSET_BASE__
    : 'https://testingcf.jsdelivr.net/gh/JunLi-ZZZ/JingDaiLiuNian/卡区/镜待流年/光栅卡/母镜/assets/';
export const MOTHER_MIRROR_CARD: LenticularEntry = {
  id: 'mother-mirror',
  category: 'item',
  name: '母镜',
  aliases: ['母镜'],
  grade: '唯一',
  subtitle: '古朴铜镜 · 幼时获赠',
  description: '虞姝昀在你幼时赠予的一面古朴铜镜，称作“护身符”。偶尔能在镜中瞥见模糊的红颜特征。',
  edition: 'M · 01',
  states: ['静照', '映照'],
  imageA: encodeURI(`${assetBase}mother-mirror-a-d8bb4e65de.webp`),
  imageB: encodeURI(`${assetBase}mother-mirror-b-da9137596b.webp`),
};
export const LENTICULAR_CATALOG: readonly LenticularEntry[] = [MOTHER_MIRROR_CARD];
export function normalizeLenticularName(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .replace(/^\*\*(.*?)\*\*$/, '$1')
    .trim();
}
export function findLenticularEntry(category: LenticularCategory, name: string, catalog = LENTICULAR_CATALOG) {
  const normalized = normalizeLenticularName(name);
  return catalog.find(
    entry =>
      entry.category === category &&
      [entry.name, ...entry.aliases].some(alias => normalizeLenticularName(alias) === normalized),
  );
}
export function lenticularGrade(value: string | undefined, fallback: LenticularGrade): LenticularGrade {
  return LENTICULAR_GRADES.includes(value?.trim() as LenticularGrade) ? (value!.trim() as LenticularGrade) : fallback;
}
export const LENTICULAR_ACCENTS: Record<LenticularGrade, string> = {
  残破: '#9b9791',
  普通: '#b4ada0',
  精良: '#8bbb9b',
  优秀: '#7daac3',
  稀有: '#a18fc9',
  史诗: '#c083b3',
  传说: '#d3ac6d',
  神话: '#d0938e',
  不朽: '#b8d4d5',
  唯一: '#dfc190',
};
