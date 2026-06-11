import { DamageNumber } from "@/components/partnerChess/DamageNumber";
import type { ChessUnit } from "@/utils/partnerChessEngine";

export type CharacterAnimationState = "idle" | "attack" | "hit" | "skill";

function hpPercent(unit: ChessUnit) {
  return Math.max(0, Math.min(100, Math.round((unit.hp / Math.max(1, unit.maxHp)) * 100)));
}

export function AnimatedCharacter({
  animation,
  damage,
  playKey,
  size = "medium",
  unit
}: {
  animation: CharacterAnimationState;
  damage?: number;
  playKey: string;
  size?: "small" | "medium" | "large" | "boss";
  unit: ChessUnit;
}) {
  const isAlly = unit.side === "ally";
  const hp = hpPercent(unit);
  const sizeClass = {
    small: "w-[86px] sm:w-[104px]",
    medium: "w-[98px] sm:w-[122px]",
    large: "w-[112px] sm:w-[144px]",
    boss: "w-[128px] sm:w-[168px]"
  }[size];
  const imageClass = {
    small: "h-[78px] sm:h-[94px]",
    medium: "h-[90px] sm:h-[112px]",
    large: "h-[104px] sm:h-[134px]",
    boss: "h-[120px] sm:h-[158px]"
  }[size];
  const animationClass = {
    idle: "partner-chess-idle",
    attack: isAlly ? "partner-chess-attack-ally" : "partner-chess-attack-enemy",
    hit: "partner-chess-hit",
    skill: "partner-chess-skill"
  }[animation];

  return (
    <div className={`relative flex flex-col items-center ${sizeClass}`}>
      <div className={`relative grid place-items-center bg-transparent ${imageClass} ${animationClass}`}>
        {damage && damage > 0 && <DamageNumber playKey={`${playKey}-${unit.id}-${damage}`} side={unit.side} value={damage} />}
        <img
          alt={unit.name}
          className={`h-full w-full bg-transparent object-contain drop-shadow-[0_16px_16px_rgba(16,36,63,0.22)] mix-blend-multiply [image-rendering:pixelated] ${animation === "hit" ? "partner-chess-hit-flash" : ""}`}
          src={unit.image}
        />
        {animation === "skill" && <span className={`absolute inset-1 rounded-full blur-sm ${isAlly ? "ring-4 ring-tide/35" : "ring-4 ring-coral/35"}`} />}
      </div>
      <span className="pointer-events-none -mt-2 h-4 w-4/5 rounded-[50%] bg-ink/18 blur-md" />
      <div className="mt-1 w-full rounded-2xl border border-white/60 bg-white/54 px-2 py-1.5 text-center shadow-[0_8px_18px_rgba(16,36,63,0.08)] backdrop-blur">
        <p className="truncate text-xs font-black text-ink sm:text-sm">{unit.name}</p>
        <div className="mt-1 flex items-center justify-between text-[10px] font-black text-ink/46">
          <span>HP</span>
          <span>{Math.max(0, unit.hp)}/{unit.maxHp}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div className={`h-full rounded-full bg-gradient-to-r ${isAlly ? "from-tide to-leaf" : "from-coral to-gold"}`} style={{ width: `${hp}%` }} />
        </div>
      </div>
    </div>
  );
}
