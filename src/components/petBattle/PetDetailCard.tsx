import { GameCard } from "@/components/GameCard";
import type { BattlePet, BattleStats } from "@/data/petBattleData";
import type { PetTrainingSkill } from "@/data/petTrainingSkills";
import { petSpriteFacingClass } from "@/utils/petSpriteFacing";
import type { ReactNode } from "react";

function attributeLabel(attribute: BattlePet["attribute"]) {
  return {
    action: "行动型",
    focus: "专注型",
    growth: "积累型"
  }[attribute];
}

function expPercent(exp: number, requiredExp: number) {
  if (requiredExp <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((exp / requiredExp) * 100)));
}

export function PetDetailCard({
  actionArea,
  exp,
  getSourceLabel,
  inTeam,
  level,
  pet,
  requiredExp,
  shardCount,
  skills,
  stats
}: {
  actionArea?: ReactNode;
  exp: number;
  getSourceLabel: string;
  inTeam?: boolean;
  level: number;
  pet: BattlePet;
  requiredExp: number;
  shardCount?: number;
  skills: PetTrainingSkill[];
  stats: BattleStats;
}) {
  return (
    <GameCard className="h-full bg-white/68">
      <div className="flex items-start gap-4">
        <div className="grid size-24 shrink-0 place-items-center rounded-[1.4rem] bg-[linear-gradient(135deg,#FFFDF7,#EAF5F2)] p-2 ring-1 ring-white/80">
          <img alt={pet.name} className={`max-h-full max-w-full object-contain [image-rendering:pixelated] ${petSpriteFacingClass(pet.id, "right")}`} src={pet.image} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-ink">{pet.name}</h3>
            {inTeam && <span className="rounded-full bg-tide/10 px-2.5 py-1 text-[11px] font-black text-tide ring-1 ring-tide/20">已上阵</span>}
          </div>
          <p className="mt-1 text-xs font-black text-tide">{attributeLabel(pet.attribute)} · Lv.{level}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-ink/58">{pet.role}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[11px] font-black text-ink/48">
          <span>经验</span>
          <span>{requiredExp > 0 ? `${exp}/${requiredExp}` : "已满级"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-gradient-to-r from-tide to-leaf" style={{ width: `${expPercent(exp, requiredExp)}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-2xl bg-ink/5 px-2 py-2">
          <p className="text-[10px] font-black text-ink/42">HP</p>
          <p className="text-sm font-black text-ink">{stats.hp}</p>
        </div>
        <div className="rounded-2xl bg-ink/5 px-2 py-2">
          <p className="text-[10px] font-black text-ink/42">攻</p>
          <p className="text-sm font-black text-ink">{stats.attack}</p>
        </div>
        <div className="rounded-2xl bg-ink/5 px-2 py-2">
          <p className="text-[10px] font-black text-ink/42">防</p>
          <p className="text-sm font-black text-ink">{stats.defense}</p>
        </div>
        <div className="rounded-2xl bg-ink/5 px-2 py-2">
          <p className="text-[10px] font-black text-ink/42">速</p>
          <p className="text-sm font-black text-ink">{stats.speed}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-black text-ink/45">技能</p>
        {skills.map((skill) => {
          const locked = level < skill.unlockLevel;
          return (
            <div className={`rounded-2xl px-3 py-2 text-xs font-bold ${locked ? "bg-ink/5 text-ink/36" : "bg-tide/8 text-ink/66"}`} key={skill.id}>
              {skill.name} · {locked ? `Lv.${skill.unlockLevel} 解锁` : `威力 ${skill.power}`}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-black text-ink/46">
        <span>{getSourceLabel}</span>
        {typeof shardCount === "number" && <span>碎片 {shardCount}</span>}
      </div>
      {actionArea && <div className="mt-4">{actionArea}</div>}
    </GameCard>
  );
}
