import { AbilityDesignSchema, type AbilityDesign } from './ability-design';
/** 创作起点使用同一份能力声明；运行内核不按预设名称分支。 */
export const abilityPresets:Record<string,AbilityDesign>={
  devour:AbilityDesignSchema.parse({name:'吞噬进化',grade:'罕世',usage:'复合',principle:'吸收目标的有效结构，将取得的特质适配自身。',
    description:'从能够接触和容纳的对象中提取能力、特质或精华，将其保留、适配或参与进一步重组。所得能力由目标实际具备的结构与持有者的承载状态形成。',
    trigger:'形成有效接触并取得目标力量的控制条件',limitations:'提取深度、所需时间和负担取决于目标状态、结构复杂度及自身承载；抗拒与不相容性影响结果。',transformation:true}),
  synthesis:AbilityDesignSchema.parse({name:'合成进化',grade:'罕世',usage:'主动',principle:'理解素材结构及彼此关系，以自身能力将其重组为新的作用。',
    description:'以已有能力、材料、知识与现场条件构思新的能力结构。素材、意图与实际处境共同决定结果，形成后的能力可以继续使用、成长和参与重组。',
    trigger:'具备可作用的素材与足以建立联系的理解',limitations:'成形过程所需代价、时间和素材去向由具体结构决定；部分形成和中断保留已发生的实际后果。',transformation:true}),
};
