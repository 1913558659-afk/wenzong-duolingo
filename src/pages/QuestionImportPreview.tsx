import { FileQuestion, Info } from "lucide-react";
import type { ReactNode } from "react";
import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageHeader } from "@/components/PageHeader";
import { importedQuestionData } from "@/data/importedQuestionData";
import type { ImportedQuestionItem, ImportedQuestionType } from "@/data/importedQuestionData";
import type { PageId } from "@/types";

const typeLabels: Record<ImportedQuestionType, string> = {
  fill_blank: "填空题",
  multiple_choice: "多选题",
  single_choice: "单选题"
};

const subjectLabels: Record<string, string> = {
  biology: "生物",
  english: "英语",
  geography: "地理",
  history: "历史",
  math: "数学",
  physics: "物理",
  politics: "政治",
  unknown: "学科待确认"
};

export function QuestionImportPreview({ navigate }: { navigate: (page: PageId) => void }) {
  const counts = {
    fill: importedQuestionData.filter((item) => item.questionType === "fill_blank").length,
    multiple: importedQuestionData.filter((item) => item.questionType === "multiple_choice").length,
    single: importedQuestionData.filter((item) => item.questionType === "single_choice").length
  };

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <section className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#FFFFFF_50%,#EAF5F2_100%)] px-5 py-6 sm:px-7">
        <PageHeader title="题库导入预览" subtitle="查看已审核并导出的题目数据，确认格式后再决定是否合并到正式题库。" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white">开发者预览</span>
          <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-black text-coral">尚未进入正式闯关题库</span>
          <button className="ml-auto rounded-2xl bg-white/80 px-4 py-2 text-xs font-black text-ink ring-1 ring-ink/10" onClick={() => navigate("questionReview")} type="button">返回题库审核台</button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="已导入题目" value={importedQuestionData.length} />
        <Metric label="单选题" value={counts.single} />
        <Metric label="多选题" value={counts.multiple} />
        <Metric label="填空题" value={counts.fill} />
      </section>

      <div className="flex gap-3 rounded-2xl bg-gold/15 px-4 py-3 text-sm font-bold leading-6 text-ink/65">
        <Info className="mt-0.5 size-5 shrink-0 text-coral" />
        这是导入预览，数据仅来自 importedQuestionData.ts，未合并到正式闯关、练习或错题本。
      </div>

      {importedQuestionData.length ? (
        <section className="space-y-4">
          {importedQuestionData.map((item, index) => <PreviewCard index={index} item={item} key={item.id} />)}
        </section>
      ) : (
        <GameCard className="border border-dashed border-tide/25 bg-white/70 py-14 text-center">
          <FileQuestion className="mx-auto size-10 text-tide/45" />
          <h2 className="mt-3 text-lg font-black text-ink">暂无已审核导入题目</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/50">在 question-drafts.json 中批准题目后，运行导出脚本再刷新本页。</p>
        </GameCard>
      )}
    </div>
  );
}

function PreviewCard({ index, item }: { index: number; item: ImportedQuestionItem }) {
  return (
    <GameCard className="border border-tide/15 bg-white/76">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-black text-white">#{String(index + 1).padStart(2, "0")}</span>
        <span className="rounded-full bg-tide/10 px-3 py-1 text-[11px] font-black text-tide">{subjectLabels[item.subject] ?? item.subject} · {item.chapter}</span>
        <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-black text-ink">{typeLabels[item.questionType]}</span>
        <span className="rounded-full bg-leaf/10 px-3 py-1 text-[11px] font-black text-leaf">已审核导出</span>
      </div>

      <div className="mt-5 space-y-4">
        <PreviewSection title="题干"><MarkdownContent content={item.question} /></PreviewSection>
        {item.options.length > 0 && (
          <PreviewSection title="选项">
            <div className="grid gap-2 sm:grid-cols-2">
              {item.options.map((option, optionIndex) => (
                <div className="rounded-xl bg-ink/[0.04] px-3 py-2" key={`${option}-${optionIndex}`}><MarkdownContent content={option} /></div>
              ))}
            </div>
          </PreviewSection>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <PreviewSection title="答案"><div className="rounded-xl bg-leaf/10 px-3 py-2 text-leaf"><MarkdownContent content={item.answer || "暂无答案"} /></div></PreviewSection>
          <PreviewSection title="解析"><MarkdownContent content={item.explanation || "暂无解析"} /></PreviewSection>
        </div>
        <p className="break-all text-xs font-semibold text-ink/35">来源：{item.sourceFile || "未记录 sourceFile"}</p>
      </div>
    </GameCard>
  );
}

function PreviewSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-black text-ink/46">{title}</h3>
      <div className="text-sm font-semibold leading-6 text-ink/65">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <GameCard className="bg-white/76">
      <p className="text-xs font-black text-ink/45">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
    </GameCard>
  );
}
