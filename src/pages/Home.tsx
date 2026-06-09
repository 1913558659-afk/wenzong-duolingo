import { ArrowRight, Bell, BookOpen, Brain, CalendarDays, ClipboardList, Globe2, Landmark, LibraryBig, Map, ScrollText, ShieldCheck } from "lucide-react";
import { aiPrompts } from "@/data/aiPrompts";
import { defaultScheduleItems } from "@/data/timetable";
import type { PageId, QuizQuestion, ScheduleItem, StudyStats, Subject } from "@/types";

type HomeProps = {
  isLoggedIn?: boolean;
  navigate: (page: PageId) => void;
  questionSourceStatus?: "loading" | "cloud" | "local";
  questions?: QuizQuestion[];
  stats: StudyStats;
  syncError?: boolean;
  wrongCount: number;
  scheduleItems?: ScheduleItem[];
};

type SubjectMeta = {
  subject: Subject;
  title: string;
  desc: string;
  icon: typeof Landmark;
  color: string;
  bg: string;
};

const subjectMeta: SubjectMeta[] = [
  { subject: "history", title: "历史", desc: "穿越历史长河，探索文明的源流", icon: Landmark, color: "#1496A3", bg: "bg-[#DFF6F1]" },
  { subject: "politics", title: "政治", desc: "理解社会运行，掌握政治智慧", icon: ShieldCheck, color: "#E95B4F", bg: "bg-[#FBE5DF]" },
  { subject: "geography", title: "地理", desc: "认识地理环境，辨析区域特征", icon: Globe2, color: "#F3B24A", bg: "bg-[#E8F4F5]" }
];

function percent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function subjectQuestions(questions: QuizQuestion[], subject: Subject) {
  return questions.filter((question) => question.subject === subject);
}

function todayText() {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
}

function ProgressLine({ color = "#1496A3", value }: { color?: string; value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#10243F]/10">
      <div className="h-full rounded-full" style={{ backgroundColor: color, width: `${value}%` }} />
    </div>
  );
}

export function Home({
  isLoggedIn = false,
  navigate,
  questionSourceStatus = "local",
  questions = [],
  stats,
  syncError = false,
  wrongCount,
  scheduleItems = defaultScheduleItems
}: HomeProps) {
  const totalAnswered = stats.totalAnswered ?? stats.answeredToday;
  const totalQuestions = questions.length;
  const learningProgress = totalQuestions === 0 ? 0 : percent((totalAnswered / totalQuestions) * 100);
  const accuracy = totalAnswered === 0 ? 0 : percent((stats.correctCount / totalAnswered) * 100);
  const completedLevels = new Set(questions.map((question) => `${question.subject}:${question.chapter}`)).size;
  const studyHours = Math.max(0, Math.round((stats.xp / 75) * 10) / 10);
  const todayTask = scheduleItems.find((item) => !item.done) ?? scheduleItems[0];
  const recentQuestions = questions.slice(0, 3);
  const recommendedChapters = Array.from(new Set(questions.map((question) => question.chapter))).slice(0, 3);
  const prompt = aiPrompts[0];
  const sourceText = questionSourceStatus === "cloud" ? "云端题库已同步" : questionSourceStatus === "loading" ? "正在同步题库" : "当前使用本地题库";
  const syncText = isLoggedIn ? (syncError ? "学习进度暂未同步" : "账号进度已连接") : "登录后可同步进度";

  return (
    <div className="min-h-screen rounded-[1.6rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#F7F1E4_48%,#EAF5F2_100%)] px-4 pb-8 pt-4 text-[#10243F] md:px-6 md:pt-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex items-center justify-between md:hidden">
          <div>
            <p className="text-2xl font-black">文综岛</p>
            <p className="mt-1 text-xs font-bold text-[#667085]">SayHiStudy · 今日学习</p>
          </div>
          <button className="grid size-11 place-items-center rounded-2xl bg-white text-[#10243F] shadow-[0_10px_28px_rgba(16,36,63,0.08)]" type="button">
            <Bell className="size-5" />
          </button>
        </header>

        <section className="hidden items-center justify-between md:flex">
          <div>
            <h1 className="text-3xl font-black tracking-normal">你好，宋明龙 👋</h1>
            <p className="mt-2 text-sm font-semibold text-[#667085]">今天也要加油学习呀！</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/72 px-4 py-3 text-sm font-bold text-[#667085] shadow-[0_8px_24px_rgba(16,36,63,0.06)]">
              {todayText()}
            </div>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#10243F] shadow-[0_8px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-[#1496A3]" onClick={() => navigate("profile")} type="button">
              <CalendarDays className="size-4" />
              今日学习报告
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.78fr]">
          <div className="overflow-hidden rounded-[1.6rem] bg-[#10243F] p-5 text-white shadow-[0_20px_48px_rgba(16,36,63,0.18)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/68">今日学习进度</p>
                <p className="mt-3 text-6xl font-black leading-none md:text-7xl">{learningProgress}%</p>
                <p className="mt-3 text-sm font-semibold text-white/68">已完成 {totalAnswered} / {totalQuestions} 题 · {sourceText}</p>
              </div>
              <div className="hidden rounded-[1.4rem] bg-white/8 p-4 md:block">
                <Map className="size-8 text-[#1496A3]" />
              </div>
            </div>
            <div className="mt-6">
              <ProgressLine value={learningProgress} />
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {[
                { label: "连续学习", value: `${stats.streakDays}`, sub: "天" },
                { label: "正确率", value: `${accuracy}%`, sub: "较昨日稳步" },
                { label: "完成关卡", value: `${completedLevels}`, sub: "个" },
                { label: "学习时长", value: `${studyHours}`, sub: "小时" }
              ].map((item) => (
                <div className="rounded-2xl bg-white/[0.07] p-3" key={item.label}>
                  <p className="text-lg font-black md:text-2xl">{item.value}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/52">{item.label}</p>
                  <p className="mt-0.5 hidden text-[10px] font-bold text-white/38 sm:block">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden rounded-[1.6rem] border border-white/70 bg-white/78 p-5 shadow-[0_16px_42px_rgba(16,36,63,0.08)] lg:block">
            <p className="text-sm font-black text-[#667085]">今日任务</p>
            <h2 className="mt-3 text-2xl font-black">{todayTask?.title ?? "完成一组闯关练习"}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">{todayTask?.task ?? "建议先从历史高频章节开始，做完立刻复盘解析。"}</p>
            <div className="mt-6 rounded-[1.2rem] bg-[#EAF5F2] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1496A3]">AI 建议</p>
              <p className="mt-2 text-sm font-bold leading-6">{prompt.useCase}</p>
            </div>
            <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#E95B4F] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#10243F]" onClick={() => navigate("map")} type="button">
              开始今天的练习 <ArrowRight className="size-4" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2 md:hidden">
          {[
            { label: "连续学习", value: stats.streakDays, unit: "天" },
            { label: "正确率", value: accuracy, unit: "%" },
            { label: "完成关卡", value: completedLevels, unit: "个" },
            { label: "学习时长", value: studyHours, unit: "h" }
          ].map((item) => (
            <div className="rounded-[1.1rem] bg-white/82 p-3 text-center shadow-[0_10px_26px_rgba(16,36,63,0.06)]" key={item.label}>
              <p className="text-xl font-black">{item.value}</p>
              <p className="mt-1 text-[10px] font-bold text-[#667085]">{item.label}</p>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">学科入口</h2>
            <button className="text-xs font-black text-[#667085] md:hidden" onClick={() => navigate("map")} type="button">全部 &gt;</button>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {subjectMeta.map((item) => {
              const Icon = item.icon;
              const list = subjectQuestions(questions, item.subject);
              const count = list.length;
              const done = totalQuestions === 0 ? 0 : Math.min(count, Math.round((learningProgress / 100) * count));
              const progress = count === 0 ? 0 : percent((done / count) * 100);

              return (
                <button className="group min-w-0 text-left" key={item.subject} onClick={() => navigate("map")} type="button">
                  <div className="h-full rounded-[1.35rem] border border-white/72 bg-white/82 p-3 shadow-[0_12px_32px_rgba(16,36,63,0.07)] transition hover:-translate-y-0.5 md:rounded-[1.6rem] md:p-5">
                    <div className={`mx-auto grid size-14 place-items-center rounded-2xl ${item.bg} md:mx-0 md:size-20`}>
                      <Icon className="size-7 md:size-10" style={{ color: item.color }} />
                    </div>
                    <h3 className="mt-3 text-center text-sm font-black md:text-left md:text-xl">{item.title}</h3>
                    <p className="mt-2 hidden min-h-10 text-sm font-semibold leading-5 text-[#667085] md:block">{item.desc}</p>
                    <div className="mt-3 hidden md:block">
                      <div className="mb-2 flex items-center justify-between text-xs font-black text-[#667085]">
                        <span>{done} / {count} 题</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressLine color={item.color} value={progress} />
                    </div>
                    <button className="mt-4 hidden min-h-10 rounded-xl bg-[#10243F] px-4 text-sm font-black text-white transition group-hover:bg-[#1496A3] md:inline-flex md:items-center" type="button">
                      开始学习
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.45rem] border border-white/72 bg-white/82 p-5 shadow-[0_14px_34px_rgba(16,36,63,0.07)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black">最近练习</h2>
              <button className="text-xs font-black text-[#1496A3]" onClick={() => navigate("map")} type="button">查看全部 &gt;</button>
            </div>
            <div className="space-y-3">
              {(recentQuestions.length > 0 ? recentQuestions : [undefined, undefined, undefined]).map((question, index) => (
                <button className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-[#EAF5F2]" key={question?.id ?? index} onClick={() => navigate("map")} type="button">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#DFF6F1] text-[#1496A3]">
                    <ScrollText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black">{question?.chapter ?? "先秦时期 · 第 3 关"}</span>
                    <span className="mt-0.5 block text-xs font-bold text-[#667085]">正确率 {accuracy}%</span>
                  </span>
                  <span className="text-xs font-bold text-[#667085]">{index === 0 ? "今天" : "昨天"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-white/72 bg-white/82 p-5 shadow-[0_14px_34px_rgba(16,36,63,0.07)]">
            <h2 className="font-black">错题本</h2>
            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-5xl font-black text-[#E95B4F]">{wrongCount}</p>
                <p className="mt-2 text-sm font-bold text-[#667085]">待巩固错题</p>
              </div>
              <div className="grid size-20 place-items-center rounded-[1.4rem] bg-[#FBE5DF] text-[#E95B4F]">
                <ClipboardList className="size-9" />
              </div>
            </div>
            <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#10243F] text-sm font-black text-white transition hover:bg-[#E95B4F]" onClick={() => navigate("wrongBook")} type="button">
              去复盘 <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="rounded-[1.45rem] border border-white/72 bg-white/82 p-5 shadow-[0_14px_34px_rgba(16,36,63,0.07)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-black">推荐章节</h2>
              <button className="text-xs font-black text-[#1496A3]" onClick={() => navigate("textbook")} type="button">教材 &gt;</button>
            </div>
            <div className="space-y-3">
              {(recommendedChapters.length > 0 ? recommendedChapters : ["先秦时期", "中国古代史", "地图与地球运动"]).map((chapter, index) => (
                <button className="flex w-full items-center justify-between gap-3 rounded-2xl p-2 text-left transition hover:bg-[#EAF5F2]" key={chapter} onClick={() => navigate(index === 2 ? "textbook" : "map")} type="button">
                  <span>
                    <span className="block text-sm font-black">{chapter}</span>
                    <span className="mt-0.5 block text-xs font-bold text-[#667085]">{index === 2 ? "地理" : "历史"} · 进度 {index * 8}%</span>
                  </span>
                  <ArrowRight className="size-4 text-[#667085]" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 pb-3 md:grid-cols-3">
          {[
            { title: "AI 学习建议", desc: prompt.title, page: "prompts" as PageId, icon: Brain },
            { title: "教材解读", desc: "核心问题、高频考点、易错点", page: "textbook" as PageId, icon: BookOpen },
            { title: "教辅雷达", desc: "适合学生和家长的教辅参考", page: "studyAids" as PageId, icon: LibraryBig }
          ].map((entry) => {
            const Icon = entry.icon;
            return (
              <button className="flex items-center gap-3 rounded-[1.3rem] border border-white/72 bg-white/70 p-4 text-left shadow-[0_10px_28px_rgba(16,36,63,0.05)] transition hover:-translate-y-0.5" key={entry.title} onClick={() => navigate(entry.page)} type="button">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#EAF5F2] text-[#1496A3]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">{entry.title}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-[#667085]">{entry.desc}</span>
                </span>
              </button>
            );
          })}
        </section>

        <div className="flex flex-wrap gap-2 pb-2 text-xs font-black text-[#667085]">
          <span className="rounded-full bg-white/70 px-3 py-1.5">{syncText}</span>
          <span className="rounded-full bg-white/70 px-3 py-1.5">{sourceText}</span>
        </div>
      </div>
    </div>
  );
}
