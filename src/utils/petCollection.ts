import { enemies, pets } from "@/data/petBattleData";
import type { BattleEnemy, BattlePet, EnemyType, PetAttribute } from "@/data/petBattleData";
import type { PartnerChessSave } from "@/utils/partnerChessSave";

export const defaultTrainingTeamIds = ["cloud_beast", "fire_fox", "grass_dragon"];

export function attributeFromEnemyType(type: EnemyType): PetAttribute {
  const map: Record<EnemyType, PetAttribute> = {
    anxiety: "focus",
    careless: "action",
    forget: "growth"
  };
  return map[type];
}

export function typeLabelFromEnemyType(type: EnemyType) {
  return {
    anxiety: "焦虑型",
    careless: "粗心型",
    forget: "遗忘型"
  }[type];
}

export function enemyToPet(enemy: BattleEnemy): BattlePet {
  const attribute = attributeFromEnemyType(enemy.type);
  return {
    attribute,
    baseStats: {
      attack: Math.max(7, Math.round(enemy.stats.attack * 0.82)),
      defense: Math.max(5, Math.round(enemy.stats.defense * 0.82)),
      hp: Math.max(36, Math.round(enemy.stats.hp * 0.72)),
      speed: Math.max(5, Math.round(enemy.stats.speed * 0.82))
    },
    battleStyle: enemy.description ?? `${enemy.name} 转化而来的训练伙伴。`,
    counters: [enemy.type],
    fitFor: "捕捉获得",
    growth: {
      attack: 1,
      defense: 1,
      hp: 3,
      speed: 1
    },
    id: enemy.id,
    image: enemy.image,
    name: enemy.name,
    role: `${typeLabelFromEnemyType(enemy.type)} / ${enemy.role}`,
    skills: []
  };
}

export function getTrainingPetById(petId: string): BattlePet {
  const initialPet = pets.find((pet) => pet.id === petId);
  if (initialPet) return initialPet;
  const enemy = enemies.find((item) => item.id === petId);
  return enemy ? enemyToPet(enemy) : pets[0];
}

export function getAllCollectiblePets(): BattlePet[] {
  return [...pets, ...enemies.map(enemyToPet)];
}

export function isInitialPet(petId: string) {
  return defaultTrainingTeamIds.includes(petId);
}

export function isCapturablePet(petId: string) {
  const enemy = enemies.find((item) => item.id === petId);
  return Boolean(enemy && enemy.stage !== "advancedBoss");
}

export function isBossPet(petId: string) {
  const enemy = enemies.find((item) => item.id === petId);
  return Boolean(enemy?.stage === "advancedBoss");
}

export function normalizeOwnedPets(save: PartnerChessSave) {
  return Array.from(new Set([...(save.ownedPets ?? []), ...defaultTrainingTeamIds]));
}

export function normalizeActiveTrainingTeam(save: PartnerChessSave) {
  const ownedPets = normalizeOwnedPets(save);
  const team = Array.from(new Set(save.activeTrainingTeam ?? [])).filter((petId) => ownedPets.includes(petId)).slice(0, 3);
  for (const petId of defaultTrainingTeamIds) {
    if (team.length >= 3) break;
    if (!team.includes(petId)) team.push(petId);
  }
  return team.slice(0, 3);
}

export function ensurePetCollection(save: PartnerChessSave): PartnerChessSave {
  const ownedPets = normalizeOwnedPets(save);
  const activeTrainingTeam = normalizeActiveTrainingTeam({ ...save, ownedPets });
  return {
    ...save,
    activeTrainingTeam,
    capturedAt: save.capturedAt ?? {},
    ownedPets,
    petExp: { ...Object.fromEntries(ownedPets.map((petId) => [petId, 0])), ...save.petExp },
    petLevel: { ...Object.fromEntries(ownedPets.map((petId) => [petId, 1])), ...save.petLevel },
    petShards: save.petShards ?? {}
  };
}

export function replaceTeamSlot(save: PartnerChessSave, slotIndex: number, petId: string): PartnerChessSave {
  const normalized = ensurePetCollection(save);
  if (!normalized.ownedPets.includes(petId)) return normalized;
  const nextTeam = [...normalized.activeTrainingTeam];
  if (nextTeam.includes(petId)) return normalized;
  nextTeam[Math.max(0, Math.min(2, slotIndex))] = petId;
  return { ...normalized, activeTrainingTeam: nextTeam.filter(Boolean).slice(0, 3) };
}

export function addPetToCollection(save: PartnerChessSave, petId: string) {
  const normalized = ensurePetCollection(save);
  const alreadyOwned = normalized.ownedPets.includes(petId);
  const shardKey = `${petId}_shard`;
  if (alreadyOwned) {
    return {
      alreadyOwned: true,
      save: {
        ...normalized,
        petShards: { ...normalized.petShards, [shardKey]: (normalized.petShards[shardKey] ?? 0) + 3 }
      }
    };
  }
  return {
    alreadyOwned: false,
    save: {
      ...normalized,
      capturedAt: { ...normalized.capturedAt, [petId]: new Date().toISOString() },
      ownedPets: [...normalized.ownedPets, petId],
      petExp: { ...normalized.petExp, [petId]: 0 },
      petLevel: { ...normalized.petLevel, [petId]: 1 }
    }
  };
}
