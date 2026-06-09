import { useMemo, useState } from "react";
import { ArrowLeft, Flag, Gift, Lock, Star } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { subjectLabels } from "@/lib/labels";
import type { Difficulty, QuizQuestion, Subject } from "@/types";
import {
  getChapterProgress,
  getCompletedQuestionIds,
  getModuleProgress,
  getSubjectProgress,
  getTotalProgress
} from "@/utils/progress";

type ChallengeMapProps = {
  questionSourceStatus: "loading" | "cloud" | "local";
  questions: QuizQuestion[];
  startPractice: (levelId: string) => void;
};

type SubjectCard = {
  subject: Subject;
  desc: string;
  accent: string;
};

type ChallengeModule = {
  name: string;
  chapters: string[];
};

type MapNodeStatus = "done" | "current" | "locked";

type MapNode = {
  chapter: string;
  index: number;
  label: string;
  subject: Subject;
  status: MapNodeStatus;
  progress: ReturnType<typeof getChapterProgress>;
  x: number;
  y: number;
  mobileX: number;
  mobileY: number;
};

const subjectCards: SubjectCard[] = [
  { subject: "history", desc: "按中国古代史、中国近现代史、世界史分层推进。", accent: "from-coral/18 to-gold/18" },
  { subject: "politics", desc: "围绕教材章节训练概念判断、材料理解和易错点。", accent: "from-tide/16 to-leaf/16" },
  { subject: "geography", desc: "从地球运动、自然地理到区域问题逐步闯关。", accent: "from-leaf/18 to-tide/14" }
];

const historyModules: ChallengeModule[] = [
  {
    name: "中国古代史",
    chapters: ["先秦时期", "秦汉魏晋时期", "隋唐宋元时期", "明清时期"]
  },
  {
    name: "中国近现代史",
    chapters: ["晚清时期", "民国初期至抗战前", "抗日战争与解放战争时期", "新中国成立后"]
  },
  {
    name: "世界史",
    chapters: ["古代世界史", "新航路开辟到两次工业革命", "两次大战期间的世界", "二战后的世界"]
  }
];

const difficultyLabels: Record<Difficulty, string> = {
  easy: "easy",
  medium: "medium",
  hard: "hard"
};

function getSubjectQuestions(subject: Subject, questions: QuizQuestion[]) {
  return questions.filter((question) => question.subject === subject);
}

function getSubjectChapters(subject: Subject, questions: QuizQuestion[]) {
  return [...new Set(getSubjectQuestions(subject, questions).map((question) => question.chapter))];
}

function buildModules(subject: Subject, questions: QuizQuestion[]): ChallengeModule[] {
  const chapters = getSubjectChapters(subject, questions);

  if (subject !== "history") {
    return chapters.map((chapter) => ({ name: chapter, chapters: [chapter] }));
  }

  const knownChapters = new Set(historyModules.flatMap((module) => module.chapters));
  const modules = historyModules
    .map((module) => ({
      ...module,
      chapters: module.chapters.filter((chapter) => chapters.includes(chapter))
    }))
    .filter((module) => module.chapters.length > 0);

  const unmatched = chapters.filter((chapter) => !knownChapters.has(chapter));
  if (unmatched.length > 0) {
    modules.push({ name: "历史综合训练", chapters: unmatched });
  }

  return modules;
}

function getDifficultyCounts(questions: QuizQuestion[]) {
  return questions.reduce(
    (counts, question) => {
      counts[question.difficulty] += 1;
      return counts;
    },
    { easy: 0, medium: 0, hard: 0 } satisfies Record<Difficulty, number>
  );
}

function getTopTags(questions: QuizQuestion[]) {
  const tagCounts = new Map<string, number>();
  questions.forEach((question) => {
    question.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
  });

  return [...tagCounts.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

function getChapterStatus(done: number, total: number) {
  if (total > 0 && done >= total) {
    return "已完成";
  }
  if (done > 0) {
    return "继续练习";
  }
  return "开始练习";
}

const sampleHistoryNodes = ["夏商周", "西周的兴衰", "春秋争霸", "战国变法", "百家争鸣", "秦的统一"];

const nodePositions = [
  { x: 17, y: 56 },
  { x: 30, y: 35 },
  { x: 44, y: 60 },
  { x: 56, y: 44 },
  { x: 69, y: 61 },
  { x: 81, y: 38 },
  { x: 75, y: 73 },
  { x: 58, y: 76 }
];

const mobileNodePositions = [
  { x: 28, y: 10 },
  { x: 70, y: 24 },
  { x: 30, y: 38 },
  { x: 70, y: 52 },
  { x: 30, y: 66 },
  { x: 70, y: 80 },
  { x: 35, y: 92 },
  { x: 70, y: 104 }
];

function buildMapNodes(subject: Subject, modules: ChallengeModule[], completedIds: Set<string>, questions: QuizQuestion[]): MapNode[] {
  const chapters = modules.flatMap((module) => module.chapters);
  const shouldUseHistorySample = subject === "history" && chapters.length <= 2 && chapters.some((chapter) => chapter.includes("先秦"));
  const sourceChapters = shouldUseHistorySample ? sampleHistoryNodes.map(() => chapters[0] ?? "先秦时期") : chapters;
  const labels = shouldUseHistorySample ? sampleHistoryNodes : sourceChapters;
  let foundCurrent = false;

  return labels.slice(0, 8).map((label, index) => {
    const chapter = sourceChapters[index] ?? sourceChapters[0] ?? label;
    const progress = getChapterProgress(subject, chapter, completedIds, questions);
    const done = progress.total > 0 && progress.done >= progress.total;
    let status: MapNodeStatus = "locked";

    if (done) {
      status = "done";
    } else if (!foundCurrent) {
      status = "current";
      foundCurrent = true;
    }

    if (index === 0 && progress.total === 0) {
      status = "current";
    }

    const position = nodePositions[index % nodePositions.length];
    const mobilePosition = mobileNodePositions[index % mobileNodePositions.length];
    return {
      chapter,
      index: index + 1,
      label,
      subject,
      status,
      progress,
      x: position.x,
      y: position.y,
      mobileX: mobilePosition.x,
      mobileY: mobilePosition.y
    };
  });
}

export function ChallengeMap({ questionSourceStatus, questions, startPractice }: ChallengeMapProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const completedIds = getCompletedQuestionIds();
  const totalProgress = getTotalProgress(completedIds, questions);

  function openSubject(subject: Subject) {
    setSelectedSubject(subject);
    setOpenModules([]);
  }

  function toggleModule(moduleName: string) {
    setOpenModules((current) =>
      current.includes(moduleName) ? current.filter((item) => item !== moduleName) : [...current, moduleName]
    );
  }

  if (selectedSubject) {
    return (
      <SubjectDetail
        completedIds={completedIds}
        questionSourceStatus={questionSourceStatus}
        questions={questions}
        onBack={() => setSelectedSubject(null)}
        openModules={openModules}
        startPractice={startPractice}
        subject={selectedSubject}
        toggleModule={toggleModule}
      />
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="学科闯关" subtitle="按学科和章节闯关，逐步完成高频考点训练" />
      <p className="rounded-2xl bg-white/72 px-4 py-3 text-sm font-black text-ink/58">
        {questionSourceStatus === "cloud" ? "使用云端题库" : questionSourceStatus === "loading" ? "正在加载题库" : "后端暂不可用，已使用本地题库"}
      </p>

      <GameCard className="bg-ink text-white">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-black text-gold">总进度统计</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">已完成 {totalProgress.done} / {totalProgress.total}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/70">总完成百分比 {totalProgress.percent}%</p>
          </div>
          <div>
            <ProgressBar value={totalProgress.percent} />
            <div className="mt-3 grid gap-2 text-sm font-black sm:grid-cols-3">
              <span className="rounded-2xl bg-white/10 px-3 py-2">总题数 {totalProgress.total}</span>
              <span className="rounded-2xl bg-white/10 px-3 py-2">已完成 {totalProgress.done}</span>
              <span className="rounded-2xl bg-white/10 px-3 py-2">完成 {totalProgress.percent}%</span>
            </div>
          </div>
        </div>
      </GameCard>

      <section className="grid gap-4 lg:grid-cols-3">
        {subjectCards.map((card) => {
          const progress = getSubjectProgress(card.subject, completedIds, questions);

          return (
            <button className="group min-w-0 text-left" key={card.subject} onClick={() => openSubject(card.subject)} type="button">
              <GameCard className={`h-full bg-gradient-to-br ${card.accent} transition group-hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-tide">学科入口</p>
                    <h2 className="mt-1 text-2xl font-black leading-tight text-ink">{subjectLabels[card.subject]}</h2>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-ink/58">暂无正确率</span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/66">{card.desc}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-ink/60">
                    <span>已完成 {progress.done} / {progress.total}</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <ProgressBar value={progress.percent} />
                </div>
                <div className="mt-4 grid gap-2 text-sm font-black sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <span className="rounded-2xl bg-white/72 px-3 py-2 text-ink/66">题目 {progress.total}</span>
                  <span className="rounded-2xl bg-white/72 px-3 py-2 text-ink/66">完成 {progress.done}</span>
                </div>
                <span className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame transition group-hover:bg-coral">
                  进入闯关
                </span>
              </GameCard>
            </button>
          );
        })}
      </section>
    </div>
  );
}

function SubjectDetail({
  completedIds,
  questionSourceStatus,
  questions,
  onBack,
  openModules,
  startPractice,
  subject,
  toggleModule
}: {
  completedIds: Set<string>;
  questionSourceStatus: "loading" | "cloud" | "local";
  questions: QuizQuestion[];
  onBack: () => void;
  openModules: string[];
  startPractice: (levelId: string) => void;
  subject: Subject;
  toggleModule: (moduleName: string) => void;
}) {
  const modules = useMemo(() => buildModules(subject, questions), [questions, subject]);
  const progress = getSubjectProgress(subject, completedIds, questions);
  const mapNodes = useMemo(() => buildMapNodes(subject, modules, completedIds, questions), [completedIds, modules, questions, subject]);
  const rewardTotal = Math.max(progress.total, 36);
  const rewardDone = Math.min(rewardTotal, Math.max(progress.done, Math.round((progress.percent / 100) * rewardTotal)));

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.6rem] border border-white/75 bg-[linear-gradient(135deg,#F7F1E4_0%,#F9F6EE_45%,#EAF5F2_100%)] p-3 shadow-[0_18px_46px_rgba(16,36,63,0.08)] sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/82 text-ink shadow-[0_8px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-tide"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-ink">闯关地图 / {mapNodes[0]?.chapter ?? subjectLabels[subject]}</p>
            <p className="mt-0.5 text-xs font-bold text-ink/52">
              {questionSourceStatus === "cloud" ? "云端题库" : questionSourceStatus === "loading" ? "题库加载中" : "本地题库"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/78 px-3 py-2 text-right shadow-[0_8px_22px_rgba(16,36,63,0.06)]">
            <p className="text-[11px] font-black text-tide">{subjectLabels[subject]}总进度</p>
            <p className="text-lg font-black text-ink">{progress.percent}%</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-[#F7F1E4] shadow-[0_18px_48px_rgba(16,36,63,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(20,150,163,0.11),transparent_15rem),radial-gradient(circle_at_86%_12%,rgba(233,91,79,0.055),transparent_18rem),linear-gradient(180deg,#F8F2E6_0%,#EEF6EF_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:radial-gradient(#0B1F3A_0.7px,transparent_0.7px)] [background-size:18px_18px]" />

        <div className="relative hidden h-[600px] md:block">
          <InkMountainBackground variant="desktop" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M17 56 C25 38 30 36 30 35 S38 49 44 60 S50 53 56 44 S64 52 69 61 S76 49 81 38" fill="none" stroke="#829D96" strokeDasharray="1.8 2.8" strokeLinecap="round" strokeWidth="0.8" opacity=".82" />
            <path d="M17 56 C25 38 30 36 30 35 S38 49 44 60 S50 53 56 44 S64 52 69 61 S76 49 81 38" fill="none" stroke="#F7F1E4" strokeDasharray="1.8 2.8" strokeLinecap="round" strokeWidth="0.35" opacity=".7" />
          </svg>
          {modules.length === 0 && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <GameCard className="max-w-md">
                <p className="text-xl font-black text-ink">这个学科还没有题目</p>
                <p className="mt-2 text-sm font-semibold text-ink/58">稍后在题库里补充后，这里会自动出现地图关卡。</p>
              </GameCard>
            </div>
          )}

          {mapNodes.map((node) => (
            <MapLevelNode key={`${node.label}-${node.index}`} mode="desktop" node={node} startPractice={startPractice} />
          ))}
        </div>

        <div className="relative h-[840px] md:hidden">
          <InkMountainBackground variant="mobile" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 112">
            <path d="M28 10 C62 16 70 20 70 24 C70 32 30 30 30 38 C30 46 70 45 70 52 C70 60 30 58 30 66 C30 74 70 72 70 80 C70 88 35 88 35 92" fill="none" stroke="#829D96" strokeDasharray="2 3.2" strokeLinecap="round" strokeWidth="1.15" opacity=".76" />
            <path d="M28 10 C62 16 70 20 70 24 C70 32 30 30 30 38 C30 46 70 45 70 52 C70 60 30 58 30 66 C30 74 70 72 70 80 C70 88 35 88 35 92" fill="none" stroke="#F7F1E4" strokeDasharray="2 3.2" strokeLinecap="round" strokeWidth=".45" opacity=".72" />
          </svg>
          {mapNodes.map((node) => (
            <MapLevelNode key={`${node.label}-${node.index}-mobile`} mode="mobile" node={node} startPractice={startPractice} />
          ))}
        </div>

        <ChapterProgressReward done={rewardDone} percent={progress.percent} total={rewardTotal} />
      </section>

      <div className="hidden">
        {modules.length === 0 && (
          <GameCard className="py-8 text-center">
            <p className="text-xl font-black text-ink">这个学科还没有题目</p>
            <p className="mt-2 text-sm font-semibold text-ink/58">稍后在题库里补充后，这里会自动出现章节。</p>
          </GameCard>
        )}

        {modules.map((module) => {
          const moduleProgress = getModuleProgress(subject, module.chapters, completedIds, questions);
          const isOpen = openModules.includes(module.name);

          return (
            <section className="rounded-[1.4rem] border border-white/70 bg-white/58 p-3 shadow-soft sm:p-4" key={module.name}>
              <button
                className="grid w-full min-w-0 gap-3 rounded-2xl bg-white/82 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-game sm:grid-cols-[1fr_180px_44px] sm:items-center"
                onClick={() => toggleModule(module.name)}
                type="button"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black leading-tight text-ink">{module.name}</h2>
                    <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-black text-tide">{moduleProgress.total} 题</span>
                  </div>
                  <p className="mt-2 text-xs font-black text-ink/52">
                    已完成 {moduleProgress.done} / {moduleProgress.total} · {moduleProgress.percent}%
                  </p>
                </div>
                <div className="min-w-0">
                  <ProgressBar value={moduleProgress.percent} />
                </div>
                <span className="grid size-11 place-items-center rounded-2xl bg-ink text-lg font-black text-white shadow-insetGame">
                  {isOpen ? "收" : "展"}
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {module.chapters.map((chapter) => (
                    <ChapterCard
                      chapter={chapter}
                      completedIds={completedIds}
                      questions={questions}
                      key={chapter}
                      startPractice={startPractice}
                      subject={subject}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function InkMountainBackground({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <>
      <svg className="pointer-events-none absolute inset-x-0 bottom-10 h-[86%] w-full blur-[0.2px]" preserveAspectRatio="none" viewBox="0 0 1000 620">
        <path d="M0 320 C120 230 205 286 315 180 C432 68 516 230 615 138 C730 32 825 178 1000 80 L1000 620 L0 620 Z" fill="#D8E8E1" opacity={variant === "desktop" ? ".62" : ".52"} />
        <path d="M0 410 C145 300 260 365 380 245 C495 130 600 330 720 210 C825 105 910 235 1000 160 L1000 620 L0 620 Z" fill="#C8DCD3" opacity={variant === "desktop" ? ".48" : ".38"} />
        <path d="M0 505 C130 415 250 445 365 360 C510 252 620 462 750 330 C865 215 930 335 1000 280 L1000 620 L0 620 Z" fill="#AFC8BE" opacity={variant === "desktop" ? ".22" : ".16"} />
      </svg>
      <div className="pointer-events-none absolute left-8 top-20 h-16 w-56 rounded-full bg-white/35 blur-2xl" />
      <div className="pointer-events-none absolute right-10 top-32 h-20 w-72 rounded-full bg-white/30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-32 left-1/3 h-16 w-64 rounded-full bg-[#F7F1E4]/45 blur-2xl" />
    </>
  );
}

function MapLevelNode({ mode, node, startPractice }: { mode: "desktop" | "mobile"; node: MapNode; startPractice: (levelId: string) => void }) {
  const clickable = node.status !== "locked";
  const statusLabel = node.status === "done" ? "已完成" : node.status === "current" ? "进行中" : "未解锁";
  const nodeClass =
    node.status === "done"
      ? "bg-[#1496A3] text-white shadow-[0_12px_24px_rgba(20,150,163,0.26)]"
      : node.status === "current"
        ? "bg-[#E95B4F] text-white shadow-[0_12px_26px_rgba(233,91,79,0.30)]"
        : "bg-[#273446] text-white/80 shadow-[0_8px_18px_rgba(39,52,70,0.16)]";
  const left = mode === "mobile" ? node.mobileX : node.x;
  const top = mode === "mobile" ? node.mobileY : node.y;
  const nodeSize = mode === "mobile" ? "size-12" : "size-14";
  const labelWidth = mode === "mobile" ? "max-w-[112px]" : "max-w-[132px]";

  return (
    <button
      className="absolute min-w-[92px] -translate-x-1/2 -translate-y-1/2 text-center transition enabled:hover:-translate-y-[54%] disabled:cursor-not-allowed"
      disabled={!clickable}
      onClick={() => startPractice(`${node.subject}:${node.chapter}`)}
      style={{ left: `${left}%`, top: `${top}%` }}
      type="button"
    >
      <span className="relative inline-grid">
        {node.status === "current" && (
          <span className="absolute -right-3 -top-6 text-[#E95B4F]">
            <Flag className="size-7 fill-current" />
          </span>
        )}
        <span className={`grid ${nodeSize} place-items-center border-[4px] border-white text-lg font-black ${node.status === "done" ? "rounded-[1.05rem]" : "rounded-2xl"} ${nodeClass}`}>
          {node.status === "locked" ? <Lock className="size-4" /> : node.index}
        </span>
      </span>
      <span className={`mx-auto mt-2 block ${labelWidth} rounded-full bg-[#FFFCF5]/82 px-3 py-1 text-[11px] font-black leading-4 text-ink shadow-[0_7px_16px_rgba(16,36,63,0.08)] backdrop-blur`}>
        {node.label}
      </span>
      <span className={`mt-1 block text-[11px] font-black ${node.status === "done" ? "text-[#1496A3]" : node.status === "current" ? "text-[#E95B4F]" : "text-ink/42"}`}>
        {statusLabel}
      </span>
    </button>
  );
}

function ChapterProgressReward({ done, percent, total }: { done: number; percent: number; total: number }) {
  return (
    <div className="relative z-10 mx-3 mb-3 rounded-[1.25rem] border border-white/80 bg-white/88 p-3 shadow-[0_12px_34px_rgba(16,36,63,0.10)] backdrop-blur md:absolute md:inset-x-5 md:bottom-5 md:mx-0 md:mb-0 md:rounded-[1.4rem]">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <p className="text-xs font-black text-ink/66 sm:text-sm">完成本章节获得 <span className="text-gold">⭐</span> {done} / {total}</p>
        <div className="h-3 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-[#1496A3]" style={{ width: `${percent}%` }} />
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-[#F7F1E4] text-[#E95B4F]">
          <Gift className="size-6" />
        </span>
      </div>
    </div>
  );
}

function ChapterCard({
  chapter,
  completedIds,
  questions,
  startPractice,
  subject
}: {
  chapter: string;
  completedIds: Set<string>;
  questions: QuizQuestion[];
  startPractice: (levelId: string) => void;
  subject: Subject;
}) {
  const chapterQuestions = questions.filter((question) => question.subject === subject && question.chapter === chapter);
  const progress = getChapterProgress(subject, chapter, completedIds, questions);
  const difficultyCounts = getDifficultyCounts(chapterQuestions);
  const topTags = getTopTags(chapterQuestions);
  const status = getChapterStatus(progress.done, progress.total);
  const isDone = progress.total > 0 && progress.done >= progress.total;
  const isStarted = progress.done > 0 && !isDone;

  return (
    <button
      className={`min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-game disabled:cursor-not-allowed disabled:opacity-65 ${
        isDone ? "border-leaf/30 bg-leaf/12" : isStarted ? "border-coral/24 bg-coral/8" : "border-white/80 bg-white/86"
      }`}
      disabled={chapterQuestions.length === 0}
      onClick={() => startPractice(`${subject}:${chapter}`)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-tide">{subjectLabels[subject]}章节</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-ink">{chapter}</h3>
        </div>
        {isDone && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-leaf text-sm font-black text-white">✓</span>}
      </div>

      {chapterQuestions.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white/72 p-3 text-sm font-bold text-ink/52">这个章节还没有题目，稍后补充。</p>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-ink/58">
              <span>已完成 {progress.done} / {progress.total}</span>
              <span>{progress.percent}%</span>
            </div>
            <ProgressBar value={progress.percent} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(difficultyCounts).map(([difficulty, count]) => (
              <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-black text-ink/58" key={difficulty}>
                {difficultyLabels[difficulty as Difficulty]} {count}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/52" key={tag}>{tag}</span>
            ))}
          </div>

          <span className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-coral px-4 text-sm font-black text-white shadow-insetGame">
            {status}
          </span>
        </>
      )}
    </button>
  );
}
