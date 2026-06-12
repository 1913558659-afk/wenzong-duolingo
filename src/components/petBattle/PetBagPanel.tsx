import { GameCard } from "@/components/GameCard";
import type { PetBattleTeamMember } from "@/components/petBattle/PetTeamBar";

function hpPercent(current: number, max: number) {
  return max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

export function PetBagPanel({
  members,
  selectedSlot,
  onSelectSlot
}: {
  members: PetBattleTeamMember[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
}) {
  return (
    <section className="space-y-4">
      <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Battle Bag</p>
        <h2 className="mt-1 text-2xl font-black text-ink">宠物背包</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">背包中的 3 只宠物会进入训练场。第 1 位是默认首发，点击槽位后可去仓库替换。</p>
      </GameCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {members.map((member, index) => {
          const selected = selectedSlot === index;
          return (
            <button
              className={`rounded-[1.8rem] border p-4 text-left transition ${
                selected
                  ? "border-tide/40 bg-tide/10 shadow-[0_14px_30px_rgba(21,156,168,0.14)]"
                  : "border-white/70 bg-white/68 hover:-translate-y-0.5 hover:border-tide/25"
              }`}
              key={`${member.pet.id}-${index}`}
              onClick={() => onSelectSlot(index)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">槽位 {index + 1}{index === 0 ? " · 首发" : ""}</span>
                {selected && <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-black text-tide ring-1 ring-tide/20">待替换</span>}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="grid size-24 shrink-0 place-items-center rounded-[1.4rem] bg-white/72 p-2 ring-1 ring-white/80">
                  <img alt={member.pet.name} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" src={member.pet.image} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-ink">{member.pet.name}</h3>
                  <p className="mt-1 text-sm font-bold text-ink/54">Lv.{member.level}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-tide to-leaf" style={{ width: `${hpPercent(member.hp, member.maxHp)}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-black text-ink/48">{member.hp}/{member.maxHp}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
