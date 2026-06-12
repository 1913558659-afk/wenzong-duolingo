import type { PetGrowthResult, PartnerChessSave } from "@/utils/partnerChessSave";
import { getPetLevelInfo } from "@/utils/partnerChessSave";

export function PetGrowthSummary({
  growth,
  save
}: {
  growth: PetGrowthResult[];
  save: PartnerChessSave;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {growth.map((item) => {
        const levelInfo = getPetLevelInfo(save, item.petId);
        return (
          <div className="rounded-2xl border border-white/70 bg-white/68 p-3 shadow-[0_10px_22px_rgba(16,36,63,0.06)]" key={item.petId}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-ink">{item.petName}</p>
                <p className="mt-1 text-xs font-bold text-ink/50">
                  {item.leveledUp ? `Lv.${item.beforeLevel} -> Lv.${item.afterLevel}` : `Lv.${item.afterLevel} + EXP`}
                </p>
              </div>
              {item.leveledUp && <span className="rounded-full bg-tide/10 px-2 py-1 text-[10px] font-black text-tide">升级</span>}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-tide to-leaf"
                style={{ width: `${levelInfo.requiredExp > 0 ? Math.min(100, (levelInfo.exp / levelInfo.requiredExp) * 100) : 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-bold text-ink/48">
              EXP {levelInfo.exp}{levelInfo.requiredExp > 0 ? ` / ${levelInfo.requiredExp}` : " / MAX"}
            </p>
            {item.leveledUp && <p className="mt-2 text-[11px] font-black text-coral">成长：HP +3 · ATK +1 · DEF +1</p>}
          </div>
        );
      })}
    </div>
  );
}
