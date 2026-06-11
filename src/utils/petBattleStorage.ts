import { pets } from "@/data/petBattleData";

export type PetTrainingStats = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type PetBattleSaveState = {
  selectedPetId: string;
  petLevel: number;
  petExp: number;
  companionTrainingExp: number;
  battleStage: number;
  bestStage: number;
  training: PetTrainingStats;
  skillLevels: Record<string, number>;
  battleHistory: string[];
};

const petBattleStateKey = "sayhi-pet-battle-state";

export const defaultPetBattleState: PetBattleSaveState = {
  selectedPetId: pets[0]?.id ?? "cloud_beast",
  petLevel: 1,
  petExp: 0,
  companionTrainingExp: 0,
  battleStage: 1,
  bestStage: 1,
  training: {
    hp: 0,
    attack: 0,
    defense: 0,
    speed: 0
  },
  skillLevels: {},
  battleHistory: []
};

function normalizePetBattleState(value: Partial<PetBattleSaveState> | null | undefined): PetBattleSaveState {
  return {
    ...defaultPetBattleState,
    ...value,
    petLevel: Math.max(1, Number(value?.petLevel ?? defaultPetBattleState.petLevel)),
    petExp: Math.max(0, Number(value?.petExp ?? defaultPetBattleState.petExp)),
    companionTrainingExp: Math.max(0, Number(value?.companionTrainingExp ?? defaultPetBattleState.companionTrainingExp)),
    battleStage: Math.max(1, Number(value?.battleStage ?? defaultPetBattleState.battleStage)),
    bestStage: Math.max(1, Number(value?.bestStage ?? defaultPetBattleState.bestStage)),
    training: {
      ...defaultPetBattleState.training,
      ...(value?.training ?? {})
    },
    skillLevels: value?.skillLevels ?? {},
    battleHistory: Array.isArray(value?.battleHistory) ? value.battleHistory : []
  };
}

export function loadPetBattleState(): PetBattleSaveState {
  if (typeof window === "undefined") {
    return defaultPetBattleState;
  }

  try {
    const saved = window.localStorage.getItem(petBattleStateKey);
    return normalizePetBattleState(saved ? JSON.parse(saved) as Partial<PetBattleSaveState> : null);
  } catch {
    return defaultPetBattleState;
  }
}

export function savePetBattleState(state: PetBattleSaveState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(petBattleStateKey, JSON.stringify(normalizePetBattleState(state)));
}

export function updatePetBattleState(updater: (current: PetBattleSaveState) => PetBattleSaveState) {
  const next = updater(loadPetBattleState());
  savePetBattleState(next);
  return next;
}

export function addCompanionTrainingExp(amount: number) {
  if (amount <= 0) {
    return loadPetBattleState();
  }

  return updatePetBattleState((current) => ({
    ...current,
    companionTrainingExp: current.companionTrainingExp + amount
  }));
}

