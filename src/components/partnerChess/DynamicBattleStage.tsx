import { useEffect, useMemo, useState } from "react";
import { AnimatedCharacter, type CharacterAnimationState } from "@/components/partnerChess/AnimatedCharacter";
import { BattleEffectLayer } from "@/components/partnerChess/BattleEffectLayer";
import type { PartnerChessStage } from "@/data/partnerChessStages";
import type { ChessUnit } from "@/utils/partnerChessEngine";

type BattleAnimationEvent = {
  log: string;
  actorName?: string;
  targetName?: string;
  damage?: number;
  skillName?: string;
};

const themeBackground: Record<PartnerChessStage["theme"], string> = {
  careless: "bg-[linear-gradient(135deg,#F8F1DF_0%,#EAF7DF_42%,#DDF4F2_100%)]",
  forget: "bg-[linear-gradient(135deg,#F7F1DF_0%,#E9E4FF_42%,#DDF4F2_100%)]",
  anxiety: "bg-[linear-gradient(135deg,#FFF3E7_0%,#FBE4D8_44%,#EADFD8_100%)]"
};

type StageSlot = {
  className: string;
  size: "small" | "medium" | "large" | "boss";
  z: string;
};

function parseLogEvent(log: string): BattleAnimationEvent {
  const match = log.match(/^(.+?)发动【(.+?)】，对(.+?)造成\s*(\d+)\s*点伤害/);
  if (!match) return { log };
  return {
    log,
    actorName: match[1],
    skillName: match[2],
    targetName: match[3],
    damage: Number(match[4])
  };
}

function allySlot(position: ChessUnit["position"]): StageSlot {
  const slots: Record<ChessUnit["position"], StageSlot> = {
    front: { className: "left-[7%] bottom-[4%] sm:left-[14%] sm:bottom-[18%]", size: "large", z: "z-30" },
    middle: { className: "left-[38%] bottom-[34%] sm:left-[24%] sm:bottom-[32%]", size: "medium", z: "z-20" },
    back: { className: "left-[8%] bottom-[64%] sm:left-[15%] sm:bottom-[48%]", size: "small", z: "z-10" }
  };
  return slots[position];
}

function enemySlot(index: number, count: number, isBoss: boolean): StageSlot {
  if (isBoss) {
    return { className: "right-[8%] bottom-[24%] sm:right-[15%] sm:bottom-[26%]", size: "boss", z: "z-30" };
  }
  if (count >= 2) {
    return index === 0
      ? { className: "right-[24%] bottom-[21%] sm:right-[18%] sm:bottom-[22%]", size: "large", z: "z-30" }
      : { className: "right-[4%] bottom-[43%] sm:right-[10%] sm:bottom-[42%]", size: "medium", z: "z-20" };
  }
  return { className: "right-[7%] bottom-[28%] sm:right-[16%] sm:bottom-[28%]", size: "large", z: "z-30" };
}

function animationForUnit(unit: ChessUnit, event: BattleAnimationEvent): CharacterAnimationState {
  if (event.actorName === unit.name) {
    return event.skillName && event.skillName !== "普通攻击" ? "skill" : "attack";
  }
  if (event.targetName === unit.name) {
    return "hit";
  }
  return "idle";
}

export function DynamicBattleStage({
  allies,
  enemies,
  isBossRound = false,
  logs,
  phase,
  roundTitle,
  stageTheme
}: {
  allies: ChessUnit[];
  enemies: ChessUnit[];
  isBossRound?: boolean;
  logs: string[];
  phase: string;
  roundTitle?: string;
  stageTheme: PartnerChessStage["theme"];
}) {
  const battleEvents = useMemo(() => logs.map(parseLogEvent), [logs]);
  const [eventIndex, setEventIndex] = useState(Math.max(0, battleEvents.length - 1));

  useEffect(() => {
    if (battleEvents.length <= 1) {
      setEventIndex(0);
      return;
    }

    setEventIndex(0);
    const timer = window.setInterval(() => {
      setEventIndex((current) => {
        if (current >= battleEvents.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 720);

    return () => window.clearInterval(timer);
  }, [battleEvents.length, logs]);

  const activeEvent = battleEvents[eventIndex] ?? battleEvents[battleEvents.length - 1] ?? { log: "选择副本，开始战棋试炼。" };

  return (
    <section className={`relative min-h-[380px] overflow-hidden rounded-[2rem] border border-white/75 p-4 shadow-[0_22px_56px_rgba(16,36,63,0.14)] sm:min-h-[440px] ${themeBackground[stageTheme]}`}>
      <BattleEffectLayer activeSkillName={activeEvent.skillName} theme={stageTheme} />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Dynamic Battle Stage</p>
          <h2 className="mt-1 text-xl font-black text-ink sm:text-2xl">横版战斗场景</h2>
          <p className="mt-1 text-sm font-semibold text-ink/58">{roundTitle || "选择副本后，伙伴会进入战棋阵位。"}</p>
        </div>
        <span className="rounded-full bg-white/72 px-3 py-2 text-xs font-black text-ink/56 shadow-[0_10px_22px_rgba(16,36,63,0.08)]">
          {phase}
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-24 top-24 z-10">
        {allies.map((unit) => {
          const slot = allySlot(unit.position);
          return (
          <div className={`absolute ${slot.className} ${slot.z}`} key={unit.id}>
            <AnimatedCharacter
              animation={animationForUnit(unit, activeEvent)}
              damage={activeEvent.targetName === unit.name ? activeEvent.damage : undefined}
              playKey={`${eventIndex}-${activeEvent.log}`}
              size={slot.size}
              unit={unit}
            />
          </div>
          );
        })}
        {enemies.map((unit, index) => {
          const slot = enemySlot(index, enemies.length, isBossRound && enemies.length === 1);
          return (
          <div className={`absolute ${slot.className} ${slot.z}`} key={unit.id}>
            <AnimatedCharacter
              animation={animationForUnit(unit, activeEvent)}
              damage={activeEvent.targetName === unit.name ? activeEvent.damage : undefined}
              playKey={`${eventIndex}-${activeEvent.log}`}
              size={slot.size}
              unit={unit}
            />
          </div>
          );
        })}
      </div>

      <div className="absolute inset-x-6 bottom-4 z-20 rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-bold text-ink/70 shadow-[0_14px_34px_rgba(16,36,63,0.12)] backdrop-blur">
        {activeEvent.log}
      </div>
    </section>
  );
}
