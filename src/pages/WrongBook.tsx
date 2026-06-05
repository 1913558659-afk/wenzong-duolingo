import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { SubjectPill } from "@/components/SubjectPill";
import type { WrongAnswerRecord } from "@/types";

type WrongBookProps = {
  records: WrongAnswerRecord[];
  removeWrongAnswer: (id: string) => void;
  clearWrongAnswers: () => void;
};

export function WrongBook({ records, removeWrongAnswer, clearWrongAnswers }: WrongBookProps) {

  return (
    <div>
      <PageHeader title="错题本" subtitle="选择题答错后会自动加入这里，先看错因，再回去重做同类题。" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-ink/60">共 {records.length} 道错题</p>
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
        {records.map((record) => (
          <GameCard key={record.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SubjectPill subject={record.subject} />
                <span className="text-xs font-black text-ink/52">{record.chapter}</span>
              </div>
              <button className="min-h-10 rounded-full bg-ink/5 px-4 py-2 text-xs font-black text-ink/50 transition hover:bg-coral/12 hover:text-coral" onClick={() => removeWrongAnswer(record.id)} type="button">
                移除
              </button>
            </div>
            <h2 className="mt-3 text-lg font-black leading-snug text-ink">{record.question}</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-2xl bg-coral/10 p-3">
                <p className="text-xs font-black text-coral">你的答案</p>
                <p className="mt-1 text-sm font-bold text-ink">{record.selectedAnswer}</p>
              </div>
              <div className="rounded-2xl bg-leaf/10 p-3">
                <p className="text-xs font-black text-leaf">正确答案</p>
                <p className="mt-1 text-sm font-bold text-ink">{record.correctAnswer}</p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-gold/14 p-3">
              <p className="text-xs font-black text-ink/52">解析</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/72">{record.explanation}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/52" key={tag}>{tag}</span>
              ))}
            </div>
          </GameCard>
        ))}
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
