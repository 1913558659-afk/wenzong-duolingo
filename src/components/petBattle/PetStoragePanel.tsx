import { GameCard } from "@/components/GameCard";
import { PetDetailCard } from "@/components/petBattle/PetDetailCard";
import type { BattlePet, BattleStats } from "@/data/petBattleData";
import type { PetTrainingSkill } from "@/data/petTrainingSkills";

export function PetStoragePanel({
  activeTeamIds,
  getLevelInfo,
  getSkills,
  getSourceLabel,
  getStats,
  onReplaceSlot,
  ownedPets,
  petShards,
  selectedSlot
}: {
  activeTeamIds: string[];
  getLevelInfo: (petId: string) => { exp: number; level: number; requiredExp: number };
  getSkills: (pet: BattlePet) => PetTrainingSkill[];
  getSourceLabel: (petId: string) => string;
  getStats: (pet: BattlePet, level: number) => BattleStats;
  onReplaceSlot: (slotIndex: number, petId: string) => void;
  ownedPets: BattlePet[];
  petShards: Record<string, number>;
  selectedSlot: number;
}) {
  return (
    <section className="space-y-4">
      <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Pet Storage</p>
        <h2 className="mt-1 text-2xl font-black text-ink">宠物仓库</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">这里显示所有已拥有宠物。选择任意宠物，可替换背包中的上阵槽位。</p>
      </GameCard>

      <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
        {ownedPets.map((pet) => {
          const levelInfo = getLevelInfo(pet.id);
          const inTeam = activeTeamIds.includes(pet.id);
          return (
            <PetDetailCard
              actionArea={
                inTeam ? (
                  <div className="rounded-2xl bg-tide/10 px-3 py-2 text-center text-xs font-black text-tide ring-1 ring-tide/20">已在背包中</div>
                ) : (
                  <div className="grid gap-2">
                    <button
                      className="min-h-10 rounded-2xl bg-tide px-3 text-xs font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink"
                      onClick={() => onReplaceSlot(selectedSlot, pet.id)}
                      type="button"
                    >
                      替换当前槽位 {selectedSlot + 1}
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((slot) => (
                        <button
                          className="min-h-9 rounded-xl bg-white px-2 text-[11px] font-black text-ink shadow-[0_8px_18px_rgba(16,36,63,0.06)] transition hover:-translate-y-0.5 hover:text-tide"
                          key={slot}
                          onClick={() => onReplaceSlot(slot, pet.id)}
                          type="button"
                        >
                          第 {slot + 1} 位
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }
              exp={levelInfo.exp}
              getSourceLabel={getSourceLabel(pet.id)}
              inTeam={inTeam}
              key={pet.id}
              level={levelInfo.level}
              pet={pet}
              requiredExp={levelInfo.requiredExp}
              shardCount={petShards[`${pet.id}_shard`] ?? 0}
              skills={getSkills(pet)}
              stats={getStats(pet, levelInfo.level)}
            />
          );
        })}
      </div>
    </section>
  );
}
