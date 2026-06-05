import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { quizQuestions } from "@/data/questions";
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

function getSubjectQuestions(subject: Subject) {
  return quizQuestions.filter((question) => question.subject === subject);
}

function getSubjectChapters(subject: Subject) {
  return [...new Set(getSubjectQuestions(subject).map((question) => question.chapter))];
}

function buildModules(subject: Subject): ChallengeModule[] {
  const chapters = getSubjectChapters(subject);

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

export function ChallengeMap({ startPractice }: ChallengeMapProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const completedIds = getCompletedQuestionIds();
  const totalProgress = getTotalProgress(completedIds);

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
      <PageHeader title="文综闯关" subtitle="按学科和章节闯关，逐步完成高频考点训练" />

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
          const progress = getSubjectProgress(card.subject, completedIds);

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
  onBack,
  openModules,
  startPractice,
  subject,
  toggleModule
}: {
  completedIds: Set<string>;
  onBack: () => void;
  openModules: string[];
  startPractice: (levelId: string) => void;
  subject: Subject;
  toggleModule: (moduleName: string) => void;
}) {
  const modules = useMemo(() => buildModules(subject), [subject]);
  const progress = getSubjectProgress(subject, completedIds);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-[1.6rem] bg-ink p-5 text-white shadow-game sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-gold">学科详情</p>
            <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">{subjectLabels[subject]}闯关</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/72">
              已完成 {progress.done} / {progress.total}，完成百分比 {progress.percent}%
            </p>
          </div>
          <button
            className="min-h-12 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink shadow-insetGame transition hover:-translate-y-0.5 hover:bg-gold"
            onClick={onBack}
            type="button"
          >
            返回文综闯关页
          </button>
        </div>
        <div className="mt-5">
          <ProgressBar value={progress.percent} />
        </div>
      </div>

      <div className="space-y-4">
        {modules.length === 0 && (
          <GameCard className="py-8 text-center">
            <p className="text-xl font-black text-ink">这个学科还没有题目</p>
            <p className="mt-2 text-sm font-semibold text-ink/58">稍后在题库里补充后，这里会自动出现章节。</p>
          </GameCard>
        )}

        {modules.map((module) => {
          const moduleProgress = getModuleProgress(subject, module.chapters, completedIds);
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

function ChapterCard({
  chapter,
  completedIds,
  startPractice,
  subject
}: {
  chapter: string;
  completedIds: Set<string>;
  startPractice: (levelId: string) => void;
  subject: Subject;
}) {
  const questions = quizQuestions.filter((question) => question.subject === subject && question.chapter === chapter);
  const progress = getChapterProgress(subject, chapter, completedIds);
  const difficultyCounts = getDifficultyCounts(questions);
  const topTags = getTopTags(questions);
  const status = getChapterStatus(progress.done, progress.total);
  const isDone = progress.total > 0 && progress.done >= progress.total;
  const isStarted = progress.done > 0 && !isDone;

  return (
    <button
      className={`min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-game disabled:cursor-not-allowed disabled:opacity-65 ${
        isDone ? "border-leaf/30 bg-leaf/12" : isStarted ? "border-coral/24 bg-coral/8" : "border-white/80 bg-white/86"
      }`}
      disabled={questions.length === 0}
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

      {questions.length === 0 ? (
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
