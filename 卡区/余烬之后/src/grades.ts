/** 跨系统共用的品质尺度，来源和所有者另行记录。 */
export const grades = ['凡常','精良','稀有','史诗','传说','神话','本源'] as const;
export type Grade = typeof grades[number];
export const GradeSchema = z.enum(grades);
export const evolutionDirections = ['容纳','转化','释放','威力','精通','节律','节能'] as const;
export type EvolutionDirection = typeof evolutionDirections[number];
export const EvolutionDirectionSchema = z.enum(evolutionDirections);
export const MAX_TURN_OPERATIONS=32;
