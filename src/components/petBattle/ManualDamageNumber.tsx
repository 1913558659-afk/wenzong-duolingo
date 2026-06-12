export function ManualDamageNumber({
  isCounter,
  isSkill,
  playKey,
  value
}: {
  isCounter?: boolean;
  isSkill?: boolean;
  playKey: string;
  value: number;
}) {
  return (
    <span
      className={`pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 rounded-full border border-white/80 px-3 py-1 font-black shadow-[0_12px_26px_rgba(16,36,63,0.18)] manual-battle-damage ${
        isCounter
          ? "bg-gradient-to-r from-gold to-coral text-base text-white manual-battle-damage-counter"
          : isSkill
            ? "bg-gradient-to-r from-coral to-ink text-[15px] text-white"
            : "bg-coral/95 text-sm text-white"
      }`}
      key={playKey}
    >
      {isCounter ? "克制 " : isSkill ? "技能 " : ""}-{value}
    </span>
  );
}
