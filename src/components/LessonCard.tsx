import type { ChallengeLevel } from "@/types";

const difficultyClass = {
  入门: "bg-leaf/14 text-leaf",
  进阶: "bg-gold/24 text-ink",
  挑战: "bg-coral/14 text-coral"
};

type LessonCardProps = {
  level: ChallengeLevel;
  index: number;
  onStart: (levelId: string) => void;
};

export function LessonCard({ level, index, onStart }: LessonCardProps) {
  return (
    <button
      className={`group grid w-full grid-cols-[56px_1fr] items-center gap-3 text-left ${level.unlocked ? "" : "cursor-not-allowed opacity-60"}`}
      disabled={!level.unlocked}
      onClick={() => onStart(level.id)}
      type="button"
    >
      <div className={`grid size-14 place-items-center rounded-2xl border-2 text-lg font-black shadow-insetGame ${level.unlocked ? "border-tide bg-tide text-white" : "border-ink/20 bg-white text-ink/45"}`}>
        {level.unlocked ? index + 1 : "锁"}
      </div>
      <div className="rounded-2xl border border-white/70 bg-white/78 p-3 transition group-hover:-translate-y-0.5 group-hover:shadow-game">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-ink">{level.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-black ${difficultyClass[level.difficulty]}`}>{level.difficulty}</span>
        </div>
        <p className="mt-2 text-xs font-semibold text-ink/62">
          {level.questionCount} 道题 · {level.unlocked ? "已解锁" : "未解锁"}
        </p>
      </div>
    </button>
  );
}
