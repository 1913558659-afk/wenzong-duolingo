import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";

export function About({ resetStats }: { resetStats: () => void }) {
  return (
    <div>
      <PageHeader title="关于本站页" subtitle="这是 SayHi 学习岛第一阶段：纯前端、本地数据、可点击、可答题。" />
      <GameCard className="space-y-3">
        <p className="text-sm font-semibold leading-6 text-ink/72">
          SayHi 学习岛目前不接数据库、不需要登录，也没有后端。题库、教材解读、AI 提示词和课程表都在本地 data 文件中，学习经验值和答题记录暂时保存在浏览器 localStorage。
        </p>
        <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame" onClick={resetStats} type="button">
          重置本地学习记录
        </button>
      </GameCard>
    </div>
  );
}
