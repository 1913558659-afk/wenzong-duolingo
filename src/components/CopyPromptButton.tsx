import { useState } from "react";

export function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <button className="rounded-2xl bg-tide px-4 py-2 text-sm font-black text-white shadow-insetGame" onClick={copyText} type="button">
      {copied ? "已复制" : "复制"}
    </button>
  );
}
