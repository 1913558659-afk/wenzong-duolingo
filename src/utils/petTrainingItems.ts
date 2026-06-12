import type { BattleEnemy } from "@/data/petBattleData";

export type CaptureBallId = "basic" | "advanced" | "premium";

export type CaptureBallConfig = {
  baseRate: number;
  description: string;
  id: CaptureBallId;
  initialCount: number;
  name: string;
  shortName: string;
  tone: "basic" | "advanced" | "premium";
};

export type PetTrainingItemInventory = {
  captureBalls: Record<CaptureBallId, number>;
  rewardProgress: {
    answeredQuestions: number;
    clearedLevelRewardKeys: string[];
    nextAdvancedAnswerReward: number;
    nextBasicAnswerReward: number;
    nextPremiumAnswerReward: number;
  };
  updatedAt: string;
};

export type CaptureRateBreakdown = {
  allowed: boolean;
  finalRate: number;
  notes: string[];
};

export type CaptureRewardGrant = {
  inventory: PetTrainingItemInventory;
  messages: string[];
};

export const petTrainingItemInventoryKey = "petTrainingItemInventory";

export const captureBallConfigs: CaptureBallConfig[] = [
  {
    baseRate: 35,
    description: "适合低血量普通训练敌人。",
    id: "basic",
    initialCount: 10,
    name: "基础伙伴球",
    shortName: "普通",
    tone: "basic"
  },
  {
    baseRate: 55,
    description: "对精英敌人更稳定的中级捕捉道具。",
    id: "advanced",
    initialCount: 2,
    name: "进阶伙伴球",
    shortName: "中级",
    tone: "advanced"
  },
  {
    baseRate: 72,
    description: "高难训练里更可靠的高级捕捉道具。",
    id: "premium",
    initialCount: 0,
    name: "高级伙伴球",
    shortName: "高级",
    tone: "premium"
  }
];

const defaultCaptureBalls: Record<CaptureBallId, number> = {
  basic: 10,
  advanced: 2,
  premium: 0
};

function clampRate(value: number) {
  return Math.max(15, Math.min(92, Math.round(value)));
}

function normalizeInventory(value?: Partial<PetTrainingItemInventory> | null): PetTrainingItemInventory {
  return {
    captureBalls: {
      basic: Math.max(0, Number(value?.captureBalls?.basic ?? defaultCaptureBalls.basic)),
      advanced: Math.max(0, Number(value?.captureBalls?.advanced ?? defaultCaptureBalls.advanced)),
      premium: Math.max(0, Number(value?.captureBalls?.premium ?? defaultCaptureBalls.premium))
    },
    rewardProgress: {
      answeredQuestions: Math.max(0, Number(value?.rewardProgress?.answeredQuestions ?? 0)),
      clearedLevelRewardKeys: Array.isArray(value?.rewardProgress?.clearedLevelRewardKeys) ? value.rewardProgress.clearedLevelRewardKeys : [],
      nextAdvancedAnswerReward: Math.max(80, Number(value?.rewardProgress?.nextAdvancedAnswerReward ?? 80)),
      nextBasicAnswerReward: Math.max(30, Number(value?.rewardProgress?.nextBasicAnswerReward ?? 30)),
      nextPremiumAnswerReward: Math.max(150, Number(value?.rewardProgress?.nextPremiumAnswerReward ?? 150))
    },
    updatedAt: value?.updatedAt ?? new Date().toISOString()
  };
}

export function loadPetTrainingItemInventory(): PetTrainingItemInventory {
  if (typeof window === "undefined") return normalizeInventory();

  try {
    const raw = window.localStorage.getItem(petTrainingItemInventoryKey);
    return normalizeInventory(raw ? JSON.parse(raw) as Partial<PetTrainingItemInventory> : null);
  } catch {
    return normalizeInventory();
  }
}

export function savePetTrainingItemInventory(inventory: PetTrainingItemInventory) {
  if (typeof window === "undefined") return;
  const normalized = normalizeInventory({ ...inventory, updatedAt: new Date().toISOString() });
  window.localStorage.setItem(petTrainingItemInventoryKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("petTrainingItemsUpdated", { detail: normalized }));
}

export function addCaptureBalls(
  inventory: PetTrainingItemInventory,
  additions: Partial<Record<CaptureBallId, number>>
): PetTrainingItemInventory {
  return normalizeInventory({
    ...inventory,
    captureBalls: {
      basic: inventory.captureBalls.basic + (additions.basic ?? 0),
      advanced: inventory.captureBalls.advanced + (additions.advanced ?? 0),
      premium: inventory.captureBalls.premium + (additions.premium ?? 0)
    },
    updatedAt: new Date().toISOString()
  });
}

export function consumeCaptureBall(inventory: PetTrainingItemInventory, ballId: CaptureBallId): PetTrainingItemInventory | null {
  if ((inventory.captureBalls[ballId] ?? 0) <= 0) return null;
  return normalizeInventory({
    ...inventory,
    captureBalls: {
      ...inventory.captureBalls,
      [ballId]: inventory.captureBalls[ballId] - 1
    },
    updatedAt: new Date().toISOString()
  });
}

export function getCaptureBallConfig(ballId: CaptureBallId) {
  return captureBallConfigs.find((ball) => ball.id === ballId) ?? captureBallConfigs[0];
}

export function isEliteCaptureTarget(enemy: BattleEnemy) {
  return enemy.stage === "advanced" || enemy.stage === "advancedBoss" || enemy.branch !== "basic";
}

export function calculateCaptureBallRate({
  ballId,
  enemy,
  enemyHp,
  enemyMaxHp,
  enemyLevel,
  petLevel
}: {
  ballId: CaptureBallId;
  enemy: BattleEnemy;
  enemyHp: number;
  enemyLevel: number;
  enemyMaxHp: number;
  petLevel: number;
}): CaptureRateBreakdown {
  const config = getCaptureBallConfig(ballId);
  const hpRatio = enemyMaxHp <= 0 ? 1 : enemyHp / enemyMaxHp;
  const notes: string[] = [];
  if (hpRatio >= 0.35) {
    return { allowed: false, finalRate: 0, notes: ["目标血量过高"] };
  }

  let rate = config.baseRate;
  if (hpRatio <= 0.2) {
    const bonus = ballId === "premium" ? 8 : 10;
    rate += bonus;
    notes.push(`低血量 +${bonus}%`);
  }
  if (enemyLevel <= petLevel) {
    const bonus = ballId === "premium" ? 6 : 8;
    rate += bonus;
    notes.push(`等级稳定 +${bonus}%`);
  }
  const levelGap = enemyLevel - petLevel;
  if (levelGap >= 2) {
    const penalty = ballId === "basic" ? 10 : ballId === "advanced" ? 8 : 12;
    rate -= penalty;
    notes.push(`越级 -${penalty}%`);
  }
  if (levelGap >= 4 && ballId === "premium") {
    rate -= 8;
    notes.push("高阶越级 -8%");
  }
  if (isEliteCaptureTarget(enemy)) {
    const penalty = ballId === "basic" ? 8 : 5;
    rate -= penalty;
    notes.push(`精英敌人 -${penalty}%`);
  }

  return { allowed: true, finalRate: clampRate(rate), notes };
}

export function recordChallengeClearCaptureRewards(levelIndex: number): CaptureRewardGrant {
  let inventory = loadPetTrainingItemInventory();
  const messages: string[] = [];
  const rewardKeys = new Set(inventory.rewardProgress.clearedLevelRewardKeys);
  const additions: Partial<Record<CaptureBallId, number>> = {};

  if (levelIndex > 0 && levelIndex % 3 === 0 && !rewardKeys.has(`level:${levelIndex}:basic`)) {
    rewardKeys.add(`level:${levelIndex}:basic`);
    additions.basic = (additions.basic ?? 0) + 1;
    messages.push(`首次通过第 ${levelIndex} 关：基础伙伴球 +1。`);
  }
  if (levelIndex > 0 && levelIndex % 7 === 0 && !rewardKeys.has(`level:${levelIndex}:advanced`)) {
    rewardKeys.add(`level:${levelIndex}:advanced`);
    additions.advanced = (additions.advanced ?? 0) + 1;
    messages.push(`首次通过第 ${levelIndex} 关：进阶伙伴球 +1。`);
  }
  if (levelIndex > 0 && levelIndex % 15 === 0 && !rewardKeys.has(`level:${levelIndex}:premium`)) {
    rewardKeys.add(`level:${levelIndex}:premium`);
    additions.premium = (additions.premium ?? 0) + 1;
    messages.push(`首次通过第 ${levelIndex} 关：高级伙伴球 +1。`);
  }

  if (messages.length) {
    inventory = addCaptureBalls({
      ...inventory,
      rewardProgress: {
        ...inventory.rewardProgress,
        clearedLevelRewardKeys: [...rewardKeys]
      }
    }, additions);
    savePetTrainingItemInventory(inventory);
  }

  return { inventory, messages };
}

export function recordAnsweredQuestionCaptureRewards(answeredCount: number): CaptureRewardGrant {
  let inventory = loadPetTrainingItemInventory();
  const progress = { ...inventory.rewardProgress, answeredQuestions: inventory.rewardProgress.answeredQuestions + Math.max(0, answeredCount) };
  const additions: Partial<Record<CaptureBallId, number>> = {};
  const messages: string[] = [];

  while (progress.answeredQuestions >= progress.nextBasicAnswerReward) {
    additions.basic = (additions.basic ?? 0) + 1;
    messages.push(`累计答题 ${progress.nextBasicAnswerReward} 题：基础伙伴球 +1。`);
    progress.nextBasicAnswerReward = progress.nextBasicAnswerReward < 150 ? 200 : progress.nextBasicAnswerReward + 50;
  }
  while (progress.answeredQuestions >= progress.nextAdvancedAnswerReward) {
    additions.advanced = (additions.advanced ?? 0) + 1;
    messages.push(`累计答题 ${progress.nextAdvancedAnswerReward} 题：进阶伙伴球 +1。`);
    progress.nextAdvancedAnswerReward = progress.nextAdvancedAnswerReward < 150 ? 270 : progress.nextAdvancedAnswerReward + 120;
  }
  while (progress.answeredQuestions >= progress.nextPremiumAnswerReward) {
    additions.premium = (additions.premium ?? 0) + 1;
    messages.push(`累计答题 ${progress.nextPremiumAnswerReward} 题：高级伙伴球 +1。`);
    progress.nextPremiumAnswerReward += 250;
  }

  inventory = addCaptureBalls({ ...inventory, rewardProgress: progress }, additions);
  savePetTrainingItemInventory(inventory);
  return { inventory, messages };
}
