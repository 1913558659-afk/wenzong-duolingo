import { statusLabel, statusMeta, type BattleStatusEffect } from "@/data/petTrainingStatuses";

export function StatusEffectBadges({ statuses }: { statuses: BattleStatusEffect[] }) {
  if (statuses.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
      {statuses.map((status) => (
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-black ring-1 ${statusMeta[status.type].tone}`}
          key={status.id}
          title={statusMeta[status.type].text}
        >
          {statusLabel(status)}
        </span>
      ))}
    </div>
  );
}
