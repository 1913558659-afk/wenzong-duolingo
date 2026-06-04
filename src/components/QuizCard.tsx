import { useState } from "react";
import { GameCard } from "@/components/GameCard";
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
    <GameCard className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <SubjectPill subject={question.subject} />
        <span className="text-xs font-black text-ink/52">{currentNumber} / {total}</span>
      </div>
      <h2 className="text-xl font-black leading-snug text-ink">{question.question}</h2>
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const answerClass = isAnswered && option === question.answer ? "border-leaf bg-leaf text-white" : "";
          const wrongClass = isAnswered && selectedAnswer === index && option !== question.answer ? "border-coral bg-coral text-white" : "";

          return (
            <button
              className={`w-full rounded-2xl border border-ink/10 bg-white p-3 text-left text-sm font-bold text-ink shadow-insetGame transition hover:-translate-y-0.5 ${answerClass} ${wrongClass}`}
              key={option}
              onClick={() => choose(index)}
              type="button"
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          );
        })}
      </div>
      {isAnswered && (
        <div className={`rounded-2xl p-4 ${isCorrect ? "bg-leaf/14" : "bg-coral/12"}`}>
          <p className={`text-sm font-black ${isCorrect ? "text-leaf" : "text-coral"}`}>{isCorrect ? "回答正确" : "先别急，这题再看一遍"}</p>
          <p className="mt-1 text-sm font-semibold text-ink/70">{question.explanation}</p>
          <button className="mt-3 rounded-2xl bg-ink px-4 py-2 text-sm font-black text-white shadow-insetGame" onClick={nextQuestion} type="button">
            {nextLabel}
          </button>
        </div>
      )}
    </GameCard>
  );
}
