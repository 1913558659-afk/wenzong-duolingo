import { battleSkills, counterBonus } from "@/data/petBattleData";
import type { BattleEnemy, BattlePet, BattleSkill, BattleStats, EnemyType } from "@/data/petBattleData";
import { getPetSpeciesStatsAtLevel, petDamageFormulaConfig } from "@/data/petSpeciesMasterData";

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

export function getPetStatsAtLevel(pet: BattlePet, level: number, evolutionStage = 1): BattleStats {
  const speciesStats = getPetSpeciesStatsAtLevel(pet.id, level, evolutionStage);
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
  attackerLevel = 1,
  defenderDefense,
  enemyType,
  pet,
  skill,
  statusMultiplier = 1,
  randomMultiplier = 1
}: {
  attackerAttack: number;
  attackerLevel?: number;
  defenderDefense: number;
  pet: Pick<BattlePet, "counters">;
  enemyType: EnemyType;
  skill: BattleSkill;
  randomMultiplier?: number;
  statusMultiplier?: number;
}): DamageResult {
  const hits = skill.hits ?? 1;
  const baseDamage = Math.max(1, skill.power * attackerAttack / (defenderDefense * 0.55 + 12));
  const counterMultiplier = getCounterMultiplier({ enemyType, pet, skill });
  const levelPower = 1 + Math.max(1, attackerLevel) * 0.006;
  const safeRandom = Math.max(petDamageFormulaConfig.randomRange[0], Math.min(petDamageFormulaConfig.randomRange[1], randomMultiplier));
  const hitDamage = Math.max(1, Math.round(baseDamage * levelPower * counterMultiplier * statusMultiplier * safeRandom));

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
  attackerLevel = 1,
  defenderDefense,
  skill,
  statusMultiplier = 1,
  randomMultiplier = 1
}: {
  attackerAttack: number;
  attackerLevel?: number;
  defenderDefense: number;
  skill: BattleSkill;
  randomMultiplier?: number;
  statusMultiplier?: number;
}): DamageResult {
  const hits = skill.hits ?? 1;
  const baseDamage = Math.max(1, skill.power * attackerAttack / (defenderDefense * 0.55 + 12));
  const levelPower = 1 + Math.max(1, attackerLevel) * 0.006;
  const safeRandom = Math.max(petDamageFormulaConfig.randomRange[0], Math.min(petDamageFormulaConfig.randomRange[1], randomMultiplier));
  const hitDamage = Math.max(1, Math.round(baseDamage * levelPower * statusMultiplier * safeRandom));

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
