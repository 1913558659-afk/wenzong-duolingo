import { useMemo, useState } from "react";
import { HeartPulse, RotateCcw, Shield, Swords, Zap } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { enemies, pets } from "@/data/petBattleData";
import type { BattlePet, BattleSkill, BattleStats } from "@/data/petBattleData";
import {
  calculateEnemyDamage,
  calculateSkillDamage,
  chooseEnemySkill,
  clampHp,
  getEnemySkills,
  getPetSkills,
  getPetStatsAtLevel
} from "@/utils/petBattle";

type BattleEffects = {
  enemyAttackBonus: number;
  enemyDefenseBonus: number;
  petAttackBonus: number;
  petDefenseBonus: number;
  petSpeedBonus: number;
  nextAttackMultiplier: number;
  nextDamageMultiplier: number;
  shieldReduction: number;
};

const defaultEffects: BattleEffects = {
  enemyAttackBonus: 0,
  enemyDefenseBonus: 0,
  petAttackBonus: 0,
  petDefenseBonus: 0,
  petSpeedBonus: 0,
  nextAttackMultiplier: 1,
  nextDamageMultiplier: 1,
  shieldReduction: 0
};

const trainingEnemy = enemies.find((enemy) => enemy.id === "careless_beast") ?? enemies[0];

function attributeLabel(attribute: BattlePet["attribute"]) {
  const labels = {
    focus: "专注",
    action: "行动",
    growth: "积累"
  };
  return labels[attribute];
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
  if (max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-2 text-center">
      <p className="text-[11px] font-black text-ink/45">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
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

  return (
    <div className="rounded-[1.6rem] border border-white/75 bg-white/76 p-4 shadow-[0_16px_38px_rgba(16,36,63,0.08)]">
      <div className="flex items-center gap-4">
        <div className="grid size-24 shrink-0 place-items-center rounded-[1.4rem] bg-[#F7F1E4] p-2 shadow-[inset_0_-3px_0_rgba(16,36,63,0.06)] sm:size-32">
          <img alt={name} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" src={image} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-xl font-black text-ink">{name}</h3>
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">Lv.{level}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-black text-ink/58">
            <span>HP</span>
            <span>{hp} / {maxHp}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10">
            <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold text-ink/58">
            <span>攻 {stats.attack}</span>
            <span>防 {stats.defense}</span>
            <span>速 {stats.speed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PetCard({ active, onSelect, pet }: { active: boolean; onSelect: (pet: BattlePet) => void; pet: BattlePet }) {
  return (
    <button className="group h-full text-left" onClick={() => onSelect(pet)} type="button">
      <GameCard className={`h-full overflow-hidden transition group-hover:-translate-y-0.5 ${active ? "ring-2 ring-tide" : ""}`}>
        <div className="flex items-start gap-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-[1.35rem] bg-[linear-gradient(135deg,#EAF5F2,#F7F1E4)] p-2 shadow-[inset_0_-3px_0_rgba(16,36,63,0.06)]">
            <img alt={pet.name} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" src={pet.image} />
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
          {active ? "正在训练" : "选择伙伴"}
        </span>
      </GameCard>
    </button>
  );
}

export function PetBattle() {
  const [selectedPet, setSelectedPet] = useState<BattlePet>(pets[0]);
  const petLevel = 1;
  const petStats = useMemo(() => getPetStatsAtLevel(selectedPet, petLevel), [selectedPet]);
  const petSkills = useMemo(() => getPetSkills(selectedPet), [selectedPet]);
  const enemySkills = useMemo(() => getEnemySkills(trainingEnemy), []);
  const [petHp, setPetHp] = useState(petStats.hp);
  const [enemyHp, setEnemyHp] = useState(trainingEnemy.stats.hp);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [effects, setEffects] = useState<BattleEffects>(defaultEffects);
  const [logs, setLogs] = useState<string[]>(["欢迎来到伙伴岛。选择技能，帮助学习伙伴击败粗心兽。"]);
  const [battleState, setBattleState] = useState<"playing" | "won" | "lost">("playing");

  function pushLogs(nextLogs: string[]) {
    setLogs((current) => [...nextLogs, ...current].slice(0, 8));
  }

  function resetBattle(pet = selectedPet) {
    const nextStats = getPetStatsAtLevel(pet, petLevel);
    setSelectedPet(pet);
    setPetHp(nextStats.hp);
    setEnemyHp(trainingEnemy.stats.hp);
    setCooldowns({});
    setEffects(defaultEffects);
    setBattleState("playing");
    setLogs([`${pet.name} 准备好了，训练目标：击败${trainingEnemy.name}。`]);
  }

  function tickCooldowns(usedSkill: BattleSkill) {
    setCooldowns((current) => {
      const next = Object.fromEntries(Object.entries(current).map(([skillId, value]) => [skillId, Math.max(0, value - 1)]));
      next[usedSkill.id] = usedSkill.cooldown;
      return next;
    });
  }

  function useSkill(skill: BattleSkill) {
    if (battleState !== "playing" || (cooldowns[skill.id] ?? 0) > 0) {
      return;
    }

    const nextLogs: string[] = [];
    let nextPetHp = petHp;
    let nextEnemyHp = enemyHp;
    let nextEffects = { ...effects };

    nextLogs.push(`${selectedPet.name} 使用了「${skill.name}」。`);

    if (skill.type === "heal") {
      const heal = Math.max(1, Math.round(petStats.hp * (skill.healPercent ?? 0)));
      nextPetHp = clampHp(nextPetHp + heal, petStats.hp);
      nextLogs.push(`${selectedPet.name} 恢复了 ${heal} 点 HP。`);
    } else if (skill.type === "shield") {
      nextEffects.shieldReduction = Math.max(nextEffects.shieldReduction, skill.shieldReduction ?? 0);
      nextLogs.push(`${selectedPet.name} 获得护盾，下一次受到的伤害会降低。`);
    } else if (skill.type === "buff") {
      nextEffects.petAttackBonus += skill.buff?.attack ?? 0;
      nextEffects.petDefenseBonus += skill.buff?.defense ?? 0;
      nextEffects.petSpeedBonus += skill.buff?.speed ?? 0;
      nextEffects.nextAttackMultiplier = Math.max(nextEffects.nextAttackMultiplier, skill.buff?.nextAttackPowerMultiplier ?? 1);
      nextLogs.push(`${selectedPet.name} 状态提升：${skill.effectText}`);
    } else {
      const skillForDamage = {
        ...skill,
        power: Math.round(skill.power * nextEffects.nextAttackMultiplier)
      };
      const damage = calculateSkillDamage({
        attackerAttack: petStats.attack + nextEffects.petAttackBonus,
        defenderDefense: trainingEnemy.stats.defense + nextEffects.enemyDefenseBonus,
        enemyType: trainingEnemy.type,
        pet: selectedPet,
        skill: skillForDamage,
        statusMultiplier: nextEffects.nextDamageMultiplier
      });
      nextEnemyHp = clampHp(nextEnemyHp - damage.totalDamage, trainingEnemy.stats.hp);
      nextEffects.nextAttackMultiplier = 1;
      nextEffects.nextDamageMultiplier = 1;
      nextLogs.push(`造成 ${damage.totalDamage} 点伤害${damage.counterMultiplier > 1 ? "，克制生效！" : "。"}`);

      if (skill.debuff?.attack) {
        nextEffects.enemyAttackBonus += skill.debuff.attack;
        nextLogs.push(`${trainingEnemy.name} 攻击降低。`);
      }
      if (skill.lifestealPercent) {
        const heal = Math.max(1, Math.round(damage.totalDamage * skill.lifestealPercent));
        nextPetHp = clampHp(nextPetHp + heal, petStats.hp);
        nextLogs.push(`${selectedPet.name} 通过记忆根系恢复 ${heal} 点 HP。`);
      }
    }

    if (nextEnemyHp <= 0) {
      setEnemyHp(0);
      setPetHp(nextPetHp);
      setEffects(nextEffects);
      tickCooldowns(skill);
      setBattleState("won");
      pushLogs([`${trainingEnemy.name} 被击败了！获得宠物经验 +${trainingEnemy.rewardExp}。`, ...nextLogs]);
      return;
    }

    const enemySkill = chooseEnemySkill(trainingEnemy);
    if (enemySkill) {
      nextLogs.push(`${trainingEnemy.name} 反击，使用了「${enemySkill.name}」。`);
      const shieldMultiplier = 1 - nextEffects.shieldReduction;
      const enemyDamage = calculateEnemyDamage({
        attackerAttack: trainingEnemy.stats.attack + nextEffects.enemyAttackBonus,
        defenderDefense: petStats.defense + nextEffects.petDefenseBonus,
        skill: enemySkill,
        statusMultiplier: shieldMultiplier
      });
      nextPetHp = clampHp(nextPetHp - enemyDamage.totalDamage, petStats.hp);
      nextEffects.shieldReduction = 0;
      nextLogs.push(`${selectedPet.name} 受到 ${enemyDamage.totalDamage} 点伤害。`);

      if (enemySkill.debuff?.nextDamageMultiplier) {
        nextEffects.nextDamageMultiplier = Math.min(nextEffects.nextDamageMultiplier, enemySkill.debuff.nextDamageMultiplier);
        nextLogs.push(`${selectedPet.name} 下一次攻击伤害降低。`);
      }
      if (enemySkill.debuff?.defense) {
        nextEffects.petDefenseBonus += enemySkill.debuff.defense;
        nextLogs.push(`${selectedPet.name} 防御降低。`);
      }
      if (enemySkill.debuff?.attack) {
        nextEffects.petAttackBonus += enemySkill.debuff.attack;
        nextLogs.push(`${selectedPet.name} 攻击降低。`);
      }
      if (enemySkill.selfDebuff?.defense) {
        nextEffects.enemyDefenseBonus += enemySkill.selfDebuff.defense;
        nextLogs.push(`${trainingEnemy.name} 使用强攻后防御下降。`);
      }
    }

    setPetHp(nextPetHp);
    setEnemyHp(nextEnemyHp);
    setEffects(nextEffects);
    tickCooldowns(skill);

    if (nextPetHp <= 0) {
      setBattleState("lost");
      pushLogs([`${selectedPet.name} 暂时失败了，但仍获得宠物经验 +5。`, ...nextLogs]);
      return;
    }

    pushLogs(nextLogs);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="我的学习伙伴" subtitle="伙伴岛第一版：选择宠物，进行一场轻量训练对战。战斗数据暂时只保存在当前页面状态中。" />

      <section className="grid gap-4 lg:grid-cols-3">
        {pets.map((pet) => (
          <PetCard active={pet.id === selectedPet.id} key={pet.id} onSelect={resetBattle} pet={pet} />
        ))}
      </section>

      <GameCard className="overflow-hidden bg-[linear-gradient(135deg,#F7F1E4_0%,#EAF5F2_100%)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Training Battle</p>
            <h2 className="mt-1 text-2xl font-black text-ink">伙伴训练场</h2>
            <p className="mt-1 text-sm font-semibold text-ink/58">当前敌人：{trainingEnemy.name}。胜利奖励宠物经验 +{trainingEnemy.rewardExp}</p>
          </div>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-coral" onClick={() => resetBattle()} type="button">
            <RotateCcw className="size-4" />
            重新训练
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FighterPanel hp={petHp} image={selectedPet.image} level={petLevel} maxHp={petStats.hp} name={selectedPet.name} stats={petStats} tone="pet" />
          <FighterPanel hp={enemyHp} image={trainingEnemy.image} level={trainingEnemy.level} maxHp={trainingEnemy.stats.hp} name={trainingEnemy.name} stats={trainingEnemy.stats} tone="enemy" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.4rem] border border-white/75 bg-white/72 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Swords className="size-5 text-coral" />
              <h3 className="text-lg font-black text-ink">技能</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {petSkills.map((skill) => {
                const cooldown = cooldowns[skill.id] ?? 0;
                const disabled = battleState !== "playing" || cooldown > 0;
                const Icon = skill.type === "heal" ? HeartPulse : skill.type === "shield" ? Shield : skill.type === "buff" ? Zap : Swords;

                return (
                  <button
                    className={`min-h-[104px] rounded-2xl border p-3 text-left transition ${
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
                      <span className="flex items-center gap-2 text-sm font-black">
                        <Icon className="size-4" />
                        {skill.name}
                      </span>
                      <span className="rounded-full bg-ink/6 px-2 py-1 text-[11px] font-black">{cooldown > 0 ? `冷却 ${cooldown}` : `威力 ${skill.power}`}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-ink/52">{skillTypeLabel(skill.type)} · 冷却 {skill.cooldown} 回合</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-ink/62">{skill.effectText}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/75 bg-[#0B1F3A] p-4 text-white shadow-[0_16px_34px_rgba(16,36,63,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">战斗日志</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${battleState === "won" ? "bg-leaf/20 text-leaf" : battleState === "lost" ? "bg-coral/20 text-coral" : "bg-white/10 text-white/70"}`}>
                {battleState === "won" ? "胜利" : battleState === "lost" ? "暂败" : "进行中"}
              </span>
            </div>
            <div className="max-h-[310px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {logs.map((log, index) => (
                <p className="rounded-2xl bg-white/[0.07] px-3 py-2 text-sm font-semibold leading-6 text-white/76" key={`${log}-${index}`}>
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>
      </GameCard>
    </div>
  );
}

