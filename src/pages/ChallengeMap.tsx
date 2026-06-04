import { LessonCard } from "@/components/LessonCard";
import { PageHeader } from "@/components/PageHeader";
import { challengeLevels, islands } from "@/data/questions";
import { subjectLabels } from "@/lib/labels";

export function ChallengeMap({ startPractice }: { startPractice: (levelId: string) => void }) {
  return (
    <div>
      <PageHeader title="文综闯关页" subtitle="历史岛、政治岛、地理岛各有 3 个关卡，先从已解锁关卡开始。" />
      <div className="space-y-5">
        {islands.map((island) => {
          const levels = challengeLevels.filter((level) => level.island === island);

          return (
            <section className="map-path rounded-[1.6rem] border border-white/70 bg-white/45 p-4" key={island}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-tide">学习岛屿</p>
                  <h2 className="text-2xl font-black text-ink">{subjectLabels[island]}岛</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/60">3 个关卡</span>
              </div>
              <div className="space-y-4">
                {levels.map((level, index) => (
                  <div className={index % 2 === 0 ? "pr-8" : "pl-8"} key={level.id}>
                    <LessonCard index={index} level={level} onStart={startPractice} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
