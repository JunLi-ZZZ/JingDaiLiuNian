import { BasicGradeSchema } from './grades';
/** 自由能力的声明；可组合的计算结构与完整作用描述分别保存。 */
const mechanism = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
export const AbilityDesignSchema = z.strictObject({
  name:z.string().trim().min(1).max(80), grade:BasicGradeSchema,
  usage:z.enum(['主动','被动','复合']),
  description:z.string().trim().min(1).max(2000), trigger:z.string().trim().min(1).max(600),
  limitations:z.string().max(1000), principle:z.string().trim().min(4).max(1000),
  cost:z.number().nonnegative().max(100000).prefault(0), cooldown:z.number().nonnegative().max(86400).prefault(0),
  travel:z.boolean().optional(), transformation:z.boolean().optional(),
  utility:z.strictObject({bonus:z.number().int().min(0).max(8)}).optional(),
  strike:z.strictObject({mechanism,power:z.number().positive().max(100),fixed:z.number().nonnegative().max(100000),seconds:z.number().positive().max(86400)}).optional(),
  conversion:z.strictObject({mechanism,capacity:z.number().positive().max(1000000),storage:z.number().positive().max(1000000),multiplier:z.number().positive().max(100)}).optional(),
});
export type AbilityDesign=z.output<typeof AbilityDesignSchema>;
export type InitialAbilityChoice={mode:'origin'|'none'|'designed';design?:AbilityDesign};
export function parseAbilityDesign(text:string):AbilityDesign {
  return AbilityDesignSchema.parse(JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')));
}
export function abilityDesignPrompt(wish:string,profile:unknown,scene:unknown):{role:'system'|'user';content:string}[]{
  return [{role:'system',content:'为虚海多元位面的旅人构思一项完整能力。虚海是容纳位面气泡的无垠虚空，各位面具有独立时空与法则。能力名称、来源机理、作用、对象、触发条件、代价和成长潜力以玩家构想、人物背景与所处世界为依据。构想留白时自由创作。保持情感、生活、探索与战斗用途的可能性。返回符合下列结构的JSON对象，文字字段直接写设定正文。usage为实际运用方式。计算结构可组合：utility记录运用和专项检定，strike记录直接攻防，conversion记录防护转化与储能；travel对应位面旅行，transformation对应把素材转为新能力的作用。仅填写能力实际具有的结构，其他作用完整写入description、trigger、limitations和principle。消耗与冷却按能力设定填写；cost表示能量点，cooldown与seconds表示当地秒。能力通过description与principle保留完整机理，计算结构承担其中已定标的部分。\n'+JSON.stringify(z.toJSONSchema(AbilityDesignSchema,{io:'input'}))},
    {role:'user',content:JSON.stringify({构想:wish.trim()||'自由构思一项与这段旅途相衬的能力',人物:profile,开局:scene})}];
}
