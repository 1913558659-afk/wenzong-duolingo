import { GameCard } from "@/components/GameCard";
import type { ChessUnit } from "@/utils/partnerChessEngine";

function hpPercent(unit: ChessUnit) {
  return Math.max(0, Math.min(100, Math.round((unit.hp / Math.max(1, unit.maxHp)) * 100)));
}

const positionLabels: Record<ChessUnit["position"], string> = {
  front: "前排",
  middle: "中排",
  back: "后排"
};

export function UnitCard({ unit }: { unit: ChessUnit }) {
  const isAlly = unit.side === "ally";
  return (
    <div className={`rounded-3xl border p-3 ${isAlly ? "border-tide/20 bg-white/74" : "border-coral/20 bg-[#FFF6E8]/72"}`}>
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white/80 p-2 shadow-[0_10px_22px_rgba(16,36,63,0.08)]">
          <img alt={unit.name} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" src={unit.image} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-black text-ink">{unit.name}</h3>
            <span className="rounded-full bg-ink/6 px-2 py-1 text-[11px] font-black text-ink/54">{positionLabels[unit.position]}</span>
          </div>
          <p className="mt-1 text-xs font-bold text-ink/54">{unit.typeLabel} · {unit.role}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs font-black text-ink/52">
        <span>HP</span>
        <span>{unit.hp}/{unit.maxHp}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${isAlly ? "from-tide to-leaf" : "from-coral to-gold"}`} style={{ width: `${hpPercent(unit)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] font-black text-ink/50">
        <span>攻 {unit.attack}</span>
        <span>防 {unit.defense}</span>
        <span>速 {unit.speed}</span>
        <span>盾 {unit.shield}</span>
      </div>
    </div>
  );
}

export function FormationPanel({ allies, enemies }: { allies: ChessUnit[]; enemies: ChessUnit[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GameCard className="bg-white/66">
        <h2 className="text-xl font-black text-ink">我方阵容</h2>
        <p className="mt-1 text-sm font-semibold text-ink/56">前排草芽龙，中排星火狐，后排云团兽。</p>
        <div className="mt-4 grid gap-3">
          {allies.map((unit) => <UnitCard key={unit.id} unit={unit} />)}
        </div>
      </GameCard>
      <GameCard className="bg-white/66">
        <h2 className="text-xl font-black text-ink">敌方区域</h2>
        <p className="mt-1 text-sm font-semibold text-ink/56">敌方会随副本和回合变化。</p>
        <div className="mt-4 grid gap-3">
          {enemies.map((unit) => <UnitCard key={unit.id} unit={unit} />)}
        </div>
      </GameCard>
    </div>
  );
}
