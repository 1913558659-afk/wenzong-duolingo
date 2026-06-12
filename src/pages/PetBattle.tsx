import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, HeartPulse, PawPrint, RotateCcw, Shield, Sparkles, Swords, Trophy, Zap } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { CapturePanel } from "@/components/petBattle/CapturePanel";
import { DailyTrainingRewardPanel } from "@/components/petBattle/DailyTrainingRewardPanel";
import { ManualBattleStage, type ManualBattleAction } from "@/components/petBattle/ManualBattleStage";
import { PetBagPanel } from "@/components/petBattle/PetBagPanel";
import { PetOwnedBadge } from "@/components/petBattle/PetOwnedBadge";
import { PetStoragePanel } from "@/components/petBattle/PetStoragePanel";
import { PetTeamBar, type PetBattleTeamMember } from "@/components/petBattle/PetTeamBar";
import { SkillUnlockHint } from "@/components/petBattle/SkillUnlockHint";
import { enemies, pets } from "@/data/petBattleData";
import type { BattleEnemy, BattlePet, BattleSkill, BattleStats, EnemyType, PetAttribute } from "@/data/petBattleData";
import { getTrainingSkillsForPet, trainingSkillCountersEnemy, type PetTrainingSkill } from "@/data/petTrainingSkills";
import type { BattleStatusEffect, BattleStatusType } from "@/data/petTrainingStatuses";
import {
  calculateEnemyDamage,
  chooseEnemySkill,
  clampHp,
  getPetStatsAtLevel,
  getRequiredPetExp
} from "@/utils/petBattle";
import { loadPetBattleState, savePetBattleState } from "@/utils/petBattleStorage";
import type { PetBattleSaveState, PetTrainingStats } from "@/utils/petBattleStorage";
import { addPetExp, getPetLevelInfo, loadPartnerChessSave, savePartnerChessSave } from "@/utils/partnerChessSave";
import type { PartnerChessSave } from "@/utils/partnerChessSave";
import {
  addPetToCollection,
  defaultTrainingTeamIds,
  ensurePetCollection,
  getAllCollectiblePets,
  getTrainingPetById,
  isBossPet,
  isCapturablePet,
  isInitialPet,
  replaceTeamSlot
} from "@/utils/petCollection";
import { petSpriteFacingClass } from "@/utils/petSpriteFacing";
import {
  addCoinsAndShard,
  claimDailyFirstEntry,
  loadDailyTrainingProgress,
  recordTrainingBattle,
  saveDailyTrainingProgress,
  shardKeyForEnemyType,
  shardLabelForEnemyType
} from "@/utils/petTrainingSave";
import type { DailyTrainingProgress } from "@/utils/petTrainingSave";

type BattleEffects = {
  enemyAttackBonus: number;
  enemyDefenseBonus: number;
  enemyShieldReduction: number;
  petAttackBonus: number;
  petDefenseBonus: number;
  nextAttackMultiplier: number;
  nextDamageMultiplier: number;
  shieldReduction: number;
};

type PetBattleTab = "training" | "growth" | "bag" | "storage" | "archive";

const defaultEffects: BattleEffects = {
  enemyAttackBonus: 0,
  enemyDefenseBonus: 0,
  enemyShieldReduction: 0,
  petAttackBonus: 0,
  petDefenseBonus: 0,
  nextAttackMultiplier: 1,
  nextDamageMultiplier: 1,
  shieldReduction: 0
};

const trainingCost = 30;
const openingEnemyCycle = [
  "careless_beast",
  "forget_shadow",
  "anxiety_beast",
  "forget-lizard-01",
  "forget-ant-02",
  "forget-chicken-03",
  "anxiety-dog-01",
  "anxiety-cat-02",
  "anxiety-bear-03",
  "careless_shark",
  "careless_tiger",
  "careless_rhino"
];
const advancedEnemyCycle = [
  "forget_shadow",
  "anxiety_beast",
  "forget-lizard-01",
  "forget-ant-02",
  "forget-chicken-03",
  "anxiety-dog-01",
  "anxiety-cat-02",
  "anxiety-bear-03",
  "careless_shark",
  "careless_tiger",
  "careless_rhino"
];

const counterMessages: Record<EnemyType, string> = {
  careless: "属性克制：行动型克制粗心型，本场伤害提升。",
  forget: "属性克制：积累型克制遗忘型，本场伤害提升。",
  anxiety: "属性克制：专注型克制焦虑型，本场伤害提升。"
};
function getBaseEnemyForStage(stage: number) {
  const safeStage = Math.max(1, stage);
  const enemyId = safeStage <= openingEnemyCycle.length
    ? openingEnemyCycle[safeStage - 1]
    : advancedEnemyCycle[(safeStage - openingEnemyCycle.length - 1) % advancedEnemyCycle.length];
  return enemies.find((enemy) => enemy.id === enemyId) ?? enemies[0];
}

function getScaledEnemy(stage: number): BattleEnemy {
  const baseEnemy = getBaseEnemyForStage(stage);
  return {
    ...baseEnemy,
    level: stage,
    rewardExp: baseEnemy.rewardExp + stage * 5,
    rewardTrainingExp: baseEnemy.rewardTrainingExp ?? 10 + Math.floor(stage / 2) * 2,
    stats: {
      hp: baseEnemy.stats.hp + stage * 8,
      attack: baseEnemy.stats.attack + stage * 2,
      defense: baseEnemy.stats.defense + Math.floor(stage / 2),
      speed: baseEnemy.stats.speed + Math.floor(stage / 3)
    }
  };
}

function getRewardTrainingExp(enemy: BattleEnemy) {
  return enemy.rewardTrainingExp ?? 10;
}

function getBattleStats(pet: BattlePet, level: number, training: PetTrainingStats): BattleStats {
  const levelStats = getPetStatsAtLevel(pet, level);
  return {
    hp: levelStats.hp + training.hp * 5,
    attack: levelStats.attack + training.attack,
    defense: levelStats.defense + training.defense,
    speed: levelStats.speed + training.speed
  };
}

function addPetExpWithLevelUp(state: PetBattleSaveState, gainedExp: number) {
  let nextLevel = state.petLevel;
  let nextExp = state.petExp + gainedExp;
  const levelUpLogs: string[] = [];

  while (nextExp >= getRequiredPetExp(nextLevel)) {
    nextExp -= getRequiredPetExp(nextLevel);
    nextLevel += 1;
    levelUpLogs.push(`伙伴升到了 Lv.${nextLevel}！`);
  }

  return {
    levelUpLogs,
    state: {
      ...state,
      petLevel: nextLevel,
      petExp: nextExp
    }
  };
}

function attributeLabel(attribute: PetAttribute) {
  return {
    focus: "专注型",
    action: "行动型",
    growth: "积累型"
  }[attribute];
}

function enemyTypeLabel(type: EnemyType) {
  return {
    careless: "粗心",
    forget: "遗忘",
    anxiety: "焦虑"
  }[type];
}

function skillTypeLabel(type: BattleSkill["type"]) {
  const labels: Record<BattleSkill["type"], string> = {
    attack: "普通攻击",
    power_attack: "强力攻击",
    multi_hit: "多段攻击",
    shield: "护盾",
    heal: "恢复",
    buff: "强化",
    debuff: "削弱"
  };
  return labels[type];
}

function hpPercent(current: number, max: number) {
  return max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function isCountering(pet: BattlePet, enemy: Pick<BattleEnemy, "type">) {
  return pet.counters.includes(enemy.type);
}

function getPartnerPetLevel(save: PartnerChessSave, petId: string) {
  return Math.max(1, save.petLevel[petId] ?? 1);
}

function hasLevelPressure(pet: BattlePet, petLevel: number, enemy: Pick<BattleEnemy, "level" | "type">) {
  return enemy.level - petLevel > 2 && !isCountering(pet, enemy);
}

function getLevelPressureStatus(pet: BattlePet, petLevel: number, enemy: Pick<BattleEnemy, "level" | "type">): BattleStatusEffect[] {
  if (!hasLevelPressure(pet, petLevel, enemy)) return [];
  return [{
    duration: 999,
    id: "level-pressure",
    label: "等级压制",
    type: "levelPressure"
  }];
}

function getAdjustedCaptureRate(enemyHp: number, enemyMaxHp: number, levelPressure: boolean) {
  const baseRate = getCaptureRate(enemyHp, enemyMaxHp);
  if (baseRate <= 0) return 0;
  return levelPressure ? Math.max(5, baseRate - 10) : baseRate;
}

function getTrainingBattleStats(pet: BattlePet, level: number): BattleStats {
  const levelBonus = Math.max(0, level - 1);
  return {
    hp: pet.baseStats.hp + levelBonus * 3,
    attack: pet.baseStats.attack + levelBonus,
    defense: pet.baseStats.defense + levelBonus,
    speed: pet.baseStats.speed
  };
}

function createTeamHp(save: PartnerChessSave) {
  const normalized = ensurePetCollection(save);
  return Object.fromEntries(normalized.activeTrainingTeam.map((petId, index) => {
    const pet = getTrainingPetById(petId);
    const stats = getTrainingBattleStats(pet, getPartnerPetLevel(save, petId));
    return [getPlayerBattleUnitId(index, petId), stats.hp];
  }));
}

function getPlayerBattleUnitId(slotIndex: number, petId: string) {
  return `player-slot-${slotIndex}-${petId}`;
}

function getEnemyBattleUnitId(enemy: Pick<BattleEnemy, "id">) {
  return `enemy-0-${enemy.id}`;
}

function applyShield(statuses: BattleStatusEffect[], incomingDamage: number) {
  let remainingDamage = incomingDamage;
  const nextStatuses = statuses.flatMap((status) => {
    if (status.type !== "shield" || remainingDamage <= 0) return [status];
    const shield = status.amount ?? 0;
    const nextShield = Math.max(0, shield - remainingDamage);
    remainingDamage = Math.max(0, remainingDamage - shield);
    return nextShield > 0 ? [{ ...status, amount: nextShield }] : [];
  });
  return { damage: remainingDamage, statuses: nextStatuses };
}

function tickStatuses(statuses: BattleStatusEffect[]) {
  return statuses
    .map((status) => status.type === "shield" ? { ...status, duration: status.duration - 1 } : status)
    .filter((status) => status.duration > 0 || (status.type === "shield" && (status.amount ?? 0) > 0));
}

function addOrReplaceStatus(statuses: BattleStatusEffect[], status: BattleStatusEffect) {
  return [...statuses.filter((item) => item.type !== status.type), status];
}

function statusForSkill(skill: PetTrainingSkill, targetMaxHp: number): BattleStatusEffect | null {
  if (skill.status?.type === "burn") {
    return { duration: 2, id: `burn-${Date.now()}`, label: "灼烧", type: "burn" };
  }
  if (skill.status?.type === "shield") {
    return { amount: Math.max(12, Math.round(targetMaxHp * 0.22)), duration: 2, id: `shield-${Date.now()}`, label: "护盾", type: "shield" };
  }
  if (skill.id === "focus_star") {
    return { duration: 1, id: `stun-${Date.now()}`, label: "眩晕", type: "stun" };
  }
  if (skill.id === "root_bind") {
    return { duration: 1, id: `forget-${Date.now()}`, label: "遗忘", type: "forget" };
  }
  return null;
}

function statusForEnemySkill(skill: BattleSkill): BattleStatusEffect | null {
  if (skill.debuff?.nextDamageMultiplier) {
    return { duration: 1, id: `anxiety-${Date.now()}`, label: "焦虑压制", type: "anxietyDown" };
  }
  if (skill.debuff && skill.power === 0) {
    return { duration: 1, id: `forget-${Date.now()}`, label: "遗忘", type: "forget" };
  }
  return null;
}

function burnDamage(maxHp: number) {
  return Math.max(3, Math.round(maxHp * 0.08));
}

function getCaptureRate(enemyHp: number, enemyMaxHp: number) {
  const ratio = enemyMaxHp <= 0 ? 1 : enemyHp / enemyMaxHp;
  if (ratio <= 0.1) return 70;
  if (ratio <= 0.2) return 50;
  if (ratio <= 0.3) return 35;
  return 0;
}

function isBossEnemy(enemy: BattleEnemy) {
  return enemy.stage === "advancedBoss" || enemy.role.includes("Boss") || Boolean(enemy.description?.includes("Boss"));
}

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white/72 px-3 py-2 text-center ring-1 ring-ink/5">
      <p className="text-[11px] font-black text-ink/45">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function ProgressBar({ percent, tone = "tide" }: { percent: number; tone?: "tide" | "gold" | "coral" }) {
  const color = tone === "gold" ? "from-gold to-[#F3B24A]" : tone === "coral" ? "from-coral to-[#F3B24A]" : "from-tide to-leaf";
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-ink/10">
      <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function TopStatusBar({
  companionTrainingExp,
  pet,
  petExp,
  petExpNeed,
  petLevel,
  bestStage
}: {
  companionTrainingExp: number;
  pet: BattlePet;
  petExp: number;
  petExpNeed: number;
  petLevel: number;
  bestStage: number;
}) {
  return (
    <GameCard className="border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82)_0%,rgba(226,247,244,0.74)_58%,rgba(255,246,224,0.66)_100%)] shadow-[0_18px_44px_rgba(16,36,63,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-[1.7rem] bg-[linear-gradient(135deg,#FFFDF7,#EAF5F2)] p-2 shadow-[0_12px_28px_rgba(16,36,63,0.10)] ring-1 ring-white/80 sm:size-24">
            <img alt={pet.name} className={`max-h-full max-w-full object-contain [image-rendering:pixelated] ${petSpriteFacingClass(pet.id, "right")}`} src={pet.image} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-ink sm:text-2xl">{pet.name}</h2>
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">Lv.{petLevel}</span>
              <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-black text-tide ring-1 ring-tide/20">{attributeLabel(pet.attribute)}</span>
            </div>
            <div className="mt-3 max-w-md">
              <div className="mb-1 flex justify-between text-xs font-black text-ink/52">
                <span>宠物经验</span>
                <span>{petExp} / {petExpNeed}</span>
              </div>
              <ProgressBar percent={hpPercent(petExp, petExpNeed)} tone="tide" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[430px]">
          <div className="rounded-3xl bg-white/68 p-3 shadow-[0_10px_24px_rgba(16,36,63,0.06)] ring-1 ring-white/78">
            <p className="text-xs font-black text-ink/45">伙伴训练经验</p>
            <p className="mt-1 text-2xl font-black text-tide">{companionTrainingExp}</p>
          </div>
          <div className="rounded-3xl bg-white/68 p-3 shadow-[0_10px_24px_rgba(16,36,63,0.06)] ring-1 ring-white/78">
            <p className="text-xs font-black text-ink/45">最高挑战</p>
            <p className="mt-1 text-2xl font-black text-ink">{bestStage}</p>
          </div>
          <div className="col-span-2 rounded-3xl bg-white/68 p-3 shadow-[0_10px_24px_rgba(16,36,63,0.06)] ring-1 ring-white/78 sm:col-span-1">
            <p className="text-xs font-black text-ink/45">经验来源</p>
            <p className="mt-1 text-sm font-bold leading-5 text-ink/62">闯关、答题与训练胜利</p>
          </div>
        </div>
      </div>
    </GameCard>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`min-h-11 rounded-2xl px-4 text-sm font-black transition ${
        active
          ? "bg-gradient-to-r from-tide to-[#22B8A5] text-white shadow-[0_12px_24px_rgba(21,156,168,0.18)]"
          : "bg-white/58 text-ink/58 ring-1 ring-white/78 hover:-translate-y-0.5 hover:bg-white/78 hover:text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PetSelectCard({ active, onSelect, pet }: { active: boolean; onSelect: (pet: BattlePet) => void; pet: BattlePet }) {
  return (
    <button className="group h-full text-left" onClick={() => onSelect(pet)} type="button">
      <GameCard className={`h-full overflow-hidden transition group-hover:-translate-y-0.5 ${active ? "ring-2 ring-tide" : ""}`}>
        <div className="flex items-start gap-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-[1.35rem] bg-[linear-gradient(135deg,#EAF5F2,#F7F1E4)] p-2 shadow-[inset_0_-3px_0_rgba(16,36,63,0.06)]">
            <img alt={pet.name} className={`max-h-full max-w-full object-contain [image-rendering:pixelated] ${petSpriteFacingClass(pet.id, "right")}`} src={pet.image} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">{attributeLabel(pet.attribute)}</p>
            <h3 className="mt-1 text-2xl font-black text-ink">{pet.name}</h3>
            <p className="mt-1 text-sm font-bold text-ink/58">{pet.role}</p>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-ink/62">{pet.battleStyle}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatItem label="HP" value={pet.baseStats.hp} />
          <StatItem label="攻击" value={pet.baseStats.attack} />
          <StatItem label="防御" value={pet.baseStats.defense} />
          <StatItem label="速度" value={pet.baseStats.speed} />
        </div>
        <span className="mt-4 flex min-h-11 items-center justify-center rounded-2xl bg-ink text-sm font-black text-white shadow-insetGame transition group-hover:bg-tide">
          {active ? "当前伙伴" : "选择伙伴"}
        </span>
      </GameCard>
    </button>
  );
}

function FighterPanel({
  hp,
  image,
  level,
  maxHp,
  name,
  stats,
  tone
}: {
  hp: number;
  image: string;
  level: number;
  maxHp: number;
  name: string;
  stats: BattleStats;
  tone: "pet" | "enemy";
}) {
  const percent = hpPercent(hp, maxHp);
  const barColor = tone === "pet" ? "from-[#1496A3] to-[#61B870]" : "from-[#E95B4F] to-[#F3B24A]";
  const panelTone = tone === "pet" ? "border-tide/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.80),rgba(224,247,244,0.48))]" : "border-coral/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.80),rgba(255,241,224,0.58))]";

  return (
    <div className={`rounded-[1.8rem] border p-4 shadow-[0_16px_38px_rgba(16,36,63,0.07)] backdrop-blur ${panelTone}`}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="grid size-32 shrink-0 place-items-center rounded-[1.6rem] bg-[linear-gradient(135deg,#FFFDF7,#F7F1E4)] p-3 shadow-[0_10px_24px_rgba(16,36,63,0.08),inset_0_-3px_0_rgba(16,36,63,0.04)] ring-1 ring-white/80 lg:size-36">
          <img alt={name} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" src={image} />
        </div>
        <div className="w-full min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
            <h3 className="break-words text-center text-2xl font-black text-ink sm:text-left">{name}</h3>
            <span className="shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-black text-white shadow-[0_8px_16px_rgba(16,36,63,0.12)]">Lv.{level}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-black text-ink/58">
            <span>HP</span>
            <span>{hp} / {maxHp}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10">
            <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-ink/58">
            <span className="rounded-full bg-ink/5 px-2 py-1">攻 {stats.attack}</span>
            <span className="rounded-full bg-ink/5 px-2 py-1">防 {stats.defense}</span>
            <span className="rounded-full bg-ink/5 px-2 py-1">速 {stats.speed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainingRoom({
  action,
  activeUnitId,
  battleState,
  canCapture,
  captureRate,
  dailyProgress,
  continueChallenge,
  cooldowns,
  enemy,
  enemyHp,
  enemyStatuses,
  isAnimating,
  isBossCapture,
  levelPressure,
  logs,
  nextEnemy,
  onActionComplete,
  onActionImpact,
  onCapture,
  onSwitchPet,
  pet,
  petHp,
  petLevel,
  petSkills,
  petStats,
  petStatuses,
  resetBattle,
  returnToPetSelect,
  setActiveTab,
  stage,
  teamMembers,
  useSkill
}: {
  action?: ManualBattleAction | null;
  activeUnitId: string;
  battleState: "playing" | "won" | "lost";
  canCapture: boolean;
  captureRate: number;
  dailyProgress: DailyTrainingProgress;
  continueChallenge: () => void;
  cooldowns: Record<string, number>;
  enemy: BattleEnemy;
  enemyHp: number;
  enemyStatuses: BattleStatusEffect[];
  isAnimating: boolean;
  isBossCapture: boolean;
  levelPressure: boolean;
  logs: string[];
  nextEnemy: BattleEnemy;
  onActionComplete: () => void;
  onActionImpact: () => void;
  onCapture: () => void;
  onSwitchPet: (petId: string) => void;
  pet: BattlePet;
  petHp: number;
  petLevel: number;
  petSkills: PetTrainingSkill[];
  petStats: BattleStats;
  petStatuses: BattleStatusEffect[];
  resetBattle: () => void;
  returnToPetSelect: () => void;
  setActiveTab: (tab: PetBattleTab) => void;
  stage: number;
  teamMembers: PetBattleTeamMember[];
  useSkill: (skill: PetTrainingSkill) => void;
}) {
  const countersCurrent = isCountering(pet, enemy);
  const levelGap = Math.max(0, enemy.level - petLevel);

  return (
    <section className="space-y-4">
      <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Training Field</p>
            <h2 className="mt-1 text-2xl font-black text-ink">第 {stage} 场 · {enemy.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">
              <span className="mr-2 rounded-full bg-coral/10 px-2.5 py-1 text-xs font-black text-coral">{enemyTypeLabel(enemy.type)}型 · {enemy.role}</span>
              胜利奖励：宠物经验 +{enemy.rewardExp} · 伙伴训练经验 +{getRewardTrainingExp(enemy)}
            </p>
          </div>
          <div className={`rounded-3xl p-4 ring-1 ${countersCurrent ? "bg-tide/10 text-tide ring-tide/20" : levelPressure ? "bg-gold/10 text-ink ring-gold/25" : "bg-white/72 text-ink/62 ring-ink/6"}`}>
            <p className="text-xs font-black">克制提示</p>
            <p className="mt-1 text-sm font-bold leading-6">
              {countersCurrent
                ? levelGap > 2
                  ? "属性克制：当前宠物可抵消等级压制。"
                  : counterMessages[enemy.type]
                : levelPressure
                  ? `等级压制：敌人高出 ${levelGap} 级，伤害 -12%，受伤 +8%，捕捉率 -10%。`
                  : "越级挑战：敌人等级较高。若当前宠物属性不克制敌人，将受到等级压制。你仍然可以挑战。"}
            </p>
          </div>
        </div>
      </GameCard>

      <ManualBattleStage
        action={action}
        canAnimate={isAnimating}
        enemy={enemy}
        enemyHp={enemyHp}
        enemyMaxHp={enemy.stats.hp}
        enemyStats={enemy.stats}
        enemyStatuses={enemyStatuses}
        enemyUnitId={getEnemyBattleUnitId(enemy)}
        onActionComplete={onActionComplete}
        onActionImpact={onActionImpact}
        pet={pet}
        petHp={petHp}
        petLevel={petLevel}
        petMaxHp={petStats.hp}
        petStats={petStats}
        petStatuses={petStatuses}
        petUnitId={activeUnitId}
      />

      <PetTeamBar activeUnitId={activeUnitId} members={teamMembers} onSwitch={onSwitchPet} switchingDisabled={battleState !== "playing" || isAnimating} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <GameCard className="bg-white/68">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-coral" />
              <h3 className="text-xl font-black text-ink">技能指令</h3>
            </div>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-coral" onClick={resetBattle} type="button">
              <RotateCcw className="size-4" />
              重新训练
            </button>
          </div>
          <CapturePanel canCapture={canCapture} isBoss={isBossCapture} onCapture={onCapture} rate={captureRate} />
          <div className="grid gap-3 md:grid-cols-2">
            {petSkills.map((skill) => {
              const cooldown = cooldowns[`${activeUnitId}:${skill.id}`] ?? 0;
              const locked = petLevel < skill.unlockLevel;
              const disabled = battleState !== "playing" || cooldown > 0 || isAnimating || locked;
              const Icon = skill.type === "heal" ? HeartPulse : skill.type === "shield" ? Shield : skill.type === "buff" ? Zap : Swords;
              const iconTone = skill.type === "heal" || skill.type === "shield" ? "text-leaf" : skill.type === "power_attack" || skill.type === "multi_hit" ? "text-coral" : skill.type === "buff" ? "text-gold" : "text-tide";
              const counters = trainingSkillCountersEnemy(skill, enemy.type);

              return (
                <button
                  className={`min-h-[116px] min-w-0 rounded-3xl border p-4 text-left transition md:min-w-[180px] ${
                    disabled
                      ? "cursor-not-allowed border-ink/8 bg-ink/5 text-ink/38"
                      : "border-white bg-white text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:-translate-y-0.5 hover:border-tide/30"
                  }`}
                  disabled={disabled}
                  key={skill.id}
                  onClick={() => useSkill(skill)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-base font-black">
                          <Icon className={`size-4 shrink-0 ${disabled ? "text-ink/30" : iconTone}`} />
                          {skill.name}
                    </span>
                    {locked ? <SkillUnlockHint level={skill.unlockLevel} /> : <span className="shrink-0 rounded-full bg-ink/6 px-2 py-1 text-[11px] font-black">{cooldown > 0 ? `冷却 ${cooldown}` : `威力 ${skill.power}`}</span>}
                  </div>
                  <p className="mt-2 text-xs font-bold text-ink/52">{skillTypeLabel(skill.type)} · 冷却 {skill.cooldown} 回合 · {counters ? "克制当前敌人" : "普通效果"}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-ink/62">{skill.effectText}</p>
                </button>
              );
            })}
          </div>

          {battleState === "won" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl border border-gold/20 bg-gold/10 p-4 text-sm font-bold leading-6 text-ink/62">
                下一场 {nextEnemy.name} Lv.{nextEnemy.level} 可以直接挑战；若不克制且等级差过大，会触发等级压制。
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <button
                  className="min-h-12 rounded-2xl bg-tide px-4 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink"
                  onClick={continueChallenge}
                  type="button"
                >
                  继续挑战
                </button>
                <button className="min-h-12 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-tide" onClick={() => setActiveTab("growth")} type="button">
                  进入养成室
                </button>
                <button className="min-h-12 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-coral" onClick={returnToPetSelect} type="button">
                  返回伙伴选择
                </button>
              </div>
            </div>
          )}
          {battleState === "lost" && (
            <button className="mt-4 min-h-12 w-full rounded-2xl bg-coral px-4 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" onClick={resetBattle} type="button">
              再试一次
            </button>
          )}
        </GameCard>

        <div className="rounded-[1.6rem] border border-white/75 bg-white/68 p-4 text-ink shadow-[0_16px_34px_rgba(16,36,63,0.07)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black">战斗日志</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${battleState === "won" ? "bg-leaf/10 text-leaf ring-1 ring-leaf/20" : battleState === "lost" ? "bg-coral/10 text-coral ring-1 ring-coral/20" : "bg-tide/10 text-tide ring-1 ring-tide/20"}`}>
              {battleState === "won" ? "胜利" : battleState === "lost" ? "暂败" : "进行中"}
            </span>
          </div>
          <div className="h-[190px] space-y-2 overflow-y-auto rounded-[1.25rem] bg-[#F7F3E7]/58 p-2 pr-1 ring-1 ring-white/72 [scrollbar-width:thin] md:h-[230px]">
            {logs.length === 0 ? (
              <p className="rounded-2xl border border-tide/20 bg-tide/10 px-3 py-3 text-sm font-bold leading-6 text-ink/54">选择技能，开始本场训练。</p>
            ) : (
              logs.slice(0, 5).map((log, index) => (
                <p
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold leading-6 ${
                    index === 0
                      ? "border-tide/20 bg-tide/10 text-ink shadow-[inset_3px_0_0_rgba(21,156,168,0.55)]"
                      : "border-[#D2E1E6]/70 bg-white/70 text-ink/70"
                  }`}
                  key={`${log}-${index}`}
                >
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
      <DailyTrainingRewardPanel progress={dailyProgress} />
    </section>
  );
}

function GrowthRoom({
  companionTrainingExp,
  notice,
  pet,
  petExp,
  petExpNeed,
  petLevel,
  petStats,
  trainStat,
  training
}: {
  companionTrainingExp: number;
  notice: string;
  pet: BattlePet;
  petExp: number;
  petExpNeed: number;
  petLevel: number;
  petStats: BattleStats;
  trainStat: (key: keyof PetTrainingStats, label: string, value: number) => void;
  training: PetTrainingStats;
}) {
  const trainingActions = [
    { key: "hp" as const, label: "生命", value: 5, text: "最大HP +5", icon: HeartPulse },
    { key: "attack" as const, label: "攻击", value: 1, text: "攻击 +1", icon: Swords },
    { key: "defense" as const, label: "防御", value: 1, text: "防御 +1", icon: Shield },
    { key: "speed" as const, label: "速度", value: 1, text: "速度 +1", icon: Zap }
  ];
  const expNotEnough = companionTrainingExp < trainingCost;

  return (
    <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
      <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
        <div className="grid place-items-center rounded-[2rem] bg-white/58 p-5 ring-1 ring-white/80">
          <img alt={pet.name} className={`h-40 object-contain [image-rendering:pixelated] ${petSpriteFacingClass(pet.id, "right")}`} src={pet.image} />
        </div>
        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">{attributeLabel(pet.attribute)}</p>
            <h2 className="mt-1 text-3xl font-black text-ink">{pet.name}</h2>
            <p className="mt-1 text-sm font-bold text-ink/58">{pet.role}</p>
          </div>
          <span className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white">Lv.{petLevel}</span>
        </div>
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs font-black text-ink/52">
            <span>宠物经验</span>
            <span>{petExp} / {petExpNeed}</span>
          </div>
          <ProgressBar percent={hpPercent(petExp, petExpNeed)} />
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          <StatItem label="HP" value={petStats.hp} />
          <StatItem label="攻击" value={petStats.attack} />
          <StatItem label="防御" value={petStats.defense} />
          <StatItem label="速度" value={petStats.speed} />
        </div>
      </GameCard>

      <GameCard className="bg-white/68">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Growth Room</p>
            <h2 className="mt-1 text-2xl font-black text-ink">伙伴养成室</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">伙伴训练经验来自闯关、答题和训练胜利，用于提升伙伴属性。</p>
          </div>
          <div className="rounded-3xl bg-ink px-4 py-3 text-white">
            <p className="text-xs font-black text-white/54">伙伴训练经验</p>
            <p className="mt-1 text-2xl font-black">{companionTrainingExp}</p>
          </div>
        </div>
        {expNotEnough && (
          <div className="mt-4 rounded-3xl border border-coral/20 bg-coral/10 p-4 text-sm font-bold leading-6 text-coral">
            伙伴训练经验不足，完成闯关或战斗可获得更多经验。
          </div>
        )}
        {notice && <div className="mt-4 rounded-3xl border border-tide/20 bg-tide/10 p-4 text-sm font-bold leading-6 text-tide">{notice}</div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {trainingActions.map((item) => {
            const Icon = item.icon;
            const disabled = companionTrainingExp < trainingCost;
            return (
              <button
                className={`min-h-28 rounded-3xl border p-4 text-left transition ${
                  disabled
                    ? "cursor-not-allowed border-ink/8 bg-ink/5 text-ink/38"
                    : "border-white bg-white text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:-translate-y-0.5 hover:border-tide/30"
                }`}
                disabled={disabled}
                key={item.key}
                onClick={() => trainStat(item.key, item.label, item.value)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-lg font-black">
                    <Icon className="size-5" />
                    {item.label}训练
                  </span>
                  <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-black">消耗 {trainingCost}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-ink/58">{item.text}</p>
                <p className="mt-1 text-xs font-black text-ink/42">已训练 {training[item.key]} 次</p>
              </button>
            );
          })}
        </div>
      </GameCard>
    </section>
  );
}

function ArchiveCard({
  badge,
  image,
  name,
  primary,
  secondary,
  sourceId,
  text,
  tone
}: {
  badge?: ReactNode;
  image: string;
  name: string;
  primary: string;
  secondary: string;
  sourceId: string;
  text: string;
  tone: "pet" | "enemy";
}) {
  return (
    <GameCard className="h-full bg-white/66">
      <div className="flex items-start gap-4">
        <div className={`grid size-24 shrink-0 place-items-center rounded-[1.4rem] p-2 ${tone === "pet" ? "bg-tide/10" : "bg-coral/10"}`}>
          <img alt={name} className={`max-h-full max-w-full object-contain [image-rendering:pixelated] ${petSpriteFacingClass(sourceId, "right")}`} src={image} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${tone === "pet" ? "text-tide" : "text-coral"}`}>{primary}</p>
            {badge}
          </div>
          <h3 className="mt-1 text-2xl font-black text-ink">{name}</h3>
          <p className="mt-1 text-sm font-bold text-ink/54">{secondary}</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-ink/62">{text}</p>
    </GameCard>
  );
}

function CompanionArchive({
  ownedPetIds,
  selectedPetId,
  selectPet
}: {
  ownedPetIds: string[];
  selectedPetId: string;
  selectPet: (pet: BattlePet) => void;
}) {
  const basicEnemies = enemies.filter((enemy) => enemy.branch === "basic");
  const carelessAdvancedEnemies = enemies.filter((enemy) => enemy.branch === "careless");
  const forgetAdvancedEnemies = enemies.filter((enemy) => enemy.branch === "forget");
  const anxietyAdvancedEnemies = enemies.filter((enemy) => enemy.branch === "anxiety");

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-ink">伙伴图鉴</h2>
        <p className="mt-2 text-sm font-semibold text-ink/58">查看第一版伙伴和训练敌人的类型、特点与克制关系。</p>
      </div>
      <div>
        <h3 className="text-xl font-black text-ink">初始伙伴</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {pets.map((pet) => (
            <div key={pet.id}>
              <PetSelectCard active={pet.id === selectedPetId} onSelect={selectPet} pet={pet} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-ink">基础敌人</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {basicEnemies.map((enemy) => (
            <ArchiveCard
              badge={<PetOwnedBadge state={ownedPetIds.includes(enemy.id) ? "owned" : isCapturablePet(enemy.id) ? "capturable" : isBossPet(enemy.id) ? "boss" : "unowned"} />}
              image={enemy.image}
              key={enemy.id}
              name={enemy.name}
              primary={`${enemyTypeLabel(enemy.type)}型`}
              secondary={enemy.role}
              sourceId={enemy.id}
              text={enemy.description ?? counterMessages[enemy.type]}
              tone="enemy"
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-ink">粗心型进阶敌人</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {carelessAdvancedEnemies.map((enemy) => (
            <ArchiveCard
              badge={<PetOwnedBadge state={ownedPetIds.includes(enemy.id) ? "owned" : isCapturablePet(enemy.id) ? "capturable" : isBossPet(enemy.id) ? "boss" : "unowned"} />}
              image={enemy.image}
              key={enemy.id}
              name={enemy.name}
              primary="粗心型"
              secondary={enemy.role}
              sourceId={enemy.id}
              text={enemy.description ?? "粗心型进阶敌人。"}
              tone="enemy"
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-ink">遗忘型进阶敌人</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {forgetAdvancedEnemies.map((enemy) => (
            <ArchiveCard
              badge={<PetOwnedBadge state={ownedPetIds.includes(enemy.id) ? "owned" : isCapturablePet(enemy.id) ? "capturable" : isBossPet(enemy.id) ? "boss" : "unowned"} />}
              image={enemy.image}
              key={enemy.id}
              name={enemy.name}
              primary="遗忘型"
              secondary={`${enemy.role}${enemy.species ? ` · ${enemy.species}` : ""}`}
              sourceId={enemy.id}
              text={enemy.description ?? "遗忘型进阶敌人。"}
              tone="enemy"
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-black text-ink">焦虑型进阶敌人</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {anxietyAdvancedEnemies.map((enemy) => (
            <ArchiveCard
              badge={<PetOwnedBadge state={ownedPetIds.includes(enemy.id) ? "owned" : isCapturablePet(enemy.id) ? "capturable" : isBossPet(enemy.id) ? "boss" : "unowned"} />}
              image={enemy.image}
              key={enemy.id}
              name={enemy.name}
              primary="焦虑型"
              secondary={`${enemy.role}${enemy.species ? ` · ${enemy.species}` : ""}`}
              sourceId={enemy.id}
              text={enemy.description ?? "焦虑型进阶敌人。"}
              tone="enemy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PetBattle({ openPartnerChess }: { openPartnerChess?: () => void }) {
  const [saveState, setSaveState] = useState(() => loadPetBattleState());
  const [partnerSave, setPartnerSave] = useState(() => ensurePetCollection(loadPartnerChessSave()));
  const [dailyProgress, setDailyProgress] = useState(() => loadDailyTrainingProgress());
  const [activeTab, setActiveTab] = useState<PetBattleTab>("training");
  const [selectedTeamSlot, setSelectedTeamSlot] = useState(0);
  const [activeUnitId, setActiveUnitId] = useState(() => {
    const initialTeam = ensurePetCollection(loadPartnerChessSave()).activeTrainingTeam;
    return getPlayerBattleUnitId(0, initialTeam[0] ?? defaultTrainingTeamIds[0]);
  });
  const normalizedPartnerSave = useMemo(() => ensurePetCollection(partnerSave), [partnerSave]);
  const activeTrainingTeam = normalizedPartnerSave.activeTrainingTeam;
  const enemy = useMemo(() => getScaledEnemy(saveState.battleStage), [saveState.battleStage]);
  const nextEnemy = useMemo(() => getScaledEnemy(saveState.battleStage + 1), [saveState.battleStage]);
  const [teamHp, setTeamHp] = useState<Record<string, number>>(() => createTeamHp(ensurePetCollection(loadPartnerChessSave())));
  const [enemyHp, setEnemyHp] = useState(enemy.stats.hp);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [effects, setEffects] = useState<BattleEffects>(defaultEffects);
  const [petStatuses, setPetStatuses] = useState<BattleStatusEffect[]>([]);
  const [enemyStatuses, setEnemyStatuses] = useState<BattleStatusEffect[]>([]);
  const [logs, setLogs] = useState<string[]>(["欢迎来到伙伴岛。选择技能，帮助学习伙伴击败训练敌人。"]);
  const [battleState, setBattleState] = useState<"playing" | "won" | "lost">("playing");
  const [manualAction, setManualAction] = useState<ManualBattleAction | null>(null);
  const [isManualAnimating, setIsManualAnimating] = useState(false);
  const [notice, setNotice] = useState("");
  const actionImpactRef = useRef<(() => void) | null>(null);
  const actionResolveRef = useRef<(() => void) | null>(null);
  const teamMembers = useMemo<PetBattleTeamMember[]>(() => activeTrainingTeam.map((petId, index) => {
    const pet = getTrainingPetById(petId);
    const level = getPartnerPetLevel(normalizedPartnerSave, petId);
    const stats = getTrainingBattleStats(pet, level);
    const battleUnitId = getPlayerBattleUnitId(index, petId);
    return {
      battleUnitId,
      hp: teamHp[battleUnitId] ?? stats.hp,
      level,
      maxHp: stats.hp,
      pet,
      speciesId: petId,
      stats
    };
  }), [activeTrainingTeam, normalizedPartnerSave, teamHp]);
  const activeMember = teamMembers.find((member) => member.battleUnitId === activeUnitId) ?? teamMembers[0];
  const activePetId = activeMember?.speciesId ?? activeTrainingTeam[0] ?? defaultTrainingTeamIds[0];
  const selectedPet = activeMember?.pet ?? getTrainingPetById(activePetId);
  const activePetLevel = activeMember?.level ?? getPartnerPetLevel(normalizedPartnerSave, activePetId);
  const petStats = activeMember?.stats ?? getTrainingBattleStats(selectedPet, activePetLevel);
  const petSkills = useMemo(() => getTrainingSkillsForPet(selectedPet), [selectedPet]);
  const petHp = activeMember?.hp ?? petStats.hp;
  const activePetLevelInfo = getPetLevelInfo(normalizedPartnerSave, activePetId);
  const petExpNeed = activePetLevelInfo.requiredExp || getRequiredPetExp(activePetLevel);
  const levelPressure = hasLevelPressure(selectedPet, activePetLevel, enemy);
  const captureRate = getAdjustedCaptureRate(enemyHp, enemy.stats.hp, levelPressure);
  const enemyUnitId = getEnemyBattleUnitId(enemy);

  function persist(next: PetBattleSaveState) {
    setSaveState(next);
    savePetBattleState(next);
  }

  useEffect(() => {
    const reward = claimDailyFirstEntry(partnerSave);
    if (reward) {
      setPartnerSave(reward.save);
      setDailyProgress(loadDailyTrainingProgress());
      setLogs((current) => [reward.message, ...current].slice(0, 12));
    }
    // 首次进入训练场奖励只在挂载时检查。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pushLogs(nextLogs: string[]) {
    setLogs((current) => [...nextLogs, ...current].slice(0, 12));
  }

  const handleManualActionImpact = useCallback(() => {
    actionImpactRef.current?.();
  }, []);

  const handleManualActionComplete = useCallback(() => {
    actionImpactRef.current = null;
    const resolve = actionResolveRef.current;
    actionResolveRef.current = null;
    setManualAction(null);
    setIsManualAnimating(false);
    resolve?.();
  }, []);

  function playManualAction(action: ManualBattleAction, onImpact: () => void) {
    return new Promise<void>((resolve) => {
      let settled = false;
      let impacted = false;
      const triggerImpact = () => {
        if (impacted) return;
        impacted = true;
        onImpact();
      };
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(safetyTimer);
        resolve();
      };
      const safetyTimer = window.setTimeout(() => {
        if (settled) return;
        triggerImpact();
        actionImpactRef.current = null;
        actionResolveRef.current = null;
        setManualAction(null);
        setIsManualAnimating(false);
        pushLogs([`战斗动作异常，已跳过本次动画。debug: actor=${action.actorUnitId}, target=${action.targetUnitId ?? "none"}`]);
        finish();
      }, 1800);
      actionImpactRef.current = triggerImpact;
      actionResolveRef.current = () => {
        actionImpactRef.current = null;
        actionResolveRef.current = null;
        finish();
      };
      setManualAction(action);
      setIsManualAnimating(true);
    });
  }

  function resetBattle(nextState = saveState, message?: string) {
    const latestPartnerSave = ensurePetCollection(loadPartnerChessSave());
    setPartnerSave(latestPartnerSave);
    const currentSlot = latestPartnerSave.activeTrainingTeam.findIndex((petId, index) => getPlayerBattleUnitId(index, petId) === activeUnitId);
    const nextSlot = currentSlot >= 0 ? currentSlot : 0;
    const nextActivePetId = latestPartnerSave.activeTrainingTeam[nextSlot] ?? latestPartnerSave.activeTrainingTeam[0] ?? defaultTrainingTeamIds[0];
    const nextActiveUnitId = getPlayerBattleUnitId(nextSlot, nextActivePetId);
    const nextPet = getTrainingPetById(nextActivePetId);
    const nextEnemyForBattle = getScaledEnemy(nextState.battleStage);
    const nextTeamHp = createTeamHp(latestPartnerSave);
    setTeamHp(nextTeamHp);
    if (nextActiveUnitId !== activeUnitId) setActiveUnitId(nextActiveUnitId);
    setEnemyHp(nextEnemyForBattle.stats.hp);
    setCooldowns({});
    setEffects(defaultEffects);
    setPetStatuses([]);
    setEnemyStatuses([]);
    setBattleState("playing");
    setManualAction(null);
    setIsManualAnimating(false);
    actionImpactRef.current = null;
    actionResolveRef.current = null;
    setLogs([message ?? `第 ${nextState.battleStage} 场训练开始：${nextPet.name} 对战 ${nextEnemyForBattle.name}。`]);
  }

  function selectPet(pet: BattlePet) {
    const slotIndex = normalizedPartnerSave.activeTrainingTeam.indexOf(pet.id);
    if (slotIndex < 0) {
      setNotice(`${pet.name} 不在当前背包中，可先在宠物仓库替换上阵。`);
      setActiveTab("storage");
      return;
    }
    const next = {
      ...saveState,
      selectedPetId: pet.id
    };
    persist(next);
    setActiveUnitId(getPlayerBattleUnitId(slotIndex, pet.id));
    setActiveTab("training");
    resetBattle(next, `${pet.name} 成为当前学习伙伴。`);
  }

  function continueChallenge() {
    const nextStage = saveState.battleStage + 1;
    const next = {
      ...saveState,
      battleStage: nextStage,
      bestStage: Math.max(saveState.bestStage, nextStage)
    };
    persist(next);
    resetBattle(next);
  }

  function returnToPetSelect() {
    setActiveTab("archive");
    resetBattle(saveState, "可以重新选择伙伴，训练数据会保留。");
  }

  function trainStat(key: keyof PetTrainingStats, label: string, value: number) {
    if (saveState.companionTrainingExp < trainingCost) {
      setNotice("伙伴训练经验不足，完成闯关或战斗可获得更多经验。");
      return;
    }

    const next = {
      ...saveState,
      companionTrainingExp: saveState.companionTrainingExp - trainingCost,
      training: {
        ...saveState.training,
        [key]: saveState.training[key] + 1
      }
    };
    persist(next);
    resetBattle(next, `${selectedPet.name} 完成${label}训练，${label} +${value}。`);
    setNotice(`${selectedPet.name} 完成${label}训练，${label} +${value}。`);
  }

  function tickCooldowns(usedSkill: BattleSkill) {
    setCooldowns((current) => {
      const next = Object.fromEntries(Object.entries(current).map(([skillId, value]) => [skillId, Math.max(0, value - 1)]));
      next[`${activeUnitId}:${usedSkill.id}`] = usedSkill.cooldown;
      return next;
    });
  }

  function switchPet(battleUnitId: string) {
    if (battleUnitId === activeUnitId || isManualAnimating || battleState !== "playing") return;
    const member = teamMembers.find((item) => item.battleUnitId === battleUnitId);
    if (!member || member.hp <= 0) return;
    setActiveUnitId(battleUnitId);
    const next = { ...saveState, selectedPetId: member.speciesId };
    persist(next);
    setPetStatuses([]);
    setCooldowns({});
    pushLogs([`${member.pet.name} 上场！`]);
  }

  function replaceTrainingTeamSlot(slotIndex: number, petId: string) {
    const nextPartnerSave = replaceTeamSlot(normalizedPartnerSave, slotIndex, petId);
    if (nextPartnerSave.activeTrainingTeam.join("|") === normalizedPartnerSave.activeTrainingTeam.join("|")) {
      setNotice("这只宠物已经在背包中，不能重复上阵。");
      return;
    }
    savePartnerChessSave(nextPartnerSave);
    setPartnerSave(nextPartnerSave);
    setSelectedTeamSlot(slotIndex);
    const replacement = getTrainingPetById(petId);
    const nextActivePetId = nextPartnerSave.activeTrainingTeam[0] ?? petId;
    setActiveUnitId(getPlayerBattleUnitId(0, nextActivePetId));
    resetBattle(saveState, `${replacement.name} 已替换到背包第 ${slotIndex + 1} 位。`);
    setNotice(`${replacement.name} 已加入训练背包。`);
  }

  function petSourceLabel(petId: string) {
    if (isInitialPet(petId)) return "获取方式：初始伙伴";
    if (normalizedPartnerSave.capturedAt[petId]) return "获取方式：捕捉获得";
    return "获取方式：碎片解锁预留";
  }

  function autoSwitchOrLose(nextLogs: string[]) {
    const nextMember = teamMembers.find((member) => member.battleUnitId !== activeUnitId && member.hp > 0);
    if (nextMember) {
      setActiveUnitId(nextMember.battleUnitId);
      setPetStatuses([]);
      setCooldowns({});
      pushLogs([`${selectedPet.name} 暂时退场，${nextMember.pet.name} 接替出战！`, ...nextLogs]);
      return;
    }

    let nextPartnerSave = normalizedPartnerSave;
    const growthLogs: string[] = [];
    for (const petId of activeTrainingTeam) {
      const result = addPetExp(nextPartnerSave, petId, 5);
      nextPartnerSave = result.save;
      if (result.growth.leveledUp) {
        growthLogs.push(`${result.growth.petName} Lv.${result.growth.beforeLevel} → Lv.${result.growth.afterLevel}！`);
      }
    }
    const dailyResult = recordTrainingBattle({ captured: false, enemyType: enemy.type, isWin: false, save: nextPartnerSave });
    savePartnerChessSave(dailyResult.save);
    setPartnerSave(dailyResult.save);
    setDailyProgress(dailyResult.progress);
    setBattleState("lost");
    pushLogs([`三只伙伴都暂时退场了，但全队仍获得宠物经验 +5。`, ...dailyResult.messages, ...growthLogs, ...nextLogs]);
  }

  async function enemyImmediateAction(reasonLog: string) {
    if (isManualAnimating || battleState !== "playing") return;
    const enemySkill = chooseEnemySkill(enemy);
    if (!enemySkill) return;
    const nextLogs = [reasonLog, `${enemy.name} 立刻反击，使用了「${enemySkill.name}」。`];
    let nextPetHp = petHp;
    let nextPetStatuses = [...petStatuses];
    const enemyDamage = calculateEnemyDamage({
      attackerAttack: enemy.stats.attack + effects.enemyAttackBonus,
      defenderDefense: petStats.defense + effects.petDefenseBonus,
      skill: enemySkill,
      statusMultiplier: (1 - effects.shieldReduction) * (levelPressure ? 1.08 : 1)
    });
    const shielded = applyShield(nextPetStatuses, enemyDamage.totalDamage);
    nextPetStatuses = shielded.statuses;
    nextPetHp = clampHp(nextPetHp - shielded.damage, petStats.hp);
    await playManualAction({ actor: "enemy", actorUnitId: enemyUnitId, damage: shielded.damage, id: `enemy-capture-${Date.now()}`, skill: enemySkill, targetUnitId: activeUnitId }, () => {
      setTeamHp((current) => ({ ...current, [activeUnitId]: nextPetHp }));
      setPetStatuses(nextPetStatuses);
      nextLogs.push(`${selectedPet.name} 受到 ${shielded.damage} 点伤害。`);
    });
    if (nextPetHp <= 0) {
      autoSwitchOrLose(nextLogs);
      return;
    }
    pushLogs(nextLogs);
  }

  async function attemptCapture() {
    const rate = captureRate;
    const canCapture = rate > 0 && !isBossEnemy(enemy) && battleState === "playing" && !isManualAnimating;
    if (!canCapture) return;
    const success = Math.random() * 100 < rate;
    if (success) {
      const collection = addPetToCollection(normalizedPartnerSave, enemy.id);
      const captureLog = collection.alreadyOwned
        ? `已拥有${enemy.name}，转化为碎片 +3。`
        : `捕捉成功！${enemy.name} 加入宠物仓库！初始等级 Lv.1，可在宠物仓库中加入背包。`;
      finishWin(petHp, [captureLog], petSkills[0], true, collection.save);
      return;
    }
    await enemyImmediateAction(`捕捉失败！${enemy.name} 挣脱了。`);
  }

  function finishWin(nextPetHp: number, nextLogs: string[], usedSkill: BattleSkill, captured = false, basePartnerSave: PartnerChessSave = normalizedPartnerSave) {
    const rewardPetExp = enemy.rewardExp;
    const rewardTrainingExp = getRewardTrainingExp(enemy);
    let nextPartnerSave = ensurePetCollection(basePartnerSave);
    const growthLogs: string[] = [];
    for (const petId of nextPartnerSave.activeTrainingTeam) {
      const result = addPetExp(nextPartnerSave, petId, rewardPetExp);
      nextPartnerSave = result.save;
      if (result.growth.leveledUp) {
        growthLogs.push(`${result.growth.petName} Lv.${result.growth.beforeLevel} → Lv.${result.growth.afterLevel}！`);
      } else {
        growthLogs.push(`${result.growth.petName} 经验 +${rewardPetExp}。`);
      }
    }
    if (!captured) {
      nextPartnerSave = addCoinsAndShard({
        save: nextPartnerSave,
        shardAmount: isBossEnemy(enemy) ? 2 : 1,
        shardType: enemy.type
      });
    }
    const dailyResult = recordTrainingBattle({
      captured,
      enemyType: enemy.type,
      isWin: true,
      save: nextPartnerSave
    });
    nextPartnerSave = dailyResult.save;
    savePartnerChessSave(nextPartnerSave);
    setPartnerSave(nextPartnerSave);
    setDailyProgress(dailyResult.progress);
    const nextState = {
      ...saveState,
      companionTrainingExp: saveState.companionTrainingExp + rewardTrainingExp,
      bestStage: Math.max(saveState.bestStage, saveState.battleStage),
      battleHistory: [`第 ${saveState.battleStage} 场${captured ? "捕捉" : "击败"} ${enemy.name}`, ...saveState.battleHistory].slice(0, 20)
    };
    persist(nextState);
    setEnemyHp(0);
    setTeamHp((current) => ({ ...current, [activeUnitId]: nextPetHp }));
    tickCooldowns(usedSkill);
    setBattleState("won");
    pushLogs([
      captured
        ? `捕捉完成！伙伴训练经验 +${rewardTrainingExp}。`
        : `${enemy.name} 被击败！全队宠物经验 +${rewardPetExp}，伙伴训练经验 +${rewardTrainingExp}。`,
      ...dailyResult.messages,
      ...growthLogs,
      ...nextLogs
    ]);
  }

  async function useSkill(skill: PetTrainingSkill) {
    if (battleState !== "playing" || (cooldowns[`${activeUnitId}:${skill.id}`] ?? 0) > 0 || isManualAnimating) {
      return;
    }

    const nextLogs: string[] = [];
    let nextPetHp = petHp;
    let nextEnemyHp = enemyHp;
    let nextEffects = { ...effects };
    let nextPetStatuses = [...petStatuses];
    let nextEnemyStatuses = [...enemyStatuses];

    const petBurn = nextPetStatuses.find((status) => status.type === "burn");
    if (petBurn) {
      const damage = burnDamage(petStats.hp);
      nextPetHp = clampHp(nextPetHp - damage, petStats.hp);
      setTeamHp((current) => ({ ...current, [activeUnitId]: nextPetHp }));
      nextLogs.push(`${selectedPet.name} 受到灼烧 ${damage} 点伤害。`);
      nextPetStatuses = nextPetStatuses.map((status) => status.type === "burn" ? { ...status, duration: status.duration - 1 } : status).filter((status) => status.duration > 0);
      setPetStatuses(nextPetStatuses);
      if (nextPetHp <= 0) {
        autoSwitchOrLose(nextLogs);
        return;
      }
    }

    const stunned = nextPetStatuses.some((status) => status.type === "stun");
    if (stunned) {
      nextPetStatuses = nextPetStatuses.filter((status) => status.type !== "stun");
      setPetStatuses(nextPetStatuses);
      nextLogs.push(`${selectedPet.name} 被眩晕，跳过本次行动。`);
    } else {
    if (nextPetStatuses.some((status) => status.type === "forget")) {
      const firstSkill = petSkills.find((item) => activePetLevel >= item.unlockLevel);
      if (firstSkill) {
        const firstSkillKey = `${activeUnitId}:${firstSkill.id}`;
        setCooldowns((current) => ({ ...current, [firstSkillKey]: (current[firstSkillKey] ?? 0) + 1 }));
        nextLogs.push(`${selectedPet.name} 受到遗忘影响，「${firstSkill.name}」冷却 +1。`);
      }
      nextPetStatuses = nextPetStatuses.filter((status) => status.type !== "forget");
      setPetStatuses(nextPetStatuses);
    }
    nextLogs.push(`${selectedPet.name} 使用了「${skill.name}」。`);

    if (skill.type === "heal") {
      const heal = Math.max(1, Math.round(petStats.hp * (skill.healPercent ?? 0.25)));
      nextPetHp = clampHp(nextPetHp + heal, petStats.hp);
      await playManualAction({ actor: "pet", actorUnitId: activeUnitId, heal, id: `pet-${skill.id}-${Date.now()}`, isBuff: true, skill, targetUnitId: activeUnitId }, () => {
        setTeamHp((current) => ({ ...current, [activeUnitId]: nextPetHp }));
        nextLogs.push(`${selectedPet.name} 恢复了 ${heal} 点 HP。`);
      });
    } else if (skill.type === "shield") {
      nextEffects.shieldReduction = Math.max(nextEffects.shieldReduction, skill.shieldReduction ?? 0);
      const status = statusForSkill(skill, petStats.hp);
      await playManualAction({ actor: "pet", actorUnitId: activeUnitId, id: `pet-${skill.id}-${Date.now()}`, isBuff: true, skill, targetUnitId: activeUnitId }, () => {
        if (status) {
          nextPetStatuses = addOrReplaceStatus(nextPetStatuses, status);
          setPetStatuses(nextPetStatuses);
        }
        nextLogs.push(`${selectedPet.name} 获得护盾，下一次受到的伤害会降低。`);
      });
    } else if (skill.type === "buff") {
      nextEffects.petAttackBonus += skill.buff?.attack ?? 0;
      nextEffects.petDefenseBonus += skill.buff?.defense ?? 0;
      nextEffects.nextAttackMultiplier = Math.max(nextEffects.nextAttackMultiplier, skill.buff?.nextAttackPowerMultiplier ?? 1);
      await playManualAction({ actor: "pet", actorUnitId: activeUnitId, id: `pet-${skill.id}-${Date.now()}`, isBuff: true, skill, targetUnitId: activeUnitId }, () => {
        nextLogs.push(`${selectedPet.name} 状态提升：${skill.effectText}`);
      });
    } else {
      const skillForDamage = {
        ...skill,
        power: Math.round(skill.power * nextEffects.nextAttackMultiplier)
      };
      const anxietyMultiplier = nextPetStatuses.some((status) => status.type === "anxietyDown") ? 0.8 : 1;
      const counterMultiplier = trainingSkillCountersEnemy(skill, enemy.type) ? 1.35 : 1;
      const levelPressureDamageMultiplier = levelPressure ? 0.88 : 1;
      const baseDamage = Math.max(1, skillForDamage.power + petStats.attack + nextEffects.petAttackBonus - enemy.stats.defense - nextEffects.enemyDefenseBonus);
      const totalDamage = Math.max(1, Math.round(baseDamage * counterMultiplier * anxietyMultiplier * levelPressureDamageMultiplier * nextEffects.nextDamageMultiplier));
      const shielded = applyShield(nextEnemyStatuses, totalDamage);
      nextEnemyStatuses = shielded.statuses;
      nextEnemyHp = clampHp(nextEnemyHp - shielded.damage, enemy.stats.hp);
      await playManualAction({
        actor: "pet",
        actorUnitId: activeUnitId,
        damage: shielded.damage,
        id: `pet-${skill.id}-${Date.now()}`,
        isCounter: counterMultiplier > 1,
        skill,
        targetUnitId: enemyUnitId
      }, () => {
        setEnemyHp(nextEnemyHp);
        setEnemyStatuses(nextEnemyStatuses);
        if (nextEffects.enemyShieldReduction > 0) {
          nextLogs.push(`${enemy.name} 的防守降低了本次伤害。`);
        }
        nextLogs.push(`造成 ${shielded.damage} 点伤害${counterMultiplier > 1 ? "，属性克制，伤害提升！" : levelPressure ? "，受到等级压制影响。" : "。"}`);
        const status = statusForSkill(skill, enemy.stats.hp);
        if (status) {
          nextEnemyStatuses = addOrReplaceStatus(nextEnemyStatuses, status);
          setEnemyStatuses(nextEnemyStatuses);
          nextLogs.push(`${enemy.name} 进入${status.label}状态。`);
        }
      });
      nextEffects.nextAttackMultiplier = 1;
      nextEffects.nextDamageMultiplier = 1;
      nextPetStatuses = nextPetStatuses.filter((status) => status.type !== "anxietyDown");
      nextEffects.enemyShieldReduction = 0;

      if (skill.debuff?.attack) {
        nextEffects.enemyAttackBonus += skill.debuff.attack;
        nextLogs.push(`${enemy.name} 攻击降低。`);
      }
      if (skill.lifestealPercent) {
        const heal = Math.max(1, Math.round(shielded.damage * skill.lifestealPercent));
        nextPetHp = clampHp(nextPetHp + heal, petStats.hp);
        nextLogs.push(`${selectedPet.name} 恢复 ${heal} 点 HP。`);
      }
    }
    }

    if (nextEnemyHp <= 0) {
      finishWin(nextPetHp, nextLogs, skill);
      return;
    }

    tickCooldowns(skill);
    setEffects(nextEffects);
    setPetStatuses(nextPetStatuses);
    setEnemyStatuses(nextEnemyStatuses);
    setIsManualAnimating(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setIsManualAnimating(false);

    const enemyBurn = nextEnemyStatuses.find((status) => status.type === "burn");
    if (enemyBurn) {
      const damage = burnDamage(enemy.stats.hp);
      nextEnemyHp = clampHp(nextEnemyHp - damage, enemy.stats.hp);
      setEnemyHp(nextEnemyHp);
      nextLogs.push(`${enemy.name} 受到灼烧 ${damage} 点伤害。`);
      nextEnemyStatuses = nextEnemyStatuses.map((status) => status.type === "burn" ? { ...status, duration: status.duration - 1 } : status).filter((status) => status.duration > 0);
      setEnemyStatuses(nextEnemyStatuses);
      if (nextEnemyHp <= 0) {
        finishWin(nextPetHp, nextLogs, skill);
        return;
      }
    }

    if (nextEnemyStatuses.some((status) => status.type === "stun")) {
      nextEnemyStatuses = nextEnemyStatuses.filter((status) => status.type !== "stun");
      setEnemyStatuses(nextEnemyStatuses);
      nextLogs.push(`${enemy.name} 被眩晕，跳过反击。`);
      pushLogs(nextLogs);
      return;
    }

    if (nextEnemyStatuses.some((status) => status.type === "forget")) {
      nextEnemyStatuses = nextEnemyStatuses.filter((status) => status.type !== "forget");
      setEnemyStatuses(nextEnemyStatuses);
      nextLogs.push(`${enemy.name} 被遗忘干扰，反击节奏变慢。`);
    }

    const enemySkill = chooseEnemySkill(enemy);
    if (enemySkill) {
      nextLogs.push(`${enemy.name} 反击，使用了「${enemySkill.name}」。`);
      if (enemySkill.type === "shield") {
        if (enemySkill.power > 0) {
          const shieldMultiplier = 1 - nextEffects.shieldReduction;
          const enemyDamage = calculateEnemyDamage({
            attackerAttack: enemy.stats.attack + nextEffects.enemyAttackBonus,
            defenderDefense: petStats.defense + nextEffects.petDefenseBonus,
            skill: enemySkill,
            statusMultiplier: shieldMultiplier * (levelPressure ? 1.08 : 1)
          });
          const shielded = applyShield(nextPetStatuses, enemyDamage.totalDamage);
          nextPetStatuses = shielded.statuses;
          nextPetHp = clampHp(nextPetHp - shielded.damage, petStats.hp);
          nextEffects.shieldReduction = 0;
          await playManualAction({ actor: "enemy", actorUnitId: enemyUnitId, damage: shielded.damage, id: `enemy-${enemySkill.id}-${Date.now()}`, skill: enemySkill, targetUnitId: activeUnitId }, () => {
            setTeamHp((current) => ({ ...current, [activeUnitId]: nextPetHp }));
            setPetStatuses(nextPetStatuses);
            nextLogs.push(`${selectedPet.name} 受到 ${shielded.damage} 点伤害。`);
          });
        }
        nextEffects.enemyShieldReduction = Math.max(nextEffects.enemyShieldReduction, enemySkill.shieldReduction ?? 0.35);
        await playManualAction({ actor: "enemy", actorUnitId: enemyUnitId, id: `enemy-${enemySkill.id}-${Date.now()}`, isBuff: true, skill: enemySkill, targetUnitId: enemyUnitId }, () => {
          nextLogs.push(`${enemy.name} 进入防守姿态，下一次受到的伤害会降低。`);
        });
      } else {
        const shieldMultiplier = 1 - nextEffects.shieldReduction;
        const enemyDamage = calculateEnemyDamage({
          attackerAttack: enemy.stats.attack + nextEffects.enemyAttackBonus,
          defenderDefense: petStats.defense + nextEffects.petDefenseBonus,
          skill: enemySkill,
          statusMultiplier: shieldMultiplier * (levelPressure ? 1.08 : 1)
        });
        const shielded = applyShield(nextPetStatuses, enemyDamage.totalDamage);
        nextPetStatuses = shielded.statuses;
        nextPetHp = clampHp(nextPetHp - shielded.damage, petStats.hp);
        nextEffects.shieldReduction = 0;
        await playManualAction({ actor: "enemy", actorUnitId: enemyUnitId, damage: shielded.damage, id: `enemy-${enemySkill.id}-${Date.now()}`, skill: enemySkill, targetUnitId: activeUnitId }, () => {
          setTeamHp((current) => ({ ...current, [activeUnitId]: nextPetHp }));
          setPetStatuses(nextPetStatuses);
          nextLogs.push(`${selectedPet.name} 受到 ${shielded.damage} 点伤害。`);
        });
      }

      if (enemySkill.debuff?.nextDamageMultiplier) {
        nextEffects.nextDamageMultiplier = Math.min(nextEffects.nextDamageMultiplier, enemySkill.debuff.nextDamageMultiplier);
        nextLogs.push(`${selectedPet.name} 下一次攻击伤害降低。`);
        const status = statusForEnemySkill(enemySkill);
        if (status) {
          nextPetStatuses = addOrReplaceStatus(nextPetStatuses, status);
          setPetStatuses(nextPetStatuses);
        }
      }
      if (enemySkill.debuff?.defense) {
        nextEffects.petDefenseBonus += enemySkill.debuff.defense;
        nextLogs.push(`${selectedPet.name} 防御降低。`);
      }
      if (enemySkill.debuff?.attack) {
        nextEffects.petAttackBonus += enemySkill.debuff.attack;
        nextLogs.push(`${selectedPet.name} 攻击降低。`);
      }
      if (enemySkill.debuff?.speed) {
        nextLogs.push(`${selectedPet.name} 速度降低。`);
      }
      if (enemySkill.buff?.speed) {
        nextLogs.push(`${enemy.name} 速度提升。`);
      }
      if (enemySkill.selfDebuff?.defense) {
        nextEffects.enemyDefenseBonus += enemySkill.selfDebuff.defense;
        nextLogs.push(`${enemy.name} 使用强攻后防御下降。`);
      }
      if (enemySkill.selfDebuff?.speed) {
        nextLogs.push(`${enemy.name} 使用强攻后速度下降。`);
      }
      const enemyAppliedStatus = statusForEnemySkill(enemySkill);
      if (enemyAppliedStatus && !nextPetStatuses.some((status) => status.type === enemyAppliedStatus.type)) {
        nextPetStatuses = addOrReplaceStatus(nextPetStatuses, enemyAppliedStatus);
        setPetStatuses(nextPetStatuses);
      }
    } else {
      setIsManualAnimating(false);
    }

    setEffects(nextEffects);

    if (nextPetHp <= 0) {
      autoSwitchOrLose(nextLogs);
      return;
    }

    pushLogs(nextLogs);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="我的学习伙伴" subtitle="伙伴岛第一版：把学习经验转化为伙伴养成，用训练战斗陪你稳步闯关。" />
      {openPartnerChess && (
        <GameCard className="flex flex-col gap-3 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(226,247,244,0.62))] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Partner Chess v0.1</p>
            <h2 className="mt-1 text-xl font-black text-ink">伙伴战棋场已开放</h2>
            <p className="mt-1 text-sm font-semibold text-ink/58">先答题备战，再选择增益，让三只伙伴自动出战。</p>
          </div>
          <button className="min-h-12 rounded-2xl bg-tide px-5 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" onClick={openPartnerChess} type="button">
            进入伙伴战棋场
          </button>
        </GameCard>
      )}

      <TopStatusBar
        bestStage={saveState.bestStage}
        companionTrainingExp={saveState.companionTrainingExp}
        pet={selectedPet}
        petExp={activePetLevelInfo.exp}
        petExpNeed={petExpNeed}
        petLevel={activePetLevel}
      />

      <div className="sticky top-2 z-10 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/70 bg-[#F7F1E4]/86 p-2 shadow-[0_12px_28px_rgba(16,36,63,0.08)] backdrop-blur [scrollbar-width:none]">
        <TabButton active={activeTab === "training"} onClick={() => setActiveTab("training")}>
          <span className="inline-flex items-center gap-2"><Swords className="size-4" />训练场</span>
        </TabButton>
        <TabButton active={activeTab === "growth"} onClick={() => setActiveTab("growth")}>
          <span className="inline-flex items-center gap-2"><Sparkles className="size-4" />养成室</span>
        </TabButton>
        <TabButton active={activeTab === "bag"} onClick={() => setActiveTab("bag")}>
          <span className="inline-flex items-center gap-2"><PawPrint className="size-4" />宠物背包</span>
        </TabButton>
        <TabButton active={activeTab === "storage"} onClick={() => setActiveTab("storage")}>
          <span className="inline-flex items-center gap-2"><Shield className="size-4" />宠物仓库</span>
        </TabButton>
        <TabButton active={activeTab === "archive"} onClick={() => setActiveTab("archive")}>
          <span className="inline-flex items-center gap-2"><BookOpen className="size-4" />伙伴图鉴</span>
        </TabButton>
      </div>

      {activeTab === "training" && (
        <TrainingRoom
          action={manualAction}
          activeUnitId={activeUnitId}
          battleState={battleState}
          canCapture={captureRate > 0 && !isBossEnemy(enemy) && battleState === "playing" && !isManualAnimating}
          captureRate={captureRate}
          dailyProgress={dailyProgress}
          continueChallenge={continueChallenge}
          cooldowns={cooldowns}
          enemy={enemy}
          enemyHp={enemyHp}
          enemyStatuses={enemyStatuses}
          isAnimating={isManualAnimating}
          isBossCapture={isBossEnemy(enemy) && enemyHp > 0 && enemyHp / enemy.stats.hp <= 0.3}
          levelPressure={levelPressure}
          logs={logs}
          nextEnemy={nextEnemy}
          onActionComplete={handleManualActionComplete}
          onActionImpact={handleManualActionImpact}
          onCapture={attemptCapture}
          onSwitchPet={switchPet}
          pet={selectedPet}
          petHp={petHp}
          petLevel={activePetLevel}
          petSkills={petSkills}
          petStats={petStats}
          petStatuses={[...getLevelPressureStatus(selectedPet, activePetLevel, enemy), ...petStatuses]}
          resetBattle={() => resetBattle()}
          returnToPetSelect={returnToPetSelect}
          setActiveTab={setActiveTab}
          stage={saveState.battleStage}
          teamMembers={teamMembers}
          useSkill={useSkill}
        />
      )}

      {activeTab === "growth" && (
        <GrowthRoom
          companionTrainingExp={saveState.companionTrainingExp}
          notice={notice}
          pet={selectedPet}
          petExp={activePetLevelInfo.exp}
          petExpNeed={petExpNeed}
          petLevel={activePetLevel}
          petStats={petStats}
          trainStat={trainStat}
          training={saveState.training}
        />
      )}

      {activeTab === "bag" && (
        <PetBagPanel
          members={teamMembers}
          onSelectSlot={(slot) => {
            setSelectedTeamSlot(slot);
            setActiveTab("storage");
          }}
          selectedSlot={selectedTeamSlot}
        />
      )}

      {activeTab === "storage" && (
        <PetStoragePanel
          activeTeamIds={activeTrainingTeam}
          getLevelInfo={(petId) => getPetLevelInfo(normalizedPartnerSave, petId)}
          getSkills={getTrainingSkillsForPet}
          getSourceLabel={petSourceLabel}
          getStats={getTrainingBattleStats}
          onReplaceSlot={replaceTrainingTeamSlot}
          ownedPets={normalizedPartnerSave.ownedPets.map(getTrainingPetById)}
          petShards={normalizedPartnerSave.petShards}
          selectedSlot={selectedTeamSlot}
        />
      )}

      {activeTab === "archive" && <CompanionArchive ownedPetIds={normalizedPartnerSave.ownedPets} selectPet={selectPet} selectedPetId={selectedPet.id} />}

      <GameCard className="flex items-center gap-3 bg-white/64">
        <Trophy className="size-5 shrink-0 text-gold" />
        <p className="text-sm font-semibold leading-6 text-ink/62">提示：伙伴岛数据保存在当前浏览器 localStorage。伙伴训练经验来自闯关、答题和训练胜利，不会消耗原有学习 XP。</p>
      </GameCard>
    </div>
  );
}
