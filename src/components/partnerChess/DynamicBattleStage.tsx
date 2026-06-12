import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatedCharacter, type CharacterAnimationState } from "@/components/partnerChess/AnimatedCharacter";
import { BattleEffectLayer } from "@/components/partnerChess/BattleEffectLayer";
import { getPartnerChessAnimationProfile } from "@/data/partnerChessAnimationData";
import type { PartnerChessStage } from "@/data/partnerChessStages";
import type { ChessUnit } from "@/utils/partnerChessEngine";

type BattleAnimationEvent = {
  log: string;
  actorName?: string;
  targetName?: string;
  damage?: number;
  skillName?: string;
};

type MeasuredAttack = {
  dashOffsetX?: number;
  impactPoint?: { x: number; y: number };
};

const themeBackground: Record<PartnerChessStage["theme"], string> = {
  careless: "bg-[radial-gradient(circle_at_24%_20%,rgba(255,238,174,0.9),transparent_28%),linear-gradient(135deg,#F8F1DF_0%,#EAF7DF_42%,#DDF4F2_100%)]",
  forget: "bg-[radial-gradient(circle_at_30%_18%,rgba(205,196,255,0.72),transparent_30%),linear-gradient(135deg,#F7F1DF_0%,#E9E4FF_42%,#DDF4F2_100%)]",
  anxiety: "bg-[radial-gradient(circle_at_28%_18%,rgba(255,210,180,0.72),transparent_30%),linear-gradient(135deg,#FFF3E7_0%,#FBE4D8_44%,#EADFD8_100%)]"
};

type StageSlot = {
  className: string;
  size: "small" | "medium" | "large" | "boss";
  z: string;
};

const allySlots: Record<ChessUnit["position"], StageSlot> = {
  front: {
    className: "left-[8%] bottom-[12%] sm:left-[12%] sm:bottom-[14%]",
    size: "large",
    z: "z-30"
  },
  middle: {
    className: "left-[27%] bottom-[27%] sm:left-[24%] sm:bottom-[28%]",
    size: "medium",
    z: "z-20"
  },
  back: {
    className: "left-[8%] bottom-[43%] sm:left-[13%] sm:bottom-[43%]",
    size: "small",
    z: "z-10"
  }
};

const enemySlots = {
  single: {
    className: "right-[8%] bottom-[20%] sm:right-[13%] sm:bottom-[20%]",
    size: "large",
    z: "z-30"
  },
  boss: {
    className: "right-[7%] bottom-[17%] sm:right-[12%] sm:bottom-[17%]",
    size: "boss",
    z: "z-[35]"
  },
  pairFront: {
    className: "right-[25%] bottom-[15%] sm:right-[20%] sm:bottom-[15%]",
    size: "large",
    z: "z-30"
  },
  pairBack: {
    className: "right-[4%] bottom-[38%] sm:right-[8%] sm:bottom-[38%]",
    size: "medium",
    z: "z-20"
  }
} satisfies Record<string, StageSlot>;

function parseLogEvent(log: string): BattleAnimationEvent {
  const withSkill = log.match(/^(.+?)发动【(.+?)】，对(.+?)造成\s*(\d+)\s*点伤害/);
  if (withSkill) {
    return {
      log,
      actorName: withSkill[1],
      skillName: withSkill[2],
      targetName: withSkill[3],
      damage: Number(withSkill[4])
    };
  }

  const directDamage = log.match(/^(.+?)对(.+?)造成\s*(\d+)\s*点伤害/);
  if (!directDamage) return { log };
  return {
    log,
    actorName: directDamage[1],
    skillName: "普通攻击",
    targetName: directDamage[2],
    damage: Number(directDamage[3])
  };
}

function allySlot(position: ChessUnit["position"]): StageSlot {
  return allySlots[position];
}

function enemySlot(index: number, count: number, isBoss: boolean): StageSlot {
  if (isBoss) {
    return enemySlots.boss;
  }
  if (count >= 2) {
    return index === 0 ? enemySlots.pairFront : enemySlots.pairBack;
  }
  return enemySlots.single;
}

function animationForUnit(unit: ChessUnit, event: BattleAnimationEvent, actorId?: string, targetId?: string): CharacterAnimationState {
  if (actorId === unit.id) {
    if (event.damage && event.targetName) return "attack";
    return event.skillName && event.skillName !== "普通攻击" ? "skill" : "attack";
  }
  if (targetId === unit.id) {
    return "hit";
  }
  return "idle";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculateDashOffset(attackerRect: DOMRect, targetRect: DOMRect, stageRect: DOMRect) {
  const attackerCenterX = attackerRect.left + attackerRect.width / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const direction = targetCenterX >= attackerCenterX ? 1 : -1;
  const rawDistance = direction > 0
    ? targetRect.left - attackerRect.right - 8
    : targetRect.right - attackerRect.left + 8;
  const maxDistance = Math.max(140, stageRect.width * 0.65);
  const distance = clamp(Math.max(Math.abs(rawDistance), 80), 80, maxDistance);

  return direction * distance;
}

function calculateImpactPoint(stageRect: DOMRect, targetRect: DOMRect, targetSide: ChessUnit["side"]) {
  const x = targetSide === "enemy"
    ? targetRect.left + targetRect.width * 0.25
    : targetRect.left + targetRect.width * 0.75;
  const y = targetRect.top + targetRect.height * 0.42;

  return {
    x: x - stageRect.left,
    y: y - stageRect.top
  };
}

function isCounterDamage(actor?: ChessUnit, target?: ChessUnit) {
  if (!actor || !target || actor.side !== "ally" || !actor.attribute || !target.enemyType) return false;
  return (
    (actor.attribute === "focus" && target.enemyType === "anxiety") ||
    (actor.attribute === "action" && target.enemyType === "careless") ||
    (actor.attribute === "growth" && target.enemyType === "forget")
  );
}

export function DynamicBattleStage({
  allies,
  enemies,
  isBossRound = false,
  isBattlePlaying,
  logs,
  onDamageImpact,
  phase,
  roundTitle,
  stageTheme
}: {
  allies: ChessUnit[];
  enemies: ChessUnit[];
  isBossRound?: boolean;
  isBattlePlaying: boolean;
  logs: string[];
  onDamageImpact?: (event: { damage: number; targetId: string; targetSide: ChessUnit["side"] }) => void;
  phase: string;
  roundTitle?: string;
  stageTheme: PartnerChessStage["theme"];
}) {
  const battleEvents = useMemo(() => {
    if (!isBattlePlaying) return [];
    return logs.map(parseLogEvent).filter((event) => Boolean(event.damage));
  }, [isBattlePlaying, logs]);
  const [eventIndex, setEventIndex] = useState(Math.max(0, battleEvents.length - 1));
  const stageRef = useRef<HTMLElement | null>(null);
  const unitRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const appliedDamageEventsRef = useRef<Set<string>>(new Set());
  const [measuredAttack, setMeasuredAttack] = useState<MeasuredAttack>({});

  useEffect(() => {
    if (!isBattlePlaying || battleEvents.length === 0) {
      setEventIndex(0);
      setMeasuredAttack({});
      return;
    }
    if (battleEvents.length === 1) {
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
    }, 880);

    return () => window.clearInterval(timer);
  }, [battleEvents.length, isBattlePlaying, logs]);

  useEffect(() => {
    appliedDamageEventsRef.current.clear();
  }, [isBattlePlaying, logs]);

  const activeEvent = isBattlePlaying
    ? battleEvents[eventIndex] ?? battleEvents[battleEvents.length - 1] ?? { log: "自动战斗准备中。" }
    : { log: "伙伴们待命中。" };
  const units = useMemo(() => [...allies, ...enemies], [allies, enemies]);
  const fallbackActor = isBattlePlaying && activeEvent.damage ? [...allies, ...enemies].find((unit) => unit.hp > 0) : undefined;
  const activeActor = units.find((unit) => unit.name === activeEvent.actorName) ?? fallbackActor;
  const activeTarget = units.find((unit) => unit.name === activeEvent.targetName)
    ?? (activeActor?.side === "ally"
      ? enemies.find((unit) => unit.hp > 0) ?? enemies[0]
      : allies.find((unit) => unit.position === "front" && unit.hp > 0) ?? allies.find((unit) => unit.hp > 0) ?? allies[0]);
  const activeEffectTheme = activeActor
    ? getPartnerChessAnimationProfile({
      attribute: activeActor.attribute,
      enemyType: activeActor.enemyType,
      sourceId: activeActor.sourceId
    }).effectTheme
    : undefined;
  const activeProfile = activeActor
    ? getPartnerChessAnimationProfile({
      attribute: activeActor.attribute,
      enemyType: activeActor.enemyType,
      sourceId: activeActor.sourceId
    })
    : undefined;
  const isSkillEvent = isBattlePlaying && Boolean(activeEvent.skillName && activeEvent.skillName !== "普通攻击");
  const isHeavyImpact = isSkillEvent || Boolean(activeEvent.damage && activeEvent.damage / Math.max(1, activeTarget?.maxHp ?? 1) >= 0.25);
  const counterDamage = isCounterDamage(activeActor, activeTarget);

  useLayoutEffect(() => {
    if (!isBattlePlaying || !activeEvent.damage || !activeActor || !activeTarget || !stageRef.current) {
      setMeasuredAttack({});
      return;
    }

    const attackerEl = unitRefs.current[activeActor.id];
    const targetEl = unitRefs.current[activeTarget.id];
    if (!attackerEl || !targetEl) {
      setMeasuredAttack({});
      return;
    }

    const attackerRect = attackerEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const stageRect = stageRef.current.getBoundingClientRect();
    const attackerCenterX = attackerRect.left + attackerRect.width / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const finalDashX = calculateDashOffset(attackerRect, targetRect, stageRect);

    if (import.meta.env.DEV) {
      console.debug("[PartnerChessAnim]", {
        attackerName: activeActor.name,
        targetName: activeTarget.name,
        attackerCenterX,
        targetCenterX,
        attackerSide: activeActor.side,
        dashX: finalDashX,
        damage: activeEvent.damage,
        isBuffEvent: !activeEvent.damage,
        isDamageEvent: Boolean(activeEvent.damage)
      });
    }

    setMeasuredAttack({
      dashOffsetX: finalDashX,
      impactPoint: calculateImpactPoint(stageRect, targetRect, activeTarget.side)
    });
  }, [activeActor?.id, activeEvent.damage, activeEvent.log, activeTarget?.id, allies, enemies, eventIndex, isBattlePlaying]);

  useEffect(() => {
    if (!isBattlePlaying || !activeEvent.damage || !activeTarget || !onDamageImpact) return;
    const damageEventId = `${eventIndex}-${activeEvent.log}-${activeTarget.id}`;
    const timer = window.setTimeout(() => {
      if (appliedDamageEventsRef.current.has(damageEventId)) return;
      appliedDamageEventsRef.current.add(damageEventId);
      onDamageImpact({
        damage: activeEvent.damage ?? 0,
        targetId: activeTarget.id,
        targetSide: activeTarget.side
      });
    }, 430);

    return () => window.clearTimeout(timer);
  }, [activeEvent.damage, activeEvent.log, activeTarget, eventIndex, isBattlePlaying, onDamageImpact]);

  return (
    <section
      className={`relative min-h-[370px] overflow-hidden rounded-[2rem] border border-white/75 p-4 shadow-[0_22px_56px_rgba(16,36,63,0.14)] sm:min-h-[480px] lg:min-h-[520px] ${themeBackground[stageTheme]}`}
      ref={stageRef}
    >
      <BattleEffectLayer
        activeEffectTheme={activeEffectTheme}
        activeSkillName={activeEvent.skillName}
        impactKey={isBattlePlaying && activeEvent.damage ? `${eventIndex}-${activeEvent.log}` : undefined}
        impactPoint={measuredAttack.impactPoint}
        impactSide={activeTarget?.side}
        impactType={activeProfile?.impactType}
        isHeavyImpact={isHeavyImpact || counterDamage}
        theme={stageTheme}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-tide sm:text-xs">Dynamic Battle Stage</p>
          <h2 className="mt-1 text-lg font-black text-ink sm:text-2xl">横版战斗场景</h2>
          <p className="mt-1 max-w-[14rem] text-xs font-semibold text-ink/58 sm:max-w-none sm:text-sm">{roundTitle || "选择副本后，伙伴会进入战棋阵位。"}</p>
        </div>
        <span className="rounded-full bg-white/72 px-3 py-2 text-xs font-black text-ink/56 shadow-[0_10px_22px_rgba(16,36,63,0.08)]">
          {phase}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-[7%] bottom-[5.5rem] z-[2] h-[26%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,255,255,0.56)_0%,rgba(221,238,220,0.38)_42%,rgba(16,36,63,0.08)_78%,transparent_100%)] blur-[1px]" />
      <div className="pointer-events-none absolute inset-x-[11%] bottom-[5.1rem] z-[3] h-[2px] bg-white/42" />

      <div
        className={`absolute inset-x-3 bottom-24 top-20 z-10 sm:inset-x-5 sm:bottom-24 sm:top-24 ${isBattlePlaying && activeEvent.damage ? "partner-chess-stage-shake" : ""}`}
        key={`battlefield-${eventIndex}-${activeEvent.damage ?? 0}`}
      >
        {allies.map((unit) => {
          const slot = allySlot(unit.position);
          return (
          <div
            className={`absolute ${slot.className} ${slot.z}`}
            key={unit.id}
            ref={(element) => {
              unitRefs.current[unit.id] = element;
            }}
          >
            <AnimatedCharacter
              animation={isBattlePlaying ? animationForUnit(unit, activeEvent, activeActor?.id, activeTarget?.id) : "idle"}
              dashOffsetX={isBattlePlaying && activeActor?.id === unit.id ? measuredAttack.dashOffsetX : undefined}
              damage={isBattlePlaying && activeTarget?.id === unit.id ? activeEvent.damage : undefined}
              isCounterDamage={activeTarget?.id === unit.id ? counterDamage : false}
              isSkillDamage={activeTarget?.id === unit.id ? isSkillEvent : false}
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
          <div
            className={`absolute ${slot.className} ${slot.z}`}
            key={unit.id}
            ref={(element) => {
              unitRefs.current[unit.id] = element;
            }}
          >
            <AnimatedCharacter
              animation={isBattlePlaying ? animationForUnit(unit, activeEvent, activeActor?.id, activeTarget?.id) : "idle"}
              dashOffsetX={isBattlePlaying && activeActor?.id === unit.id ? measuredAttack.dashOffsetX : undefined}
              damage={isBattlePlaying && activeTarget?.id === unit.id ? activeEvent.damage : undefined}
              isCounterDamage={activeTarget?.id === unit.id ? counterDamage : false}
              isSkillDamage={activeTarget?.id === unit.id ? isSkillEvent : false}
              playKey={`${eventIndex}-${activeEvent.log}`}
              size={slot.size}
              unit={unit}
            />
          </div>
          );
        })}
      </div>

      <div className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-white/70 bg-white/72 px-3 py-2.5 text-xs font-bold text-ink/70 shadow-[0_12px_26px_rgba(16,36,63,0.1)] backdrop-blur sm:inset-x-6 sm:px-4 sm:py-3 sm:text-sm">
        {activeEvent.log}
      </div>
    </section>
  );
}
