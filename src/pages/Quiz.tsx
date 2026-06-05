import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { QuizCard } from "@/components/QuizCard";
import { ProgressBar } from "@/components/ProgressBar";
import { challengeLevels, quizQuestions } from "@/data/questions";
import { subjectLabels } from "@/lib/labels";
import type { QuizQuestion } from "@/types";
import { markQuestionsCompleted } from "@/utils/progress";

type QuizProps = {
  selectedLevelId: string | null;
  onComplete: (correctAnswers: number, totalQuestions: number, earnedXp: number) => void;
  onWrongAnswer: (question: QuizQuestion, selectedAnswer: string) => void;
  goMap: () => void;
};

function getEncouragement(score: number, total: number) {
  if (score === total) {
    return "满分！这关你已经很稳了，可以去挑战下一关。";
  }
  if (score >= 3) {
    return "不错，核心知识已经抓住了。把错题解析再看一遍就更稳。";
  }
  return "没关系，先把解析读懂，再回教材卡片看核心问题。";
}

export function Quiz({ selectedLevelId, onComplete, onWrongAnswer, goMap }: QuizProps) {
  const level = challengeLevels.find((item) => item.id === selectedLevelId) ?? challengeLevels.find((item) => item.unlocked) ?? challengeLevels[0];
  const [levelSubject, levelChapter] = level.id.split(":");
  const questions = useMemo(
    () => quizQuestions.filter((question) => question.subject === levelSubject && question.chapter === levelChapter).slice(0, 5),
    [levelChapter, levelSubject]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  if (questions.length === 0) {
    return (
      <div>
        <PageHeader title="题目待补充" subtitle={`${subjectLabels[level.island]}岛 · ${level.name}`} />
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
  const earnedXp = correctAnswers * 10 + (questions.length - correctAnswers) * 2;

  function recordAnswer(isCorrect: boolean, selectedAnswer: string) {
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
    markQuestionsCompleted(questions.map((item) => item.id));
    onComplete(correctAnswers, questions.length, earnedXp);
    setSaved(true);
  }

  if (finished) {
    return (
      <div>
        <PageHeader title="本关完成" subtitle={`${subjectLabels[level.island]}岛 · ${level.name}`} />
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
          </div>
        </GameCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="选择题练习页" subtitle={`${subjectLabels[level.island]}岛 · ${level.name} · 每关 5 道单选题`} />
      <QuizCard
        currentNumber={questionIndex + 1}
        nextLabel={questionIndex + 1 >= questions.length ? "查看成绩" : "下一题"}
        onAnswer={recordAnswer}
        onNext={nextQuestion}
        question={question}
        total={questions.length}
      />
    </div>
  );
}
