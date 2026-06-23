import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, Server, UploadCloud } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import type { PageId } from "@/types";

type ImportStatus = "idle" | "uploading" | "parsing" | "drafting" | "completed" | "failed";

type ImportResult = {
  draftCount: number;
  draftPath: string;
  fileName: string;
  jsonCount: number;
  markdownCount: number;
  ok: true;
};

const statusLabels: Record<ImportStatus, string> = {
  completed: "完成",
  drafting: "生成草稿中",
  failed: "失败",
  idle: "等待选择 PDF",
  parsing: "MinerU 解析中",
  uploading: "上传中"
};

export function FormulaAdmin({ navigate }: { navigate: (page: PageId) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const draftingTimer = useRef<number | null>(null);
  const busy = status === "uploading" || status === "parsing" || status === "drafting";

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    setResult(null);
    setStatus("idle");

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("只允许选择 PDF 文件。");
      event.target.value = "";
      return;
    }
    if (selected.size > 30 * 1024 * 1024) {
      setFile(null);
      setError("PDF 文件不能超过 30MB。");
      event.target.value = "";
      return;
    }
    setFile(selected);
  }

  function startImport() {
    if (!file || busy) return;
    setError("");
    setResult(null);
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "http://127.0.0.1:8787/api/formula-import");
    request.responseType = "json";

    request.upload.addEventListener("load", () => {
      setStatus("parsing");
      draftingTimer.current = window.setTimeout(() => setStatus("drafting"), 5000);
    });
    request.addEventListener("load", () => {
      clearDraftingTimer(draftingTimer);
      const payload = request.response as ImportResult | { ok?: false; error?: string } | null;
      if (request.status >= 200 && request.status < 300 && payload?.ok) {
        setResult(payload as ImportResult);
        setStatus("completed");
        return;
      }
      setError(payload && "error" in payload && payload.error ? payload.error : `本地后台返回错误（${request.status}）。`);
      setStatus("failed");
    });
    request.addEventListener("error", () => {
      clearDraftingTimer(draftingTimer);
      setError("无法连接本地导入后台。请先在终端运行 npm run formula:admin。");
      setStatus("failed");
    });
    request.addEventListener("timeout", () => {
      clearDraftingTimer(draftingTimer);
      setError("导入请求超时。MinerU 可能仍在运行，请检查后台终端。");
      setStatus("failed");
    });
    request.timeout = 30 * 60 * 1000;
    request.send(formData);
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <section className="rounded-[1.8rem] bg-[linear-gradient(135deg,#F7F1E4_0%,#FFFFFF_50%,#EAF5F2_100%)] px-5 py-6 sm:px-7">
        <PageHeader title="公式导入后台" subtitle="本页面仅用于本地开发者导入公式资料，不对学生开放。上传 PDF 后会调用本地 MinerU 生成公式草稿，需要进入审核台人工清洗后再发布。" />
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white">仅本地使用</span>
          <span className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-black text-coral">不会自动 approved</span>
          <span className="rounded-full bg-gold/18 px-3 py-1.5 text-xs font-black text-ink">不会覆盖正式公式数据</span>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <GameCard className="bg-white/76">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-tide/10 text-tide"><UploadCloud className="size-5" /></span>
            <div>
              <h2 className="text-lg font-black text-ink">选择本地 PDF</h2>
              <p className="mt-1 text-xs font-semibold text-ink/48">仅支持 .pdf，最大 30MB。</p>
            </div>
          </div>

          <label className={`mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition ${busy ? "cursor-not-allowed border-ink/10 bg-ink/[0.03] opacity-60" : "border-tide/30 bg-tide/[0.04] hover:bg-tide/[0.08]"}`}>
            <FileText className="size-9 text-tide" />
            <span className="mt-3 text-sm font-black text-ink">{file ? file.name : "点击选择 PDF 文件"}</span>
            <span className="mt-1 text-xs font-semibold text-ink/45">{file ? formatFileSize(file.size) : "文件只会发送到 127.0.0.1 本地服务"}</span>
            <input accept=".pdf,application/pdf" className="sr-only" disabled={busy} onChange={selectFile} type="file" />
          </label>

          {error && (
            <div className="mt-4 flex gap-2 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold leading-6 text-coral">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />{error}
            </div>
          )}

          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:opacity-55"
            disabled={!file || busy}
            onClick={startImport}
            type="button"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Server className="size-4" />}
            {busy ? statusLabels[status] : "开始 MinerU 解析"}
          </button>
        </GameCard>

        <GameCard className="bg-white/76 lg:sticky lg:top-5">
          <p className="text-xs font-black text-tide">当前状态</p>
          <div className="mt-3 flex items-center gap-3">
            <StatusIcon status={status} />
            <div>
              <h2 className="text-lg font-black text-ink">{statusLabels[status]}</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-ink/48">{statusDescription(status)}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {(["uploading", "parsing", "drafting", "completed"] as ImportStatus[]).map((step, index) => (
              <StatusStep active={status === step} complete={statusRank(status) > index + 1} key={step} label={statusLabels[step]} />
            ))}
          </div>
        </GameCard>
      </div>

      {result && (
        <GameCard className="border border-leaf/20 bg-leaf/[0.06]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-leaf" />
            <div>
              <h2 className="text-lg font-black text-ink">公式草稿生成完成</h2>
              <p className="mt-1 text-sm font-semibold text-ink/52">下一步进入审核台人工检查，不会自动发布。</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ResultItem label="PDF 文件名" value={result.fileName} />
            <ResultItem label="Markdown" value={String(result.markdownCount)} />
            <ResultItem label="JSON" value={String(result.jsonCount)} />
            <ResultItem label="草稿数量" value={String(result.draftCount)} />
            <ResultItem label="草稿路径" value={result.draftPath} />
          </div>
        </GameCard>
      )}

      <GameCard className="bg-white/70">
        <div className="flex flex-wrap gap-3">
          <button className="min-h-11 rounded-2xl bg-ink px-5 text-sm font-black text-white" onClick={() => navigate("formulaReview")} type="button">打开公式导入审核台</button>
          <button className="min-h-11 rounded-2xl bg-tide/10 px-5 text-sm font-black text-tide" onClick={() => navigate("formulaIsland")} type="button">回到公式岛</button>
        </div>
      </GameCard>
    </div>
  );
}

function clearDraftingTimer(timer: { current: number | null }) {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
    timer.current = null;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function statusRank(status: ImportStatus) {
  return { completed: 5, drafting: 3, failed: 0, idle: 0, parsing: 2, uploading: 1 }[status];
}

function statusDescription(status: ImportStatus) {
  return {
    completed: "草稿 JSON 已生成，可以进入审核台。",
    drafting: "正在扫描 MinerU 输出并提取公式。",
    failed: "请查看错误提示和本地后台终端。",
    idle: "请选择一个不超过 30MB 的 PDF。",
    parsing: "本地 MinerU 正在解析 PDF，此过程可能需要几分钟。",
    uploading: "正在把 PDF 发送到本机 127.0.0.1 服务。"
  }[status];
}

function StatusIcon({ status }: { status: ImportStatus }) {
  if (status === "completed") return <CheckCircle2 className="size-8 text-leaf" />;
  if (status === "failed") return <AlertCircle className="size-8 text-coral" />;
  if (status === "uploading" || status === "parsing" || status === "drafting") return <LoaderCircle className="size-8 animate-spin text-tide" />;
  return <Server className="size-8 text-ink/35" />;
}

function StatusStep({ active, complete, label }: { active: boolean; complete: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-black ${active ? "bg-tide/10 text-tide" : complete ? "bg-leaf/10 text-leaf" : "bg-ink/[0.035] text-ink/38"}`}>
      <span className={`size-2 rounded-full ${active ? "bg-tide" : complete ? "bg-leaf" : "bg-ink/15"}`} />
      {label}
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/76 p-4">
      <p className="text-xs font-black text-ink/42">{label}</p>
      <p className="mt-2 break-all text-sm font-black text-ink">{value}</p>
    </div>
  );
}
