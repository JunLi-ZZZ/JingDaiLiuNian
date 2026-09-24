/** 通用七阶与特殊序列分开；存档字段名继续使用品阶。 */
export const grades = ['凡尘','凝华','罕世','史铭','传遗','神御','本源'] as const;
export const specialGrades = ['原初本源'] as const;
export const displayGrades = [...grades, ...specialGrades] as const;
export type BasicGrade = typeof grades[number];
export type Grade = typeof displayGrades[number];
export const legacyGrades = {凡常:'凡尘',精良:'凝华',稀有:'罕世',史诗:'史铭',传说:'传遗',神话:'神御'} as const;
export function normalizeGrade(value: unknown): unknown {
  return typeof value === 'string' && Object.hasOwn(legacyGrades,value)
    ? legacyGrades[value as keyof typeof legacyGrades] : value;
}
export const GradeSchema = z.enum(displayGrades);
export const BasicGradeSchema = z.enum(grades);
const LegacyGradeSchema = z.enum(['凡常','精良','稀有','史诗','传说','神话'])
  .transform((value):BasicGrade=>legacyGrades[value]);
/** 旧输入只在读取边界接受，新写入与展示使用新名称。 */
export const StoredGradeSchema = z.union([GradeSchema, LegacyGradeSchema]);
export const AcquiredGradeSchema = z.union([BasicGradeSchema, LegacyGradeSchema]);
export function displayGrade(value:unknown):Grade|undefined {
  const parsed=StoredGradeSchema.safeParse(value);
  return parsed.success?parsed.data:undefined;
}
export function nextGrade(value:Grade):Grade {
  if(value==='原初本源')return value;
  return grades[Math.min(grades.length-1,grades.indexOf(value)+1)];
}
/** 特殊序列不套用基础阶梯的序号加值。 */
export function gradeBonus(value:Grade):number {
  return value==='原初本源'?0:grades.indexOf(value);
}
export const evolutionDirections = ['容纳','转化','释放','威力','精通','节律','节能'] as const;
export type EvolutionDirection = typeof evolutionDirections[number];
export const EvolutionDirectionSchema = z.enum(evolutionDirections);
export const MAX_TURN_OPERATIONS=32;

/** 提示词可在旧楼层直接读取；只投影两类档案的序列，不改历史文本或事件账本。 */
export function normalizeGradeRecords<T extends {_能力?:Record<string,any>;_物品?:Record<string,any>}>(state:T, aliases:Record<string,string>):T {
  const records=(source:Record<string,any>|undefined)=>Object.fromEntries(Object.entries(source||{}).map(([id,record])=>
    [id,{...record,品阶:typeof record.品阶==='string' && Object.hasOwn(aliases,record.品阶)?aliases[record.品阶]:record.品阶}]));
  return {...state,_能力:records(state._能力),_物品:records(state._物品)};
}
