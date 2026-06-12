import type { PartnerChessStage } from "@/data/partnerChessStages";

export type PartnerChessShardType = "careless_shard" | "forget_shard" | "anxiety_shard";

export type PartnerChessReward = {
  coins: number;
  petExp: number;
  shardType?: PartnerChessShardType;
  shards: number;
  rating: "S" | "A" | "B" | "C";
};

export function shardTypeForTheme(theme: PartnerChessStage["theme"]): PartnerChessShardType {
  const shardByTheme: Record<PartnerChessStage["theme"], PartnerChessShardType> = {
    anxiety: "anxiety_shard",
    careless: "careless_shard",
    forget: "forget_shard"
  };

  return shardByTheme[theme];
}

export function shardLabel(shardType: PartnerChessShardType) {
  return {
    anxiety_shard: "焦虑碎片",
    careless_shard: "粗心碎片",
    forget_shard: "遗忘碎片"
  }[shardType];
}

function answerMultiplier(correctCount: number) {
  if (correctCount <= 0) return 0.6;
  if (correctCount === 1) return 1;
  if (correctCount === 2) return 1.2;
  return 1.5;
}

function battleRating(isWin: boolean, correctCount: number, totalQuestions: number): PartnerChessReward["rating"] {
  if (!isWin) return "C";
  if (totalQuestions > 0 && correctCount === totalQuestions) return "S";
  if (correctCount >= 2) return "A";
  return "B";
}

export function calculateBattleRewards({
  correctCount,
  isBossRound,
  isWin,
  stageTheme,
  totalQuestions
}: {
  correctCount: number;
  isBossRound: boolean;
  isWin: boolean;
  round: number;
  stageId: string;
  stageTheme: PartnerChessStage["theme"];
  totalQuestions: number;
}): PartnerChessReward {
  const baseCoins = 20;
  const baseExp = 15;
  const multiplier = answerMultiplier(correctCount) * (isWin ? 1.3 : 0.6) * (isBossRound ? 1.8 : 1);
  let shards = 0;

  if (isWin) {
    shards = 1;
    if (isBossRound) shards += 2;
    if (totalQuestions > 0 && correctCount === totalQuestions) shards += 1;
  }

  return {
    coins: Math.round(baseCoins * multiplier),
    petExp: Math.round(baseExp * multiplier),
    rating: battleRating(isWin, correctCount, totalQuestions),
    shardType: shards > 0 ? shardTypeForTheme(stageTheme) : undefined,
    shards
  };
}
