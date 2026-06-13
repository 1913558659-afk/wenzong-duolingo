import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Sparkles, X } from "lucide-react";
import { getPetSpeciesMasterData, type PetSpeciesElement } from "@/data/petSpeciesMasterData";
import { petSpriteFacingClass } from "@/utils/petSpriteFacing";

type EvolutionAnimationOverlayProps = {
  currentImage: string;
  currentName: string;
  level: number;
  nextImage: string;
  nextName: string;
  nextStage: number;
  onCancel: () => void;
  onFinish: () => void;
  petId?: string;
  statSummary?: string;
  unlockedSkillNames?: string[];
};

const phaseText = [
  "正在积蓄成长能量……",
  "进化之光正在聚集……",
  "新的轮廓正在显现……",
  "新的伙伴形态登场！",
  "进化成功！"
];

type EvolutionTheme = {
  accent: string;
  aura: string;
  card: string;
  glow: string;
  name: string;
  particle: string;
  ring: string;
  soft: string;
};

const evolutionThemes: Record<PetSpeciesElement | "default", EvolutionTheme> = {
  action: {
    accent: "#f59e0b",
    aura: "rgba(255, 185, 82, 0.24)",
    card: "rgba(255, 248, 232, 0.94)",
    glow: "rgba(255, 185, 82, 0.72)",
    name: "星风跃迁",
    particle: "#fde68a",
    ring: "#60a5fa",
    soft: "#fff7df"
  },
  anxiety: {
    accent: "#f97373",
    aura: "rgba(249, 115, 115, 0.18)",
    card: "rgba(255, 242, 239, 0.94)",
    glow: "rgba(244, 114, 182, 0.56)",
    name: "平息重压",
    particle: "#fecaca",
    ring: "#a78bfa",
    soft: "#fff1f2"
  },
  careless: {
    accent: "#f59e0b",
    aura: "rgba(250, 204, 21, 0.22)",
    card: "rgba(255, 248, 232, 0.94)",
    glow: "rgba(251, 191, 36, 0.68)",
    name: "错题新章",
    particle: "#fde68a",
    ring: "#fb923c",
    soft: "#fff7ed"
  },
  focus: {
    accent: "#159ca8",
    aura: "rgba(142, 232, 255, 0.22)",
    card: "rgba(239, 253, 255, 0.94)",
    glow: "rgba(142, 232, 255, 0.72)",
    name: "专注星辉",
    particle: "#bae6fd",
    ring: "#8ee8ff",
    soft: "#effdff"
  },
  forget: {
    accent: "#8b5cf6",
    aura: "rgba(167, 139, 250, 0.2)",
    card: "rgba(246, 242, 255, 0.94)",
    glow: "rgba(167, 139, 250, 0.64)",
    name: "记忆回光",
    particle: "#ddd6fe",
    ring: "#a78bfa",
    soft: "#f4f0ff"
  },
  growth: {
    accent: "#22a06b",
    aura: "rgba(134, 239, 172, 0.22)",
    card: "rgba(240, 253, 244, 0.94)",
    glow: "rgba(134, 239, 172, 0.68)",
    name: "森息生长",
    particle: "#bbf7d0",
    ring: "#4ade80",
    soft: "#f0fdf4"
  },
  default: {
    accent: "#159ca8",
    aura: "rgba(142, 232, 255, 0.22)",
    card: "rgba(255, 255, 255, 0.94)",
    glow: "rgba(142, 232, 255, 0.72)",
    name: "成长之光",
    particle: "#bae6fd",
    ring: "#8ee8ff",
    soft: "#f7f3e7"
  }
};

export function EvolutionAnimationOverlay({
  currentImage,
  currentName,
  level,
  nextImage,
  nextName,
  nextStage,
  onCancel,
  onFinish,
  petId,
  statSummary,
  unlockedSkillNames = []
}: EvolutionAnimationOverlayProps) {
  const [phase, setPhase] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase(1), 800),
      window.setTimeout(() => setPhase(2), 1800),
      window.setTimeout(() => setPhase(3), 2600),
      window.setTimeout(() => setPhase(4), 3600),
      window.setTimeout(() => setComplete(true), 3600)
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const species = petId ? getPetSpeciesMasterData(petId) : null;
  const theme = evolutionThemes[species?.element ?? "default"];
  const showNext = phase >= 3;
  const stageLabel = nextStage === 2 ? "二阶段" : "三阶段";
  const stageCopy = phaseText[complete ? 4 : phase];

  function skip() {
    setPhase(4);
    setComplete(true);
  }

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center overflow-hidden px-3 py-4 sm:px-4 sm:py-6"
      style={{
        "--evolution-accent": theme.accent,
        "--evolution-aura": theme.aura,
        "--evolution-card": theme.card,
        "--evolution-glow": theme.glow,
        "--evolution-particle": theme.particle,
        "--evolution-ring": theme.ring,
        "--evolution-soft": theme.soft
      } as CSSProperties}
    >
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[5px]" />
      <div className="evolution-orb evolution-orb-a" />
      <div className="evolution-orb evolution-orb-b" />
      <div className={`evolution-flash ${phase === 2 ? "evolution-flash-active" : ""}`} />
      <button className="absolute right-4 top-4 z-30 grid size-11 place-items-center rounded-full border border-white/70 bg-white/90 text-[#10233f] shadow-[0_12px_28px_rgba(16,35,63,0.14)] transition hover:bg-white" onClick={onCancel} type="button">
        <X className="size-5" />
      </button>

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(226,247,244,0.9),rgba(255,246,224,0.9))] p-4 text-center text-[#10233f] shadow-[0_30px_90px_rgba(16,35,63,0.22)] sm:p-6">
        <div className="evolution-stage-haze" />
        <div className="absolute left-1/2 top-28 h-44 w-44 -translate-x-1/2 rounded-full border evolution-ring sm:h-52 sm:w-52" />
        <div className="absolute left-1/2 top-28 h-60 w-60 -translate-x-1/2 rounded-full border evolution-ring evolution-ring-slow sm:h-72 sm:w-72" />
        <div className="absolute left-1/2 top-28 h-72 w-72 -translate-x-1/2 rounded-full border evolution-ring evolution-ring-wide sm:h-80 sm:w-80" />
        <p className="relative z-10 text-xs font-black uppercase tracking-[0.22em]" style={{ color: theme.accent }}>Evolution</p>
        <h2 className="evolution-title relative z-10 mt-2 text-2xl font-black text-[#10233f] sm:text-3xl">{complete ? `恭喜！${currentName} 进化为 ${nextName}！` : `【${currentName}】${stageCopy}`}</h2>
        <p className="relative z-10 mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-[#31506f]">{complete ? `${theme.name}完成，新的学习伙伴已经准备好了。` : stageCopy}</p>

        <div className="relative mx-auto mt-5 grid h-64 place-items-center sm:h-72">
          <div className="evolution-magic-circle" />
          <div className={`evolution-wave ${phase >= 3 ? "evolution-wave-active" : ""}`} />
          <img
            alt={currentName}
            className={`absolute z-10 h-52 object-contain [image-rendering:pixelated] sm:h-60 ${petSpriteFacingClass(petId ?? "", "right")} ${showNext ? "evolution-old-out" : phase === 2 ? "evolution-silhouette" : "evolution-charge"}`}
            src={currentImage}
          />
          <img
            alt=""
            aria-hidden="true"
            className={`absolute z-20 h-56 object-contain opacity-0 [image-rendering:pixelated] sm:h-64 ${petSpriteFacingClass(petId ?? "", "right")} ${phase === 2 ? "evolution-morph-glow" : ""}`}
            src={currentImage}
          />
          <img
            alt={nextName}
            className={`absolute z-20 h-56 object-contain [image-rendering:pixelated] sm:h-64 ${petSpriteFacingClass(petId ?? "", "right")} ${showNext ? "evolution-new-in" : "opacity-0"}`}
            src={nextImage}
          />
          {Array.from({ length: 24 }).map((_, index) => (
            <span className="evolution-particle" key={index} style={{ "--particle-index": index } as CSSProperties} />
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
            <span className="evolution-spark" key={`spark-${index}`} style={{ "--spark-index": index } as CSSProperties} />
          ))}
        </div>

        {complete ? (
          <div className="evolution-result-card relative z-10 mx-auto mt-3 max-w-lg rounded-[1.5rem] border border-white/90 p-4 text-[#10233f] shadow-[0_18px_42px_rgba(16,35,63,0.14)] sm:p-5">
            <Sparkles className="mx-auto size-8" style={{ color: theme.accent }} />
            <p className="mt-2 text-2xl font-black text-[#10233f]">{nextName}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#10233f]">Lv.{level}</span>
              <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ background: theme.accent }}>{stageLabel}</span>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#31506f]">{theme.name}</span>
            </div>
            <p className="mt-3 rounded-2xl px-4 py-3 text-sm font-black leading-6 text-[#10233f]" style={{ background: theme.soft }}>{statSummary ?? "进化后基础属性获得阶段加成，等级、经验和技能配置全部保留。"}</p>
            {unlockedSkillNames.length > 0 && (
              <div className="mt-3 rounded-2xl border border-white/80 bg-white/76 px-4 py-3 text-left">
                <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: theme.accent }}>Skill Unlock</p>
                <p className="mt-1 text-sm font-black text-[#10233f]">解锁技能：{unlockedSkillNames.join("、")}</p>
              </div>
            )}
            <button className="mt-4 min-h-12 rounded-2xl bg-[#10233f] px-6 py-3 text-sm font-black text-white shadow-[0_12px_26px_rgba(16,35,63,0.18)] transition hover:-translate-y-0.5" onClick={onFinish} style={{ boxShadow: `0 14px 30px ${theme.aura}` }} type="button">继续</button>
          </div>
        ) : (
          <button className="relative z-10 mt-4 min-h-11 rounded-2xl border border-[#159ca8]/20 bg-white/[0.88] px-5 py-3 text-sm font-black text-[#10233f] shadow-[0_10px_24px_rgba(16,35,63,0.1)] transition hover:-translate-y-0.5 hover:bg-white" onClick={skip} type="button">跳过动画</button>
        )}
      </div>
    </div>
  );
}
