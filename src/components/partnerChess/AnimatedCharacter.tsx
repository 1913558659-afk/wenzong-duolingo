import type { CSSProperties } from "react";
import { DamageNumber } from "@/components/partnerChess/DamageNumber";
import { getPartnerChessAnimationProfile, type PartnerChessEffectTheme } from "@/data/partnerChessAnimationData";
import type { ChessUnit } from "@/utils/partnerChessEngine";

export type CharacterAnimationState = "idle" | "attack" | "hit" | "skill";

function hpPercent(unit: ChessUnit) {
  return Math.max(0, Math.min(100, Math.round((unit.hp / Math.max(1, unit.maxHp)) * 100)));
}

const skillRingClass: Record<PartnerChessEffectTheme, string> = {
  cloud: "partner-chess-skill-aura-cloud",
  fire: "partner-chess-skill-aura-fire",
  growth: "partner-chess-skill-aura-growth",
  careless: "partner-chess-skill-aura-careless",
  forget: "partner-chess-skill-aura-forget",
  anxiety: "partner-chess-skill-aura-anxiety"
};

export function AnimatedCharacter({
  animation,
  damage,
  dashOffsetX,
  isCounterDamage,
  isSkillDamage,
  playKey,
  size = "medium",
  unit
}: {
  animation: CharacterAnimationState;
  damage?: number;
  dashOffsetX?: number;
  isCounterDamage?: boolean;
  isSkillDamage?: boolean;
  playKey: string;
  size?: "small" | "medium" | "large" | "boss";
  unit: ChessUnit;
}) {
  const isAlly = unit.side === "ally";
  const hp = hpPercent(unit);
  const sizeClass = {
    small: "w-[78px] sm:w-[128px] lg:w-[142px]",
    medium: "w-[88px] sm:w-[142px] lg:w-[158px]",
    large: "w-[104px] sm:w-[162px] lg:w-[178px]",
    boss: "w-[124px] sm:w-[186px] lg:w-[204px]"
  }[size];
  const imageClass = {
    small: "h-[74px] sm:h-[118px] lg:h-[132px]",
    medium: "h-[84px] sm:h-[132px] lg:h-[146px]",
    large: "h-[100px] sm:h-[152px] lg:h-[166px]",
    boss: "h-[118px] sm:h-[176px] lg:h-[190px]"
  }[size];
  const profile = getPartnerChessAnimationProfile({
    attribute: unit.attribute,
    enemyType: unit.enemyType,
    sourceId: unit.sourceId
  });
  const isBigHit = Boolean(damage && damage / Math.max(1, unit.maxHp) >= 0.25);
  const dashX = `${dashOffsetX ?? (unit.side === "ally" ? profile.dashDistance : -profile.dashDistance)}px`;
  const knockbackX = `${unit.side === "ally" ? -8 : 8}px`;
  const animationClass = {
    idle: "partner-chess-idle",
    attack: `${isAlly ? "partner-chess-attack-ally" : "partner-chess-attack-enemy"} partner-chess-motion-${profile.motion}`,
    hit: `partner-chess-hit ${isBigHit ? "partner-chess-hit-heavy" : ""}`,
    skill: `partner-chess-skill partner-chess-motion-${profile.motion}`
  }[animation];

  return (
    <div className={`relative flex flex-col items-center ${sizeClass}`}>
      <div
        className={`relative grid place-items-center bg-transparent ${imageClass} ${animationClass}`}
        key={`${playKey}-${unit.id}-${animation}`}
        style={{
          "--partner-chess-attack-duration": `${profile.attackDuration}ms`,
          "--partner-chess-character-scale": 1,
          "--partner-chess-dash-x": dashX,
          "--partner-chess-knockback-x": knockbackX
        } as CSSProperties}
      >
        {damage && damage > 0 && (
          <DamageNumber
            isCounter={isCounterDamage}
            isSkill={isSkillDamage}
            playKey={`${playKey}-${unit.id}-${damage}`}
            side={unit.side}
            value={damage}
          />
        )}
        <img
          alt={unit.name}
          className={`h-full w-full border-0 bg-transparent object-contain drop-shadow-[0_18px_18px_rgba(16,36,63,0.18)] [image-rendering:pixelated] ${animation === "hit" ? "partner-chess-hit-flash" : ""}`}
          src={unit.image}
        />
        {animation === "skill" && <span className={`pointer-events-none absolute inset-0 rounded-full ${skillRingClass[profile.effectTheme]}`} />}
      </div>
      <span className="pointer-events-none -mt-3 h-4 w-4/5 rounded-[50%] bg-ink/20 blur-md sm:h-5" />
      <div className="mt-1 w-[86px] text-center sm:w-[108px]">
        <p className="text-[11px] font-black leading-tight text-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.65)] sm:text-xs">
          {unit.name}
        </p>
        <div className="mt-0.5 text-[9px] font-black leading-none text-ink/58 sm:text-[10px]">
          {Math.max(0, unit.hp)}/{unit.maxHp}
        </div>
        <div className={`mx-auto mt-1 h-1.5 w-[78px] overflow-hidden rounded-full bg-ink/16 shadow-[0_1px_2px_rgba(255,255,255,0.7)_inset] sm:h-2 sm:w-[104px] ${animation === "hit" ? "partner-chess-hp-shake" : ""}`}>
          <div className={`h-full rounded-full bg-gradient-to-r ${isAlly ? "from-tide to-leaf" : "from-coral to-gold"}`} style={{ width: `${hp}%` }} />
        </div>
      </div>
    </div>
  );
}
