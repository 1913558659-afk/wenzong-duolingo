import { BarChart3, BookOpen, ClipboardCheck, FileText, Map, PawPrint, Play, ScrollText } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { PageId, StudyStats } from "@/types";

type StudentDashboardProps = {
  navigate: (page: PageId) => void;
  stats: StudyStats;
  wrongCount: number;
};

export function StudentDashboard({ navigate, stats, wrongCount }: StudentDashboardProps) {
  const totalAnswered = stats.totalAnswered ?? stats.answeredToday;
  const cards = [
    { icon: BookOpen, title: "我的课程", value: "0 门", description: "暂未加入课程，后续可通过教师邀请码加入。", action: "查看课程" },
    { icon: ClipboardCheck, title: "今日学习任务", value: `${stats.answeredToday} 题`, description: "教师布置任务功能正在准备中。", action: "开始练习", page: "quiz" as PageId },
    { icon: Map, title: "我的闯关进度", value: `${totalAnswered} 题`, description: `连续学习 ${stats.streakDays} 天，继续推进学科关卡。`, action: "继续闯关", page: "map" as PageId },
    { icon: ScrollText, title: "我的错题本", value: `${wrongCount} 题`, description: "回顾近期错题，巩固薄弱知识点。", action: "查看错题", page: "wrongBook" as PageId },
    { icon: BarChart3, title: "我的成绩", value: "暂无", description: "教师录入成绩后将在这里显示。", action: "成绩记录" },
    { icon: FileText, title: "我的学习报告", value: "待生成", description: "后续将根据学习、成绩和错题生成分析报告。", action: "报告预览" }
  ];

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <PageHeader title="学生学习中心" subtitle="集中查看课程、任务、闯关进度与个人学习数据。" />

      <GameCard className="bg-[linear-gradient(135deg,#DFF6F1_0%,#FFF8EC_58%,#E8F4F5_100%)]">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Student Workspace</p>
            <h2 className="mt-2 text-2xl font-black text-ink">今天从哪一项开始？</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">当前工作台复用已有本地学习数据；课程和教师任务将在后续接入。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-tide px-5 text-sm font-black text-white" onClick={() => navigate("map")} type="button">
              <Play className="size-4" />继续学习
            </button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/82 px-5 text-sm font-black text-ink ring-1 ring-white/80" onClick={() => navigate("petBattle")} type="button">
              <PawPrint className="size-4" />伙伴岛
            </button>
          </div>
        </div>
      </GameCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <GameCard className="bg-white/72" key={card.title}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-tide/10 text-tide"><Icon className="size-5" /></span>
                <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-black text-ink/54">{card.value}</span>
              </div>
              <h3 className="mt-4 text-lg font-black text-ink">{card.title}</h3>
              <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-ink/56">{card.description}</p>
              <button className="mt-4 min-h-10 rounded-2xl bg-ink/5 px-4 text-sm font-black text-ink transition hover:bg-tide hover:text-white" disabled={!card.page} onClick={() => card.page && navigate(card.page)} type="button">
                {card.action}
              </button>
            </GameCard>
          );
        })}
      </div>
    </div>
  );
}
