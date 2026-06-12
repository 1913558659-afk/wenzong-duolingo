import type { EnemyType, PetAttribute } from "@/data/petBattleData";

export type ManualImpactTheme = "cloud" | "fire" | "growth" | EnemyType;

const backgroundClass: Record<EnemyType, string> = {
  careless: "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.62),transparent_26%),radial-gradient(circle_at_78%_24%,rgba(243,178,74,0.28),transparent_28%),linear-gradient(135deg,#F9F2D8_0%,#DFF5E4_58%,#FFF8EC_100%)]",
  forget: "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.58),transparent_26%),radial-gradient(circle_at_78%_24%,rgba(124,106,230,0.24),transparent_30%),linear-gradient(135deg,#F5F0FF_0%,#DDEFF7_58%,#FFF8EC_100%)]",
  anxiety: "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.56),transparent_26%),radial-gradient(circle_at_76%_24%,rgba(233,91,79,0.24),transparent_30%),linear-gradient(135deg,#FFF0E8_0%,#F1E8DE_58%,#FFF8EC_100%)]",
  focus: "bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.62),transparent_26%),radial-gradient(circle_at_76%_24%,rgba(21,156,168,0.22),transparent_30%),linear-gradient(135deg,#EEF9F7_0%,#EAF2FF_58%,#FFF8EC_100%)]"
};

const groundClass: Record<EnemyType, string> = {
  careless: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.66)_0%,rgba(218,239,196,0.54)_46%,rgba(34,184,165,0.18)_76%,transparent_100%)]",
  forget: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.62)_0%,rgba(216,210,255,0.48)_46%,rgba(20,150,163,0.16)_76%,transparent_100%)]",
  anxiety: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.62)_0%,rgba(255,216,194,0.48)_46%,rgba(233,91,79,0.16)_76%,transparent_100%)]",
  focus: "bg-[radial-gradient(ellipse,rgba(255,255,255,0.66)_0%,rgba(205,242,238,0.50)_46%,rgba(21,156,168,0.18)_76%,transparent_100%)]"
};

const impactClass: Record<ManualImpactTheme, string> = {
  anxiety: "manual-battle-impact-anxiety",
  careless: "manual-battle-impact-careless",
  cloud: "manual-battle-impact-cloud",
  focus: "manual-battle-impact-cloud",
  fire: "manual-battle-impact-fire",
  forget: "manual-battle-impact-forget",
  growth: "manual-battle-impact-growth"
};

const skillClass: Record<ManualImpactTheme, string> = {
  anxiety: "manual-battle-skill-burst-anxiety",
  careless: "manual-battle-skill-burst-careless",
  cloud: "manual-battle-skill-burst-cloud",
  focus: "manual-battle-skill-burst-cloud",
  fire: "manual-battle-skill-burst-fire",
  forget: "manual-battle-skill-burst-forget",
  growth: "manual-battle-skill-burst-growth"
};

export function themeFromPetAttribute(attribute: PetAttribute): ManualImpactTheme {
  return attribute === "focus" ? "cloud" : attribute === "action" ? "fire" : "growth";
}

export function ManualBattleEffectLayer({
  enemyType,
  impactKey,
  impactPoint,
  impactTheme,
  isHeavyImpact,
  skillName,
  skillTheme
}: {
  enemyType: EnemyType;
  impactKey?: string;
  impactPoint?: { x: number; y: number };
  impactTheme?: ManualImpactTheme;
  isHeavyImpact?: boolean;
  skillName?: string;
  skillTheme?: ManualImpactTheme;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${backgroundClass[enemyType]}`}>
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_14%_28%,rgba(255,255,255,0.42),transparent_22%),radial-gradient(circle_at_84%_34%,rgba(255,255,255,0.32),transparent_20%)]" />
      <div className={`absolute left-1/2 bottom-8 h-[30%] w-[92%] -translate-x-1/2 rounded-[50%] ${groundClass[enemyType]} blur-[1px]`} />
      <div className="absolute left-[8%] right-[8%] bottom-[5.6rem] h-px bg-white/50" />
      <div className="absolute left-[12%] top-[18%] size-2 rounded-full bg-white/60 shadow-[34px_22px_0_rgba(255,255,255,0.28),86px_-8px_0_rgba(255,255,255,0.24),154px_38px_0_rgba(255,255,255,0.18)]" />
      <div className="absolute right-[16%] top-[15%] size-1.5 rounded-full bg-white/60 shadow-[-48px_24px_0_rgba(255,255,255,0.26),22px_40px_0_rgba(255,255,255,0.22),-94px_54px_0_rgba(255,255,255,0.18)]" />
      {impactKey && impactPoint && impactTheme && (
        <div
          className={`absolute z-20 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full manual-battle-impact ${impactClass[impactTheme]} ${isHeavyImpact ? "manual-battle-impact-heavy" : ""}`}
          key={impactKey}
          style={{ left: `${impactPoint.x}px`, top: `${impactPoint.y}px` }}
        >
          <span />
          <i />
          <b />
        </div>
      )}
      {skillName && skillTheme && (
        <>
          <div className={`absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl manual-battle-skill-burst ${skillClass[skillTheme]}`} />
          <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-white/72 bg-white/76 px-4 py-2 text-xs font-black text-ink shadow-[0_16px_34px_rgba(16,36,63,0.14)] backdrop-blur manual-battle-skill-text">
            {skillName}
          </div>
        </>
      )}
    </div>
  );
}
