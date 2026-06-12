import { GameCard } from "@/components/GameCard";
import { PetGrowthSummary } from "@/components/partnerChess/PetGrowthSummary";
import { shardLabel } from "@/data/partnerChessRewards";
import type { PartnerChessStage } from "@/data/partnerChessStages";
import type { AppliedBattleReward, PartnerChessSave } from "@/utils/partnerChessSave";

export function BattleResultPanel({
  appliedReward,
  correctCount,
  goPetBattle,
  isFinalVictory,
  isRoundWin,
  onNextRound,
  onRestart,
  onSelectStage,
  roundTitle,
  save,
  stage,
  totalQuestions
}: {
  appliedReward?: AppliedBattleReward | null;
  correctCount: number;
  goPetBattle: () => void;
  isFinalVictory: boolean;
  isRoundWin: boolean;
  onNextRound: () => void;
  onRestart: () => void;
  onSelectStage: () => void;
  roundTitle: string;
  save: PartnerChessSave;
  stage?: PartnerChessStage | null;
  totalQuestions: number;
}) {
  const reward = appliedReward?.reward;

  return (
    <GameCard className="bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(226,247,244,0.68),rgba(255,246,224,0.62))]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Battle Result</p>
          <h2 className="mt-1 text-2xl font-black text-ink">{isRoundWin ? "本回合胜利" : "本回合失利"}</h2>
          <p className="mt-2 text-sm font-semibold text-ink/58">
            {stage?.name ?? "当前副本"} · {roundTitle} · 备战答题 {correctCount}/{totalQuestions}
          </p>
        </div>
        {reward && (
          <div className="rounded-3xl bg-white/72 px-5 py-3 text-center ring-1 ring-white/80">
            <p className="text-xs font-black text-ink/45">战斗评级</p>
            <p className="text-4xl font-black text-coral">{reward.rating}</p>
          </div>
        )}
      </div>

      {reward && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/80">
              <p className="text-xs font-black text-ink/45">学习币</p>
              <p className="mt-1 text-2xl font-black text-ink">+{reward.coins}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/80">
              <p className="text-xs font-black text-ink/45">伙伴经验</p>
              <p className="mt-1 text-2xl font-black text-tide">+{reward.petExp}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-white/80">
              <p className="text-xs font-black text-ink/45">类型碎片</p>
              <p className="mt-1 text-2xl font-black text-coral">
                {reward.shardType ? `${shardLabel(reward.shardType)} +${reward.shards}` : "未获得"}
              </p>
            </div>
          </div>

          {appliedReward && (
            <div className="mt-5">
              <h3 className="text-sm font-black text-ink">伙伴成长</h3>
              <div className="mt-3">
                <PetGrowthSummary growth={appliedReward.growth} save={save} />
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {isRoundWin && !isFinalVictory && (
          <button className="min-h-11 rounded-2xl bg-tide px-4 text-sm font-black text-white hover:bg-ink" onClick={onNextRound} type="button">
            继续下一回合
          </button>
        )}
        <button className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:text-tide" onClick={onSelectStage} type="button">
          返回副本选择
        </button>
        <button className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:text-coral" onClick={onRestart} type="button">
          重新挑战
        </button>
        <button className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:text-coral" onClick={goPetBattle} type="button">
          查看伙伴岛
        </button>
      </div>
    </GameCard>
  );
}
