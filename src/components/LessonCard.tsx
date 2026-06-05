import type { ChallengeLevel } from "@/types";
import { subjectLabels } from "@/lib/labels";

const difficultyClass = {
  入门: "bg-leaf/14 text-leaf",
  进阶: "bg-gold/24 text-ink",
  挑战: "bg-coral/14 text-coral"
};

const nodeClass = {
  unlocked: "border-tide bg-tide text-white",
  locked: "border-ink/15 bg-white text-ink/40"
};

type LessonCardProps = {
  level: ChallengeLevel;
  index: number;
  onStart: (levelId: string) => void;
};

export function LessonCard({ level, index, onStart }: LessonCardProps) {
  return (
    <button
      className={`group grid min-h-[104px] w-full min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-3 text-left sm:grid-cols-[64px_minmax(0,1fr)] ${level.unlocked ? "" : "cursor-not-allowed opacity-70"}`}
      disabled={!level.unlocked}
      onClick={() => onStart(level.id)}
      type="button"
    >
      <div
        className={`relative z-10 grid size-14 place-items-center rounded-full border-2 text-lg font-black shadow-insetGame sm:size-16 ${
          level.unlocked ? nodeClass.unlocked : nodeClass.locked
        }`}
      >
        {level.unlocked ? index + 1 : "锁"}
      </div>
      <div
        className={`min-h-[92px] rounded-2xl border p-3 transition sm:p-4 ${
          level.unlocked ? "border-white/80 bg-white/86 group-hover:-translate-y-0.5 group-hover:shadow-game" : "border-ink/10 bg-white/56"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-black leading-snug text-ink">{level.name}</h3>
            <p className="mt-2 text-xs font-semibold text-ink/62">{subjectLabels[level.island]} · {level.questionCount} 道选择题</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-black ${difficultyClass[level.difficulty]}`}>{level.difficulty}</span>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${level.unlocked ? "bg-tide/10 text-tide" : "bg-ink/8 text-ink/45"}`}>
            {level.unlocked ? "已解锁" : "未解锁"}
          </span>
          <span className={`text-xs font-black ${level.unlocked ? "text-coral" : "text-ink/38"}`}>{level.unlocked ? "开始练习" : "先完成前面关卡"}</span>
        </div>
      </div>
    </button>
  );
}
