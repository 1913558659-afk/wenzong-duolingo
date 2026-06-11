import type { PartnerChessStage } from "@/data/partnerChessStages";

const themeGlow: Record<PartnerChessStage["theme"], string> = {
  careless: "bg-[radial-gradient(circle,rgba(243,178,74,0.24),rgba(34,184,165,0.12)_48%,transparent_72%)]",
  forget: "bg-[radial-gradient(circle,rgba(124,106,230,0.22),rgba(20,150,163,0.12)_48%,transparent_72%)]",
  anxiety: "bg-[radial-gradient(circle,rgba(233,91,79,0.24),rgba(243,178,74,0.12)_48%,transparent_72%)]"
};

export function BattleEffectLayer({
  activeSkillName,
  theme
}: {
  activeSkillName?: string;
  theme: PartnerChessStage["theme"];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full ${themeGlow[theme]} blur-2xl`} />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.26)_28%,rgba(16,36,63,0.08)_100%)]" />
      <div className="absolute left-1/2 bottom-10 h-24 w-[86%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(16,36,63,0.13)_0%,rgba(16,36,63,0.08)_42%,transparent_72%)] blur-sm" />
      <div className="absolute left-[8%] right-[8%] bottom-20 h-px bg-white/45" />
      <div className="absolute left-[12%] top-[18%] size-2 rounded-full bg-white/60 shadow-[30px_22px_0_rgba(255,255,255,0.32),72px_-8px_0_rgba(255,255,255,0.26)]" />
      <div className="absolute right-[18%] top-[16%] size-1.5 rounded-full bg-white/60 shadow-[-42px_20px_0_rgba(255,255,255,0.28),24px_34px_0_rgba(255,255,255,0.24)]" />
      {activeSkillName && (
        <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-white/70 bg-white/78 px-4 py-2 text-xs font-black text-ink shadow-[0_16px_34px_rgba(16,36,63,0.14)] backdrop-blur partner-chess-skill-text">
          {activeSkillName}
        </div>
      )}
    </div>
  );
}
