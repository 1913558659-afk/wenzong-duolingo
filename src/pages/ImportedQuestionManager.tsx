import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, RefreshCw, Save, Trash2, Undo2 } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { PageId } from "@/types";

type ImportedQuestion = {
  analysis: string;
  answer: string;
  chapter: string;
  createdAt: string;
  difficulty: string;
  explanation: string;
  id: string;
  importBatchId: string;
  imported: boolean;
  options: string[];
  question: string;
  source: string;
  sourceFile: string;
  subject: string;
  tags: string[];
  type: string;
};

type ListPayload = {
  backups: string[];
  batches: string[];
  questions: Record<string, unknown>[];
  sourceFiles: string[];
  total: number;
};

const apiBase = "http://127.0.0.1:8787/api/imported-questions";

export function ImportedQuestionManager({ navigate }: { navigate: (page: PageId) => void }) {
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [sourceFiles, setSourceFiles] = useState<string[]>([]);
  const [backups, setBackups] = useState<string[]>([]);
  const [filters, setFilters] = useState({ batch: "", sourceFile: "", subject: "", chapter: "", type: "" });
  const [expandedId, setExpandedId] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [selectedBackup, setSelectedBackup] = useState("");

  const loadQuestions = useCallback(async (preserveNotice = false) => {
    setBusyKey("load");
    setError("");
    try {
      const response = await fetch(apiBase);
      const payload = await response.json() as ListPayload & { error?: string; ok?: boolean };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "读取导入题库失败");
      setQuestions(payload.questions.map(normalizeQuestion));
      setBatches(payload.batches ?? []);
      setSourceFiles(payload.sourceFiles ?? []);
      setBackups(payload.backups ?? []);
      setSelectedBackup((current) => current || payload.backups?.[0] || "");
      if (!preserveNotice) setNotice(`已读取 ${payload.total} 道 MinerU 导入题。`);
    } catch {
      setError("请先运行 npm run formula:admin，再刷新页面。");
    } finally {
      setBusyKey("");
    }
  }, []);

  useEffect(() => { void loadQuestions(); }, [loadQuestions]);

  const subjects = uniqueValues(questions.map((item) => item.subject));
  const chapters = uniqueValues(questions.map((item) => item.chapter));
  const types = uniqueValues(questions.map((item) => item.type));
  const filtered = useMemo(() => questions.filter((item) =>
    (!filters.batch || item.importBatchId === filters.batch)
    && (!filters.sourceFile || item.sourceFile === filters.sourceFile)
    && (!filters.subject || item.subject === filters.subject)
    && (!filters.chapter || item.chapter === filters.chapter)
    && (!filters.type || item.type === filters.type)
  ), [filters, questions]);

  function updateLocal(id: string, patch: Partial<ImportedQuestion>) {
    setQuestions((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
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

  async function save(item: ImportedQuestion) {
    await runAction(`save:${item.id}`, async () => {
      const payload = await post<{ backupPath: string; question: Record<string, unknown> }>("update", {
        id: item.id,
        patch: {
          analysis: item.analysis,
          answer: item.answer,
          chapter: item.chapter,
          difficulty: item.difficulty,
          explanation: item.explanation,
          options: item.options,
          stem: item.question,
          subject: item.subject,
          tags: item.tags,
          type: item.type
        }
      });
      updateLocal(item.id, normalizeQuestion(payload.question));
      setNotice(`修改已保存。备份：${payload.backupPath}`);
      await loadQuestions(true);
    });
  }

  async function remove(item: ImportedQuestion) {
    if (!window.confirm(`确定删除导入题 ${item.id}？删除前会自动备份。`)) return;
    await runAction(`delete:${item.id}`, async () => {
      const payload = await post<{ backupPath: string; deletedCount: number }>("delete", { id: item.id });
      setNotice(`已删除 ${payload.deletedCount} 道题。备份：${payload.backupPath}`);
      await loadQuestions(true);
    });
  }

  async function removeBatch() {
    if (!filters.batch) {
      setError("请先选择一个 importBatchId。");
      return;
    }
    if (!window.confirm(`确定删除批次 ${filters.batch} 的全部导入题？删除前会自动备份。`)) return;
    await runAction("delete-batch", async () => {
      const payload = await post<{ backupPath: string; deletedCount: number }>("delete-batch", { importBatchId: filters.batch });
      setNotice(`已删除批次中的 ${payload.deletedCount} 道题。备份：${payload.backupPath}`);
      setFilters((current) => ({ ...current, batch: "" }));
      await loadQuestions(true);
    });
  }

  async function rollback() {
    if (!selectedBackup) {
      setError("请选择一个备份文件。");
      return;
    }
    if (!window.confirm(`确定使用 ${selectedBackup} 恢复正式题库？当前题库会先创建安全备份。`)) return;
    await runAction("rollback", async () => {
      const payload = await post<{ questionBankPath: string; restoredFrom: string; safetyBackupPath: string }>("rollback", { backupPath: selectedBackup });
      setNotice(`已从 ${payload.restoredFrom} 恢复。回滚前安全备份：${payload.safetyBackupPath}`);
      await loadQuestions(true);
    });
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <section className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#FFFFFF_50%,#EAF5F2_100%)] px-5 py-6 sm:px-7">
        <PageHeader title="导入题库管理" subtitle="这里只管理 MinerU 导入题，不会删除普通题库。每次修改、删除和回滚前都会自动备份正式题库。" />
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white">MinerU 导入题</span>
          <span className="rounded-full bg-tide/10 px-3 py-1.5 text-xs font-black text-tide">导入题总数 {questions.length}</span>
          <span className="rounded-full bg-gold/20 px-3 py-1.5 text-xs font-black text-ink">批次数量 {batches.length}</span>
          <button className="ml-auto rounded-2xl bg-white/80 px-4 py-2 text-xs font-black text-ink ring-1 ring-ink/10" onClick={() => navigate("questionReview")} type="button">返回题库审核台</button>
        </div>
        {notice && <p className="mt-4 rounded-2xl bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf">{notice}</p>}
        {error && <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{error}</p>}
      </section>

      <GameCard className="bg-white/76">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Filter label="importBatchId" onChange={(value) => setFilters((current) => ({ ...current, batch: value }))} options={batches} value={filters.batch} />
          <Filter label="sourceFile" onChange={(value) => setFilters((current) => ({ ...current, sourceFile: value }))} options={sourceFiles} value={filters.sourceFile} />
          <Filter label="subject" onChange={(value) => setFilters((current) => ({ ...current, subject: value }))} options={subjects} value={filters.subject} />
          <Filter label="chapter" onChange={(value) => setFilters((current) => ({ ...current, chapter: value }))} options={chapters} value={filters.chapter} />
          <Filter label="type" onChange={(value) => setFilters((current) => ({ ...current, type: value }))} options={types} value={filters.type} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={secondaryButton} onClick={() => void loadQuestions()} type="button"><RefreshCw className="size-4" />刷新</button>
          <button className={dangerButton} disabled={!filters.batch || Boolean(busyKey)} onClick={() => void removeBatch()} type="button"><Trash2 className="size-4" />删除当前批次</button>
          <span className="ml-auto text-xs font-black text-ink/45">筛选结果 {filtered.length} 道</span>
        </div>
      </GameCard>

      <GameCard className="border border-gold/20 bg-gold/[0.08]">
        <p className="text-sm font-black text-ink">备份回滚</p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <select className={`${inputClass} min-w-0 flex-1`} onChange={(event) => setSelectedBackup(event.target.value)} value={selectedBackup}>
            <option value="">选择备份文件</option>
            {backups.map((backup) => <option key={backup} value={backup}>{backup}</option>)}
          </select>
          <button className={secondaryButton} disabled={!selectedBackup || Boolean(busyKey)} onClick={() => void rollback()} type="button"><Undo2 className="size-4" />使用备份回滚</button>
        </div>
      </GameCard>

      {filtered.length > 0 ? (
        <section className="space-y-4">
          {filtered.map((item) => (
            <ImportedQuestionCard
              busyKey={busyKey}
              expanded={expandedId === item.id}
              item={item}
              key={item.id}
              onChange={(patch) => updateLocal(item.id, patch)}
              onDelete={() => void remove(item)}
              onSave={() => void save(item)}
              onToggle={() => setExpandedId((current) => current === item.id ? "" : item.id)}
            />
          ))}
        </section>
      ) : (
        <GameCard className="py-12 text-center"><p className="text-lg font-black text-ink">当前筛选条件下没有导入题</p></GameCard>
      )}
    </div>
  );
}

function ImportedQuestionCard({ busyKey, expanded, item, onChange, onDelete, onSave, onToggle }: {
  busyKey: string;
  expanded: boolean;
  item: ImportedQuestion;
  onChange: (patch: Partial<ImportedQuestion>) => void;
  onDelete: () => void;
  onSave: () => void;
  onToggle: () => void;
}) {
  return (
    <GameCard className="border border-tide/15 bg-white/78">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-black text-ink">MinerU 导入</span>
            <span className="rounded-full bg-tide/10 px-3 py-1 text-[11px] font-black text-tide">{item.subject} · {item.chapter}</span>
            <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-black text-ink/60">{item.type} · {item.difficulty}</span>
          </div>
          <p className="mt-3 break-all text-xs font-black text-ink/40">{item.id}</p>
          <p className="mt-2 line-clamp-3 text-base font-black leading-7 text-ink">{item.question}</p>
        </div>
        <button className={secondaryButton} onClick={onToggle} type="button">{expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}{expanded ? "收起编辑" : "展开编辑"}</button>
      </div>

      <div className="mt-4 grid gap-2 text-xs font-bold text-ink/48 sm:grid-cols-2">
        <p className="break-all">批次：{item.importBatchId}</p>
        <p className="break-all">来源：{item.sourceFile}</p>
        <p>source：{item.source}</p>
        <p>createdAt：{item.createdAt}</p>
      </div>

      {expanded && (
        <div className="mt-5 border-t border-ink/8 pt-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="subject"><input className={inputClass} onChange={(event) => onChange({ subject: event.target.value })} value={item.subject} /></Field>
            <Field label="chapter"><input className={inputClass} onChange={(event) => onChange({ chapter: event.target.value })} value={item.chapter} /></Field>
            <Field label="type"><select className={inputClass} onChange={(event) => onChange({ type: event.target.value })} value={item.type}><option value="single_choice">single_choice</option><option value="multiple_choice">multiple_choice</option><option value="fill_blank">fill_blank</option></select></Field>
            <Field label="difficulty"><select className={inputClass} onChange={(event) => onChange({ difficulty: event.target.value })} value={item.difficulty}><option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option></select></Field>
          </div>
          <div className="mt-4"><Field label="tags"><input className={inputClass} onChange={(event) => onChange({ tags: event.target.value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) })} value={item.tags.join(", ")} /></Field></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Field label="stem"><textarea className={textareaClass} onChange={(event) => onChange({ question: event.target.value })} value={item.question} /></Field>
            <Field label="options（每行一个）"><textarea className={textareaClass} onChange={(event) => onChange({ options: event.target.value.split("\n").map((option) => option.trim()).filter(Boolean) })} value={item.options.join("\n")} /></Field>
            <Field label="answer"><input className={inputClass} onChange={(event) => onChange({ answer: event.target.value })} value={item.answer} /></Field>
            <Field label="analysis"><textarea className={textareaClass} onChange={(event) => onChange({ analysis: event.target.value })} value={item.analysis} /></Field>
            <Field label="explanation"><textarea className={textareaClass} onChange={(event) => onChange({ explanation: event.target.value })} value={item.explanation} /></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className={primaryButton} disabled={Boolean(busyKey)} onClick={onSave} type="button">{busyKey === `save:${item.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}保存修改</button>
            <button className={dangerButton} disabled={Boolean(busyKey)} onClick={onDelete} type="button">{busyKey === `delete:${item.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}删除此题</button>
          </div>
        </div>
      )}
    </GameCard>
  );
}

function normalizeQuestion(raw: Record<string, unknown>): ImportedQuestion {
  return {
    analysis: stringValue(raw.analysis),
    answer: stringValue(raw.answer),
    chapter: stringValue(raw.chapter),
    createdAt: stringValue(raw.createdAt),
    difficulty: stringValue(raw.difficulty, "medium"),
    explanation: stringValue(raw.explanation),
    id: stringValue(raw.id),
    importBatchId: stringValue(raw.importBatchId),
    imported: raw.imported === true,
    options: stringArray(raw.options),
    question: stringValue(raw.question ?? raw.stem),
    source: stringValue(raw.source),
    sourceFile: stringValue(raw.sourceFile),
    subject: stringValue(raw.subject),
    tags: stringArray(raw.tags),
    type: stringValue(raw.type ?? raw.questionType, "single_choice")
  };
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry).trim()).filter(Boolean) : [];
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function Filter({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return <label><span className="mb-1.5 block text-xs font-black text-ink/45">{label}</span><select className={inputClass} onChange={(event) => onChange(event.target.value)} value={value}><option value="">全部</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label><span className="mb-1.5 block text-xs font-black text-ink/45">{label}</span>{children}</label>;
}

const inputClass = "min-h-11 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-tide";
const textareaClass = `${inputClass} min-h-32 py-3 leading-6`;
const primaryButton = "inline-flex min-h-10 items-center gap-2 rounded-xl bg-tide px-4 text-xs font-black text-white disabled:opacity-50";
const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink/5 px-4 text-xs font-black text-ink disabled:opacity-50";
const dangerButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-coral px-4 text-xs font-black text-white disabled:opacity-50";
