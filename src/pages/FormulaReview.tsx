import { useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Check, Clipboard, FileSearch, FlaskConical } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageHeader } from "@/components/PageHeader";
import { formulaSubjectConfig } from "@/data/formulaData";
import { importedFormulaData } from "@/data/importedFormulaData";
import { createFormulaCleanupTemplate, getFormulaQualityIssues } from "@/lib/formulaImportQuality";
import type { FormulaItem, FormulaSubject } from "@/data/formulaData";
import type { PageId } from "@/types";

export function FormulaReview({ navigate }: { navigate: (page: PageId) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const counts = {
    geography: importedFormulaData.filter((item) => item.subject === "geography").length,
    math: importedFormulaData.filter((item) => item.subject === "math").length,
    physics: importedFormulaData.filter((item) => item.subject === "physics").length
  };
  const reviewItems = importedFormulaData.map((item) => ({ item, issues: getFormulaQualityIssues(item) }));
  const cleanupCount = reviewItems.filter(({ issues }) => issues.length > 0).length;

  async function copyTemplate(item: FormulaItem) {
    const text = JSON.stringify(createFormulaCleanupTemplate(item), null, 2);
    setCopyError("");
    try {
      await copyText(text);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId((current) => current === item.id ? null : current), 1800);
    } catch {
      setCopyError("复制失败，请手动选择卡片内容。");
    }
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#FFFFFF_48%,#EAF5F2_100%)] px-5 py-6 sm:px-7">
        <PageHeader title="公式导入审核台" subtitle="这里用于检查 MinerU 导入公式，正式发布前需要人工整理标题、章节、变量解释和例题。" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white">开发者本地工具</span>
          <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-black text-coral">不会自动写回草稿文件</span>
          <button className="ml-auto rounded-2xl bg-white/80 px-4 py-2 text-xs font-black text-ink ring-1 ring-ink/10" onClick={() => navigate("formulaIsland")} type="button">返回公式岛</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="导入公式数量" value={importedFormulaData.length} />
        <Metric label="数学数量" value={counts.math} />
        <Metric label="物理数量" value={counts.physics} />
        <Metric label="地理数量" value={counts.geography} />
        <Metric alert={cleanupCount > 0} label="待清洗数量" value={cleanupCount} />
      </div>

      {copyError && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{copyError}</p>}

      {reviewItems.length > 0 ? (
        <div className="space-y-4">
          {reviewItems.map(({ item, issues }, index) => (
            <ReviewCard copied={copiedId === item.id} index={index} issues={issues} item={item} key={item.id} onCopy={() => copyTemplate(item)} />
          ))}
        </div>
      ) : (
        <GameCard className="border border-dashed border-tide/25 bg-white/70 py-14 text-center">
          <FileSearch className="mx-auto size-10 text-tide/45" />
          <h2 className="mt-3 text-lg font-black text-ink">暂无已导入公式</h2>
          <p className="mt-2 text-sm font-semibold text-ink/50">先批准草稿并运行 export-drafts-to-formula-data.js，再回到这里审核。</p>
        </GameCard>
      )}
    </div>
  );
}

function ReviewCard({ copied, index, issues, item, onCopy }: {
  copied: boolean;
  index: number;
  issues: ReturnType<typeof getFormulaQualityIssues>;
  item: FormulaItem;
  onCopy: () => void;
}) {
  const subjectLabel = formulaSubjectConfig[item.subject as FormulaSubject]?.label ?? item.subject;
  return (
    <GameCard className={issues.length ? "border border-coral/20 bg-white/76" : "border border-leaf/20 bg-white/76"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-black text-white">#{String(index + 1).padStart(2, "0")}</span>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-black text-ink">MinerU 导入</span>
            <span className="rounded-full bg-tide/10 px-3 py-1 text-[11px] font-black text-tide">{subjectLabel} · {item.chapter}</span>
            {issues.length > 0 && <span className="rounded-full bg-coral/10 px-3 py-1 text-[11px] font-black text-coral">待清洗 {issues.length} 项</span>}
          </div>
          <h2 className="mt-3 break-words text-xl font-black text-ink">{item.name}</h2>
          <p className="mt-1 break-all text-xs font-semibold text-ink/38">来源：{item.sourceFile || "未记录 sourceFile"}</p>
        </div>
        <button className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-xs font-black text-white transition hover:bg-tide" onClick={onCopy} type="button">
          {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
          {copied ? "已复制" : "复制整理模板"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <ReviewSection title="公式">
            <div className="overflow-x-auto rounded-2xl bg-ink px-4 py-3 text-center text-white">
              <MarkdownContent className="text-lg font-black" content={`$$${item.latex}$$`} />
            </div>
          </ReviewSection>
          <ReviewSection title="适用场景"><p>{item.scenario}</p></ReviewSection>
          <ReviewSection title="变量解释">
            {item.variables.length ? (
              <div className="space-y-2">
                {item.variables.map((variable, variableIndex) => (
                  <div className="grid gap-1 rounded-xl bg-ink/[0.04] px-3 py-2 sm:grid-cols-[110px_1fr]" key={`${variable.symbol}-${variableIndex}`}>
                    <span className="font-black text-tide">{variable.symbol}</span>
                    <span>{variable.meaning}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-coral">暂无变量解释</p>}
          </ReviewSection>
          <ReviewSection title="易错点">
            <ul className="list-disc space-y-1 pl-5">{item.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
          </ReviewSection>
          <ReviewSection title="示例题"><p>{item.example}</p></ReviewSection>
        </div>

        <div className="rounded-2xl bg-[#FFF6F3] p-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-5 text-coral" />
            <h3 className="text-sm font-black text-ink">整理建议</h3>
          </div>
          {issues.length > 0 ? (
            <div className="mt-3 space-y-3">
              {issues.map((issue) => (
                <div className="rounded-xl bg-white/80 p-3" key={issue.code}>
                  <p className="flex items-center gap-2 text-xs font-black text-coral"><AlertTriangle className="size-3.5" />{issue.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-ink/58">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-leaf/10 p-3 text-xs font-bold leading-5 text-leaf">未发现明显占位内容，仍建议人工核对公式和来源。</p>
          )}
        </div>
      </div>
    </GameCard>
  );
}

function ReviewSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-black text-ink/46">{title}</h3>
      <div className="text-sm font-semibold leading-6 text-ink/65">{children}</div>
    </section>
  );
}

function Metric({ alert = false, label, value }: { alert?: boolean; label: string; value: number }) {
  return (
    <GameCard className={alert ? "border border-coral/20 bg-coral/[0.06]" : "bg-white/76"}>
      <p className="text-xs font-black text-ink/45">{label}</p>
      <p className={`mt-2 text-3xl font-black ${alert ? "text-coral" : "text-ink"}`}>{value}</p>
    </GameCard>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for local or embedded browsers that expose but restrict Clipboard API.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}
