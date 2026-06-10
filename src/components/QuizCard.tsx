import { useState } from "react";
import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { SubjectPill } from "@/components/SubjectPill";
import type { QuizQuestion } from "@/types";

type QuizCardProps = {
  question: QuizQuestion;
  currentNumber: number;
  total: number;
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void;
  onNext: () => void;
  nextLabel?: string;
};

export function QuizCard({ question, currentNumber, total, onAnswer, onNext, nextLabel = "下一题" }: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const isAnswered = selectedAnswer !== null;
  const selectedOption = selectedAnswer === null ? "" : question.options[selectedAnswer];
  const isCorrect = selectedOption === question.answer;

  function choose(index: number) {
    if (isAnswered) {
      return;
    }
    setSelectedAnswer(index);
    onAnswer(question.options[index] === question.answer, question.options[index]);
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    onNext();
  }

  return (
    <GameCard className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <SubjectPill subject={question.subject} />
        <span className="text-xs font-black text-ink/52">{currentNumber} / {total}</span>
      </div>
      <div className="text-xl font-black leading-snug text-ink sm:text-2xl">
        <MarkdownContent content={question.question} />
      </div>
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isRightAnswer = option === question.answer;
          const isSelectedWrong = isAnswered && selectedAnswer === index && !isRightAnswer;
          const answerClass = isAnswered && isRightAnswer ? "border-leaf/55 bg-leaf/12 text-ink ring-2 ring-leaf/25" : "";
          const wrongClass = isSelectedWrong ? "border-coral/55 bg-coral/12 text-ink ring-2 ring-coral/25" : "";
          const mutedClass = isAnswered && !isRightAnswer && selectedAnswer !== index ? "opacity-70" : "";

          return (
            <button
              className={`flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-left text-base font-bold text-ink shadow-insetGame transition hover:-translate-y-0.5 disabled:cursor-default sm:min-h-[64px] ${answerClass} ${wrongClass} ${mutedClass}`}
              disabled={isAnswered}
              key={`${question.id}-${index}`}
              onClick={() => choose(index)}
              type="button"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2 leading-6">
                <span className="shrink-0">{String.fromCharCode(65 + index)}.</span>
                <MarkdownContent className="min-w-0 flex-1 text-base font-bold" content={option} />
              </div>
              {isAnswered && isRightAnswer && (
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-leaf text-sm font-black text-white" aria-label="正确答案">
                  ✓
                </span>
              )}
              {isSelectedWrong && (
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-coral text-sm font-black text-white" aria-label="错误答案">
                  ×
                </span>
              )}
            </button>
          );
        })}
      </div>
      {isAnswered && (
        <div className={`rounded-2xl border p-4 ${isCorrect ? "border-leaf/20 bg-leaf/14" : "border-coral/20 bg-coral/12"}`}>
          <p className={`text-sm font-black ${isCorrect ? "text-leaf" : "text-coral"}`}>{isCorrect ? "回答正确" : "先别急，这题再看一遍"}</p>
          <MarkdownContent className="mt-2 text-sm font-semibold text-ink/72" content={question.explanation} />
          <button className="sticky bottom-24 mt-4 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-tide sm:static sm:w-auto" onClick={nextQuestion} type="button">
            {nextLabel}
          </button>
        </div>
      )}
    </GameCard>
  );
}
