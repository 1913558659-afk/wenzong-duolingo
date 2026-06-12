import type { CSSProperties } from "react";
import { ManualDamageNumber } from "@/components/petBattle/ManualDamageNumber";
import type { BattleStats, EnemyType, PetAttribute } from "@/data/petBattleData";

export type ManualCharacterSide = "pet" | "enemy";
export type ManualCharacterAnimation = "idle" | "attack" | "hit" | "skill";

function hpPercent(current: number, max: number) {
  return max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

export function ManualBattleCharacter({
  animation,
  attribute,
  damage,
  dashOffsetX = 0,
  enemyType,
  hp,
  image,
  isCounterDamage,
  isSkillDamage,
  level,
  maxHp,
  name,
  playKey,
  scale,
  side,
  stats
}: {
  animation: ManualCharacterAnimation;
  attribute?: PetAttribute;
  damage?: number;
  dashOffsetX?: number;
  enemyType?: EnemyType;
  hp: number;
  image: string;
  isCounterDamage?: boolean;
  isSkillDamage?: boolean;
  level: number;
  maxHp: number;
  name: string;
  playKey: string;
  scale: number;
  side: ManualCharacterSide;
  stats: BattleStats;
}) {
  const percent = hpPercent(hp, maxHp);
  const theme = attribute === "focus" ? "cloud" : attribute === "action" ? "fire" : attribute === "growth" ? "growth" : enemyType ?? "careless";
  const animationClass = {
    idle: "manual-battle-idle",
    attack: "manual-battle-attack",
    hit: "manual-battle-hit",
    skill: `manual-battle-skill manual-battle-skill-${theme}`
  }[animation];

  return (
    <div
      className="manual-battle-character-slot flex flex-col items-center"
      style={{ "--manual-character-scale": scale } as CSSProperties}
    >
      <div
        className={`manual-battle-motion relative grid place-items-center ${animationClass}`}
        key={`${playKey}-${side}-${animation}`}
        style={{
          "--manual-dash-x": `${dashOffsetX}px`,
          "--manual-hit-x": side === "pet" ? "-8px" : "8px"
        } as CSSProperties}
      >
        {damage && damage > 0 && (
          <ManualDamageNumber
            isCounter={isCounterDamage}
            isSkill={isSkillDamage}
            playKey={`${playKey}-${side}-${damage}`}
            value={damage}
          />
        )}
        <img
          alt={name}
          className={`manual-battle-sprite border-0 bg-transparent object-contain drop-shadow-[0_20px_20px_rgba(16,36,63,0.18)] [image-rendering:pixelated] ${animation === "hit" ? "manual-battle-hit-flash" : ""}`}
          src={image}
        />
        {animation === "skill" && <span className={`pointer-events-none absolute inset-2 rounded-full manual-battle-aura manual-battle-aura-${theme}`} />}
      </div>
      <span className="pointer-events-none -mt-4 h-5 w-[78%] rounded-[50%] bg-ink/20 blur-md" />
      <div className="manual-battle-hud mt-1 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <p className="max-w-[118px] truncate text-xs font-black leading-tight text-ink drop-shadow-[0_1px_0_rgba(255,255,255,0.72)]">{name}</p>
          <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9px] font-black leading-none text-white">Lv.{level}</span>
        </div>
        <p className="mt-0.5 text-[10px] font-black leading-none text-ink/62">{hp} / {maxHp}</p>
        <div className={`mx-auto mt-1 h-2 w-[104px] overflow-hidden rounded-full bg-ink/16 ${animation === "hit" ? "manual-battle-hp-shake" : ""}`}>
          <div className={`h-full rounded-full bg-gradient-to-r ${side === "pet" ? "from-tide to-leaf" : "from-coral to-gold"}`} style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-[10px] font-black text-ink/45">攻 {stats.attack} · 防 {stats.defense} · 速 {stats.speed}</p>
      </div>
    </div>
  );
}
