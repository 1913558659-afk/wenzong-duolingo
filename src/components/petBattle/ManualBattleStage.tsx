import { useEffect, useRef, useState } from "react";
import { ManualBattleCharacter } from "@/components/petBattle/ManualBattleCharacter";
import { ManualBattleEffectLayer, themeFromPetAttribute, type ManualImpactTheme } from "@/components/petBattle/ManualBattleEffectLayer";
import type { BattleEnemy, BattlePet, BattleSkill, BattleStats } from "@/data/petBattleData";

export type ManualBattleAction = {
  id: string;
  actor: "pet" | "enemy";
  damage?: number;
  heal?: number;
  isBuff?: boolean;
  isCounter?: boolean;
  skill: BattleSkill;
};

function isDamageSkill(skill: BattleSkill, damage?: number) {
  return Boolean(damage && damage > 0) || skill.power > 0 || skill.type === "attack" || skill.type === "power_attack" || skill.type === "multi_hit";
}

function calculateDashOffset(attackerRect: DOMRect, targetRect: DOMRect, stageRect: DOMRect) {
  const attackerCenterX = attackerRect.left + attackerRect.width / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const direction = targetCenterX >= attackerCenterX ? 1 : -1;
  const rawDistance = direction > 0
    ? targetRect.left - attackerRect.right - 8
    : targetRect.right - attackerRect.left + 8;
  const maxDistance = stageRect.width * 0.68;
  const minDistance = Math.min(96, Math.max(48, Math.abs(rawDistance)));
  const distance = Math.min(maxDistance, Math.max(Math.abs(rawDistance), minDistance));

  return direction * distance;
}

function calculateImpactPoint(targetRect: DOMRect, stageRect: DOMRect, actor: "pet" | "enemy") {
  const x = actor === "pet" ? targetRect.left + targetRect.width * 0.28 : targetRect.left + targetRect.width * 0.72;
  const y = targetRect.top + targetRect.height * 0.42;

  return {
    x: x - stageRect.left,
    y: y - stageRect.top
  };
}

function impactThemeForAction(action: ManualBattleAction, pet: BattlePet, enemy: BattleEnemy): ManualImpactTheme {
  if (action.actor === "pet") return themeFromPetAttribute(pet.attribute);
  return enemy.type;
}

export function ManualBattleStage({
  action,
  canAnimate,
  enemy,
  enemyHp,
  enemyMaxHp,
  enemyStats,
  onActionComplete,
  onActionImpact,
  pet,
  petHp,
  petLevel,
  petMaxHp,
  petStats
}: {
  action?: ManualBattleAction | null;
  canAnimate: boolean;
  enemy: BattleEnemy;
  enemyHp: number;
  enemyMaxHp: number;
  enemyStats: BattleStats;
  onActionComplete: () => void;
  onActionImpact: () => void;
  pet: BattlePet;
  petHp: number;
  petLevel: number;
  petMaxHp: number;
  petStats: BattleStats;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const petRef = useRef<HTMLDivElement | null>(null);
  const enemyRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const [dashOffsetX, setDashOffsetX] = useState(0);
  const [impact, setImpact] = useState<{ key: string; point: { x: number; y: number }; theme: ManualImpactTheme; heavy: boolean } | null>(null);
  const [skillPulse, setSkillPulse] = useState<{ key: string; name: string; theme: ManualImpactTheme } | null>(null);
  const [hitTarget, setHitTarget] = useState<"pet" | "enemy" | null>(null);
  const [activeActor, setActiveActor] = useState<"pet" | "enemy" | null>(null);
  const [stageShake, setStageShake] = useState(false);
  const [damageFlash, setDamageFlash] = useState<{ key: string; target: "pet" | "enemy"; value: number; counter?: boolean; skill?: boolean } | null>(null);
  const currentActionIsDamage = action ? isDamageSkill(action.skill, action.damage) : false;
  const petAnimation = activeActor === "pet" ? (currentActionIsDamage ? "attack" : "skill") : hitTarget === "pet" ? "hit" : "idle";
  const enemyAnimation = activeActor === "enemy" ? (currentActionIsDamage ? "attack" : "skill") : hitTarget === "enemy" ? "hit" : "idle";

  useEffect(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
    setDashOffsetX(0);
    setImpact(null);
    setSkillPulse(null);
    setHitTarget(null);
    setActiveActor(null);
    setStageShake(false);
    setDamageFlash(null);

    if (!action || !canAnimate) return undefined;

    const stageEl = stageRef.current;
    const attackerEl = action.actor === "pet" ? petRef.current : enemyRef.current;
    const targetEl = action.actor === "pet" ? enemyRef.current : petRef.current;
    const damageEvent = isDamageSkill(action.skill, action.damage);
    const theme = impactThemeForAction(action, pet, enemy);

    setActiveActor(action.actor);
    setSkillPulse({ key: `${action.id}-skill`, name: action.skill.name, theme });

    if (damageEvent && stageEl && attackerEl && targetEl) {
      const stageRect = stageEl.getBoundingClientRect();
      const attackerRect = attackerEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const dashX = calculateDashOffset(attackerRect, targetRect, stageRect);
      const point = calculateImpactPoint(targetRect, stageRect, action.actor);
      setDashOffsetX(dashX);

      if (import.meta.env.DEV) {
        console.debug("[PetBattleManualAnim]", {
          actor: action.actor,
          attacker: action.actor === "pet" ? pet.name : enemy.name,
          dashX,
          skill: action.skill.name,
          target: action.actor === "pet" ? enemy.name : pet.name
        });
      }

      timersRef.current.push(window.setTimeout(() => {
        setImpact({ key: `${action.id}-impact`, point, theme, heavy: Boolean(action.damage && action.damage / Math.max(1, action.actor === "pet" ? enemyMaxHp : petMaxHp) >= 0.22) });
        setHitTarget(action.actor === "pet" ? "enemy" : "pet");
        setStageShake(true);
        if (action.damage && action.damage > 0) {
          setDamageFlash({
            counter: action.isCounter,
            key: `${action.id}-damage`,
            skill: action.skill.type !== "attack",
            target: action.actor === "pet" ? "enemy" : "pet",
            value: action.damage
          });
        }
        onActionImpact();
      }, 460));
    } else {
      timersRef.current.push(window.setTimeout(onActionImpact, 360));
    }

    timersRef.current.push(window.setTimeout(() => {
      setActiveActor(null);
      setHitTarget(null);
      setStageShake(false);
      setDamageFlash(null);
      setImpact(null);
    }, damageEvent ? 980 : 760));
    timersRef.current.push(window.setTimeout(() => {
      setSkillPulse(null);
      setDashOffsetX(0);
      onActionComplete();
    }, damageEvent ? 1120 : 860));

    return () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    };
  }, [action, canAnimate, enemy, enemyMaxHp, onActionComplete, onActionImpact, pet, petMaxHp]);

  return (
    <div
      className={`manual-battle-stage relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/75 shadow-[0_22px_50px_rgba(16,36,63,0.10)] sm:min-h-[460px] ${stageShake ? "manual-battle-stage-shake" : ""}`}
      ref={stageRef}
    >
      <ManualBattleEffectLayer
        enemyType={enemy.type}
        impactKey={impact?.key}
        impactPoint={impact?.point}
        impactTheme={impact?.theme}
        isHeavyImpact={impact?.heavy}
        skillName={skillPulse?.name}
        skillTheme={skillPulse?.theme}
      />
      <div className="absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
        <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-black text-ink shadow-[0_10px_20px_rgba(16,36,63,0.08)] backdrop-blur">
          {pet.name} Lv.{petLevel}
        </div>
        <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-black text-coral shadow-[0_10px_20px_rgba(16,36,63,0.08)] backdrop-blur">
          {enemy.name} Lv.{enemy.level}
        </div>
      </div>
      <div className="absolute bottom-[16%] left-[12%] z-20 sm:bottom-[16%] sm:left-[12%]" ref={petRef}>
        <ManualBattleCharacter
          animation={petAnimation}
          attribute={pet.attribute}
          damage={damageFlash?.target === "pet" ? damageFlash.value : undefined}
          dashOffsetX={activeActor === "pet" ? dashOffsetX : 0}
          hp={petHp}
          image={pet.image}
          isCounterDamage={damageFlash?.target === "pet" ? damageFlash.counter : false}
          isSkillDamage={damageFlash?.target === "pet" ? damageFlash.skill : false}
          level={petLevel}
          maxHp={petMaxHp}
          name={pet.name}
          playKey={action?.id ?? "idle"}
          scale={1}
          side="pet"
          stats={petStats}
        />
      </div>
      <div className="absolute bottom-[28%] right-[13%] z-20 sm:bottom-[28%] sm:right-[13%]" ref={enemyRef}>
        <ManualBattleCharacter
          animation={enemyAnimation}
          damage={damageFlash?.target === "enemy" ? damageFlash.value : undefined}
          dashOffsetX={activeActor === "enemy" ? dashOffsetX : 0}
          enemyType={enemy.type}
          hp={enemyHp}
          image={enemy.image}
          isCounterDamage={damageFlash?.target === "enemy" ? damageFlash.counter : false}
          isSkillDamage={damageFlash?.target === "enemy" ? damageFlash.skill : false}
          level={enemy.level}
          maxHp={enemyMaxHp}
          name={enemy.name}
          playKey={action?.id ?? "idle"}
          scale={1}
          side="enemy"
          stats={enemyStats}
        />
      </div>
    </div>
  );
}
