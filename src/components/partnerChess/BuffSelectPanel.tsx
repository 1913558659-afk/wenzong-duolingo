import { GameCard } from "@/components/GameCard";
import type { PartnerChessBuff } from "@/data/partnerChessBuffs";

export function BuffSelectPanel({
  choices,
  inspiration,
  onSelect,
  perfect
}: {
  choices: PartnerChessBuff[];
  inspiration: number;
  onSelect: (buff: PartnerChessBuff) => void;
  perfect: boolean;
}) {
  return (
    <GameCard className="bg-white/68">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">选择增益卡</h2>
          <p className="mt-1 text-sm font-semibold text-ink/56">本轮灵感点：{inspiration} {perfect ? "· 完美备战已触发" : ""}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {choices.map((buff) => (
          <button
            className="group min-h-36 rounded-3xl border border-white bg-[linear-gradient(135deg,#FFFFFF,#EAF5F2)] p-4 text-left shadow-[0_12px_26px_rgba(16,36,63,0.07)] transition hover:-translate-y-0.5 hover:border-tide/30"
            key={buff.id}
            onClick={() => onSelect(buff)}
            type="button"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-tide">{buff.rarity}</p>
            <h3 className="mt-2 text-xl font-black text-ink">{buff.name}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/62">{buff.description}</p>
            <span className="mt-4 inline-flex rounded-full bg-ink px-3 py-1 text-xs font-black text-white transition group-hover:bg-tide">选择这张</span>
          </button>
        ))}
      </div>
    </GameCard>
  );
}
