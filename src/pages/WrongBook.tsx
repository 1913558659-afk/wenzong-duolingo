import { useState } from "react";
import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageHeader } from "@/components/PageHeader";
import { SubjectPill } from "@/components/SubjectPill";
import { resolveWrongQuestion } from "@/lib/api";
import type { QuizQuestion, WrongAnswerRecord } from "@/types";

type WrongBookProps = {
  records: WrongAnswerRecord[];
  questions: QuizQuestion[];
  removeWrongAnswer: (id: string) => void;
  clearWrongAnswers: () => void;
  syncError?: boolean;
  token?: string | null;
};

export function WrongBook({ records, questions, removeWrongAnswer, clearWrongAnswers, syncError = false, token }: WrongBookProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function masterQuestion(record: WrongAnswerRecord) {
    setMessage("");

    if (!token) {
      removeWrongAnswer(record.id);
      return;
    }

    setResolvingId(record.questionId);
    try {
      await resolveWrongQuestion(record.questionId, token);
      removeWrongAnswer(record.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "暂时无法同步，稍后再试");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="错题本" subtitle="选择题答错后会自动加入这里，先看错因，再回去重做同类题。" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-ink/60">共 {records.length} 道错题</p>
          {syncError && <p className="mt-1 text-xs font-black text-coral">暂时无法同步，已使用本地错题本</p>}
          {message && <p className="mt-1 text-xs font-black text-coral">{message}</p>}
        </div>
        <button
          className="min-h-11 rounded-2xl bg-ink px-4 py-2 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-coral disabled:cursor-not-allowed disabled:opacity-45"
          disabled={records.length === 0}
          onClick={clearWrongAnswers}
          type="button"
        >
          清空错题本
        </button>
      </div>

      <div className="space-y-4">
        {records.map((record) => {
          const matchedQuestion = questions.find((question) => question.id === record.questionId);
          const questionText = matchedQuestion?.question ?? record.question ?? "题目数据暂未匹配";
          const options = matchedQuestion?.options ?? record.options ?? [];
          const correctAnswer = matchedQuestion?.answer ?? record.correctAnswer ?? "题目数据暂未匹配";
          const explanation = matchedQuestion?.explanation ?? record.explanation ?? "题目数据暂未匹配";
          const tags = matchedQuestion?.tags ?? record.tags ?? [];
          const subject = matchedQuestion?.subject ?? record.subject;
          const chapter = matchedQuestion?.chapter ?? record.chapter;
          const questionType = matchedQuestion?.questionType ?? record.questionType ?? "single_choice";

          return (
          <GameCard key={record.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SubjectPill subject={subject} />
                <span className="text-xs font-black text-ink/52">{chapter}</span>
                <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-black text-coral">错误 {record.wrongCount ?? 1} 次</span>
              </div>
              <button
                className="min-h-10 rounded-full bg-leaf/12 px-4 py-2 text-xs font-black text-leaf transition hover:bg-leaf hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={resolvingId === record.questionId}
                onClick={() => masterQuestion(record)}
                type="button"
              >
                {resolvingId === record.questionId ? "同步中" : "标记已掌握"}
              </button>
            </div>
            <div className="mt-3 text-lg font-black leading-snug text-ink">
              <MarkdownContent content={questionText} />
            </div>
            {questionType === "single_choice" && options.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {options.map((option, index) => {
                  const isSelected = option === record.selectedAnswer;
                  const isCorrect = option === correctAnswer;

                  return (
                    <div
                      className={`rounded-2xl border px-3 py-2 text-sm font-bold leading-6 ${
                        isCorrect ? "border-leaf/30 bg-leaf/10 text-ink" : isSelected ? "border-coral/30 bg-coral/10 text-ink" : "border-white/70 bg-white/70 text-ink/66"
                      }`}
                      key={option}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-2xl bg-gold/14 p-3 text-sm font-bold text-ink/58">填空题无需选项，重点复盘答案和解析。</p>
            )}
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-2xl bg-coral/10 p-3">
                <p className="text-xs font-black text-coral">你的答案</p>
                <p className="mt-1 text-sm font-bold text-ink">{record.selectedAnswer}</p>
              </div>
              <div className="rounded-2xl bg-leaf/10 p-3">
                <p className="text-xs font-black text-leaf">正确答案</p>
                <p className="mt-1 text-sm font-bold text-ink">{correctAnswer}</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-gold/14 p-3">
              <p className="text-xs font-black text-ink/52">解析</p>
              <MarkdownContent className="mt-1 text-sm font-semibold text-ink/72" content={explanation} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/52" key={tag}>{tag}</span>
              ))}
            </div>
          </GameCard>
        );
        })}
      </div>

      {records.length === 0 && (
        <GameCard className="py-8 text-center">
          <p className="text-xl font-black text-ink">还没有错题，去闯一关吧</p>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/58">选择题答错后会自动加入这里，之后可以集中复习。</p>
        </GameCard>
      )}
    </div>
  );
}
