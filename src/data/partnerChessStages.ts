export type PartnerChessStageId = "careless_trial" | "forget_rift" | "anxiety_tower";

export type PartnerChessStage = {
  id: PartnerChessStageId;
  name: string;
  description: string;
  theme: "careless" | "forget" | "anxiety";
  rounds: Array<{
    round: number;
    title: string;
    enemyIds: string[];
    isBoss?: boolean;
  }>;
};

export const partnerChessStages: PartnerChessStage[] = [
  {
    id: "careless_trial",
    name: "粗心试炼",
    description: "从漏看条件到连续马虎，训练快速纠错与稳定审题。",
    theme: "careless",
    rounds: [
      { round: 1, title: "热身粗心", enemyIds: ["careless_beast"] },
      { round: 2, title: "高速漏题", enemyIds: ["careless_shark"] },
      { round: 3, title: "马虎连击", enemyIds: ["careless_tiger"] },
      { round: 4, title: "双重马虎", enemyIds: ["careless_shark", "careless_tiger"] },
      { round: 5, title: "粗撞 Boss", enemyIds: ["careless_rhino"], isBoss: true }
    ]
  },
  {
    id: "forget_rift",
    name: "遗忘裂谷",
    description: "面对记忆断片、碎片化知识与复习混乱，靠积累稳住节奏。",
    theme: "forget",
    rounds: [
      { round: 1, title: "断片入口", enemyIds: ["forget_shadow"] },
      { round: 2, title: "迷糊便签", enemyIds: ["forget-lizard-01"] },
      { round: 3, title: "碎片迷宫", enemyIds: ["forget-ant-02"] },
      { round: 4, title: "记忆乱流", enemyIds: ["forget-lizard-01", "forget-ant-02"] },
      { round: 5, title: "旋忘 Boss", enemyIds: ["forget-chicken-03"], isBoss: true }
    ]
  },
  {
    id: "anxiety_tower",
    name: "焦虑高塔",
    description: "焦虑会抢节奏、压迫判断，专注型伙伴能帮你稳住心态。",
    theme: "anxiety",
    rounds: [
      { round: 1, title: "焦虑初现", enemyIds: ["anxiety_beast"] },
      { round: 2, title: "警觉冲刺", enemyIds: ["anxiety-dog-01"] },
      { round: 3, title: "疑影干扰", enemyIds: ["anxiety-cat-02"] },
      { round: 4, title: "焦虑夹击", enemyIds: ["anxiety-dog-01", "anxiety-cat-02"] },
      { round: 5, title: "重压 Boss", enemyIds: ["anxiety-bear-03"], isBoss: true }
    ]
  }
];

export function getPrepQuestionCount(round: number) {
  if (round <= 1) return 1;
  if (round === 2) return 2;
  return 3;
}
