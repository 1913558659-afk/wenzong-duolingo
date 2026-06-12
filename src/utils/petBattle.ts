import { battleSkills, counterBonus } from "@/data/petBattleData";
import type { BattleEnemy, BattlePet, BattleSkill, BattleStats, EnemyType } from "@/data/petBattleData";
import { getPetSpeciesStatsAtLevel } from "@/data/petSpeciesMasterData";

export type DamageResult = {
  baseDamage: number;
  counterMultiplier: number;
  statusMultiplier: number;
  hitDamage: number;
  hits: number;
  totalDamage: number;
};

export function getRequiredPetExp(currentLevel: number) {
  return Math.max(1, currentLevel) * 100;
}

export function getPetStatsAtLevel(pet: BattlePet, level: number): BattleStats {
  const speciesStats = getPetSpeciesStatsAtLevel(pet.id, level);
  if (speciesStats) return speciesStats;

  const safeLevel = Math.max(1, level);
  const growthTimes = safeLevel - 1;

  return {
    hp: pet.baseStats.hp + pet.growth.hp * growthTimes,
    attack: pet.baseStats.attack + pet.growth.attack * growthTimes,
    defense: pet.baseStats.defense + pet.growth.defense * growthTimes,
    speed: pet.baseStats.speed + pet.growth.speed * growthTimes
  };
}

export function getCounterMultiplier({
  enemyType,
  pet,
  skill
}: {
  pet: Pick<BattlePet, "counters">;
  enemyType: EnemyType;
  skill: BattleSkill;
}) {
  const skillCountersEnemy = skill.counterEnemyType === enemyType;
  const petCountersEnemy = pet.counters.includes(enemyType);
  return skillCountersEnemy || petCountersEnemy ? counterBonus.advantage : counterBonus.normal;
}

export function calculateSkillDamage({
  attackerAttack,
  defenderDefense,
  enemyType,
  pet,
  skill,
  statusMultiplier = 1
}: {
  attackerAttack: number;
  defenderDefense: number;
  pet: Pick<BattlePet, "counters">;
  enemyType: EnemyType;
  skill: BattleSkill;
  statusMultiplier?: number;
}): DamageResult {
  const hits = skill.hits ?? 1;
  const baseDamage = Math.max(1, skill.power + attackerAttack - defenderDefense);
  const counterMultiplier = getCounterMultiplier({ enemyType, pet, skill });
  const hitDamage = Math.max(1, Math.round(baseDamage * counterMultiplier * statusMultiplier));

  return {
    baseDamage,
    counterMultiplier,
    statusMultiplier,
    hitDamage,
    hits,
    totalDamage: hitDamage * hits
  };
}

export function calculateEnemyDamage({
  attackerAttack,
  defenderDefense,
  skill,
  statusMultiplier = 1
}: {
  attackerAttack: number;
  defenderDefense: number;
  skill: BattleSkill;
  statusMultiplier?: number;
}): DamageResult {
  const hits = skill.hits ?? 1;
  const baseDamage = Math.max(1, skill.power + attackerAttack - defenderDefense);
  const hitDamage = Math.max(1, Math.round(baseDamage * statusMultiplier));

  return {
    baseDamage,
    counterMultiplier: counterBonus.normal,
    statusMultiplier,
    hitDamage,
    hits,
    totalDamage: hitDamage * hits
  };
}

export function getSkillById(skillId: string) {
  return battleSkills[skillId] ?? null;
}

export function getPetSkills(pet: BattlePet) {
  return pet.skills.map(getSkillById).filter((skill): skill is BattleSkill => Boolean(skill));
}

export function getEnemySkills(enemy: BattleEnemy) {
  return enemy.skills.map(getSkillById).filter((skill): skill is BattleSkill => Boolean(skill));
}

export function chooseEnemySkill(enemy: BattleEnemy, randomValue = Math.random()) {
  const totalWeight = enemy.aiWeights.reduce((sum, item) => sum + item.weight, 0);
  const target = randomValue * totalWeight;
  let cursor = 0;

  for (const item of enemy.aiWeights) {
    cursor += item.weight;
    if (target <= cursor) {
      return getSkillById(item.skillId);
    }
  }

  return getSkillById(enemy.skills[0]);
}

export function clampHp(value: number, maxHp: number) {
  return Math.max(0, Math.min(maxHp, value));
}
