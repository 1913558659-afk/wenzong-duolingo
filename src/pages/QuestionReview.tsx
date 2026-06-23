import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Check, Clipboard, FileQuestion, FlaskConical } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageHeader } from "@/components/PageHeader";
import type { PageId } from "@/types";

type QuestionType = "fill_blank" | "multiple_choice" | "single_choice" | string;

type QuestionDraft = {
  analysis: string;
  answer: string;
  chapter: string;
  difficulty: string;
  explanation: string;
  id: string;
  options: string[];
  sourceFile: string;
  status: string;
  stem: string;
  subject: string;
  tags: string[];
  type: QuestionType;
};

type QualityIssue = {
  code: string;
  label: string;
  suggestion: string;
};

const typeLabels: Record<string, string> = {
  fill_blank: "填空题",
  multiple_choice: "多选题",
  single_choice: "选择题"
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

export function QuestionReview({ navigate }: { navigate: (page: PageId) => void }) {
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3500);
    let active = true;

    async function loadDrafts() {
      try {
        const response = await fetch("http://127.0.0.1:8787/api/question-drafts", {
          signal: controller.signal
        });
        const payload = await response.json() as { drafts?: Record<string, unknown>[]; error?: string; ok?: boolean };
        if (!response.ok || !payload.ok || !Array.isArray(payload.drafts)) {
          throw new Error(payload.error || "无法读取题目草稿");
        }
        if (active) setDrafts(payload.drafts.map(normalizeDraft));
      } catch {
        if (active) setLoadError("请先运行 npm run formula:admin，并使用 question:import 生成 question-drafts.json。");
      } finally {
        window.clearTimeout(timer);
        if (active) setLoading(false);
      }
    }

    void loadDrafts();
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const reviewed = useMemo(() => drafts.map((draft) => ({
    draft,
    issues: qualityIssues(draft)
  })), [drafts]);
  const counts = {
    fill: drafts.filter((draft) => draft.type === "fill_blank").length,
    multiple: drafts.filter((draft) => draft.type === "multiple_choice").length,
    single: drafts.filter((draft) => draft.type === "single_choice").length
  };
  const cleanupCount = reviewed.filter(({ issues }) => issues.length > 0).length;

  async function copyTemplate(draft: QuestionDraft) {
    setCopyError("");
    try {
      await copyText(JSON.stringify(draft, null, 2));
      setCopiedId(draft.id);
      window.setTimeout(() => setCopiedId((current) => current === draft.id ? null : current), 1800);
    } catch {
      setCopyError("复制失败，请手动选择卡片内容。");
    }
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <section className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#FFFFFF_50%,#EAF5F2_100%)] px-5 py-6 sm:px-7">
        <PageHeader title="题库导入审核台" subtitle="这里用于检查 MinerU 提取的题目草稿。正式导入题库前，需要人工确认题干、选项、答案和解析。" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white">开发者本地工具</span>
          <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-black text-coral">不会自动发布题目</span>
          <span className="rounded-full bg-tide/10 px-3 py-1.5 text-xs font-black text-tide">
            {loading ? "正在读取题目草稿..." : "当前查看：question-drafts.json"}
          </span>
          <button className="ml-auto rounded-2xl bg-white/80 px-4 py-2 text-xs font-black text-ink ring-1 ring-ink/10" onClick={() => navigate("formulaAdmin")} type="button">返回导入后台</button>
        </div>
        {loadError && <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{loadError}</p>}
      </section>

      <GameCard className="border border-tide/15 bg-tide/[0.05]">
        <p className="text-sm font-black text-ink">审核并发布到正式题库</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
          先人工检查题目，再把确认无误的草稿 status 改成 approved，然后运行：
        </p>
        <code className="mt-3 block overflow-x-auto rounded-xl bg-ink px-4 py-3 text-xs font-bold text-white">npm run question:publish</code>
        <div className="mt-3 space-y-1 text-xs font-bold leading-5 text-ink/52">
          <p>已发布题目会备份原题库后追加进入正式题库。</p>
          <p>status 仍为 draft 的题目不会发布。</p>
        </div>
      </GameCard>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="题目总数" value={drafts.length} />
        <Metric label="选择题数量" value={counts.single} />
        <Metric label="多选题数量" value={counts.multiple} />
        <Metric label="填空题数量" value={counts.fill} />
        <Metric alert={cleanupCount > 0} label="待清洗数量" value={cleanupCount} />
      </section>

      {copyError && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{copyError}</p>}

      {!loading && reviewed.length > 0 ? (
        <div className="space-y-4">
          {reviewed.map(({ draft, issues }, index) => (
            <QuestionCard
              copied={copiedId === draft.id}
              draft={draft}
              index={index}
              issues={issues}
              key={draft.id}
              onCopy={() => copyTemplate(draft)}
            />
          ))}
        </div>
      ) : !loading ? (
        <GameCard className="border border-dashed border-tide/25 bg-white/70 py-14 text-center">
          <FileQuestion className="mx-auto size-10 text-tide/45" />
          <h2 className="mt-3 text-lg font-black text-ink">暂无题目草稿</h2>
          <p className="mt-2 text-sm font-semibold text-ink/50">运行 question:import 后刷新本页面。</p>
        </GameCard>
      ) : null}
    </div>
  );
}

function QuestionCard({ copied, draft, index, issues, onCopy }: {
  copied: boolean;
  draft: QuestionDraft;
  index: number;
  issues: QualityIssue[];
  onCopy: () => void;
}) {
  return (
    <GameCard className={issues.length ? "border border-coral/20 bg-white/76" : "border border-leaf/20 bg-white/76"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-black text-white">#{String(index + 1).padStart(2, "0")}</span>
            <span className="rounded-full bg-tide/10 px-3 py-1 text-[11px] font-black text-tide">{subjectLabels[draft.subject] ?? draft.subject} · {draft.chapter}</span>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-black text-ink">{typeLabels[draft.type] ?? draft.type}</span>
            <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-black text-ink/60">状态：{draft.status}</span>
            {issues.length > 0 && <span className="rounded-full bg-coral/10 px-3 py-1 text-[11px] font-black text-coral">待清洗 {issues.length} 项</span>}
          </div>
          <p className="mt-2 break-all text-xs font-semibold text-ink/38">来源：{draft.sourceFile || "未记录 sourceFile"}</p>
        </div>
        <button className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-xs font-black text-white transition hover:bg-tide" onClick={onCopy} type="button">
          {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
          {copied ? "已复制" : "复制整理模板"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <ReviewSection title="题干"><MarkdownContent content={draft.stem || "暂无题干"} /></ReviewSection>
          <ReviewSection title="选项">
            {draft.options.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {draft.options.map((option, optionIndex) => <div className="rounded-xl bg-ink/[0.04] px-3 py-2" key={`${option}-${optionIndex}`}><MarkdownContent content={option} /></div>)}
              </div>
            ) : <p className="text-coral">暂无选项</p>}
          </ReviewSection>
          <ReviewSection title="答案"><MarkdownContent content={draft.answer || "暂无答案"} /></ReviewSection>
          <ReviewSection title="分析"><MarkdownContent content={draft.analysis || "暂无分析"} /></ReviewSection>
          <ReviewSection title="详解"><MarkdownContent content={draft.explanation || "暂无详解"} /></ReviewSection>
          <ReviewSection title="标签">
            <div className="flex flex-wrap gap-2">
              {draft.tags.length ? draft.tags.map((tag) => <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-black text-leaf" key={tag}>{tag}</span>) : <span className="text-coral">暂无标签</span>}
            </div>
          </ReviewSection>
        </div>

        <aside className="rounded-2xl bg-[#FFF6F3] p-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-5 text-coral" />
            <h3 className="text-sm font-black text-ink">整理建议</h3>
          </div>
          {issues.length ? (
            <div className="mt-3 space-y-3">
              {issues.map((issue) => (
                <div className="rounded-xl bg-white/80 p-3" key={issue.code}>
                  <p className="flex items-center gap-2 text-xs font-black text-coral"><AlertTriangle className="size-3.5" />{issue.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-ink/58">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 rounded-xl bg-leaf/10 p-3 text-xs font-bold leading-5 text-leaf">未发现明显缺失项，仍需人工核对原题。</p>}
        </aside>
      </div>
    </GameCard>
  );
}

function qualityIssues(draft: QuestionDraft): QualityIssue[] {
  const issues: QualityIssue[] = [];
  if (draft.stem.trim().length < 8) issues.push({ code: "stem", label: "题干过短", suggestion: "建议对照原 PDF 补全题干和公式。" });
  if (!draft.answer.trim()) issues.push({ code: "answer", label: "没有答案", suggestion: "建议检查 OCR 是否漏掉【答案】区域。" });
  if (draft.type !== "fill_blank" && draft.options.length < 2) issues.push({ code: "options", label: "没有完整选项", suggestion: "建议补齐 A、B、C、D 选项，或确认题型为填空题。" });
  if (!draft.analysis.trim() && !draft.explanation.trim()) issues.push({ code: "explanation", label: "解析为空", suggestion: "建议补充分析或详解。" });
  if (!draft.chapter.trim() || /unknown|无法识别|待分类/i.test(draft.chapter)) issues.push({ code: "chapter", label: "章节待确认", suggestion: "建议人工确认学科和章节。" });
  return issues;
}

function normalizeDraft(raw: Record<string, unknown>, index: number): QuestionDraft {
  return {
    analysis: stringValue(raw.analysis),
    answer: stringValue(raw.answer),
    chapter: stringValue(raw.chapter, "unknown"),
    difficulty: stringValue(raw.difficulty, "medium"),
    explanation: stringValue(raw.explanation),
    id: stringValue(raw.id, `question-draft-${index + 1}`),
    options: stringArray(raw.options),
    sourceFile: stringValue(raw.sourceFile),
    status: stringValue(raw.status, "draft"),
    stem: stringValue(raw.stem ?? raw.question),
    subject: stringValue(raw.subject, "unknown"),
    tags: stringArray(raw.tags),
    type: stringValue(raw.type ?? raw.questionType, "fill_blank")
  };
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return entry.trim() ? [entry.trim()] : [];
    if (!entry || typeof entry !== "object") return [];
    const option = entry as Record<string, unknown>;
    const label = stringValue(option.label);
    const text = stringValue(option.text ?? option.value);
    return text ? [`${label ? `${label}. ` : ""}${text}`] : [];
  });
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
      // Local embedded browsers can expose Clipboard API while denying write access.
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
