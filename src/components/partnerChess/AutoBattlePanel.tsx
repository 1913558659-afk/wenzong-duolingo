import { GameCard } from "@/components/GameCard";
import type { PartnerChessBuff } from "@/data/partnerChessBuffs";

export function AutoBattlePanel({
  activeBuffs,
  isBattlePlaying,
  onRunBattle
}: {
  activeBuffs: PartnerChessBuff[];
  isBattlePlaying?: boolean;
  onRunBattle: () => void;
}) {
  return (
    <GameCard className="bg-white/68">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">自动战斗</h2>
          <p className="mt-1 text-sm font-semibold text-ink/56">战斗阶段不再答题，伙伴会根据站位、速度、克制和增益自动行动。</p>
        </div>
        <button
          className="min-h-12 rounded-2xl bg-coral px-5 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/40 disabled:shadow-none disabled:hover:translate-y-0"
          disabled={isBattlePlaying}
          onClick={onRunBattle}
          type="button"
        >
          {isBattlePlaying ? "战斗播放中..." : "开始自动战斗"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {activeBuffs.length === 0 ? (
          <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-black text-ink/45">暂无增益</span>
        ) : (
          activeBuffs.map((buff) => (
            <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-black text-tide ring-1 ring-tide/20" key={buff.id}>
              {buff.name}
            </span>
          ))
        )}
      </div>
    </GameCard>
  );
}
