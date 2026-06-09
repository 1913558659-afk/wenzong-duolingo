import { ArrowRight, Bell, BookOpen, Brain, CalendarDays, ClipboardList, Globe2, Landmark, LibraryBig, ScrollText, ShieldCheck } from "lucide-react";
import geographyIllustration from "@/assets/subjects/geography.svg";
import historyIllustration from "@/assets/subjects/history.svg";
import politicsIllustration from "@/assets/subjects/politics.svg";
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
  image: string;
};

const subjectMeta: SubjectMeta[] = [
  { subject: "history", title: "历史", desc: "穿越历史长河，探索文明的源流", icon: Landmark, color: "#1496A3", bg: "bg-[#DFF6F1]", image: historyIllustration },
  { subject: "politics", title: "政治", desc: "理解社会运行，掌握政治智慧", icon: ShieldCheck, color: "#E95B4F", bg: "bg-[#FBE5DF]", image: politicsIllustration },
  { subject: "geography", title: "地理", desc: "认识地理环境，辨析区域特征", icon: Globe2, color: "#F3B24A", bg: "bg-[#E8F4F5]", image: geographyIllustration }
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

function StatBlock({ label, sub, value, accent = "#10243F" }: { label: string; sub: string; value: string; accent?: string }) {
  return (
    <div className="min-h-[78px] min-w-0 rounded-[1rem] border border-[#10243F]/5 bg-white/58 px-3 py-3 md:min-h-0 md:rounded-[1.25rem] md:px-4 md:py-4">
      <p className="text-xs font-black text-[#667085]">{label}</p>
      <p className="mt-1 truncate text-2xl font-black leading-none md:mt-2 md:text-3xl" style={{ color: accent }}>{value}</p>
      <p className="mt-1 truncate text-[11px] font-bold text-[#667085] md:mt-2 md:text-xs">{sub}</p>
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
    <div
      className="min-h-screen overflow-hidden rounded-[1.6rem] px-4 pb-8 pt-3 text-[#10243F] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] md:px-6 md:pt-6"
      style={{
        backgroundImage:
          "radial-gradient(circle at 8% 2%, rgba(20,150,163,0.14), transparent 18rem), radial-gradient(circle at 92% 0%, rgba(233,91,79,0.08), transparent 20rem), linear-gradient(135deg,#F7F1E4 0%,#FAF6EC 44%,#EAF5F2 100%)"
      }}
    >
      <div className="mx-auto max-w-[1180px] space-y-4 md:space-y-5">
        <header className="flex items-center justify-between md:hidden">
          <div>
            <p className="text-xl font-black">文综岛</p>
            <p className="mt-1 text-xs font-bold text-[#667085]">SayHiStudy · 今日学习</p>
          </div>
          <button className="grid size-10 place-items-center rounded-2xl bg-white text-[#10243F] shadow-[0_10px_28px_rgba(16,36,63,0.08)]" type="button">
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

        <section className="relative overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/78 p-3 shadow-[0_12px_30px_rgba(16,36,63,0.07)] backdrop-blur md:rounded-[1.75rem] md:p-5 md:shadow-[0_16px_44px_rgba(16,36,63,0.08)]">
          <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-[#1496A3]/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 size-48 rounded-full bg-[#E95B4F]/5 blur-2xl" />
          <div className="relative mb-3 flex flex-col gap-2 md:mb-4 md:flex-row md:items-center md:justify-between md:gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1496A3] md:text-xs md:tracking-[0.18em]">Learning Overview</p>
              <h2 className="mt-0.5 text-xl font-black md:mt-1 md:text-2xl">今日学习统计</h2>
            </div>
            <div className="rounded-[1rem] bg-[#EAF5F2]/80 px-3 py-2 md:rounded-2xl md:px-4 md:py-3">
              <p className="text-[11px] font-black text-[#1496A3] md:text-xs">今日推荐任务</p>
              <p className="mt-0.5 line-clamp-1 text-xs font-bold text-[#10243F] md:mt-1 md:text-sm">{todayTask?.task ?? "完成一组文综闯关题，并复盘解析。"}</p>
            </div>
          </div>

          <div className="relative grid gap-2 sm:grid-cols-2 md:gap-3 xl:grid-cols-[1.25fr_1fr_1fr_1fr_1fr]">
            <div className="rounded-[1rem] border border-[#1496A3]/10 bg-[#F8FCFA] p-3 md:rounded-[1.35rem] md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className="grid size-[76px] shrink-0 place-items-center rounded-full md:size-24"
                  style={{
                    background: `conic-gradient(#1496A3 ${learningProgress * 3.6}deg, #E5EEEA 0deg)`
                  }}
                >
                  <div className="grid size-14 place-items-center rounded-full bg-white md:size-16">
                    <span className="text-lg font-black text-[#10243F] md:text-xl">{learningProgress}%</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#667085]">总学习进度</p>
                  <p className="mt-1 text-sm font-bold text-[#10243F] md:mt-2">已完成 {totalAnswered} / {totalQuestions} 题</p>
                  <p className="mt-0.5 line-clamp-1 text-xs font-bold text-[#667085] md:mt-1">{sourceText}</p>
                </div>
              </div>
            </div>
            <StatBlock label="连续学习" value={`${stats.streakDays} 天`} sub={`累计 ${stats.streakDays} 天`} accent="#10243F" />
            <StatBlock label="总正确率" value={`${accuracy}%`} sub="较昨日 ↑8%" accent="#1496A3" />
            <StatBlock label="完成关卡" value={`${completedLevels} 关`} sub={`共 ${completedLevels + wrongCount} 关`} accent="#E95B4F" />
            <StatBlock label="总学习时长" value={`${studyHours} h`} sub="较昨日 ↑1.2h" accent="#10243F" />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">学科入口</h2>
            <button className="text-xs font-black text-[#667085] md:hidden" onClick={() => navigate("map")} type="button">全部 &gt;</button>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            {subjectMeta.map((item) => {
              const Icon = item.icon;
              const list = subjectQuestions(questions, item.subject);
              const count = list.length;
              const done = totalQuestions === 0 ? 0 : Math.min(count, Math.round((learningProgress / 100) * count));
              const progress = count === 0 ? 0 : percent((done / count) * 100);

              return (
                <button className="group min-w-0 text-left" key={item.subject} onClick={() => navigate("map")} type="button">
                  <div className="relative h-full overflow-hidden rounded-[1.55rem] border border-white/78 bg-white/86 p-4 shadow-[0_14px_34px_rgba(16,36,63,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(16,36,63,0.10)] md:rounded-[1.65rem] md:p-5">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white to-transparent" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className={`grid size-12 place-items-center rounded-2xl ${item.bg} shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`}>
                          <Icon className="size-6" style={{ color: item.color }} />
                        </div>
                        <h3 className="mt-4 text-2xl font-black text-[#10243F]">{item.title}</h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{item.desc}</p>
                      </div>
                      <img
                        alt={`${item.title}学科插画`}
                        className="h-24 w-24 shrink-0 object-contain opacity-95 md:h-28 md:w-28"
                        src={item.image}
                      />
                    </div>
                    <div className="relative mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs font-black text-[#667085]">
                        <span>{done} / {count} 题</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressLine color={item.color} value={progress} />
                    </div>
                    <span className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#10243F] px-4 text-sm font-black text-white transition group-hover:bg-[#1496A3] md:w-auto">
                      开始练习
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
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

          <div className="rounded-[1.45rem] border border-white/72 bg-white/82 p-5 shadow-[0_14px_34px_rgba(16,36,63,0.07)]">
            <h2 className="font-black">学习数据概览</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "题库总量", value: totalQuestions },
                { label: "今日答题", value: stats.answeredToday },
                { label: "经验值 XP", value: stats.xp }
              ].map((item) => (
                <div className="flex items-center justify-between rounded-2xl bg-[#F7F1E4]/70 px-3 py-3" key={item.label}>
                  <span className="text-xs font-black text-[#667085]">{item.label}</span>
                  <span className="text-lg font-black text-[#10243F]">{item.value}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1496A3] text-sm font-black text-white transition hover:bg-[#10243F]" onClick={() => navigate("profile")} type="button">
              查看学习报告 <ArrowRight className="size-4" />
            </button>
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
