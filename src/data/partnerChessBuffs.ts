import type { EnemyType, PetAttribute } from "@/data/petBattleData";

export type PartnerChessBuffRarity = "safe" | "common" | "strong" | "perfect";

export type PartnerChessBuff = {
  id: string;
  name: string;
  rarity: PartnerChessBuffRarity;
  description: string;
  effects: {
    teamAttackPercent?: number;
    teamDefensePercent?: number;
    teamShield?: number;
    frontShield?: number;
    middleAttackPercent?: number;
    backCharge?: number;
    randomCharge?: number;
    failWillReduction?: number;
    petStatBoost?: {
      petId: string;
      hp?: number;
      attack?: number;
      defense?: number;
      speed?: number;
    };
    bonusDamageToEnemyType?: {
      enemyType: EnemyType;
      percent: number;
    };
    reduceDamageFromEnemyType?: {
      enemyType: EnemyType;
      percent: number;
    };
    attributeBoost?: {
      attribute: PetAttribute;
      attackPercent?: number;
      defensePercent?: number;
    };
  };
};

export const partnerChessBuffs: PartnerChessBuff[] = [
  {
    id: "focus_training",
    name: "专注训练",
    rarity: "common",
    description: "全队攻击 +10%。",
    effects: { teamAttackPercent: 0.1 }
  },
  {
    id: "steady_steps",
    name: "稳扎稳打",
    rarity: "common",
    description: "全队防御 +10%。",
    effects: { teamDefensePercent: 0.1 }
  },
  {
    id: "front_shield",
    name: "前排护盾",
    rarity: "safe",
    description: "前排宠物获得护盾。",
    effects: { frontShield: 18 }
  },
  {
    id: "middle_burst",
    name: "中排爆发",
    rarity: "strong",
    description: "中排宠物攻击 +20%。",
    effects: { middleAttackPercent: 0.2 }
  },
  {
    id: "back_support",
    name: "后排支援",
    rarity: "common",
    description: "后排宠物技能充能 +20%。",
    effects: { backCharge: 0.2 }
  },
  {
    id: "inspiration_burst",
    name: "灵感爆发",
    rarity: "strong",
    description: "随机一只宠物开局技能充能提高。",
    effects: { randomCharge: 0.25 }
  },
  {
    id: "wrong_review",
    name: "错题反思",
    rarity: "safe",
    description: "本轮战斗失败时少扣学习意志。",
    effects: { failWillReduction: 0.25 }
  },
  {
    id: "growth_roots",
    name: "成长根系",
    rarity: "strong",
    description: "草芽龙生命和防御提升。",
    effects: { petStatBoost: { petId: "grass_dragon", hp: 18, defense: 4 } }
  },
  {
    id: "starfire_raid",
    name: "星火突袭",
    rarity: "strong",
    description: "星火狐攻击和速度提升。",
    effects: { petStatBoost: { petId: "fire_fox", attack: 5, speed: 4 } }
  },
  {
    id: "cloud_guard",
    name: "云团守护",
    rarity: "strong",
    description: "云团兽为全队提供小护盾。",
    effects: { teamShield: 12 }
  },
  {
    id: "memory_echo",
    name: "记忆回声",
    rarity: "strong",
    description: "对遗忘型敌人伤害 +15%。",
    effects: { bonusDamageToEnemyType: { enemyType: "forget", percent: 0.15 } }
  },
  {
    id: "calm_breath",
    name: "平静呼吸",
    rarity: "strong",
    description: "受到焦虑型敌人伤害 -15%。",
    effects: { reduceDamageFromEnemyType: { enemyType: "anxiety", percent: 0.15 } }
  },
  {
    id: "perfect_ready",
    name: "完美备战",
    rarity: "perfect",
    description: "本轮全队攻击和防御小幅提升。",
    effects: { teamAttackPercent: 0.06, teamDefensePercent: 0.06 }
  }
];

export const fallbackBuff: PartnerChessBuff = {
  id: "baseline_shield",
  name: "保底护盾",
  rarity: "safe",
  description: "0 灵感点保底：全队获得小护盾。",
  effects: { teamShield: 8 }
};

export function getBuffChoices(inspiration: number, perfect: boolean) {
  if (inspiration <= 0) return [fallbackBuff];
  const pool = partnerChessBuffs.filter((buff) => buff.rarity !== "perfect");
  const count = inspiration >= 2 ? 3 : 2;
  const start = perfect ? 6 : inspiration * 2;
  return Array.from({ length: count }, (_, index) => pool[(start + index) % pool.length]);
}

export function getPerfectBuff() {
  return partnerChessBuffs.find((buff) => buff.id === "perfect_ready")!;
}
