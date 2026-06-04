import { GameCard } from "@/components/GameCard";
import { ProgressBar } from "@/components/ProgressBar";
import { challengeLevels } from "@/data/questions";
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

  return (
    <div className="space-y-5">
      <section className="rounded-[1.6rem] bg-ink p-5 text-white shadow-game">
        <p className="text-sm font-black text-gold">文综岛</p>
        <h1 className="mt-2 text-4xl font-black leading-tight tracking-normal">学习仪表盘</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/76">
          今天先完成一个小任务，再把错题清掉一点点。稳住节奏，比猛冲更重要。
        </p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-black">
            <span>今日学习能量</span>
            <span>{Math.min(100, Math.round((stats.xp % 180) / 1.8))}%</span>
          </div>
          <ProgressBar value={Math.min(100, Math.round((stats.xp % 180) / 1.8))} />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
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
      </div>

      <GameCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-tide">今日任务</p>
            <h2 className="mt-1 text-xl font-black text-ink">{todayTask.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{todayTask.task}</p>
            <p className="mt-2 text-xs font-black text-ink/42">当前正确率 {accuracy}% · 连续学习 {stats.streakDays} 天</p>
          </div>
          <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame" onClick={() => navigate("schedule")} type="button">
            去安排
          </button>
        </div>
      </GameCard>

      <section className="grid gap-3 sm:grid-cols-2">
        {entryCards.map((entry) => (
          <button className="group text-left" key={entry.title} onClick={() => navigate(entry.page)} type="button">
            <GameCard className="h-full">
              <div className={`mb-4 h-2 w-16 rounded-full ${entry.accent}`} />
              <h2 className="text-xl font-black text-ink">{entry.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{entry.desc}</p>
              <p className="mt-4 text-sm font-black text-tide group-hover:text-coral">进入</p>
            </GameCard>
          </button>
        ))}
      </section>
    </div>
  );
}
