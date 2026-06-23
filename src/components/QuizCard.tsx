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
  const questionType = question.questionType ?? "single_choice";
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<number[]>([]);
  const [submittedMultipleAnswers, setSubmittedMultipleAnswers] = useState<number[] | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [submittedFillAnswer, setSubmittedFillAnswer] = useState<string | null>(null);
  const isAnswered = questionType === "fill_blank"
    ? submittedFillAnswer !== null
    : questionType === "multiple_choice"
      ? submittedMultipleAnswers !== null
      : selectedAnswer !== null;
  const selectedOption = selectedAnswer === null ? "" : question.options[selectedAnswer];
  const multipleAnswer = (submittedMultipleAnswers ?? []).map((index) => String.fromCharCode(65 + index)).sort().join("");
  const isCorrect = questionType === "fill_blank"
    ? isFillAnswerCorrect(submittedFillAnswer ?? "", question.answer)
    : questionType === "multiple_choice"
      ? multipleAnswer === normalizeMultipleAnswer(question.answer)
      : selectedOption === question.answer;

  function isFillAnswerCorrect(value: string, correctAnswer: string) {
    const normalizedValue = value.trim().toLowerCase();
    return correctAnswer
      .split("|")
      .map((answer) => answer.trim().toLowerCase())
      .filter(Boolean)
      .some((answer) => answer === normalizedValue);
  }

  function choose(index: number) {
    if (isAnswered) {
      return;
    }
    setSelectedAnswer(index);
    onAnswer(question.options[index] === question.answer, question.options[index]);
  }

  function toggleMultiple(index: number) {
    if (isAnswered) return;
    setSelectedMultipleAnswers((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index].sort((a, b) => a - b));
  }

  function submitMultipleAnswers() {
    if (isAnswered || selectedMultipleAnswers.length === 0) return;
    const selected = [...selectedMultipleAnswers];
    const answer = selected.map((index) => String.fromCharCode(65 + index)).join("");
    setSubmittedMultipleAnswers(selected);
    onAnswer(normalizeMultipleAnswer(answer) === normalizeMultipleAnswer(question.answer), answer);
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setSelectedMultipleAnswers([]);
    setSubmittedMultipleAnswers(null);
    setFillAnswer("");
    setSubmittedFillAnswer(null);
    onNext();
  }

  function submitFillAnswer() {
    if (isAnswered) {
      return;
    }
    const answer = fillAnswer.trim();
    setSubmittedFillAnswer(answer);
    onAnswer(isFillAnswerCorrect(answer, question.answer), answer);
  }

  return (
    <GameCard className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SubjectPill subject={question.subject} />
          {question.imported && <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-black text-ink">MinerU 导入</span>}
        </div>
        <span className="text-xs font-black text-ink/52">{currentNumber} / {total}</span>
      </div>
      <div className="text-xl font-black leading-snug text-ink sm:text-2xl">
        <MarkdownContent content={question.question} />
      </div>
      {questionType === "fill_blank" ? (
        <div className="space-y-3">
          <input
            className={`min-h-14 w-full rounded-2xl border bg-white px-4 text-base font-bold text-ink outline-none transition focus:border-tide disabled:cursor-default ${
              isAnswered ? (isCorrect ? "border-leaf/55 bg-leaf/12 ring-2 ring-leaf/25" : "border-coral/55 bg-coral/12 ring-2 ring-coral/25") : "border-ink/10"
            }`}
            disabled={isAnswered}
            onChange={(event) => setFillAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitFillAnswer();
              }
            }}
            placeholder="请输入答案"
            value={fillAnswer}
          />
          <button
            className="min-h-12 w-full rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-tide disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
            disabled={isAnswered || !fillAnswer.trim()}
            onClick={submitFillAnswer}
            type="button"
          >
            提交答案
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {question.options.map((option, index) => {
          const isMultiple = questionType === "multiple_choice";
          const correctLetters = normalizeMultipleAnswer(question.answer);
          const isRightAnswer = isMultiple ? correctLetters.includes(String.fromCharCode(65 + index)) : option === question.answer;
          const isSelected = isMultiple ? selectedMultipleAnswers.includes(index) : selectedAnswer === index;
          const isSelectedWrong = isAnswered && isSelected && !isRightAnswer;
          const answerClass = isAnswered && isRightAnswer ? "border-leaf/55 bg-leaf/12 text-ink ring-2 ring-leaf/25" : "";
          const wrongClass = isSelectedWrong ? "border-coral/55 bg-coral/12 text-ink ring-2 ring-coral/25" : "";
          const selectedClass = !isAnswered && isMultiple && isSelected ? "border-tide/50 bg-tide/10 ring-2 ring-tide/20" : "";
          const mutedClass = isAnswered && !isRightAnswer && !isSelected ? "opacity-70" : "";

          return (
            <button
              className={`flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-left text-base font-bold text-ink shadow-insetGame transition hover:-translate-y-0.5 disabled:cursor-default sm:min-h-[64px] ${answerClass} ${wrongClass} ${selectedClass} ${mutedClass}`}
              disabled={isAnswered}
              key={`${question.id}-${index}`}
              onClick={() => isMultiple ? toggleMultiple(index) : choose(index)}
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
          {questionType === "multiple_choice" && (
            <button
              className="min-h-12 w-full rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame transition hover:bg-tide disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
              disabled={isAnswered || selectedMultipleAnswers.length === 0}
              onClick={submitMultipleAnswers}
              type="button"
            >
              提交多选答案
            </button>
          )}
        </div>
      )}
      {isAnswered && (
        <div className={`rounded-2xl border p-4 ${isCorrect ? "border-leaf/20 bg-leaf/14" : "border-coral/20 bg-coral/12"}`}>
          <p className={`text-sm font-black ${isCorrect ? "text-leaf" : "text-coral"}`}>{isCorrect ? "回答正确" : "先别急，这题再看一遍"}</p>
          {questionType === "fill_blank" && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-xs font-black text-coral">你的答案</p>
                <p className="mt-1 text-sm font-bold text-ink">{submittedFillAnswer || "未填写"}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-xs font-black text-leaf">正确答案</p>
                <p className="mt-1 text-sm font-bold text-ink">{question.answer}</p>
              </div>
            </div>
          )}
          <MarkdownContent className="mt-2 text-sm font-semibold text-ink/72" content={question.explanation} />
          <button className="sticky bottom-24 mt-4 w-full rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-tide sm:static sm:w-auto" onClick={nextQuestion} type="button">
            {nextLabel}
          </button>
        </div>
      )}
    </GameCard>
  );
}

function normalizeMultipleAnswer(value: string) {
  return [...new Set((value.toUpperCase().match(/[A-D]/g) ?? []))].sort().join("");
}
