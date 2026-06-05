import { GameCard } from "@/components/GameCard";
import { ProgressBar } from "@/components/ProgressBar";
import { aiPrompts } from "@/data/aiPrompts";
import { challengeLevels } from "@/data/questions";
import { studyAids } from "@/data/studyAids";
import { defaultScheduleItems } from "@/data/timetable";
import type { PageId, ScheduleItem, StudyStats } from "@/types";

type HomeProps = {
  navigate: (page: PageId) => void;
  stats: StudyStats;
  wrongCount: number;
  scheduleItems?: ScheduleItem[];
};

const entryCards: { title: string; desc: string; page: PageId; accent: string }[] = [
  { title: "文综闯关", desc: "历史、政治、地理分岛推进", page: "map", accent: "bg-tide" },
  { title: "错题本", desc: "复盘刚刚答错的选择题", page: "wrongBook", accent: "bg-coral" },
  { title: "教辅雷达", desc: "查找适合自己的高中教辅", page: "studyAids", accent: "bg-gold" },
  { title: "课程表", desc: "安排一周学习任务", page: "schedule", accent: "bg-leaf" },
  { title: "AI 学习", desc: "复制提示词，快速问清楚", page: "prompts", accent: "bg-tide" },
  { title: "教材解读", desc: "抓核心问题和易错点", page: "textbook", accent: "bg-leaf" }
];

export function Home({ navigate, stats, wrongCount, scheduleItems = defaultScheduleItems }: HomeProps) {
  const accuracy = stats.answeredToday === 0 ? 0 : Math.round((stats.correctCount / stats.answeredToday) * 100);
  const completedLevels = challengeLevels.filter((level) => level.unlocked).length;
  const todayTask = scheduleItems.find((item) => !item.done) ?? scheduleItems[0];
  const recommendedLevel = challengeLevels.find((level) => level.unlocked) ?? challengeLevels[0];
  const recommendedAid = studyAids[0];
  const recommendedPrompt = aiPrompts[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[1.6rem] bg-ink p-5 text-white shadow-game sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-gold">文综岛</p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-normal sm:text-4xl">欢迎回来，今天也上岛学习</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/76">
              建议先完成一个小关卡，再复盘错题本。每天一点点，文综会变得越来越可控。
            </p>
          </div>
          <div className="w-full rounded-2xl bg-white/10 px-4 py-3 text-left sm:w-auto sm:text-right">
            <p className="text-xs font-black text-white/58">连续</p>
            <p className="text-xl font-black text-gold">{stats.streakDays} 天</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-black">
            <span>今日学习能量</span>
            <span>{Math.min(100, Math.round((stats.xp % 180) / 1.8))}%</span>
          </div>
          <ProgressBar value={Math.min(100, Math.round((stats.xp % 180) / 1.8))} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GameCard className="p-3 text-center">
          <p className="text-2xl font-black text-coral">{stats.xp}</p>
          <p className="text-xs font-bold text-ink/62">经验值</p>
        </GameCard>
        <GameCard className="p-3 text-center">
          <p className="text-2xl font-black text-tide">{completedLevels}</p>
          <p className="text-xs font-bold text-ink/62">已开关卡</p>
        </GameCard>
        <GameCard className="p-3 text-center">
          <p className="text-2xl font-black text-leaf">{wrongCount}</p>
          <p className="text-xs font-bold text-ink/62">错题数量</p>
        </GameCard>
        <GameCard className="p-3 text-center">
          <p className="text-2xl font-black text-gold">{scheduleItems.filter((item) => !item.done).length}</p>
          <p className="text-xs font-bold text-ink/62">课程任务</p>
        </GameCard>
      </div>

      <GameCard className="border-coral/20 bg-white/88">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-coral/12 px-3 py-1 text-xs font-black text-coral">今日任务</p>
            <h2 className="mt-1 text-xl font-black text-ink">{todayTask.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{todayTask.task}</p>
            <p className="mt-2 text-xs font-black text-ink/42">当前正确率 {accuracy}% · 连续学习 {stats.streakDays} 天</p>
          </div>
          <button className="min-h-12 w-full rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink sm:w-auto" onClick={() => navigate("schedule")} type="button">
            去安排
          </button>
        </div>
      </GameCard>

      <section className="grid gap-3 lg:grid-cols-3">
          <button className="group min-w-0 text-left" onClick={() => navigate("map")} type="button">
          <GameCard className="h-full border-tide/20 transition group-hover:-translate-y-0.5">
            <p className="text-xs font-black text-tide">推荐练习</p>
            <h2 className="mt-2 text-lg font-black text-ink">{recommendedLevel.name}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">先从已解锁关卡热身，做完再看解析和错题。</p>
            <p className="mt-3 text-sm font-black text-coral">去闯关</p>
          </GameCard>
        </button>
          <button className="group min-w-0 text-left" onClick={() => navigate("studyAids")} type="button">
          <GameCard className="h-full border-gold/30 transition group-hover:-translate-y-0.5">
            <p className="text-xs font-black text-gold">推荐教辅</p>
            <h2 className="mt-2 text-lg font-black text-ink">{recommendedAid.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{recommendedAid.fitFor}</p>
            <p className="mt-3 text-sm font-black text-coral">查看教辅雷达</p>
          </GameCard>
        </button>
          <button className="group min-w-0 text-left" onClick={() => navigate("prompts")} type="button">
          <GameCard className="h-full border-leaf/20 transition group-hover:-translate-y-0.5">
            <p className="text-xs font-black text-leaf">推荐 AI 提示词</p>
            <h2 className="mt-2 text-lg font-black text-ink">{recommendedPrompt.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{recommendedPrompt.useCase}</p>
            <p className="mt-3 text-sm font-black text-coral">去复制</p>
          </GameCard>
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {entryCards.map((entry) => (
          <button className="group min-w-0 text-left" key={entry.title} onClick={() => navigate(entry.page)} type="button">
            <GameCard className="flex h-full items-center gap-4 transition group-hover:-translate-y-0.5">
              <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${entry.accent} text-base font-black text-white shadow-insetGame`}>
                {entry.title.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-ink">{entry.title}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink/64">{entry.desc}</p>
                <p className="mt-2 text-sm font-black text-tide group-hover:text-coral">进入学习</p>
              </div>
            </GameCard>
          </button>
        ))}
      </section>
    </div>
  );
}
