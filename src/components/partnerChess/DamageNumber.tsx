export function DamageNumber({
  isCounter,
  isSkill,
  playKey,
  side,
  value
}: {
  isCounter?: boolean;
  isSkill?: boolean;
  playKey: string;
  side: "ally" | "enemy";
  value: number;
}) {
  return (
    <span
      className={`pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/75 px-2.5 py-0.5 font-black shadow-[0_10px_22px_rgba(16,36,63,0.16)] partner-chess-damage ${
        isCounter
          ? "bg-gradient-to-r from-gold to-coral text-white text-[16px] partner-chess-damage-advantage"
          : isSkill
            ? "bg-gradient-to-r from-coral to-ink text-white text-[15px] partner-chess-damage-skill"
          : side === "ally"
            ? "bg-coral/92 text-white text-sm"
            : "bg-orange-500/92 text-white text-sm"
      }`}
      key={playKey}
    >
      {isCounter ? "克制 " : isSkill ? "技能 " : ""}-{value}
    </span>
  );
}
