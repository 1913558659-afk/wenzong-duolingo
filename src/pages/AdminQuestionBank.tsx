import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import {
  confirmImportQuestions,
  createAdminQuestion,
  deleteAdminQuestion,
  fetchAllBackendQuestionsResult,
  previewImportQuestions,
  updateAdminQuestion
} from "@/lib/api";
import type { AdminQuestionPayload, BackendQuestion, ImportConfirmResponse, ImportPreviewResponse, ImportQuestionIssue } from "@/lib/api";
import type { AuthUser, Difficulty, Subject } from "@/types";

type AdminQuestionBankProps = {
  token: string | null;
  user: AuthUser | null;
};

type QuestionFormState = {
  id: string;
  questionCode: string;
  subjectCode: Subject;
  subjectName: string;
  chapterCode: string;
  chapterTitle: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: Difficulty;
  tagsText: string;
};

const emptyForm: QuestionFormState = {
  id: "",
  questionCode: "",
  subjectCode: "history",
  subjectName: "历史",
  chapterCode: "",
  chapterTitle: "",
  stem: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  explanation: "",
  difficulty: "medium",
  tagsText: ""
};

const subjectOptions: { code: "all" | Subject; name: string }[] = [
  { code: "all", name: "全部" },
  { code: "history", name: "历史" },
  { code: "politics", name: "政治" },
  { code: "geography", name: "地理" }
];

const subjectNameMap: Record<Subject, string> = {
  history: "历史",
  politics: "政治",
  geography: "地理"
};

const importPlaceholder = `学科：历史
章节：先秦时期
难度：easy
标签：先秦,分封制,宗法制

题干：西周实行分封制的主要目的是什么？
A. 扩大商品经济
B. 巩固周王朝统治
C. 推行郡县制
D. 促进思想统一
答案：B
解析：西周通过分封诸侯拱卫王室，以巩固统治秩序。
---`;

function toPayload(form: QuestionFormState): AdminQuestionPayload {
  return {
    questionCode: form.questionCode.trim(),
    subjectCode: form.subjectCode,
    subjectName: form.subjectName.trim() || subjectNameMap[form.subjectCode],
    chapterCode: form.chapterCode.trim(),
    chapterTitle: form.chapterTitle.trim(),
    stem: form.stem.trim(),
    optionA: form.optionA.trim(),
    optionB: form.optionB.trim(),
    optionC: form.optionC.trim(),
    optionD: form.optionD.trim(),
    correctAnswer: form.correctAnswer,
    explanation: form.explanation.trim(),
    difficulty: form.difficulty,
    tags: form.tagsText.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean)
  };
}

function formFromQuestion(question: BackendQuestion): QuestionFormState {
  const subjectCode = question.subject?.code === "politics" || question.subject?.code === "geography" ? question.subject.code : "history";

  return {
    id: question.id || question.questionCode || "",
    questionCode: question.questionCode || "",
    subjectCode,
    subjectName: question.subject?.name || subjectNameMap[subjectCode],
    chapterCode: question.chapter?.code || "",
    chapterTitle: question.chapter?.title || "",
    stem: question.stem || "",
    optionA: question.optionA || "",
    optionB: question.optionB || "",
    optionC: question.optionC || "",
    optionD: question.optionD || "",
    correctAnswer: question.correctAnswer === "B" || question.correctAnswer === "C" || question.correctAnswer === "D" ? question.correctAnswer : "A",
    explanation: question.explanation || "",
    difficulty: question.difficulty === "easy" || question.difficulty === "hard" ? question.difficulty : "medium",
    tagsText: Array.isArray(question.tags) ? question.tags.join(", ") : typeof question.tags === "string" ? question.tags : ""
  };
}

function formatAdminError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message.includes("401") || message.includes("403") || message.includes("未登录") || message.includes("权限")) {
    return "无管理员权限或登录已失效";
  }
  return message || fallback;
}

function importIssues(result?: ImportPreviewResponse | ImportConfirmResponse | null) {
  return result?.errors ?? result?.issues ?? [];
}

function issueIndex(issue: ImportQuestionIssue, fallbackIndex: number) {
  return issue.index ?? issue.questionIndex ?? issue.row ?? fallbackIndex + 1;
}

function issueMessage(issue: ImportQuestionIssue) {
  return issue.message ?? issue.reason ?? issue.error ?? "格式不符合要求";
}

function previewTotal(preview: ImportPreviewResponse | null) {
  return preview?.total ?? preview?.items?.length ?? preview?.parsedQuestions?.length ?? 0;
}

export function AdminQuestionBank({ token, user }: AdminQuestionBankProps) {
  const isAdmin = user?.role === "admin";
  const [questions, setQuestions] = useState<BackendQuestion[]>([]);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [subjectFilter, setSubjectFilter] = useState<"all" | Subject>("all");
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState<QuestionFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"idle" | "loading" | "submitting" | "deleting">("idle");
  const [message, setMessage] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportConfirmResponse | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [importAction, setImportAction] = useState<"idle" | "previewing" | "importing">("idle");

  async function loadQuestions(clearMessage = true) {
    setLoading(true);
    setAction("loading");
    if (clearMessage) {
      setMessage("");
    }
    try {
      const result = await fetchAllBackendQuestionsResult();
      setQuestions(result.questions);
      setQuestionTotal(result.total);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "题目列表加载失败";
      setQuestions([]);
      setQuestionTotal(0);
      setMessage(errorMessage.includes("题目为空") ? "" : errorMessage);
    } finally {
      setLoading(false);
      setAction("idle");
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadQuestions();
    }
  }, [isAdmin]);

  const filteredQuestions = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    return questions.filter((question) => {
      const matchSubject = subjectFilter === "all" || question.subject?.code === subjectFilter;
      const haystack = `${question.questionCode ?? ""} ${question.stem ?? ""}`.toLowerCase();
      return matchSubject && (!value || haystack.includes(value));
    });
  }, [keyword, questions, subjectFilter]);

  const hasActiveFilter = subjectFilter !== "all" || keyword.trim().length > 0;

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setMessage("请先登录管理员账号");
      return;
    }

    setLoading(true);
    setAction("submitting");
    setMessage("");
    try {
      const payload = toPayload(form);
      if (form.id) {
        await updateAdminQuestion(form.id, payload, token);
        setMessage("修改成功");
      } else {
        await createAdminQuestion(payload, token);
        setMessage("新增成功");
      }
      setForm(emptyForm);
      setShowForm(false);
      await loadQuestions(false);
    } catch (error) {
      setMessage(formatAdminError(error, "保存失败"));
    } finally {
      setLoading(false);
      setAction("idle");
    }
  }

  async function removeQuestion(question: BackendQuestion) {
    if (!token) {
      setMessage("请先登录管理员账号");
      return;
    }
    const id = question.id || question.questionCode;
    if (!id || !window.confirm(`确认删除 ${question.questionCode || id} 吗？`)) {
      return;
    }

    setLoading(true);
    setAction("deleting");
    setMessage("");
    try {
      await deleteAdminQuestion(id, token);
      setMessage("删除成功");
      await loadQuestions(false);
    } catch (error) {
      setMessage(formatAdminError(error, "删除失败"));
    } finally {
      setLoading(false);
      setAction("idle");
    }
  }

  async function previewBulkImport() {
    if (!token) {
      setImportMessage("请先登录管理员账号");
      return;
    }
    if (!importText.trim()) {
      setImportMessage("请先粘贴批量题目文本");
      return;
    }

    setImportAction("previewing");
    setImportMessage("");
    setImportPreview(null);
    setImportResult(null);
    try {
      const result = await previewImportQuestions(importText, token);
      setImportPreview(result);
      setImportMessage("预览解析成功，请检查结果后确认导入");
    } catch (error) {
      setImportMessage(formatAdminError(error, "预览解析失败"));
    } finally {
      setImportAction("idle");
    }
  }

  async function confirmBulkImport() {
    if (!token) {
      setImportMessage("请先登录管理员账号");
      return;
    }
    if (!importPreview) {
      setImportMessage("请先预览解析结果，再确认导入");
      return;
    }

    setImportAction("importing");
    setImportMessage("");
    setImportResult(null);
    try {
      const result = await confirmImportQuestions(importText, token);
      setImportResult(result);
      setImportMessage("批量导入完成");
      setImportPreview(null);
      setImportText("");
      await loadQuestions(false);
    } catch (error) {
      setImportMessage(formatAdminError(error, "确认导入失败"));
    } finally {
      setImportAction("idle");
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="题库管理" subtitle="管理员用于维护后端数据库题目。" />
        <GameCard className="py-8 text-center">
          <p className="text-xl font-black text-ink">无权限访问</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">请使用管理员账号登录后再进入题库管理。</p>
        </GameCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="题库管理" subtitle="管理后端数据库里的选择题，支持新增、编辑和软删除。" />

      <GameCard>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <p className="text-sm font-black text-ink/58">当前题目总数</p>
            <p className="text-3xl font-black text-coral">{questionTotal}</p>
          </div>
          <select
            className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink"
            onChange={(event) => setSubjectFilter(event.target.value as "all" | Subject)}
            value={subjectFilter}
          >
            {subjectOptions.map((item) => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
          <input
            className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索 questionCode 或题干"
            value={keyword}
          />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            className="min-h-12 rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink"
            disabled={loading}
            onClick={() => {
              setForm(emptyForm);
              setShowForm((open) => !open);
            }}
            type="button"
          >
            {showForm ? "收起表单" : "新增题目"}
          </button>
          <button
            className="min-h-12 rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-tide"
            disabled={loading}
            onClick={() => loadQuestions()}
            type="button"
          >
            {action === "loading" ? "刷新中..." : "刷新列表"}
          </button>
          <button
            className="min-h-12 rounded-2xl bg-leaf px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || importAction !== "idle"}
            onClick={() => {
              setShowImport((open) => !open);
              setImportMessage("");
            }}
            type="button"
          >
            {showImport ? "收起批量导入" : "批量导入"}
          </button>
        </div>
        {message && <p className="mt-3 rounded-2xl bg-gold/18 px-4 py-3 text-sm font-black text-ink/70">{message}</p>}
      </GameCard>

      {showImport && (
        <GameCard>
          <div className="mb-4">
            <h2 className="text-xl font-black text-ink">批量导入题目</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">先粘贴 Markdown 格式题目并预览，确认无误后再正式写入后端题库。</p>
          </div>
          <textarea
            className="min-h-80 w-full resize-y rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold leading-7 text-ink outline-none transition focus:border-tide"
            onChange={(event) => {
              setImportText(event.target.value);
              setImportPreview(null);
              setImportResult(null);
            }}
            placeholder={importPlaceholder}
            value={importText}
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              className="min-h-12 rounded-2xl bg-tide px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={importAction !== "idle"}
              onClick={previewBulkImport}
              type="button"
            >
              {importAction === "previewing" ? "预览中..." : "预览解析"}
            </button>
            <button
              className="min-h-12 rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={importAction !== "idle" || !importPreview || (importPreview.invalidCount ?? 0) > 0}
              onClick={confirmBulkImport}
              type="button"
            >
              {importAction === "importing" ? "导入中..." : "确认导入"}
            </button>
          </div>

          {importMessage && <p className="mt-3 rounded-2xl bg-gold/18 px-4 py-3 text-sm font-black text-ink/70">{importMessage}</p>}

          {importPreview && (
            <div className="mt-4 rounded-3xl border border-tide/15 bg-tide/6 p-4">
              <p className="text-sm font-black text-ink">预览结果</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-black text-ink/50">total</p>
                  <p className="text-2xl font-black text-ink">{previewTotal(importPreview)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-black text-ink/50">validCount</p>
                  <p className="text-2xl font-black text-leaf">{importPreview.validCount ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-black text-ink/50">invalidCount</p>
                  <p className="text-2xl font-black text-coral">{importPreview.invalidCount ?? importIssues(importPreview).length}</p>
                </div>
              </div>
              {importIssues(importPreview).length > 0 && (
                <div className="mt-3 space-y-2">
                  {importIssues(importPreview).map((issue, index) => (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-coral" key={`${issueIndex(issue, index)}-${index}`}>
                      第 {issueIndex(issue, index)} 道题：{issueMessage(issue)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {importResult && (
            <div className="mt-4 rounded-3xl border border-leaf/15 bg-leaf/8 p-4">
              <p className="text-sm font-black text-ink">导入结果</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-black text-ink/50">importedCount</p>
                  <p className="text-2xl font-black text-leaf">{importResult.importedCount ?? 0}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-black text-ink/50">failedCount</p>
                  <p className="text-2xl font-black text-coral">{importResult.failedCount ?? importIssues(importResult).length}</p>
                </div>
              </div>
              {importIssues(importResult).length > 0 && (
                <div className="mt-3 space-y-2">
                  {importIssues(importResult).map((issue, index) => (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-coral" key={`${issueIndex(issue, index)}-${index}`}>
                      第 {issueIndex(issue, index)} 道题：{issueMessage(issue)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </GameCard>
      )}

      {showForm && (
        <GameCard>
          <form className="grid gap-3" onSubmit={submitForm}>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, questionCode: event.target.value })} placeholder="questionCode" value={form.questionCode} />
              <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, chapterCode: event.target.value })} placeholder="chapterCode" value={form.chapterCode} />
              <select className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, subjectCode: event.target.value as Subject, subjectName: subjectNameMap[event.target.value as Subject] })} value={form.subjectCode}>
                <option value="history">历史</option>
                <option value="politics">政治</option>
                <option value="geography">地理</option>
              </select>
              <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, chapterTitle: event.target.value })} placeholder="chapterTitle" value={form.chapterTitle} />
            </div>
            <textarea className="min-h-28 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, stem: event.target.value })} placeholder="stem 题干" value={form.stem} />
            <div className="grid gap-3 md:grid-cols-2">
              {(["optionA", "optionB", "optionC", "optionD"] as const).map((key) => (
                <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" key={key} onChange={(event) => setForm({ ...form, [key]: event.target.value })} placeholder={key} value={form[key]} />
              ))}
              <select className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, correctAnswer: event.target.value as "A" | "B" | "C" | "D" })} value={form.correctAnswer}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              <select className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, difficulty: event.target.value as Difficulty })} value={form.difficulty}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
            <textarea className="min-h-24 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, explanation: event.target.value })} placeholder="explanation 解析" value={form.explanation} />
            <input className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink" onChange={(event) => setForm({ ...form, tagsText: event.target.value })} placeholder="tags，用逗号分隔" value={form.tagsText} />
            <button className="min-h-12 rounded-2xl bg-tide px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
              {action === "submitting" ? "提交中..." : form.id ? "保存修改" : "提交新增"}
            </button>
          </form>
        </GameCard>
      )}

      <div className="space-y-3">
        {filteredQuestions.map((question) => (
          <GameCard key={question.id || question.questionCode}>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-black text-ink/58">{question.questionCode}</span>
                  <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-black text-tide">{question.subject?.name || question.subject?.code}</span>
                  <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-black text-leaf">{question.chapter?.title}</span>
                  <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-black text-ink/66">{question.difficulty}</span>
                </div>
                <h2 className="text-lg font-black leading-snug text-ink">{(question.stem || "").slice(0, 40)}{(question.stem || "").length > 40 ? "..." : ""}</h2>
                <p className="mt-2 text-sm font-bold text-coral">正确答案：{question.correctAnswer}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-48">
                <button className="min-h-11 rounded-2xl bg-tide px-4 py-2 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} onClick={() => { setForm(formFromQuestion(question)); setShowForm(true); }} type="button">
                  编辑
                </button>
                <button className="min-h-11 rounded-2xl bg-coral px-4 py-2 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} onClick={() => removeQuestion(question)} type="button">
                  {action === "deleting" ? "删除中..." : "删除"}
                </button>
              </div>
            </div>
          </GameCard>
        ))}
        {filteredQuestions.length === 0 && (
          <GameCard className="py-8 text-center">
            <p className="text-sm font-bold text-ink/58">
              {loading ? "正在加载题目..." : hasActiveFilter ? "暂无匹配题目" : "暂无题目，请先新增或批量导入"}
            </p>
          </GameCard>
        )}
      </div>
    </div>
  );
}
