export type BattleStatusType = "anxietyDown" | "burn" | "forget" | "shield" | "stun";

export type BattleStatusEffect = {
  amount?: number;
  duration: number;
  id: string;
  label: string;
  type: BattleStatusType;
};

export const statusMeta: Record<BattleStatusType, { label: string; text: string; tone: string }> = {
  anxietyDown: {
    label: "压制",
    text: "下一次造成伤害降低",
    tone: "bg-red-100 text-red-700 ring-red-200"
  },
  burn: {
    label: "灼烧",
    text: "回合开始受到伤害",
    tone: "bg-orange-100 text-orange-700 ring-orange-200"
  },
  forget: {
    label: "遗忘",
    text: "技能冷却被延长",
    tone: "bg-violet-100 text-violet-700 ring-violet-200"
  },
  shield: {
    label: "护盾",
    text: "先抵扣受到的伤害",
    tone: "bg-sky-100 text-sky-700 ring-sky-200"
  },
  stun: {
    label: "眩晕",
    text: "跳过下一次行动",
    tone: "bg-yellow-100 text-yellow-700 ring-yellow-200"
  }
};

export function statusLabel(status: BattleStatusEffect) {
  if (status.type === "shield") return `${statusMeta[status.type].label} ${status.amount ?? 0}`;
  return `${statusMeta[status.type].label} ${status.duration}`;
}
