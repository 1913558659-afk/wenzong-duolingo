import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { QuizCard } from "@/components/QuizCard";
import { ProgressBar } from "@/components/ProgressBar";
import { sendAnswerAttempt } from "@/lib/api";
import { subjectLabels } from "@/lib/labels";
import { normalizeSubjectCode } from "@/lib/subjects";
import type { QuestionType, QuizQuestion, Subject } from "@/types";
import { buildChallengeLevels } from "@/utils/challengeLevels";
import { normalizeChapterForSubject } from "@/utils/chapter";
import { markQuestionsCompleted } from "@/utils/progress";

type QuizProps = {
  selectedLevelId: string | null;
  onComplete: (correctAnswers: number, totalQuestions: number, earnedXp: number) => void;
  onWrongAnswer: (question: QuizQuestion, selectedAnswer: string) => void;
  goMap: () => void;
  questions: QuizQuestion[];
  token?: string | null;
};

const questionsPerLevel = 10;
const randomPracticeId = "random:true";

function questionTypeText(questionType: QuizQuestion["questionType"]) {
  return questionType === "fill_blank" ? "填空题" : "单选题";
}

function normalizeQuestionType(value?: string): QuestionType | undefined {
  return value === "fill_blank" || value === "single_choice" ? value : undefined;
}

function shuffleQuestions(questions: QuizQuestion[]) {
  const next = [...questions];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function getEncouragement(score: number, total: number) {
  if (score === total) {
    return "满分！这关你已经很稳了，可以去挑战下一关。";
  }
  if (score >= 3) {
    return "不错，核心知识已经抓住了。把错题解析再看一遍就更稳。";
  }
  return "没关系，先把解析读懂，再回教材卡片看核心问题。";
}

function parseLevel(selectedLevelId: string | null, questions: QuizQuestion[]) {
  if (selectedLevelId === randomPracticeId) {
    return {
      subject: "history" as Subject,
      chapter: "",
      levelIndex: 1,
      tag: "",
      random: true
    };
  }

  if (selectedLevelId?.includes(":")) {
    const [subject, ...rest] = selectedLevelId.split(":");
    const normalizedSubject = normalizeSubjectCode(subject);
    const typeMarkerIndex = rest.lastIndexOf("type");
    const questionType = typeMarkerIndex >= 0 ? normalizeQuestionType(rest[typeMarkerIndex + 1]) : undefined;
    const meaningfulRest = typeMarkerIndex >= 0 ? rest.slice(0, typeMarkerIndex) : rest;
    const marker = meaningfulRest[meaningfulRest.length - 2];
    const markerValue = meaningfulRest[meaningfulRest.length - 1];

    if (marker === "tag" && markerValue) {
      return {
        subject: normalizedSubject,
        chapter: normalizeChapterForSubject(normalizedSubject, meaningfulRest.slice(0, -2).join(":")),
        levelIndex: 1,
        tag: markerValue,
        questionType,
        random: false
      };
    }

    if (marker === "level") {
      const levelIndex = Number(markerValue);
      return {
        subject: normalizedSubject,
        chapter: normalizeChapterForSubject(normalizedSubject, meaningfulRest.slice(0, -2).join(":")),
        levelIndex: Number.isInteger(levelIndex) && levelIndex > 0 ? levelIndex : 1,
        tag: "",
        questionType,
        random: false
      };
    }

    const possibleLevel = Number(meaningfulRest[meaningfulRest.length - 1]);
    const hasLevelIndex = Number.isInteger(possibleLevel) && possibleLevel > 0;
    const chapterParts = hasLevelIndex ? meaningfulRest.slice(0, -1) : meaningfulRest;

    return {
      subject: normalizedSubject,
      chapter: normalizeChapterForSubject(normalizedSubject, chapterParts.join(":")),
      levelIndex: hasLevelIndex ? possibleLevel : 1,
      tag: "",
      questionType,
      random: false
    };
  }

  const fallback = questions[0];
  return { subject: fallback?.subject ?? "history", chapter: fallback?.chapter ?? "", levelIndex: 1, tag: "", questionType: fallback?.questionType, random: false };
}

export function Quiz({ selectedLevelId, onComplete, onWrongAnswer, goMap, questions: allQuestions, token }: QuizProps) {
  const level = parseLevel(selectedLevelId, allQuestions);
  const [randomSeed, setRandomSeed] = useState(0);
  const questions = useMemo(
    () => {
      if (level.random) {
        void randomSeed;
        return shuffleQuestions(allQuestions).slice(0, questionsPerLevel);
      }

      const chapterQuestions = allQuestions.filter((question) => question.subject === level.subject && normalizeChapterForSubject(level.subject, question.chapter) === level.chapter && (!level.questionType || (question.questionType ?? "single_choice") === level.questionType));
      if (level.tag) {
        return chapterQuestions.filter((question) => question.tags.includes(level.tag));
      }
      const levels = buildChallengeLevels({
        chapterTitle: level.chapter,
        questions: allQuestions.filter((question) => question.subject === level.subject && normalizeChapterForSubject(level.subject, question.chapter) === level.chapter),
        subjectName: subjectLabels[level.subject]
      });
      return levels[level.levelIndex - 1]?.questions ?? [];
    },
    [allQuestions, level.chapter, level.levelIndex, level.questionType, level.random, level.subject, level.tag, randomSeed]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  if (questions.length === 0) {
    return (
      <div>
        <PageHeader title={level.random ? "随机练习页" : "题目待补充"} subtitle={level.random ? "当前题库还没有可练习的题目" : `${subjectLabels[level.subject]}岛 · ${level.chapter || "未选择章节"} · ${level.tag || `第 ${level.levelIndex} 关`}`} />
        <GameCard className="space-y-3 text-center">
          <p className="text-sm font-semibold leading-6 text-ink/68">这个章节的数据结构已经准备好，题目内容还可以继续在 `src/data/questions.ts` 里添加。</p>
          <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-tide" onClick={goMap} type="button">
            返回闯关地图
          </button>
        </GameCard>
      </div>
    );
  }

  const question: QuizQuestion = questions[questionIndex % questions.length];
  const currentQuestionType = question.questionType ?? "single_choice";
  const currentQuestionTypeText = questionTypeText(currentQuestionType);
  const earnedXp = correctAnswers * 10 + (questions.length - correctAnswers) * 2;

  function recordAnswer(isCorrect: boolean, selectedAnswer: string) {
    if (token) {
      sendAnswerAttempt({ isCorrect, question, selectedAnswer, token }).catch(() => {
        // 后端暂时不可用时，不影响本地游客模式记录。
      });
    }

    if (isCorrect) {
      setCorrectAnswers((current) => current + 1);
      return;
    }
    onWrongAnswer(question, selectedAnswer);
  }

  function nextQuestion() {
    if (questionIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
  }

  function saveResult() {
    if (saved) {
      return;
    }
    if (!level.random) {
      markQuestionsCompleted(questions.map((item) => item.id));
    }
    onComplete(correctAnswers, questions.length, earnedXp);
    setSaved(true);
  }

  function refreshRandomQuestions() {
    setQuestionIndex(0);
    setCorrectAnswers(0);
    setFinished(false);
    setSaved(false);
    setRandomSeed((seed) => seed + 1);
  }

  if (finished) {
    return (
      <div>
      <PageHeader title={level.random ? "随机练习完成" : "本关完成"} subtitle={level.random ? "从全题库随机抽取 · 本次最多 10 道单选题" : `${subjectLabels[level.subject]}岛 · ${level.chapter} · ${level.tag || `第 ${level.levelIndex} 关`}`} />
        <GameCard className="space-y-5 text-center">
          <p className="text-sm font-black text-tide">你的得分</p>
          <p className="text-5xl font-black text-ink">{correctAnswers} / {questions.length}</p>
          <ProgressBar value={(correctAnswers / questions.length) * 100} />
          <p className="text-lg font-black text-coral">经验值 +{earnedXp}</p>
          <p className="text-sm font-semibold leading-6 text-ink/68">{getEncouragement(correctAnswers, questions.length)}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="rounded-2xl bg-tide px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70" disabled={saved} onClick={saveResult} type="button">
              {saved ? "经验值已保存" : "保存经验值"}
            </button>
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-coral" onClick={goMap} type="button">
              返回闯关地图
            </button>
            {level.random && (
              <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink sm:col-span-2" onClick={refreshRandomQuestions} type="button">
                换一组题
              </button>
            )}
          </div>
        </GameCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={level.random ? "随机练习页" : `${currentQuestionTypeText}练习页`} subtitle={level.random ? `从全题库随机抽取 · 本次最多 10 道${currentQuestionTypeText}` : `${subjectLabels[level.subject]}岛 · ${level.chapter} · ${level.tag || `第 ${level.levelIndex} 关`} · ${level.tag ? "标签专项练习" : `最多 10 道${currentQuestionTypeText}`}`} />
      {level.random && (
        <GameCard className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-tide">随机练习</p>
            <p className="mt-1 text-xs font-bold text-ink/56">本组题目不会写入闯关完成进度，做错仍会进入错题本。</p>
          </div>
          <button className="min-h-11 rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-coral" onClick={refreshRandomQuestions} type="button">
            换一组题
          </button>
        </GameCard>
      )}
      <QuizCard
        currentNumber={questionIndex + 1}
        key={`${question.id}-${randomSeed}`}
        nextLabel={questionIndex + 1 >= questions.length ? "查看成绩" : "下一题"}
        onAnswer={recordAnswer}
        onNext={nextQuestion}
        question={question}
        total={questions.length}
      />
    </div>
  );
}
