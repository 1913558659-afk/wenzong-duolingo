import { GameCard } from "@/components/GameCard";

export type PartnerChessPhase = "select" | "prep" | "buff" | "battle" | "settlement";

const phaseLabels: Record<PartnerChessPhase, string> = {
  select: "副本选择",
  prep: "备战",
  buff: "增益选择",
  battle: "自动战斗",
  settlement: "结算"
};

export function ChessHeader({
  phase,
  round,
  stageName,
  will
}: {
  phase: PartnerChessPhase;
  round: number;
  stageName: string;
  will: number;
}) {
  return (
    <GameCard className="bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(226,247,244,0.72),rgba(255,246,224,0.62))]">
      <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Partner Chess v0.1</p>
          <h1 className="mt-1 text-3xl font-black text-ink">伙伴战棋场</h1>
          <p className="mt-2 text-sm font-semibold text-ink/60">{stageName || "选择一个副本开始二阶段玩法"}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/72 p-3 text-center ring-1 ring-white/80">
            <p className="text-xs font-black text-ink/45">当前回合</p>
            <p className="mt-1 text-xl font-black text-ink">{round}/5</p>
          </div>
          <div className="rounded-2xl bg-white/72 p-3 text-center ring-1 ring-white/80">
            <p className="text-xs font-black text-ink/45">学习意志</p>
            <p className="mt-1 text-xl font-black text-tide">{will}</p>
          </div>
          <div className="rounded-2xl bg-white/72 p-3 text-center ring-1 ring-white/80">
            <p className="text-xs font-black text-ink/45">当前阶段</p>
            <p className="mt-1 text-sm font-black text-coral">{phaseLabels[phase]}</p>
          </div>
        </div>
      </div>
    </GameCard>
  );
}
