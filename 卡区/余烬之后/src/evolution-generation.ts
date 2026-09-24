import { EvolutionDesignSchema, type Schema } from './schema';
import { projectPromptState } from './prompt-view';
import { formatPromptView } from './prompt-format';
import { operationGuide } from './operation-guide';

export const EvolutionCandidateSchema=z.strictObject({direction:z.string().trim().min(1).max(80),design:EvolutionDesignSchema});
export type EvolutionCandidate=z.infer<typeof EvolutionCandidateSchema>;
export function parseEvolution(text:string):EvolutionCandidate[]{
  return z.array(EvolutionCandidateSchema).min(1).max(4).parse(JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')));
}
export function evolutionPrompt(state:Schema,abilityId:string,wish:string,story=''):{role:'system'|'user';content:string}[]{
  const ability=state._能力[abilityId];
  if(!ability || !state._实体[state._开局.主角ID]?.能力ID[abilityId])throw Error('能力尚未登记');
  return [{role:'system',content:'根据能力自身的机理、实际使用经历、当前世界及持有者意图，现场构思一至四个有区别的进化方案。方向名称和作用由这些条件共同推导。每个方案说明原结构怎样变化、形成依据、新用法、适用条件和代价；形成后的能力能继续训练、使用和进化。保持已有经历与作用的连贯，新增用途与付出相称。以纯文字字段返回JSON数组，每项包含direction与design。design中的描述、触发和局限写进化后的完整内容，principle写变化原理，evidence写实际契机；名称可保留或重命名。数值字段只填写发生改变或新形成的结构，已有结构其余部分保留。utility用于叙事技艺与专项检定，strike用于攻防，conversion用于转化储能，travel用于位面旅行，transformation用于素材转为能力，usage记录主动、被动或复合用法；这些是可组合的结算结构；作用对象、方法和情境写在完整能力描述里。若改变数值，则按作用规模与代价定标。方案等待持有者确认。\n'+operationGuide(['evolve'])},
  {role:'user',content:JSON.stringify({当前能力:{ID:abilityId,...ability},当前处境:formatPromptView(projectPromptState(state,abilityId)),最近场景:story.slice(-6000),进化意图:wish.trim()||'根据已有能力与实际经历构思'})}];
}
