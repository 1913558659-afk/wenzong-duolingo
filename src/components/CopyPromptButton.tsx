import { useState } from "react";

export function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className={`min-h-11 shrink-0 rounded-2xl px-4 py-2 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
        copied ? "bg-leaf" : "bg-tide hover:bg-ink"
      }`}
      disabled={copied}
      onClick={copyText}
      type="button"
    >
      {copied ? "已复制" : "一键复制"}
    </button>
  );
}
