import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import {
  isPartnerChessAnswerCorrect,
  sourceLabel,
  type PartnerChessQuizQuestion
} from "@/utils/partnerChessQuestionAdapter";

export function PrepQuizPanel({
  answers,
  onAnswer,
  onSubmit,
  questions,
  selectedSubjectLabel,
  sourceSummary
}: {
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  questions: PartnerChessQuizQuestion[];
  selectedSubjectLabel: string;
  sourceSummary: {
    realCount: number;
    mockCount: number;
    insufficientRealQuestions: boolean;
  };
}) {
  const allAnswered = questions.every((question) => answers[question.id]);
  const sourceText = sourceSummary.mockCount > 0 && sourceSummary.realCount > 0
    ? "真实题库 + fallback 备战题"
    : sourceSummary.mockCount > 0
      ? "fallback 备战题"
      : "真实题库";

  return (
    <GameCard className="bg-white/68">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-ink">备战答题</h2>
          <p className="mt-1 text-sm font-semibold text-ink/56">答对 1 题获得 1 点灵感点；本轮全对会触发完美备战。</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-tide/10 px-3 py-1.5 text-tide">当前科目：{selectedSubjectLabel}</span>
            <span className="rounded-full bg-white/70 px-3 py-1.5 text-ink/58">本轮题目：{questions.length} 道</span>
            <span className="rounded-full bg-white/70 px-3 py-1.5 text-ink/58">题目来源：{sourceText}</span>
          </div>
          {sourceSummary.insufficientRealQuestions && (
            <p className="mt-2 text-xs font-bold leading-5 text-coral">当前科目题目不足，已使用备战题补充。</p>
          )}
        </div>
        <button
          className={`min-h-11 rounded-2xl px-4 text-sm font-black transition ${allAnswered ? "bg-tide text-white hover:bg-ink" : "cursor-not-allowed bg-ink/8 text-ink/36"}`}
          disabled={!allAnswered}
          onClick={onSubmit}
          type="button"
        >
          完成备战
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {questions.map((question, index) => (
          <div className="rounded-3xl bg-[#F7F3E7]/72 p-4 ring-1 ring-white/80" key={question.id}>
            <p className="text-xs font-black text-tide">
              第 {index + 1} / {questions.length} 题 · {question.subject} · {question.difficulty} · {sourceLabel(question.source)}
            </p>
            <div className="mt-2 text-base font-black leading-7 text-ink">
              <MarkdownContent content={question.question} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const letter = String.fromCharCode(65 + optionIndex);
                const active = answers[question.id] === letter;
                const answered = Boolean(answers[question.id]);
                const isCorrect = isPartnerChessAnswerCorrect(question, letter);
                const wrongSelected = answered && active && !isCorrect;
                return (
                  <button
                    className={`min-h-12 rounded-2xl border px-3 text-left text-sm font-bold transition ${
                      answered && isCorrect
                        ? "border-leaf/40 bg-leaf/10 text-ink"
                        : wrongSelected
                          ? "border-coral/40 bg-coral/10 text-ink"
                          : active
                            ? "border-tide bg-tide/10 text-tide"
                            : "border-white bg-white/72 text-ink/68 hover:border-tide/30 hover:text-ink"
                    }`}
                    key={option}
                    disabled={answered}
                    onClick={() => onAnswer(question.id, letter)}
                    type="button"
                  >
                    <span className="mr-1">{letter}.</span>
                    <MarkdownContent className="inline-block align-top" content={option} />
                  </button>
                );
              })}
            </div>
            {answers[question.id] && (
              <div className="mt-3 rounded-2xl border border-white/80 bg-white/68 p-3">
                <p className={`text-xs font-black ${isPartnerChessAnswerCorrect(question, answers[question.id]) ? "text-leaf" : "text-coral"}`}>
                  {isPartnerChessAnswerCorrect(question, answers[question.id]) ? "回答正确" : "回答错误"}
                </p>
                <p className="mt-1 text-xs font-bold text-ink/58">正确答案：{question.answer}</p>
                {question.explanation && (
                  <MarkdownContent className="mt-2 text-sm font-semibold text-ink/70" content={question.explanation} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </GameCard>
  );
}
