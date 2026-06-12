import { pets } from "@/data/petBattleData";
import type { PartnerChessReward } from "@/data/partnerChessRewards";
import type { ChessUnit } from "@/utils/partnerChessEngine";

export const partnerChessSaveKey = "partnerChessSave";
export const partnerChessLevelCap = 20;

export type PartnerChessSave = {
  activeTrainingTeam: string[];
  capturedAt: Record<string, string>;
  coins: number;
  petExp: Record<string, number>;
  petLevel: Record<string, number>;
  petShards: Record<string, number>;
  shards: Record<string, number>;
  clearedStages: Record<string, number>;
  ownedPets: string[];
  totalBattles: number;
  totalWins: number;
  updatedAt: string;
};

const defaultTrainingPetIds = ["cloud_beast", "fire_fox", "grass_dragon"];

export type PetGrowthResult = {
  afterExp: number;
  afterLevel: number;
  beforeExp: number;
  beforeLevel: number;
  leveledUp: boolean;
  petId: string;
  petName: string;
};

export type AppliedBattleReward = {
  growth: PetGrowthResult[];
  reward: PartnerChessReward;
  save: PartnerChessSave;
};

function initialPetLevel() {
  return Object.fromEntries(pets.map((pet) => [pet.id, 1]));
}

function initialPetExp() {
  return Object.fromEntries(pets.map((pet) => [pet.id, 0]));
}

export function defaultPartnerChessSave(): PartnerChessSave {
  return {
    activeTrainingTeam: defaultTrainingPetIds,
    capturedAt: {},
    clearedStages: {},
    coins: 0,
    petExp: initialPetExp(),
    petLevel: initialPetLevel(),
    petShards: {},
    shards: {},
    ownedPets: defaultTrainingPetIds,
    totalBattles: 0,
    totalWins: 0,
    updatedAt: new Date().toISOString()
  };
}

function normalizeOwnedPets(value: string[] | undefined) {
  return Array.from(new Set([...(value ?? []), ...defaultTrainingPetIds]));
}

function normalizeTrainingTeam(value: string[] | undefined, ownedPets: string[]) {
  const filtered = Array.from(new Set(value ?? [])).filter((petId) => ownedPets.includes(petId)).slice(0, 3);
  for (const petId of defaultTrainingPetIds) {
    if (filtered.length >= 3) break;
    if (!filtered.includes(petId)) filtered.push(petId);
  }
  return filtered.slice(0, 3);
}

export function loadPartnerChessSave(): PartnerChessSave {
  if (typeof window === "undefined") return defaultPartnerChessSave();

  try {
    const raw = window.localStorage.getItem(partnerChessSaveKey);
    const parsed = raw ? JSON.parse(raw) as Partial<PartnerChessSave> : {};
    const fallback = defaultPartnerChessSave();
    const ownedPets = normalizeOwnedPets(parsed.ownedPets);
    const activeTrainingTeam = normalizeTrainingTeam(parsed.activeTrainingTeam, ownedPets);
    const initialLevels = Object.fromEntries(ownedPets.map((petId) => [petId, 1]));
    const initialExp = Object.fromEntries(ownedPets.map((petId) => [petId, 0]));

    return {
      activeTrainingTeam,
      capturedAt: parsed.capturedAt ?? fallback.capturedAt,
      clearedStages: parsed.clearedStages ?? fallback.clearedStages,
      coins: parsed.coins ?? fallback.coins,
      ownedPets,
      petExp: { ...fallback.petExp, ...initialExp, ...(parsed.petExp ?? {}) },
      petLevel: { ...fallback.petLevel, ...initialLevels, ...(parsed.petLevel ?? {}) },
      petShards: parsed.petShards ?? fallback.petShards,
      shards: parsed.shards ?? fallback.shards,
      totalBattles: parsed.totalBattles ?? fallback.totalBattles,
      totalWins: parsed.totalWins ?? fallback.totalWins,
      updatedAt: parsed.updatedAt ?? fallback.updatedAt
    };
  } catch {
    return defaultPartnerChessSave();
  }
}

export function savePartnerChessSave(save: PartnerChessSave) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(partnerChessSaveKey, JSON.stringify({ ...save, updatedAt: new Date().toISOString() }));
}

export function getRequiredPetExp(level: number) {
  return 50 + (level - 1) * 30;
}

export function getPetLevelInfo(save: PartnerChessSave, petId: string) {
  const level = Math.min(partnerChessLevelCap, save.petLevel[petId] ?? 1);
  const exp = save.petExp[petId] ?? 0;
  return {
    exp,
    level,
    requiredExp: level >= partnerChessLevelCap ? 0 : getRequiredPetExp(level)
  };
}

export function addPetExp(save: PartnerChessSave, petId: string, expGain: number): { save: PartnerChessSave; growth: PetGrowthResult } {
  const pet = pets.find((item) => item.id === petId);
  const beforeLevel = Math.min(partnerChessLevelCap, save.petLevel[petId] ?? 1);
  const beforeExp = save.petExp[petId] ?? 0;
  let level = beforeLevel;
  let exp = beforeExp + expGain;

  while (level < partnerChessLevelCap && exp >= getRequiredPetExp(level)) {
    exp -= getRequiredPetExp(level);
    level += 1;
  }

  const nextSave = {
    ...save,
    petExp: { ...save.petExp, [petId]: exp },
    petLevel: { ...save.petLevel, [petId]: level }
  };

  return {
    growth: {
      afterExp: exp,
      afterLevel: level,
      beforeExp,
      beforeLevel,
      leveledUp: level > beforeLevel,
      petId,
      petName: pet?.name ?? petId
    },
    save: nextSave
  };
}

export function applyBattleRewards({
  allyPetIds,
  isWin,
  reward,
  round,
  save,
  stageId
}: {
  allyPetIds: string[];
  isWin: boolean;
  reward: PartnerChessReward;
  round: number;
  save: PartnerChessSave;
  stageId: string;
}): AppliedBattleReward {
  let nextSave: PartnerChessSave = {
    ...save,
    coins: save.coins + reward.coins,
    clearedStages: isWin
      ? { ...save.clearedStages, [stageId]: Math.max(save.clearedStages[stageId] ?? 0, round) }
      : save.clearedStages,
    shards: reward.shardType
      ? { ...save.shards, [reward.shardType]: (save.shards[reward.shardType] ?? 0) + reward.shards }
      : save.shards,
    totalBattles: save.totalBattles + 1,
    totalWins: save.totalWins + (isWin ? 1 : 0),
    updatedAt: new Date().toISOString()
  };

  const growth: PetGrowthResult[] = [];
  for (const petId of allyPetIds) {
    const result = addPetExp(nextSave, petId, reward.petExp);
    nextSave = result.save;
    growth.push(result.growth);
  }

  return { growth, reward, save: nextSave };
}

export function applyPetLevelsToChessUnits(units: ChessUnit[], save: PartnerChessSave): ChessUnit[] {
  return units.map((unit) => {
    const level = save.petLevel[unit.sourceId] ?? 1;
    const levelBonus = Math.max(0, level - 1);
    return {
      ...unit,
      attack: unit.attack + levelBonus,
      defense: unit.defense + levelBonus,
      hp: unit.hp + levelBonus * 3,
      maxHp: unit.maxHp + levelBonus * 3
    };
  });
}
