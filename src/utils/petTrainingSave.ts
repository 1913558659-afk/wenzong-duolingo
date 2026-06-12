import { loadPartnerChessSave, savePartnerChessSave } from "@/utils/partnerChessSave";
import type { PartnerChessSave } from "@/utils/partnerChessSave";
import type { EnemyType } from "@/data/petBattleData";

export const petTrainingDailyRewardKey = "petTrainingDailyReward";

export type DailyTrainingProgress = {
  claimedCaptureBonus: boolean;
  claimedFirstEntry: boolean;
  claimedFirstWin: boolean;
  claimedThreeBattles: boolean;
  dailyBattles: number;
  dailyCaptures: number;
  dailyWins: number;
  lastClaimDate: string;
};

export type PetTrainingRewardResult = {
  message: string;
  save: PartnerChessSave;
};

export function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

export function defaultDailyTrainingProgress(): DailyTrainingProgress {
  return {
    claimedCaptureBonus: false,
    claimedFirstEntry: false,
    claimedFirstWin: false,
    claimedThreeBattles: false,
    dailyBattles: 0,
    dailyCaptures: 0,
    dailyWins: 0,
    lastClaimDate: todayKey()
  };
}

function normalizeDailyProgress(value?: Partial<DailyTrainingProgress> | null): DailyTrainingProgress {
  const fallback = defaultDailyTrainingProgress();
  if (!value || value.lastClaimDate !== fallback.lastClaimDate) return fallback;

  return {
    ...fallback,
    ...value,
    dailyBattles: Math.max(0, Number(value.dailyBattles ?? 0)),
    dailyCaptures: Math.max(0, Number(value.dailyCaptures ?? 0)),
    dailyWins: Math.max(0, Number(value.dailyWins ?? 0))
  };
}

export function loadDailyTrainingProgress(): DailyTrainingProgress {
  if (typeof window === "undefined") return defaultDailyTrainingProgress();

  try {
    const raw = window.localStorage.getItem(petTrainingDailyRewardKey);
    return normalizeDailyProgress(raw ? JSON.parse(raw) as Partial<DailyTrainingProgress> : null);
  } catch {
    return defaultDailyTrainingProgress();
  }
}

export function saveDailyTrainingProgress(progress: DailyTrainingProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(petTrainingDailyRewardKey, JSON.stringify(normalizeDailyProgress(progress)));
}

export function shardKeyForEnemyType(type: EnemyType) {
  return `${type}_shard`;
}

export function shardLabelForEnemyType(type: EnemyType) {
  return {
    anxiety: "焦虑碎片",
    careless: "粗心碎片",
    forget: "遗忘碎片",
    focus: "专注碎片"
  }[type];
}

export function addCoinsAndShard({
  coins = 0,
  shardAmount = 0,
  shardType,
  save = loadPartnerChessSave()
}: {
  coins?: number;
  save?: PartnerChessSave;
  shardAmount?: number;
  shardType?: EnemyType;
}): PartnerChessSave {
  const shardKey = shardType ? shardKeyForEnemyType(shardType) : "";
  const nextSave: PartnerChessSave = {
    ...save,
    coins: save.coins + coins,
    shards: shardType ? { ...save.shards, [shardKey]: (save.shards[shardKey] ?? 0) + shardAmount } : save.shards,
    updatedAt: new Date().toISOString()
  };
  savePartnerChessSave(nextSave);
  return nextSave;
}

export function claimDailyFirstEntry(save = loadPartnerChessSave()): PetTrainingRewardResult | null {
  const progress = loadDailyTrainingProgress();
  if (progress.claimedFirstEntry) return null;
  const nextProgress = { ...progress, claimedFirstEntry: true };
  saveDailyTrainingProgress(nextProgress);
  const nextSave = addCoinsAndShard({ coins: 20, save });
  return { message: "每日首次进入训练场：学习币 +20。", save: nextSave };
}

export function recordTrainingBattle({
  captured,
  enemyType,
  isWin,
  save = loadPartnerChessSave()
}: {
  captured?: boolean;
  enemyType: EnemyType;
  isWin: boolean;
  save?: PartnerChessSave;
}) {
  const progress = loadDailyTrainingProgress();
  let nextProgress = {
    ...progress,
    dailyBattles: progress.dailyBattles + 1,
    dailyCaptures: progress.dailyCaptures + (captured ? 1 : 0),
    dailyWins: progress.dailyWins + (isWin ? 1 : 0)
  };
  let nextSave = save;
  const messages: string[] = [];

  if (isWin && !nextProgress.claimedFirstWin) {
    nextProgress = { ...nextProgress, claimedFirstWin: true };
    nextSave = addCoinsAndShard({ coins: 50, save: nextSave });
    messages.push("每日首次训练胜利：学习币 +50。");
  }

  if (nextProgress.dailyBattles >= 3 && !nextProgress.claimedThreeBattles) {
    nextProgress = { ...nextProgress, claimedThreeBattles: true };
    nextSave = addCoinsAndShard({ coins: 80, save: nextSave, shardAmount: 1, shardType: enemyType });
    messages.push(`每日完成 3 次训练：学习币 +80，${shardLabelForEnemyType(enemyType)} +1。`);
  }

  if (captured && !nextProgress.claimedCaptureBonus) {
    nextProgress = { ...nextProgress, claimedCaptureBonus: true };
    nextSave = addCoinsAndShard({ save: nextSave, shardAmount: 2, shardType: enemyType });
    messages.push(`每日首次捕捉成功：${shardLabelForEnemyType(enemyType)} +2。`);
  }

  saveDailyTrainingProgress(nextProgress);
  return {
    messages,
    progress: nextProgress,
    save: nextSave
  };
}
