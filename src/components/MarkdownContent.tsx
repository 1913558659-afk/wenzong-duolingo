import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content?: string | null;
  className?: string;
  debugLabel?: string;
};

function normalizeMarkdownContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n");
}

export function MarkdownContent({ className = "", content, debugLabel }: MarkdownContentProps) {
  if (!content) {
    return null;
  }

  const normalizedContent = normalizeMarkdownContent(content);

  if (import.meta.env.DEV && debugLabel) {
    console.log(`[MarkdownContent ${debugLabel}]`, JSON.stringify(normalizedContent));
  }

  return (
    <div className={`min-w-0 max-w-full break-words leading-7 text-inherit ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a className="font-black text-tide underline decoration-tide/30 underline-offset-4" href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          ),
          img: ({ alt, src }) => (
            <img
              alt={alt ?? ""}
              className="mx-auto my-3 block max-w-full rounded-2xl border border-ink/10 object-contain shadow-[0_10px_24px_rgba(16,36,63,0.08)]"
              src={src ?? ""}
            />
          ),
          li: ({ children }) => <li className="my-1 leading-7">{children}</li>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-black text-ink">{children}</strong>,
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-2xl border border-ink/10 bg-white/72">
              <table className="w-full min-w-max border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          td: ({ children }) => <td className="border border-ink/10 px-3 py-2 align-top">{children}</td>,
          th: ({ children }) => <th className="border border-ink/10 bg-ink/5 px-3 py-2 font-black text-ink">{children}</th>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
