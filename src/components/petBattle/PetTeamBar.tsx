import type { BattlePet, BattleStats } from "@/data/petBattleData";

export type PetBattleTeamMember = {
  hp: number;
  level: number;
  maxHp: number;
  pet: BattlePet;
  stats: BattleStats;
};

function hpPercent(current: number, max: number) {
  return max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

export function PetTeamBar({
  activePetId,
  members,
  onSwitch,
  switchingDisabled
}: {
  activePetId: string;
  members: PetBattleTeamMember[];
  onSwitch: (petId: string) => void;
  switchingDisabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {members.map((member) => {
        const active = member.pet.id === activePetId;
        const fainted = member.hp <= 0;
        return (
          <button
            className={`min-w-0 rounded-3xl border p-3 text-left transition ${
              active
                ? "border-tide/40 bg-tide/10 shadow-[0_12px_24px_rgba(21,156,168,0.10)]"
                : fainted
                  ? "cursor-not-allowed border-ink/8 bg-ink/5 opacity-60"
                  : "border-white/70 bg-white/68 hover:-translate-y-0.5 hover:border-tide/25"
            }`}
            disabled={active || fainted || switchingDisabled}
            key={member.pet.id}
            onClick={() => onSwitch(member.pet.id)}
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/72 p-1.5 ring-1 ring-white/80">
                <img alt={member.pet.name} className="max-h-full max-w-full object-contain [image-rendering:pixelated]" src={member.pet.image} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-black text-ink">{member.pet.name}</p>
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-black text-white">Lv.{member.level}</span>
                </div>
                <p className="mt-1 text-[11px] font-black text-ink/48">{fainted ? "已退场" : active ? "当前出战" : "可切换"}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/12">
                  <div className="h-full rounded-full bg-gradient-to-r from-tide to-leaf" style={{ width: `${hpPercent(member.hp, member.maxHp)}%` }} />
                </div>
                <p className="mt-1 text-[10px] font-black text-ink/52">{member.hp}/{member.maxHp}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
