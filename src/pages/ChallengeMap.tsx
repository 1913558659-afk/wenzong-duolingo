import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Flag, Gift, Lock } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { subjectLabels } from "@/lib/labels";
import { SUBJECT_CONFIGS } from "@/lib/subjects";
import type { QuestionType, QuizQuestion, Subject } from "@/types";
import { compareChapters, defaultChaptersForSubject, normalizeChapterForSubject } from "@/utils/chapter";
import {
  getChapterProgress,
  getCompletedQuestionIds,
  getPercent,
  getSubjectProgress,
  getTotalProgress
} from "@/utils/progress";

type ChallengeMapProps = {
  questionSourceStatus: "loading" | "cloud" | "local";
  questions: QuizQuestion[];
  goHome: () => void;
  startPractice: (levelId: string) => void;
  startRandomPractice: () => void;
};

type MapNodeStatus = "done" | "current" | "locked";

type MapNode = {
  chapter: string;
  index: number;
  label: string;
  practiceId: string;
  subtitle: string;
  subject: Subject;
  status: MapNodeStatus;
  questionIds: string[];
  done: number;
  total: number;
  percent: number;
  progressKey: string;
  x: number;
  y: number;
  mobileX: number;
  mobileY: number;
};

type ChapterUnit = {
  id: string;
  name: string;
  questions: QuizQuestion[];
  type: "tag" | "level";
  questionType: QuestionType;
};

function questionTypeLabel(questionType: QuestionType) {
  return questionType === "fill_blank" ? "填空题" : "单选题";
}

function splitUnitsByQuestionType(units: Omit<ChapterUnit, "questionType">[]): ChapterUnit[] {
  return units.flatMap((unit) => {
    const groups = new Map<QuestionType, QuizQuestion[]>();
    unit.questions.forEach((question) => {
      const questionType = question.questionType ?? "single_choice";
      groups.set(questionType, [...(groups.get(questionType) ?? []), question]);
    });

    return [...groups.entries()].map(([questionType, unitQuestions]) => ({
      ...unit,
      id: `${unit.id}:type:${questionType}`,
      name: groups.size > 1 ? `${unit.name} · ${questionTypeLabel(questionType)}` : unit.name,
      questions: unitQuestions,
      questionType
    }));
  });
}

function getSubjectQuestions(subject: Subject, questions: QuizQuestion[]) {
  return questions.filter((question) => question.subject === subject);
}

function getSubjectChapters(subject: Subject, questions: QuizQuestion[]) {
  const realChapters = [...new Set(getSubjectQuestions(subject, questions).map((question) => normalizeChapterForSubject(subject, question.chapter)))]
    .sort((first, second) => compareChapters(subject, first, second));

  return realChapters.length > 0 ? realChapters : defaultChaptersForSubject(subject);
}

function getTagCounts(questions: QuizQuestion[]) {
  const tagCounts = new Map<string, number>();
  questions.forEach((question) => {
    question.tags.forEach((tag) => {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) ?? 0) + 1);
      }
    });
  });
  return tagCounts;
}

const questionsPerLevel = 10;

function getDesktopPosition(index: number, total: number) {
  if (total <= 1) {
    return { x: 50, y: 48 };
  }

  const x = 14 + (72 * index) / (total - 1);
  const y = index % 2 === 0 ? 57 : 38;
  return { x, y };
}

function getMobilePosition(index: number, total: number) {
  const x = index % 2 === 0 ? 30 : 70;
  const y = total <= 1 ? 48 : 10 + (82 * index) / (total - 1);
  return { x, y };
}

function buildRoutePath(nodes: Pick<MapNode, "x" | "y">[]) {
  if (nodes.length === 0) {
    return "";
  }

  return nodes.slice(1).reduce((path, node, index) => {
    const previous = nodes[index];
    const controlOffset = (node.x - previous.x) * 0.48;
    return `${path} C ${previous.x + controlOffset} ${previous.y}, ${node.x - controlOffset} ${node.y}, ${node.x} ${node.y}`;
  }, `M ${nodes[0].x} ${nodes[0].y}`);
}

function buildMobileRoutePath(nodes: Pick<MapNode, "mobileX" | "mobileY">[]) {
  if (nodes.length === 0) {
    return "";
  }

  return nodes.slice(1).reduce((path, node, index) => {
    const previous = nodes[index];
    const middleY = (previous.mobileY + node.mobileY) / 2;
    return `${path} C ${previous.mobileX} ${middleY}, ${node.mobileX} ${middleY}, ${node.mobileX} ${node.mobileY}`;
  }, `M ${nodes[0].mobileX} ${nodes[0].mobileY}`);
}

function buildChapterUnits(chapterQuestions: QuizQuestion[]): ChapterUnit[] {
  const tagCounts = getTagCounts(chapterQuestions);
  const topTags = [...tagCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  if (topTags.length >= 2) {
    const groups = new Map<string, QuizQuestion[]>(topTags.map((tag) => [tag, []]));
    const fallbackQuestions: QuizQuestion[] = [];

    chapterQuestions.forEach((question) => {
      const matchedTag = topTags.find((tag) => question.tags.includes(tag));
      if (matchedTag) {
        groups.get(matchedTag)?.push(question);
      } else {
        fallbackQuestions.push(question);
      }
    });

    const units: Omit<ChapterUnit, "questionType">[] = [...groups.entries()]
      .filter(([, unitQuestions]) => unitQuestions.length > 0)
      .map(([tag, unitQuestions]) => ({
        id: `tag:${tag}`,
        name: tag,
        questions: unitQuestions,
        type: "tag" as const
      }));

    if (fallbackQuestions.length > 0) {
      if (units.length < 5) {
        units.push({
          id: "level:extra",
          name: "综合训练",
          questions: fallbackQuestions,
          type: "level" as const
        });
      } else {
        units[units.length - 1].questions.push(...fallbackQuestions);
      }
    }

    return splitUnitsByQuestionType(units).slice(0, 6);
  }

  const levelCount = Math.max(1, Math.ceil(chapterQuestions.length / questionsPerLevel));
  return splitUnitsByQuestionType(Array.from({ length: levelCount }).map((_, index) => {
    const start = index * questionsPerLevel;
    return {
      id: `level:${index + 1}`,
      name: `${start + 1}-${Math.min(start + questionsPerLevel, chapterQuestions.length)} 题`,
      questions: chapterQuestions.slice(start, start + questionsPerLevel),
      type: "level" as const
    };
  }));
}

function buildMapNodes(subject: Subject, chapter: string, completedIds: Set<string>, questions: QuizQuestion[]): MapNode[] {
  if (!chapter) {
    return [];
  }

  const normalizedChapter = normalizeChapterForSubject(subject, chapter);
  const currentQuestions = questions.filter((question) => question.subject === subject && normalizeChapterForSubject(subject, question.chapter) === normalizedChapter);
  const units = buildChapterUnits(currentQuestions);
  const levelCount = units.length;
  let foundCurrent = false;

  return units.map((unit, index) => {
    const levelQuestions = unit.questions;
    const doneCount = levelQuestions.filter((question) => completedIds.has(question.id)).length;
    const total = levelQuestions.length;
    const done = total > 0 && doneCount >= total;
    let status: MapNodeStatus = "locked";

    if (done) {
      status = "done";
    } else if (!foundCurrent) {
      status = "current";
      foundCurrent = true;
    }

    if (index === 0 && total === 0) {
      status = "current";
    }

    const position = getDesktopPosition(index, levelCount);
    const mobilePosition = getMobilePosition(index, levelCount);
    const practiceId = unit.type === "tag" ? `${subject}:${normalizedChapter}:tag:${unit.name}:type:${unit.questionType}` : `${subject}:${normalizedChapter}:level:${index + 1}:type:${unit.questionType}`;
    return {
      chapter: normalizedChapter,
      index: index + 1,
      label: `第 ${index + 1} 关`,
      practiceId,
      subtitle: total > 0 ? `${unit.name} · ${total} 题 · ${questionTypeLabel(unit.questionType)}` : "题目待补充",
      subject,
      status,
      questionIds: levelQuestions.map((question) => question.id),
      done: doneCount,
      total,
      percent: getPercent(doneCount, total),
      progressKey: `levelProgress:${subject}:${normalizedChapter}:${unit.id}`,
      x: position.x,
      y: position.y,
      mobileX: mobilePosition.x,
      mobileY: mobilePosition.y
    };
  });
}

export function ChallengeMap({ goHome, questionSourceStatus, questions, startPractice, startRandomPractice }: ChallengeMapProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const completedIds = getCompletedQuestionIds();
  const totalProgress = getTotalProgress(completedIds, questions);

  function openSubject(subject: Subject) {
    setSelectedSubject(subject);
  }

  if (selectedSubject) {
    return (
      <SubjectDetail
        completedIds={completedIds}
        questionSourceStatus={questionSourceStatus}
        questions={questions}
        goHome={goHome}
        onBack={() => setSelectedSubject(null)}
        startPractice={startPractice}
        startRandomPractice={startRandomPractice}
        subject={selectedSubject}
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
        {SUBJECT_CONFIGS.map((card) => {
          const progress = getSubjectProgress(card.code, completedIds, questions);

          return (
            <button className="group min-w-0 text-left" key={card.code} onClick={() => openSubject(card.code)} type="button">
              <GameCard className={`h-full bg-gradient-to-br ${card.accent} transition group-hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-tide">学科入口</p>
                    <h2 className="mt-1 text-2xl font-black leading-tight text-ink">{card.name}</h2>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-ink/58">暂无正确率</span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/66">{card.description}</p>
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
  goHome,
  questionSourceStatus,
  questions,
  onBack,
  startPractice,
  startRandomPractice,
  subject
}: {
  completedIds: Set<string>;
  goHome: () => void;
  questionSourceStatus: "loading" | "cloud" | "local";
  questions: QuizQuestion[];
  onBack: () => void;
  startPractice: (levelId: string) => void;
  startRandomPractice: () => void;
  subject: Subject;
}) {
  const chapters = useMemo(() => getSubjectChapters(subject, questions), [questions, subject]);
  const [selectedChapter, setSelectedChapter] = useState(() => getSubjectChapters(subject, questions)[0] ?? "");

  useEffect(() => {
    if (chapters.length === 0) {
      setSelectedChapter("");
      return;
    }

    if (!selectedChapter || !chapters.includes(selectedChapter)) {
      setSelectedChapter(chapters[0]);
    }
  }, [chapters, selectedChapter]);

  const progress = getSubjectProgress(subject, completedIds, questions);
  const chapterProgress = selectedChapter ? getChapterProgress(subject, selectedChapter, completedIds, questions) : { done: 0, total: 0, percent: 0 };
  const subjectQuestionCount = getSubjectQuestions(subject, questions).length;
  const subjectEmpty = subjectQuestionCount === 0;
  const chapterEmpty = !subjectEmpty && chapterProgress.total === 0;
  const mapNodes = useMemo(() => buildMapNodes(subject, selectedChapter, completedIds, questions), [completedIds, questions, selectedChapter, subject]);
  const desktopRoutePath = buildRoutePath(mapNodes);
  const mobileRoutePath = buildMobileRoutePath(mapNodes);
  const mobileMapHeight = Math.max(700, 210 + mapNodes.length * 96);
  const rewardTotal = Math.max(chapterProgress.total, 36);
  const rewardDone = Math.min(rewardTotal, Math.max(chapterProgress.done, Math.round((chapterProgress.percent / 100) * rewardTotal)));

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
            <p className="truncate text-sm font-black text-ink">闯关地图 / {subjectLabels[subject]}</p>
            <p className="mt-0.5 text-xs font-bold text-ink/52">
              当前章节：{selectedChapter || "暂无章节"} · {questionSourceStatus === "cloud" ? "云端题库" : questionSourceStatus === "loading" ? "题库加载中" : "本地题库"}
            </p>
          </div>
          <div className="rounded-2xl bg-white/78 px-3 py-2 text-right shadow-[0_8px_22px_rgba(16,36,63,0.06)]">
            <p className="text-[11px] font-black text-tide">{subjectLabels[subject]}总进度</p>
            <p className="text-lg font-black text-ink">{progress.percent}%</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-white/72 p-3 shadow-[0_12px_30px_rgba(16,36,63,0.06)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-ink">选择章节</p>
            <p className="mt-1 text-xs font-bold leading-5 text-ink/48">按真实题库章节切换，章节全部开放，可自由进入学习</p>
          </div>
          <p className="shrink-0 rounded-full bg-[#EAF5F2] px-3 py-1 text-xs font-black text-tide">{chapters.length} 个章节</p>
        </div>
        {chapters.length === 0 ? (
          <p className="rounded-2xl bg-[#F7F1E4]/72 px-3 py-2 text-sm font-bold text-ink/54">这个学科还没有章节题目，补充题库后会自动出现。</p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1 pb-1.5 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2.5">
              {chapters.map((chapter) => {
                const active = chapter === selectedChapter;
                const itemProgress = getChapterProgress(subject, chapter, completedIds, questions);

                return (
                  <button
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-black transition ${
                      active
                        ? "border-ink bg-ink text-white shadow-[0_12px_24px_rgba(16,36,63,0.20)]"
                        : "border-white/80 bg-[#FFF8EC]/82 text-ink/68 shadow-[0_6px_16px_rgba(16,36,63,0.04)] hover:-translate-y-0.5 hover:bg-white hover:text-tide"
                    }`}
                    key={chapter}
                    onClick={() => setSelectedChapter(chapter)}
                    type="button"
                  >
                    <span>{chapter}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/14 text-white/72" : "bg-ink/5 text-ink/42"}`}>
                      {itemProgress.total > 0 ? `${itemProgress.total} 题` : "待导入"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {subjectEmpty || chapterEmpty ? (
        <EmptyQuestionState
          onHome={goHome}
          onRandomPractice={startRandomPractice}
          subtitle={
            subjectEmpty
              ? "当前学科还没有导入题目。导入题库后，将自动生成章节地图与关卡路线。"
              : "本章节还没有可练习的题目。补充题库后，这里会自动生成章节内关卡。"
          }
          title={subjectEmpty ? `${subjectLabels[subject]}岛题库建设中` : "本章节题库建设中"}
        />
      ) : (
      <section className="relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-[#F7F1E4] shadow-[0_18px_48px_rgba(16,36,63,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_9%,rgba(20,150,163,0.13),transparent_16rem),radial-gradient(circle_at_88%_14%,rgba(233,91,79,0.065),transparent_18rem),radial-gradient(circle_at_50%_86%,rgba(247,241,228,0.86),transparent_18rem),linear-gradient(180deg,#FAF4E8_0%,#F8F1E4_46%,#EAF5F2_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#0B1F3A_0.68px,transparent_0.68px)] [background-size:18px_18px]" />
        <div className="pointer-events-none absolute left-[11%] top-[18%] size-2 rounded-full bg-[#1496A3]/18 blur-[1px]" />
        <div className="pointer-events-none absolute right-[18%] top-[22%] size-1.5 rounded-full bg-[#E95B4F]/18 blur-[1px]" />
        <div className="pointer-events-none absolute right-[28%] bottom-[24%] size-2 rounded-full bg-[#F3B24A]/22 blur-[1px]" />

        <div className="relative hidden h-[600px] md:block">
          <InkMountainBackground variant="desktop" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d={desktopRoutePath} fill="none" stroke="#F7F1E4" strokeLinecap="round" strokeWidth="2.1" opacity=".55" />
            <path d={desktopRoutePath} fill="none" stroke="#78958D" strokeDasharray="1.4 3" strokeLinecap="round" strokeWidth="0.95" opacity=".78" />
            <path d={desktopRoutePath} fill="none" stroke="#1496A3" strokeDasharray="1 5" strokeLinecap="round" strokeWidth="0.45" opacity=".26" />
          </svg>
          {chapters.length === 0 && (
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

        <div className="relative md:hidden" style={{ height: `${mobileMapHeight}px` }}>
          <InkMountainBackground variant="mobile" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 112">
            <path d={mobileRoutePath} fill="none" stroke="#F7F1E4" strokeLinecap="round" strokeWidth="2.2" opacity=".58" />
            <path d={mobileRoutePath} fill="none" stroke="#78958D" strokeDasharray="2 3.2" strokeLinecap="round" strokeWidth="1.15" opacity=".74" />
            <path d={mobileRoutePath} fill="none" stroke="#1496A3" strokeDasharray="1 5" strokeLinecap="round" strokeWidth=".5" opacity=".24" />
          </svg>
          {mapNodes.map((node) => (
            <MapLevelNode key={`${node.label}-${node.index}-mobile`} mode="mobile" node={node} startPractice={startPractice} />
          ))}
        </div>

        <ChapterProgressReward chapter={selectedChapter} percent={chapterProgress.percent} questionDone={chapterProgress.done} questionTotal={chapterProgress.total} rewardDone={rewardDone} rewardTotal={rewardTotal} unitDone={mapNodes.filter((node) => node.status === "done").length} unitTotal={mapNodes.length} />
      </section>
      )}

    </div>
  );
}

function EmptyQuestionState({
  onHome,
  onRandomPractice,
  subtitle,
  title
}: {
  onHome: () => void;
  onRandomPractice: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <GameCard className="overflow-hidden bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Coming Soon</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink/60">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="min-h-11 rounded-2xl bg-ink px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-tide" onClick={onHome} type="button">
            返回首页
          </button>
          <button className="min-h-11 rounded-2xl bg-white px-5 text-sm font-black text-ink shadow-[0_10px_24px_rgba(16,36,63,0.08)] transition hover:-translate-y-0.5 hover:text-coral" onClick={onRandomPractice} type="button">
            去随机练习
          </button>
        </div>
      </div>
    </GameCard>
  );
}

function InkMountainBackground({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <>
      <svg className="pointer-events-none absolute inset-x-0 bottom-10 h-[86%] w-full blur-[0.2px]" preserveAspectRatio="none" viewBox="0 0 1000 620">
        <path d="M0 300 C100 222 178 270 292 166 C430 42 514 222 616 122 C730 10 828 172 1000 68 L1000 620 L0 620 Z" fill="#DCEAE4" opacity={variant === "desktop" ? ".70" : ".58"} />
        <path d="M0 382 C122 286 232 338 360 222 C492 102 590 310 722 196 C835 98 920 218 1000 145 L1000 620 L0 620 Z" fill="#C9DDD4" opacity={variant === "desktop" ? ".50" : ".40"} />
        <path d="M0 500 C130 410 250 440 365 355 C510 248 620 458 750 326 C865 212 930 332 1000 276 L1000 620 L0 620 Z" fill="#AFC8BE" opacity={variant === "desktop" ? ".24" : ".18"} />
        <path d="M0 550 C180 488 276 528 420 464 C570 396 680 535 820 454 C910 402 960 430 1000 398 L1000 620 L0 620 Z" fill="#8FAEA4" opacity={variant === "desktop" ? ".10" : ".08"} />
      </svg>
      <div className="pointer-events-none absolute left-8 top-20 h-16 w-56 rounded-full bg-white/38 blur-2xl" />
      <div className="pointer-events-none absolute right-10 top-32 h-20 w-72 rounded-full bg-white/32 blur-2xl" />
      <div className="pointer-events-none absolute bottom-32 left-1/3 h-16 w-64 rounded-full bg-[#F7F1E4]/50 blur-2xl" />
      <div className="pointer-events-none absolute left-[18%] top-[28%] h-8 w-24 rounded-full bg-white/24 blur-xl" />
      <div className="pointer-events-none absolute right-[22%] bottom-[36%] h-10 w-32 rounded-full bg-white/20 blur-xl" />
    </>
  );
}

function MapLevelNode({ mode, node, startPractice }: { mode: "desktop" | "mobile"; node: MapNode; startPractice: (levelId: string) => void }) {
  const clickable = node.status !== "locked";
  const statusLabel = node.status === "done" ? "已完成" : node.status === "current" ? "进行中" : "未解锁";
  const nodeClass =
    node.status === "done"
      ? "bg-[#1496A3] text-white shadow-[0_14px_28px_rgba(20,150,163,0.28)]"
      : node.status === "current"
        ? "bg-[#E95B4F] text-white shadow-[0_0_0_8px_rgba(233,91,79,0.10),0_16px_30px_rgba(233,91,79,0.34)]"
        : "bg-[#273446]/72 text-white/76 shadow-[0_8px_18px_rgba(39,52,70,0.13)] backdrop-blur";
  const left = mode === "mobile" ? node.mobileX : node.x;
  const top = mode === "mobile" ? node.mobileY : node.y;
  const nodeSize = mode === "mobile" ? (node.status === "current" ? "size-14" : "size-12") : (node.status === "current" ? "size-16" : "size-14");
  const labelWidth = mode === "mobile" ? "w-[138px]" : "w-[168px]";

  return (
    <button
      className="absolute min-w-[112px] -translate-x-1/2 -translate-y-1/2 text-center transition enabled:hover:-translate-y-[54%] disabled:cursor-not-allowed"
      disabled={!clickable}
      onClick={() => startPractice(node.practiceId)}
      style={{ left: `${left}%`, top: `${top}%` }}
      type="button"
      title={node.progressKey}
    >
      <span className="relative inline-grid">
        {node.status === "current" && (
          <span className="absolute -right-3 -top-6 text-[#E95B4F]">
            <Flag className="size-7 fill-current" />
          </span>
        )}
        {node.status === "done" && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-white bg-[#F3B24A] text-[10px] font-black text-white">✓</span>}
        <span className={`grid ${nodeSize} place-items-center border-[4px] border-white text-lg font-black ${node.status === "done" ? "rounded-[1.05rem]" : "rounded-2xl"} ${nodeClass}`}>
          {node.status === "locked" ? <Lock className="size-4" /> : node.index}
        </span>
      </span>
      <span className={`mx-auto mt-2 block ${labelWidth} rounded-[1rem] border border-white/80 bg-[#FFFCF5]/86 px-3 py-2 text-ink shadow-[0_8px_18px_rgba(16,36,63,0.09)] backdrop-blur`}>
        <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-ink/42">{node.label}</span>
        <span className="mt-0.5 line-clamp-2 block text-[12px] font-black leading-4 text-ink">{node.subtitle.split(" · ")[0]}</span>
        <span className={`mt-1 block text-[10px] font-black ${node.status === "done" ? "text-[#1496A3]" : node.status === "current" ? "text-[#E95B4F]" : "text-ink/40"}`}>
          {node.total} 题 · {node.status === "locked" ? "完成前一关后开启" : statusLabel}
        </span>
      </span>
    </button>
  );
}

function ChapterProgressReward({
  chapter,
  percent,
  questionDone,
  questionTotal,
  rewardDone,
  rewardTotal,
  unitDone,
  unitTotal
}: {
  chapter: string;
  percent: number;
  questionDone: number;
  questionTotal: number;
  rewardDone: number;
  rewardTotal: number;
  unitDone: number;
  unitTotal: number;
}) {
  return (
    <div className="relative z-10 mx-3 mb-3 rounded-[1.25rem] border border-white/80 bg-white/90 p-3 shadow-[0_12px_34px_rgba(16,36,63,0.10)] backdrop-blur md:absolute md:inset-x-5 md:bottom-5 md:mx-0 md:mb-0 md:rounded-[1.4rem] md:p-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-tide">Chapter Overview</p>
          <p className="mt-1 truncate text-sm font-black text-ink sm:text-base">{chapter || "暂无章节"}</p>
          <p className="mt-1 text-xs font-bold text-ink/52">本章 {questionTotal} 题 · 已完成 {questionDone} 题 · {unitTotal} 个学习单元 · 已完成 {unitDone} 个</p>
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-ink/58">
            <span>章节进度</span>
            <span>{percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-[#1496A3]" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-[#F7F1E4] text-[#E95B4F] shadow-[inset_0_-2px_0_rgba(16,36,63,0.06)]" title={`完成本章节获得 ${rewardDone} / ${rewardTotal}`}>
          <Gift className="size-6" />
        </span>
      </div>
    </div>
  );
}
