import type { PartnerChessEffectTheme, PartnerChessImpactType } from "@/data/partnerChessAnimationData";
import type { PartnerChessStage } from "@/data/partnerChessStages";

const themeGlow: Record<PartnerChessStage["theme"], string> = {
  careless: "bg-[radial-gradient(circle,rgba(243,178,74,0.24),rgba(34,184,165,0.12)_48%,transparent_72%)]",
  forget: "bg-[radial-gradient(circle,rgba(124,106,230,0.22),rgba(20,150,163,0.12)_48%,transparent_72%)]",
  anxiety: "bg-[radial-gradient(circle,rgba(233,91,79,0.24),rgba(243,178,74,0.12)_48%,transparent_72%)]"
};

const themeMist: Record<PartnerChessStage["theme"], string> = {
  careless: "bg-[radial-gradient(circle_at_20%_34%,rgba(34,184,165,0.16),transparent_24%),radial-gradient(circle_at_78%_28%,rgba(243,178,74,0.18),transparent_22%)]",
  forget: "bg-[radial-gradient(circle_at_22%_34%,rgba(124,106,230,0.17),transparent_24%),radial-gradient(circle_at_76%_30%,rgba(20,150,163,0.13),transparent_24%)]",
  anxiety: "bg-[radial-gradient(circle_at_22%_34%,rgba(233,91,79,0.15),transparent_24%),radial-gradient(circle_at_76%_30%,rgba(243,178,74,0.16),transparent_24%)]"
};

const themeGround: Record<PartnerChessStage["theme"], string> = {
  careless: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.62)_0%,rgba(218,239,196,0.54)_42%,rgba(34,184,165,0.16)_72%,transparent_100%)]",
  forget: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.58)_0%,rgba(216,210,255,0.48)_44%,rgba(20,150,163,0.14)_74%,transparent_100%)]",
  anxiety: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.56)_0%,rgba(255,216,194,0.48)_44%,rgba(233,91,79,0.14)_74%,transparent_100%)]"
};

const skillBurst: Record<PartnerChessEffectTheme, string> = {
  cloud: "bg-[radial-gradient(circle,rgba(255,255,255,0.86)_0%,rgba(142,205,255,0.36)_34%,transparent_68%)]",
  fire: "bg-[radial-gradient(circle,rgba(255,232,120,0.72)_0%,rgba(233,91,79,0.34)_34%,transparent_70%)]",
  growth: "bg-[radial-gradient(circle,rgba(206,255,169,0.72)_0%,rgba(34,184,165,0.28)_38%,transparent_70%)]",
  careless: "bg-[radial-gradient(circle,rgba(255,231,150,0.72)_0%,rgba(243,178,74,0.32)_36%,transparent_70%)]",
  forget: "bg-[radial-gradient(circle,rgba(216,205,255,0.72)_0%,rgba(124,106,230,0.34)_36%,transparent_70%)]",
  anxiety: "bg-[radial-gradient(circle,rgba(255,210,194,0.72)_0%,rgba(233,91,79,0.34)_36%,transparent_70%)]"
};

const skillTextClass: Record<PartnerChessEffectTheme, string> = {
  cloud: "border-sky-100/80 bg-sky-50/82 text-[#17466f]",
  fire: "border-orange-100/80 bg-orange-50/84 text-[#8a2f18]",
  growth: "border-emerald-100/80 bg-emerald-50/82 text-[#18583f]",
  careless: "border-yellow-100/80 bg-yellow-50/84 text-[#715018]",
  forget: "border-violet-100/80 bg-violet-50/84 text-[#3d3274]",
  anxiety: "border-red-100/80 bg-red-50/84 text-[#7b2b2b]"
};

const impactClass: Record<PartnerChessImpactType, string> = {
  "cloud-impact": "partner-chess-impact-cloud",
  "fire-impact": "partner-chess-impact-fire",
  "leaf-impact": "partner-chess-impact-leaf",
  "careless-impact": "partner-chess-impact-careless",
  "forget-impact": "partner-chess-impact-forget",
  "anxiety-impact": "partner-chess-impact-anxiety"
};

export function BattleEffectLayer({
  activeEffectTheme,
  activeSkillName,
  impactKey,
  impactPoint,
  impactSide,
  impactType,
  isHeavyImpact,
  theme
}: {
  activeEffectTheme?: PartnerChessEffectTheme;
  activeSkillName?: string;
  impactKey?: string;
  impactPoint?: { x: number; y: number };
  impactSide?: "ally" | "enemy";
  impactType?: PartnerChessImpactType;
  isHeavyImpact?: boolean;
  theme: PartnerChessStage["theme"];
}) {
  const effectTheme = activeEffectTheme ?? (theme === "careless" ? "careless" : theme === "forget" ? "forget" : "anxiety");

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 opacity-90 ${themeMist[theme]}`} />
      <div className={`absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full ${themeGlow[theme]} blur-2xl`} />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.22)_30%,rgba(16,36,63,0.07)_100%)]" />
      <div className={`absolute left-1/2 bottom-16 h-[30%] w-[92%] -translate-x-1/2 rounded-[50%] ${themeGround[theme]} blur-[1px]`} />
      <div className="absolute left-[7%] right-[7%] bottom-[6.4rem] h-px bg-white/50" />
      <div className="absolute left-[12%] top-[18%] size-2 rounded-full bg-white/60 shadow-[30px_22px_0_rgba(255,255,255,0.32),72px_-8px_0_rgba(255,255,255,0.26),124px_34px_0_rgba(255,255,255,0.22)]" />
      <div className="absolute right-[18%] top-[16%] size-1.5 rounded-full bg-white/60 shadow-[-42px_20px_0_rgba(255,255,255,0.28),24px_34px_0_rgba(255,255,255,0.24),-82px_46px_0_rgba(255,255,255,0.2)]" />
      <div className="absolute left-[19%] bottom-[34%] h-10 w-20 -rotate-6 rounded-[45%] border border-white/28 bg-white/12" />
      <div className="absolute right-[24%] bottom-[38%] h-8 w-16 rotate-12 rounded-[45%] border border-white/22 bg-white/10" />
      {impactKey && impactType && impactSide && (
        <div
          className={`absolute z-20 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full partner-chess-impact ${impactClass[impactType]} ${isHeavyImpact ? "partner-chess-impact-heavy" : ""}`}
          key={impactKey}
          style={impactPoint ? { left: `${impactPoint.x}px`, top: `${impactPoint.y}px` } : {
            left: impactSide === "enemy" ? "76%" : "25%",
            top: impactSide === "enemy" ? "56%" : "58%"
          }}
        >
          <span />
          <i />
          <b />
        </div>
      )}
      {activeSkillName && (
        <>
          <div className={`absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl partner-chess-skill-burst ${skillBurst[effectTheme]}`} />
          <div className={`absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-black shadow-[0_16px_34px_rgba(16,36,63,0.14)] backdrop-blur partner-chess-skill-text ${skillTextClass[effectTheme]}`}>
            {activeSkillName}
          </div>
        </>
      )}
    </div>
  );
}
