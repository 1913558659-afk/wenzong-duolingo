import { ArrowRight, BookOpen, Brain, CheckCircle2, Compass, Landmark, LibraryBig, Map, ShieldCheck, Sparkles } from "lucide-react";
import { aiPrompts } from "@/data/aiPrompts";
import { studyAids } from "@/data/studyAids";
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

type SubjectCard = {
  subject: Subject;
  title: string;
  desc: string;
  tone: string;
  icon: typeof Landmark;
};

const subjects: SubjectCard[] = [
  {
    subject: "history",
    title: "历史",
    desc: "时间线、制度变迁与史料理解",
    tone: "from-[#E95B4F]/14 to-white text-[#E95B4F]",
    icon: Landmark
  },
  {
    subject: "politics",
    title: "政治",
    desc: "概念辨析、材料分析与规范表达",
    tone: "from-[#1496A3]/14 to-white text-[#1496A3]",
    icon: ShieldCheck
  },
  {
    subject: "geography",
    title: "地理",
    desc: "图表判读、区域定位与成因分析",
    tone: "from-[#F3B24A]/18 to-white text-[#B97816]",
    icon: Compass
  }
];

const quickEntries: { title: string; desc: string; page: PageId; icon: typeof BookOpen; color: string }[] = [
  { title: "错题本", desc: "复盘易错知识点", page: "wrongBook", icon: CheckCircle2, color: "text-[#E95B4F] bg-[#E95B4F]/10" },
  { title: "AI 学习助手", desc: "用提示词整理思路", page: "prompts", icon: Brain, color: "text-[#1496A3] bg-[#1496A3]/10" },
  { title: "教材解读", desc: "抓核心问题和高频考点", page: "textbook", icon: BookOpen, color: "text-[#101828] bg-[#101828]/8" },
  { title: "教辅雷达", desc: "给学生和家长做选择参考", page: "studyAids", icon: LibraryBig, color: "text-[#B97816] bg-[#F3B24A]/16" }
];

function percent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function subjectQuestionCount(questions: QuizQuestion[], subject: Subject) {
  return questions.filter((question) => question.subject === subject).length;
}

function subjectChapterCount(questions: QuizQuestion[], subject: Subject) {
  return new Set(questions.filter((question) => question.subject === subject).map((question) => question.chapter)).size;
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
  const accuracy = totalAnswered === 0 ? 0 : percent((stats.correctCount / totalAnswered) * 100);
  const learningProgress = totalQuestions === 0 ? 0 : percent((totalAnswered / totalQuestions) * 100);
  const completedLevels = new Set(questions.map((question) => `${question.subject}:${question.chapter}`)).size;
  const todayTask = scheduleItems.find((item) => !item.done) ?? scheduleItems[0];
  const recommendedLevel = questions[0];
  const recommendedAid = studyAids[0];
  const recommendedPrompt = aiPrompts[0];
  const unfinishedTasks = scheduleItems.filter((item) => !item.done).length;
  const questionSourceText = questionSourceStatus === "cloud" ? "云端题库已同步" : questionSourceStatus === "loading" ? "题库同步中" : "当前使用本地题库";
  const syncText = isLoggedIn ? (syncError ? "同步暂不可用，已保留本地进度" : "学习数据已连接账号") : "游客模式：登录后可同步学习进度";

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-4 text-[#101828] sm:space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#FFFCF5] via-[#F4FBF8] to-[#DDEFEA] p-5 shadow-[0_18px_50px_rgba(16,24,40,0.08)] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#101828] text-white shadow-[inset_0_-3px_0_rgba(255,255,255,0.12)]">
                <Map className="size-5" />
              </div>
              <div>
                <p className="text-xl font-black leading-none tracking-normal">文综岛</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#1496A3]">SayHiStudy</p>
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <p className="inline-flex rounded-full border border-[#1496A3]/18 bg-white/72 px-3 py-1 text-xs font-black text-[#1496A3]">
                面向中高考文综的学习仪表盘
              </p>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-normal sm:text-5xl">
                今天继续稳稳推进
              </h1>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-[#667085] sm:text-base">
                先完成一个小关卡，再复盘关键错题。把历史、政治、地理拆成清晰路径，家长也能一眼看懂学习进度。
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/76 px-3 py-1.5 text-xs font-black text-[#667085]">{syncText}</span>
              <span className="rounded-full bg-white/76 px-3 py-1.5 text-xs font-black text-[#667085]">{questionSourceText}</span>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-[#101828] p-5 text-white shadow-[0_18px_45px_rgba(16,24,40,0.18)] lg:w-[430px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white/62">学习总进度</p>
                <p className="mt-2 text-6xl font-black leading-none">{learningProgress}%</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <p className="text-xs font-bold text-white/54">连续学习</p>
                <p className="text-xl font-black text-[#F3B24A]">{stats.streakDays} 天</p>
              </div>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-[#1496A3]" style={{ width: `${learningProgress}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-xs font-bold text-white/52">已答题</p>
                <p className="mt-1 text-xl font-black">{totalAnswered}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-xs font-bold text-white/52">正确率</p>
                <p className="mt-1 text-xl font-black">{accuracy}%</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-xs font-bold text-white/52">XP</p>
                <p className="mt-1 text-xl font-black text-[#F3B24A]">{stats.xp}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "题库总量", value: totalQuestions, tone: "text-[#101828]" },
          { label: "已开章节", value: completedLevels, tone: "text-[#1496A3]" },
          { label: "待办任务", value: unfinishedTasks, tone: "text-[#B97816]" },
          { label: "错题提醒", value: wrongCount, tone: "text-[#E95B4F]" }
        ].map((item) => (
          <div className="rounded-[1.4rem] border border-white/72 bg-white/78 p-4 shadow-[0_10px_30px_rgba(16,24,40,0.06)] backdrop-blur" key={item.label}>
            <p className={`text-3xl font-black ${item.tone}`}>{item.value}</p>
            <p className="mt-1 text-xs font-bold text-[#667085]">{item.label}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1496A3]">Subject Islands</p>
            <h2 className="mt-1 text-2xl font-black">选择今天要登陆的学科岛</h2>
          </div>
          <button className="hidden min-h-11 rounded-full bg-[#101828] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#1496A3] sm:inline-flex sm:items-center" onClick={() => navigate("map")} type="button">
            进入闯关
          </button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {subjects.map((item) => {
            const Icon = item.icon;
            const count = subjectQuestionCount(questions, item.subject);
            const chapters = subjectChapterCount(questions, item.subject);
            const subjectProgress = totalQuestions === 0 ? 0 : percent((count / totalQuestions) * learningProgress);

            return (
              <button className="group min-w-0 text-left" key={item.subject} onClick={() => navigate("map")} type="button">
                <div className={`h-full rounded-[1.6rem] border border-white/72 bg-gradient-to-br ${item.tone} p-5 shadow-[0_14px_36px_rgba(16,24,40,0.07)] transition group-hover:-translate-y-0.5 group-hover:border-[#1496A3]/30`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-white shadow-[0_8px_22px_rgba(16,24,40,0.08)]">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full bg-white/78 px-3 py-1 text-xs font-black text-[#667085]">{count} 题</span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-[#101828]">{item.title}</h3>
                  <p className="mt-2 min-h-11 text-sm font-semibold leading-6 text-[#667085]">{item.desc}</p>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs font-black text-[#667085]">
                      <span>{chapters} 个章节</span>
                      <span>{subjectProgress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#101828]/10">
                      <div className="h-full rounded-full bg-[#1496A3]" style={{ width: `${subjectProgress}%` }} />
                    </div>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#1496A3]">
                    开始闯关 <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[1.6rem] border border-white/72 bg-white/82 p-5 shadow-[0_14px_36px_rgba(16,24,40,0.07)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-[#E95B4F]/10 px-3 py-1 text-xs font-black text-[#E95B4F]">今日推荐练习</p>
              <h2 className="mt-3 text-2xl font-black">{recommendedLevel?.chapter ?? "文综闯关"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">
                {todayTask ? `${todayTask.title}：${todayTask.task}` : "从一个 5 题小关卡开始，保持学习手感。"}
              </p>
              <p className="mt-3 text-xs font-black text-[#667085]">当前正确率 {accuracy}% · 连续学习 {stats.streakDays} 天</p>
            </div>
            <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#E95B4F] px-5 text-sm font-black text-white shadow-[inset_0_-3px_0_rgba(16,24,40,0.16)] transition hover:-translate-y-0.5 hover:bg-[#101828] sm:w-auto" onClick={() => navigate("map")} type="button">
              去闯关 <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {quickEntries.map((entry) => {
            const Icon = entry.icon;
            return (
              <button className="group min-w-0 rounded-[1.4rem] border border-white/72 bg-white/78 p-4 text-left shadow-[0_10px_28px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5" key={entry.title} onClick={() => navigate(entry.page)} type="button">
                <span className={`grid size-10 place-items-center rounded-2xl ${entry.color}`}>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 text-base font-black">{entry.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#667085]">{entry.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <button className="group min-w-0 rounded-[1.5rem] border border-white/72 bg-white/78 p-5 text-left shadow-[0_12px_32px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5" onClick={() => navigate("studyAids")} type="button">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B97816]">Guidebook Radar</p>
          <h2 className="mt-2 text-xl font-black">{recommendedAid.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{recommendedAid.fitFor}</p>
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#1496A3]">查看教辅雷达 <ArrowRight className="size-4" /></p>
        </button>

        <button className="group min-w-0 rounded-[1.5rem] border border-white/72 bg-white/78 p-5 text-left shadow-[0_12px_32px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5" onClick={() => navigate("prompts")} type="button">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1496A3]">AI Study Prompt</p>
          <h2 className="mt-2 text-xl font-black">{recommendedPrompt.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{recommendedPrompt.useCase}</p>
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#1496A3]">复制提示词 <Sparkles className="size-4" /></p>
        </button>
      </section>
    </div>
  );
}
