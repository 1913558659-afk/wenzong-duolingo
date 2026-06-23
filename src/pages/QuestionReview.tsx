import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Clipboard, FileQuestion, LoaderCircle, RefreshCw, Save, Send, X } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { PageId } from "@/types";

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
  type: string;
};

type QualityIssue = {
  level: "severe" | "normal";
  label: string;
};

type PublishResult = {
  approvedCount: number;
  backupPath: string;
  duplicateCount: number;
  importBatchId: string;
  importedCount: number;
  invalidCount: number;
  questionBankPath: string;
  skippedCount: number;
};

const apiBase = "http://127.0.0.1:8787/api/question-drafts";
const typeLabels: Record<string, string> = { fill_blank: "填空题", multiple_choice: "多选题", single_choice: "单选题" };

export function QuestionReview({ navigate }: { navigate: (page: PageId) => void }) {
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiBase);
      const payload = await response.json() as { drafts?: Record<string, unknown>[]; error?: string; ok?: boolean };
      if (!response.ok || !payload.ok || !Array.isArray(payload.drafts)) throw new Error(payload.error || "读取题目草稿失败");
      setDrafts(payload.drafts.map(normalizeDraft));
      setNotice("已读取本地草稿 question-drafts.json");
    } catch {
      setError("请先运行 npm run formula:admin，再刷新页面。");
      setNotice("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDrafts(); }, [loadDrafts]);

  const reviews = useMemo(() => drafts.map((draft) => ({ draft, issues: qualityIssues(draft) })), [drafts]);
  const counts = {
    approved: drafts.filter((draft) => draft.status === "approved").length,
    draft: drafts.filter((draft) => draft.status === "draft").length,
    fill: drafts.filter((draft) => draft.type === "fill_blank").length,
    multiple: drafts.filter((draft) => draft.type === "multiple_choice").length,
    rejected: drafts.filter((draft) => draft.status === "rejected").length,
    single: drafts.filter((draft) => draft.type === "single_choice").length,
    cleanup: reviews.filter(({ issues }) => issues.length > 0).length
  };

  function updateLocal(id: string, patch: Partial<QuestionDraft>) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...patch } : draft));
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${apiBase}/${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const payload = await response.json() as T & { error?: string; ok?: boolean };
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "操作失败");
    return payload;
  }

  async function saveDraft(draft: QuestionDraft) {
    await runAction(`save:${draft.id}`, async () => {
      const payload = await post<{ draft: Record<string, unknown> }>("update", {
        id: draft.id,
        patch: {
          analysis: draft.analysis,
          answer: draft.answer,
          chapter: draft.chapter,
          difficulty: draft.difficulty,
          explanation: draft.explanation,
          options: draft.options,
          stem: draft.stem,
          subject: draft.subject,
          tags: draft.tags,
          type: draft.type
        }
      });
      updateLocal(draft.id, normalizeDraft(payload.draft));
      setNotice(`已保存：${draft.id}`);
    });
  }

  async function setStatus(draft: QuestionDraft, action: "approve" | "reject" | "reset") {
    await runAction(`${action}:${draft.id}`, async () => {
      const payload = await post<{ draft: Record<string, unknown> }>(action, { id: draft.id });
      updateLocal(draft.id, normalizeDraft(payload.draft));
      setNotice(action === "approve" ? "题目已通过审核。" : action === "reject" ? "题目已拒绝。" : "题目已恢复为 draft。");
    });
  }

  async function batch(action: string, label: string) {
    await runAction(`batch:${action}`, async () => {
      const payload = await post<{ updatedCount: number }>("batch", { action });
      setNotice(`${label}：更新 ${payload.updatedCount} 条。`);
      await loadDrafts();
    });
  }

  async function publish() {
    if (!window.confirm("即将把 approved 题目发布到正式题库。发布前会自动备份，确认继续吗？")) return;
    await runAction("publish", async () => {
      const result = await post<PublishResult>("publish", {});
      setPublishResult(result);
      setNotice(`发布完成：成功导入 ${result.importedCount} 条，跳过 ${result.skippedCount} 条。`);
    });
  }

  async function runAction(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    setError("");
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "操作失败");
    } finally {
      setBusyKey("");
    }
  }

  async function copyDraft(draft: QuestionDraft) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
      setCopiedId(draft.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setError("复制失败，请手动选择表单内容。");
    }
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <section className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#FFFFFF_50%,#EAF5F2_100%)] px-5 py-6 sm:px-7">
        <PageHeader title="题库导入审核台" subtitle="这里用于检查 MinerU 导入题目。发布前需要人工确认题干、选项、答案和解析。只有 approved 题目会进入正式题库。" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white">本地开发者工具</span>
          <span className="rounded-full bg-tide/10 px-3 py-1.5 text-xs font-black text-tide">{loading ? "正在读取..." : notice || "本地草稿 question-drafts.json"}</span>
          <button className="ml-auto rounded-2xl bg-white/80 px-4 py-2 text-xs font-black text-ink ring-1 ring-ink/10" onClick={() => navigate("formulaAdmin")} type="button">返回导入后台</button>
        </div>
        {error && <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{error}</p>}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="题目总数" value={drafts.length} />
        <Metric label="draft" value={counts.draft} />
        <Metric label="approved" value={counts.approved} />
        <Metric label="rejected" value={counts.rejected} />
        <Metric alert label="待清洗" value={counts.cleanup} />
        <Metric label="单选题" value={counts.single} />
        <Metric label="多选题" value={counts.multiple} />
        <Metric label="填空题" value={counts.fill} />
      </section>

      <GameCard className="bg-white/76">
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={<RefreshCw className="size-4" />} label="刷新草稿" onClick={() => void loadDrafts()} />
          <ActionButton label="批量通过无严重问题题目" onClick={() => void batch("approve_clean", "批量通过完成")} />
          <ActionButton label="批量拒绝无效题" onClick={() => void batch("reject_invalid", "批量拒绝完成")} />
          <ActionButton label="批量设置学科为数学" onClick={() => void batch("set_subject_math", "学科设置完成")} />
          <ActionButton label="批量设置章节为函数" onClick={() => void batch("set_chapter_function", "章节设置完成")} />
          <ActionButton label="恢复 rejected 为 draft" onClick={() => void batch("reset_to_draft", "恢复完成")} />
          <button className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-coral px-4 text-xs font-black text-white disabled:opacity-50" disabled={Boolean(busyKey)} onClick={() => void publish()} type="button">
            {busyKey === "publish" ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}发布 approved 到正式题库
          </button>
        </div>
      </GameCard>

      {publishResult && <PublishResultCard navigate={navigate} result={publishResult} />}

      {!loading && reviews.length ? (
        <section className="space-y-4">
          {reviews.map(({ draft, issues }, index) => (
            <DraftEditor
              busyKey={busyKey}
              copied={copiedId === draft.id}
              draft={draft}
              index={index}
              issues={issues}
              key={draft.id}
              onChange={(patch) => updateLocal(draft.id, patch)}
              onCopy={() => void copyDraft(draft)}
              onSave={() => void saveDraft(draft)}
              onStatus={(action) => void setStatus(draft, action)}
            />
          ))}
        </section>
      ) : !loading ? (
        <GameCard className="border border-dashed border-tide/25 bg-white/70 py-14 text-center">
          <FileQuestion className="mx-auto size-10 text-tide/45" />
          <h2 className="mt-3 text-lg font-black text-ink">暂无题目草稿</h2>
        </GameCard>
      ) : null}
    </div>
  );
}

function DraftEditor({ busyKey, copied, draft, index, issues, onChange, onCopy, onSave, onStatus }: {
  busyKey: string;
  copied: boolean;
  draft: QuestionDraft;
  index: number;
  issues: QualityIssue[];
  onChange: (patch: Partial<QuestionDraft>) => void;
  onCopy: () => void;
  onSave: () => void;
  onStatus: (action: "approve" | "reject" | "reset") => void;
}) {
  const severeCount = issues.filter((issue) => issue.level === "severe").length;
  const qualityLabel = severeCount ? "有严重问题：不建议发布" : issues.length ? "有普通问题：建议清洗" : "无严重问题：可通过";
  return (
    <GameCard className={severeCount ? "border border-coral/25 bg-white/78" : "border border-tide/15 bg-white/78"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-3 py-1 text-[11px] font-black text-white">#{String(index + 1).padStart(2, "0")}</span>
        <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-black text-ink/60">{draft.id}</span>
        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${draft.status === "approved" ? "bg-leaf/12 text-leaf" : draft.status === "rejected" ? "bg-coral/10 text-coral" : "bg-gold/20 text-ink"}`}>{draft.status}</span>
        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${severeCount ? "bg-coral/10 text-coral" : issues.length ? "bg-gold/20 text-ink" : "bg-leaf/10 text-leaf"}`}>{qualityLabel}</span>
      </div>

      {issues.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {issues.map((issue) => <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${issue.level === "severe" ? "bg-coral/10 text-coral" : "bg-orange-100 text-orange-700"}`} key={`${issue.level}-${issue.label}`}><AlertTriangle className="size-3.5" />{issue.label}</span>)}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="subject"><input className={inputClass} onChange={(event) => onChange({ subject: event.target.value })} value={draft.subject} /></Field>
        <Field label="chapter"><input className={inputClass} onChange={(event) => onChange({ chapter: event.target.value })} value={draft.chapter} /></Field>
        <Field label="type">
          <select className={inputClass} onChange={(event) => onChange({ type: event.target.value })} value={draft.type}>
            <option value="">请选择</option><option value="single_choice">single_choice</option><option value="multiple_choice">multiple_choice</option><option value="fill_blank">fill_blank</option>
          </select>
        </Field>
        <Field label="difficulty">
          <select className={inputClass} onChange={(event) => onChange({ difficulty: event.target.value })} value={draft.difficulty}>
            <option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option>
          </select>
        </Field>
      </div>
      <div className="mt-4"><Field label="tags（逗号分隔）"><input className={inputClass} onChange={(event) => onChange({ tags: event.target.value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) })} value={draft.tags.join(", ")} /></Field></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="stem"><textarea className={textareaClass} onChange={(event) => onChange({ stem: event.target.value })} value={draft.stem} /></Field>
        <Field label="options（每行一个选项）"><textarea className={textareaClass} onChange={(event) => onChange({ options: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} value={draft.options.join("\n")} /></Field>
        <Field label="answer"><input className={inputClass} onChange={(event) => onChange({ answer: event.target.value })} value={draft.answer} /></Field>
        <Field label="sourceFile"><input className={`${inputClass} bg-ink/[0.03]`} readOnly value={draft.sourceFile} /></Field>
        <Field label="analysis"><textarea className={textareaClass} onChange={(event) => onChange({ analysis: event.target.value })} value={draft.analysis} /></Field>
        <Field label="explanation"><textarea className={textareaClass} onChange={(event) => onChange({ explanation: event.target.value })} value={draft.explanation} /></Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <CardButton icon={<Save className="size-4" />} label="保存修改" loading={busyKey === `save:${draft.id}`} onClick={onSave} />
        <CardButton icon={<Check className="size-4" />} label="通过审核" loading={busyKey === `approve:${draft.id}`} onClick={() => onStatus("approve")} tone="leaf" />
        <CardButton icon={<X className="size-4" />} label="拒绝" loading={busyKey === `reject:${draft.id}`} onClick={() => onStatus("reject")} tone="coral" />
        <CardButton label="恢复为 draft" loading={busyKey === `reset:${draft.id}`} onClick={() => onStatus("reset")} />
        <CardButton icon={<Clipboard className="size-4" />} label={copied ? "已复制" : "复制整理模板"} onClick={onCopy} />
      </div>
      <p className="mt-3 text-xs font-bold text-ink/38">题型：{typeLabels[draft.type] ?? (draft.type || "未设置")} · 来源：{draft.sourceFile || "未记录"}</p>
    </GameCard>
  );
}

function qualityIssues(draft: QuestionDraft): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const options = draft.options.filter((option) => option.trim());
  if (!draft.stem.trim()) issues.push({ level: "severe", label: "题干为空" });
  if (!draft.answer.trim()) issues.push({ level: "severe", label: "答案为空" });
  if (!draft.type.trim()) issues.push({ level: "severe", label: "type 缺失" });
  if (draft.type !== "fill_blank" && options.length < 2) issues.push({ level: "severe", label: "选择题选项少于 2 个" });
  if (!draft.analysis.trim()) issues.push({ level: "normal", label: "analysis 为空" });
  if (!draft.explanation.trim()) issues.push({ level: "normal", label: "explanation 为空" });
  if (/unknown|待分类|无法识别/i.test(draft.chapter) || !draft.chapter.trim()) issues.push({ level: "normal", label: "chapter 待确认" });
  if (/unknown|待分类|无法识别/i.test(draft.subject) || !draft.subject.trim()) issues.push({ level: "normal", label: "subject 待确认" });
  if (draft.stem.trim().length > 0 && draft.stem.trim().length < 8) issues.push({ level: "normal", label: "stem 过短" });
  if (options.some((option) => option.length < 3) || new Set(options.map((option) => option.slice(0, 1).toUpperCase())).size < options.length) issues.push({ level: "normal", label: "选项疑似断裂" });
  if (!answerMatchesOptions(draft)) issues.push({ level: "normal", label: "答案不在选项中" });
  if (looksLikeOcrNoise(`${draft.stem} ${draft.options.join(" ")} ${draft.analysis} ${draft.explanation}`)) issues.push({ level: "normal", label: "疑似 OCR 乱码" });
  return issues;
}

function answerMatchesOptions(draft: QuestionDraft) {
  if (draft.type === "fill_blank" || !draft.answer.trim()) return true;
  const labels = draft.options.map((_, index) => String.fromCharCode(65 + index));
  if (draft.type === "multiple_choice") return (draft.answer.toUpperCase().match(/[A-Z]/g) ?? []).every((letter) => labels.includes(letter));
  if (/^[A-Z]$/i.test(draft.answer.trim())) return labels.includes(draft.answer.trim().toUpperCase());
  return draft.options.some((option) => option.replace(/^[A-D][.．、]\s*/u, "").trim() === draft.answer.trim());
}

function looksLikeOcrNoise(value: string) {
  const suspicious = value.match(/[�□■◆◇※¤]|\\operatorname\s*\{\s*[a-z]\s*\}|\^ \{ [.:·]+ \}/g) ?? [];
  return suspicious.length >= 2;
}

function normalizeDraft(raw: Record<string, unknown>, index = 0): QuestionDraft {
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
    type: stringValue(raw.type ?? raw.questionType)
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry).trim()).filter(Boolean) : [];
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function PublishResultCard({ navigate, result }: { navigate: (page: PageId) => void; result: PublishResult }) {
  return (
    <GameCard className="border border-leaf/20 bg-leaf/[0.06]">
      <h2 className="text-lg font-black text-ink">正式题库发布结果</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Result label="approved 数量" value={result.approvedCount} />
        <Result label="成功导入数量" value={result.importedCount} />
        <Result label="跳过数量" value={result.skippedCount} />
        <Result label="重复题数量" value={result.duplicateCount} />
        <Result label="无效题数量" value={result.invalidCount} />
        <Result label="备份路径" value={result.backupPath || "未生成新备份"} />
        <Result label="正式题库路径" value={result.questionBankPath} />
        <Result label="importBatchId" value={result.importBatchId || "无新批次"} />
      </div>
      <button className="mt-4 min-h-10 rounded-xl bg-ink px-4 text-xs font-black text-white" onClick={() => navigate("importedQuestionManager")} type="button">查看导入题管理</button>
    </GameCard>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-tide";
const textareaClass = `${inputClass} min-h-32 py-3 leading-6`;

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black text-ink/48">{label}</span>{children}</label>;
}

function Metric({ alert = false, label, value }: { alert?: boolean; label: string; value: number }) {
  return <GameCard className={alert && value ? "border border-coral/20 bg-coral/[0.06]" : "bg-white/76"}><p className="text-[11px] font-black text-ink/45">{label}</p><p className={`mt-2 text-2xl font-black ${alert && value ? "text-coral" : "text-ink"}`}>{value}</p></GameCard>;
}

function ActionButton({ icon, label, onClick }: { icon?: React.ReactNode; label: string; onClick: () => void }) {
  return <button className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-ink/5 px-4 text-xs font-black text-ink transition hover:bg-tide hover:text-white" onClick={onClick} type="button">{icon}{label}</button>;
}

function CardButton({ icon, label, loading = false, onClick, tone = "ink" }: { icon?: React.ReactNode; label: string; loading?: boolean; onClick: () => void; tone?: "ink" | "leaf" | "coral" }) {
  const tones = { coral: "bg-coral text-white", ink: "bg-ink/5 text-ink", leaf: "bg-leaf text-white" };
  return <button className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-black disabled:opacity-50 ${tones[tone]}`} disabled={loading} onClick={onClick} type="button">{loading ? <LoaderCircle className="size-4 animate-spin" /> : icon}{label}</button>;
}

function Result({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl bg-white/70 p-3"><p className="text-[11px] font-black text-ink/42">{label}</p><p className="mt-1 break-all text-sm font-black text-ink">{value}</p></div>;
}
