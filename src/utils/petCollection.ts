import { enemies, pets } from "@/data/petBattleData";
import type { BattleEnemy, BattlePet, EnemyType, PetAttribute } from "@/data/petBattleData";
import { getPetSpeciesMasterData } from "@/data/petSpeciesMasterData";
import { getSpeciesSkillTemplate, getSkillsByIdsForPet } from "@/data/petTrainingSkills";
import type { PartnerChessSave } from "@/utils/partnerChessSave";

export const defaultTrainingTeamIds = ["cloud_beast", "fire_fox", "grass_dragon"];

export function attributeFromEnemyType(type: EnemyType): PetAttribute {
  const map: Record<EnemyType, PetAttribute> = {
    anxiety: "focus",
    careless: "action",
    forget: "growth",
    focus: "focus"
  };
  return map[type];
}

export function typeLabelFromEnemyType(type: EnemyType) {
  return {
    anxiety: "焦虑型",
    careless: "粗心型",
    forget: "遗忘型",
    focus: "专注型"
  }[type];
}

export function enemyToPet(enemy: BattleEnemy): BattlePet {
  const attribute = attributeFromEnemyType(enemy.type);
  const species = getPetSpeciesMasterData(enemy.id);
  return {
    attribute,
    baseStats: species?.baseStats ?? {
      attack: Math.max(7, Math.round(enemy.stats.attack * 0.82)),
      defense: Math.max(5, Math.round(enemy.stats.defense * 0.82)),
      hp: Math.max(36, Math.round(enemy.stats.hp * 0.72)),
      speed: Math.max(5, Math.round(enemy.stats.speed * 0.82))
    },
    battleStyle: enemy.description ?? `${enemy.name} 转化而来的训练伙伴。`,
    counters: [enemy.type],
    fitFor: "捕捉获得",
    growth: species?.growthRate ?? {
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
  return syncPetSkillState({
    ...save,
    activeTrainingTeam,
    capturedAt: save.capturedAt ?? {},
    ownedPets,
    petExp: { ...Object.fromEntries(ownedPets.map((petId) => [petId, 0])), ...save.petExp },
    petEquippedSkillIds: save.petEquippedSkillIds ?? {},
    petForgottenSkillIds: save.petForgottenSkillIds ?? {},
    petLearnedSkillIds: save.petLearnedSkillIds ?? {},
    petLevel: { ...Object.fromEntries(ownedPets.map((petId) => [petId, 1])), ...save.petLevel },
    petShards: save.petShards ?? {}
  });
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
    save: syncPetSkillState({
      ...normalized,
      capturedAt: { ...normalized.capturedAt, [petId]: new Date().toISOString() },
      ownedPets: [...normalized.ownedPets, petId],
      petExp: { ...normalized.petExp, [petId]: 0 },
      petLevel: { ...normalized.petLevel, [petId]: 1 }
    })
  };
}

function unlockedSkillIdsForPet(pet: BattlePet, level: number) {
  return getSpeciesSkillTemplate(pet).filter((skill) => level >= skill.unlockLevel).map((skill) => skill.id);
}

function fallbackAttackSkillId(pet: BattlePet) {
  return getSpeciesSkillTemplate(pet).find((skill) => skill.power > 0 || skill.type === "attack" || skill.type === "power_attack" || skill.type === "multi_hit")?.id;
}

function normalizeSkillIdsForPet(save: PartnerChessSave, petId: string) {
  const pet = getTrainingPetById(petId);
  const level = Math.max(1, save.petLevel[petId] ?? 1);
  const template = getSpeciesSkillTemplate(pet);
  const templateIds = new Set(template.map((skill) => skill.id));
  const unlockedIds = unlockedSkillIdsForPet(pet, level);
  const forgotten = new Set(save.petForgottenSkillIds?.[petId] ?? []);
  const existingLearned = (save.petLearnedSkillIds?.[petId] ?? []).filter((skillId) => templateIds.has(skillId));
  const learned = Array.from(new Set([...existingLearned, ...unlockedIds.filter((skillId) => !forgotten.has(skillId))]));
  const attackSkillId = fallbackAttackSkillId(pet);
  if (attackSkillId && !learned.some((skillId) => {
    const skill = template.find((item) => item.id === skillId);
    return Boolean(skill && (skill.power > 0 || skill.type === "attack" || skill.type === "power_attack" || skill.type === "multi_hit"));
  })) {
    learned.unshift(attackSkillId);
  }

  const learnedSet = new Set(learned);
  const existingEquipped = (save.petEquippedSkillIds?.[petId] ?? []).filter((skillId) => learnedSet.has(skillId)).slice(0, 4);
  const equipped = [...existingEquipped];
  for (const skillId of learned) {
    if (equipped.length >= 4) break;
    if (!equipped.includes(skillId)) equipped.push(skillId);
  }

  return { equipped: equipped.slice(0, 4), learned };
}

export function syncPetSkillState(save: PartnerChessSave): PartnerChessSave {
  const ownedPets = normalizeOwnedPets(save);
  const learned: Record<string, string[]> = {};
  const equipped: Record<string, string[]> = {};
  const forgotten: Record<string, string[]> = {};
  for (const petId of ownedPets) {
    const state = normalizeSkillIdsForPet(save, petId);
    const templateIds = new Set(getSpeciesSkillTemplate(getTrainingPetById(petId)).map((skill) => skill.id));
    learned[petId] = state.learned;
    equipped[petId] = state.equipped;
    forgotten[petId] = (save.petForgottenSkillIds?.[petId] ?? []).filter((skillId) => templateIds.has(skillId));
  }

  return {
    ...save,
    ownedPets,
    petEquippedSkillIds: equipped,
    petForgottenSkillIds: forgotten,
    petLearnedSkillIds: learned
  };
}

export function getLearnedSkillIds(save: PartnerChessSave, petId: string) {
  return syncPetSkillState(save).petLearnedSkillIds[petId] ?? [];
}

export function getEquippedSkillIds(save: PartnerChessSave, petId: string) {
  return syncPetSkillState(save).petEquippedSkillIds[petId] ?? [];
}

export function getEquippedTrainingSkills(save: PartnerChessSave, petId: string) {
  const pet = getTrainingPetById(petId);
  return getSkillsByIdsForPet(pet, getEquippedSkillIds(save, petId)).slice(0, 4);
}

export function setEquippedSkillIds(save: PartnerChessSave, petId: string, skillIds: string[]) {
  const synced = syncPetSkillState(save);
  const learned = new Set(synced.petLearnedSkillIds[petId] ?? []);
  const template = new Set(getSpeciesSkillTemplate(getTrainingPetById(petId)).map((skill) => skill.id));
  const equipped = Array.from(new Set(skillIds)).filter((skillId) => learned.has(skillId) && template.has(skillId)).slice(0, 4);
  return syncPetSkillState({
    ...synced,
    petEquippedSkillIds: {
      ...synced.petEquippedSkillIds,
      [petId]: equipped
    }
  });
}

export function recommendSkillLoadout(save: PartnerChessSave, petId: string) {
  const synced = syncPetSkillState(save);
  const pet = getTrainingPetById(petId);
  const learned = new Set(synced.petLearnedSkillIds[petId] ?? []);
  const ranked = getSpeciesSkillTemplate(pet)
    .filter((skill) => learned.has(skill.id))
    .sort((left, right) => {
      const leftScore = (left.power > 0 ? 100 : 0) + (left.type === "shield" || left.type === "heal" ? 30 : 0) + (left.type === "debuff" ? 20 : 0) + left.unlockLevel;
      const rightScore = (right.power > 0 ? 100 : 0) + (right.type === "shield" || right.type === "heal" ? 30 : 0) + (right.type === "debuff" ? 20 : 0) + right.unlockLevel;
      return rightScore - leftScore;
    })
    .slice(0, 4)
    .map((skill) => skill.id);
  return setEquippedSkillIds(synced, petId, ranked);
}

export function forgetLearnedSkill(save: PartnerChessSave, petId: string, skillId: string) {
  const synced = syncPetSkillState(save);
  const pet = getTrainingPetById(petId);
  const template = getSpeciesSkillTemplate(pet);
  const skill = template.find((item) => item.id === skillId);
  if (!skill) return { message: "技能不存在。", save: synced, success: false };
  const learned = synced.petLearnedSkillIds[petId] ?? [];
  const remaining = learned.filter((item) => item !== skillId);
  const remainingSkills = getSkillsByIdsForPet(pet, remaining);
  const hasAttack = remainingSkills.some((item) => item.power > 0 || item.type === "attack" || item.type === "power_attack" || item.type === "multi_hit");
  if (!hasAttack) {
    return { message: "至少需要保留一个可用攻击技能。", save: synced, success: false };
  }
  if (skill.unlockLevel <= 1 && skill.power > 0) {
    return { message: "基础攻击技能不能遗忘。", save: synced, success: false };
  }

  return {
    message: `已遗忘「${skill.name}」。`,
    save: syncPetSkillState({
      ...synced,
      petEquippedSkillIds: {
        ...synced.petEquippedSkillIds,
        [petId]: (synced.petEquippedSkillIds[petId] ?? []).filter((item) => item !== skillId)
      },
      petForgottenSkillIds: {
        ...synced.petForgottenSkillIds,
        [petId]: Array.from(new Set([...(synced.petForgottenSkillIds[petId] ?? []), skillId]))
      },
      petLearnedSkillIds: {
        ...synced.petLearnedSkillIds,
        [petId]: remaining
      }
    }),
    success: true
  };
}
