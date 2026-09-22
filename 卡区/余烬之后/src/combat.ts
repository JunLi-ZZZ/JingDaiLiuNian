import type { Schema } from './schema';

export type CombatStats = NonNullable<Schema['_实体'][string]['战斗']>;
export type AttackCalculation = {
  hitRoll: number;
  criticalRoll: number | null;
  hitChance: number;
  criticalChance: number;
  hit: boolean;
  critical: boolean;
  baseDamage: number;
  defense: number;
  resistance: number;
  criticalMultiplier: number;
  damage: number;
};
export type BattleReport = AttackCalculation & {
  actorId: string;
  targetId: string;
  actorName: string;
  targetName: string;
  skillName: string;
  mechanism: string;
  hpBefore: number;
  hpAfter: number;
  hpMax: number;
  actualDamage: number;
  absorbed: number;
  energyCost: Record<string, number>;
  elapsedLocalSeconds: number;
  result: string;
};

export function checkedNumber(value: unknown, name: string, min = 0, max = 1e9): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw Error(`${name}未定标或超出范围`);
  return value;
}

export function validateCombatStats(stats: CombatStats): void {
  checkedNumber(stats.攻击, '攻击');
  checkedNumber(stats.防御, '防御');
  checkedNumber(stats.命中率, '命中率', 0, 1);
  checkedNumber(stats.闪避率, '闪避率', 0, 1);
  checkedNumber(stats.暴击率, '暴击率', 0, 1);
  checkedNumber(stats.暴击倍率, '暴击倍率', 1, 100);
  for (const resistance of Object.values(stats.抗性)) checkedNumber(resistance, '抗性', -1, 1);
}

// 单目标直接攻击规则 combat-1。随机源由脚本持有，模型指令中没有掷骰字段。
export function calculateAttack(
  attacker: CombatStats,
  defender: CombatStats,
  mechanism: string,
  coefficient: number,
  fixedDamage: number,
  random: () => number,
): AttackCalculation {
  validateCombatStats(attacker);
  validateCombatStats(defender);
  checkedNumber(coefficient, '技能倍率', 0, 100);
  checkedNumber(fixedDamage, '技能固定伤害');
  const roll = () => {
    const value = checkedNumber(random(), '随机样本', 0, 1);
    if (value === 1) throw Error('随机样本必须小于1');
    return value;
  };
  const hitChance = Math.max(0, Math.min(1, attacker.命中率 - defender.闪避率));
  const hitRoll = roll();
  const hit = hitRoll < hitChance;
  const criticalRoll = hit ? roll() : null;
  const critical = criticalRoll !== null && criticalRoll < attacker.暴击率;
  const baseDamage = attacker.攻击 * coefficient + fixedDamage;
  const resistance = Object.hasOwn(defender.抗性, mechanism) ? defender.抗性[mechanism] : 0;
  const criticalMultiplier = critical ? attacker.暴击倍率 : 1;
  const raw = hit ? baseDamage * criticalMultiplier * (100 / (100 + defender.防御)) * (1 - resistance) : 0;
  if (!Number.isFinite(raw) || raw > Number.MAX_SAFE_INTEGER) throw Error('伤害超出精确范围');
  return {
    hitRoll,
    criticalRoll,
    hitChance,
    criticalChance: attacker.暴击率,
    hit,
    critical,
    baseDamage,
    defense: defender.防御,
    resistance,
    criticalMultiplier,
    damage: Math.floor(raw),
  };
}
