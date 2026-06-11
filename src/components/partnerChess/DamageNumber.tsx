export function DamageNumber({ value, side, playKey }: { value: number; side: "ally" | "enemy"; playKey: string }) {
  return (
    <span
      className={`pointer-events-none absolute -top-5 left-1/2 z-30 -translate-x-1/2 rounded-full px-2.5 py-1 text-sm font-black shadow-[0_10px_22px_rgba(16,36,63,0.16)] partner-chess-damage ${
        side === "ally" ? "bg-coral text-white" : "bg-tide text-white"
      }`}
      key={playKey}
    >
      -{value}
    </span>
  );
}
