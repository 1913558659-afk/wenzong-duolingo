import type { BattleEnemy, BattlePet } from "@/data/petBattleData";

export type PartnerChessMotion = "soft-bump" | "quick-dash" | "root-slam" | "clumsy-impact" | "mist-phase" | "pressure-shake";
export type PartnerChessEffectTheme = "cloud" | "fire" | "growth" | "careless" | "forget" | "anxiety";
export type PartnerChessImpactType = "cloud-impact" | "fire-impact" | "leaf-impact" | "careless-impact" | "forget-impact" | "anxiety-impact";

export type PartnerChessAnimationProfile = {
  attackDuration: number;
  dashDistance: number;
  effectTheme: PartnerChessEffectTheme;
  impactType: PartnerChessImpactType;
  motion: PartnerChessMotion;
};

const unitProfiles: Record<string, PartnerChessAnimationProfile> = {
  cloud_beast: {
    attackDuration: 850,
    dashDistance: 80,
    effectTheme: "cloud",
    impactType: "cloud-impact",
    motion: "soft-bump"
  },
  fire_fox: {
    attackDuration: 700,
    dashDistance: 130,
    effectTheme: "fire",
    impactType: "fire-impact",
    motion: "quick-dash"
  },
  grass_dragon: {
    attackDuration: 900,
    dashDistance: 70,
    effectTheme: "growth",
    impactType: "leaf-impact",
    motion: "root-slam"
  }
};

export function getPartnerChessAnimationProfile({
  attribute,
  enemyType,
  sourceId
}: {
  attribute?: BattlePet["attribute"];
  enemyType?: BattleEnemy["type"];
  sourceId: string;
}): PartnerChessAnimationProfile {
  const exactProfile = unitProfiles[sourceId];
  if (exactProfile) return exactProfile;

  if (enemyType === "careless") {
    return {
      attackDuration: 820,
      dashDistance: 106,
      effectTheme: "careless",
      impactType: "careless-impact",
      motion: "clumsy-impact"
    };
  }
  if (enemyType === "forget") {
    return {
      attackDuration: 860,
      dashDistance: 96,
      effectTheme: "forget",
      impactType: "forget-impact",
      motion: "mist-phase"
    };
  }
  if (enemyType === "anxiety") {
    return {
      attackDuration: 920,
      dashDistance: 104,
      effectTheme: "anxiety",
      impactType: "anxiety-impact",
      motion: "pressure-shake"
    };
  }

  if (attribute === "focus") {
    return {
      attackDuration: 850,
      dashDistance: 80,
      effectTheme: "cloud",
      impactType: "cloud-impact",
      motion: "soft-bump"
    };
  }
  if (attribute === "action") {
    return {
      attackDuration: 700,
      dashDistance: 130,
      effectTheme: "fire",
      impactType: "fire-impact",
      motion: "quick-dash"
    };
  }
  return {
    attackDuration: 900,
    dashDistance: 70,
    effectTheme: "growth",
    impactType: "leaf-impact",
    motion: "root-slam"
  };
}
