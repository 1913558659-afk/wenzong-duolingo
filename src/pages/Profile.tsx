import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import type { AuthUser, PageId, StudyStats } from "@/types";

type ProfileProps = {
  navigate: (page: PageId) => void;
  stats: StudyStats;
  syncError: boolean;
  user: AuthUser | null;
};

function getTotalAnswered(stats: StudyStats) {
  return stats.totalAnswered ?? stats.answeredToday;
}

function getAccuracy(stats: StudyStats) {
  const total = getTotalAnswered(stats);
  if (total <= 0) {
    return 0;
  }

  return Math.round((stats.correctCount / total) * 100);
}

export function Profile({ navigate, stats, syncError, user }: ProfileProps) {
  if (!user) {
    return (
      <div>
        <PageHeader title="我的学习" subtitle="登录后可查看个人学习数据，并在多设备之间同步进度。" />
        <GameCard className="py-8 text-center">
          <p className="text-xl font-black text-ink">登录后可查看个人学习数据</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">游客模式仍然可以做题，登录后再开始同步到后端。</p>
          <button
            className="mt-5 min-h-12 rounded-2xl bg-coral px-5 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink"
            onClick={() => navigate("auth")}
            type="button"
          >
            去登录 / 注册
          </button>
        </GameCard>
      </div>
    );
  }

  const totalAnswered = getTotalAnswered(stats);
  const accuracy = getAccuracy(stats);
  const statCards = [
    { label: "XP", value: stats.xp, color: "text-coral" },
    { label: "连续学习", value: `${stats.streakDays} 天`, color: "text-gold" },
    { label: "今日答题", value: stats.answeredToday, color: "text-tide" },
    { label: "正确题数", value: stats.correctCount, color: "text-leaf" },
    { label: "总答题数", value: totalAnswered, color: "text-ink" },
    { label: "正确率", value: `${accuracy}%`, color: "text-coral" }
  ];

  return (
    <div>
      <PageHeader title="我的学习" subtitle="查看账号学习数据、答题表现和同步状态。" />

      <GameCard className="mb-4 bg-ink text-white">
        <p className="text-sm font-black text-gold">当前账号</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">{user.name || "SayHi 学习岛学习者"}</h2>
        <p className="mt-1 text-sm font-semibold text-white/68">{user.email}</p>
        {syncError && <p className="mt-3 rounded-2xl bg-coral/20 px-3 py-2 text-sm font-black text-white">暂时无法同步，已使用本地进度</p>}
      </GameCard>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((item) => (
          <GameCard className="text-center" key={item.label}>
            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
            <p className="mt-1 text-xs font-bold text-ink/58">{item.label}</p>
          </GameCard>
        ))}
      </section>

      <GameCard className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-ink/58">
          <span>答题正确率</span>
          <span>{accuracy}%</span>
        </div>
        <ProgressBar value={accuracy} />
      </GameCard>
    </div>
  );
}
