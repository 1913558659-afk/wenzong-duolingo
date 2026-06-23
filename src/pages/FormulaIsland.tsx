import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, BookOpenCheck, ChevronRight, Compass, Search, Sparkles, X } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageHeader } from "@/components/PageHeader";
import { formulaItems, formulaSubjectConfig } from "@/data/formulaData";
import { importedFormulaData } from "@/data/importedFormulaData";
import { getFormulaQualityIssues, hasIncompleteVariables, hasRoughFormulaTitle } from "@/lib/formulaImportQuality";
import type { FormulaItem, FormulaSubject } from "@/data/formulaData";
import type { PageId } from "@/types";

const subjects = Object.keys(formulaSubjectConfig) as FormulaSubject[];
const allFormulaItems = [...formulaItems, ...importedFormulaData];

export function FormulaIsland({ navigate }: { navigate: (page: PageId) => void }) {
  const [subject, setSubject] = useState<FormulaSubject>("math");
  const [chapter, setChapter] = useState("全部章节");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("math-arithmetic-term");
  const config = formulaSubjectConfig[subject];
  const chapters = [...new Set([...config.chapters, ...allFormulaItems.filter((item) => item.subject === subject).map((item) => item.chapter)])];

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allFormulaItems.filter((item) => {
      if (item.subject !== subject) return false;
      if (chapter !== "全部章节" && item.chapter !== chapter) return false;
      if (!normalizedQuery) return true;
      return [
        item.name,
        item.chapter,
        item.scenario,
        item.latex,
        ...item.keywords,
        ...item.commonMistakes,
        ...item.variables.map((variable) => `${variable.symbol} ${variable.meaning}`)
      ].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [chapter, query, subject]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  function chooseSubject(nextSubject: FormulaSubject) {
    const firstFormula = allFormulaItems.find((item) => item.subject === nextSubject);
    setSubject(nextSubject);
    setChapter("全部章节");
    setQuery("");
    setSelectedId(firstFormula?.id ?? null);
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <section className="overflow-hidden rounded-[1.8rem] bg-[radial-gradient(circle_at_82%_16%,rgba(243,178,74,0.3),transparent_24%),linear-gradient(135deg,#E4F6F2_0%,#FFF8EC_55%,#FBE5DF_100%)] px-5 py-6 sm:px-7 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <PageHeader title="公式岛" subtitle="把数学、物理、地理公式变成可以理解、可以练习、可以闯关的知识卡片。" />
          <div className="hidden items-end gap-2 pb-6 lg:flex">
            <span className="grid size-14 place-items-center rounded-3xl bg-white/70 text-tide shadow-game"><Compass className="size-7" /></span>
            <span className="grid size-20 place-items-center rounded-[2rem] bg-ink text-gold shadow-game"><Sparkles className="size-9" /></span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {subjects.map((item) => (
            <button
              className={`min-h-11 shrink-0 rounded-2xl px-6 text-sm font-black transition ${subject === item ? "bg-ink text-white shadow-game" : "bg-white/72 text-ink/62 hover:bg-white"}`}
              key={item}
              onClick={() => chooseSubject(item)}
              type="button"
            >
              {formulaSubjectConfig[item].label}
            </button>
          ))}
        </div>
      </section>

      <GameCard className="bg-white/76">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/35" />
          <input
            aria-label="搜索公式"
            className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-12 py-3 text-sm font-bold text-ink outline-none transition placeholder:text-ink/35 focus:border-tide/45 focus:ring-4 focus:ring-tide/10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索公式名称、关键词或适用场景，例如：速度、比例尺、等差数列、太阳高度角"
            value={query}
          />
          {query && (
            <button aria-label="清空搜索" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-ink/5 text-ink/50" onClick={() => setQuery("")} type="button">
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["全部章节", ...chapters].map((item) => (
            <button
              className={`min-h-9 shrink-0 rounded-full px-4 text-xs font-black transition ${chapter === item ? "bg-tide text-white" : "bg-ink/5 text-ink/58 hover:bg-tide/10 hover:text-tide"}`}
              key={item}
              onClick={() => setChapter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </GameCard>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-tide">{config.label}航线</p>
              <h2 className="mt-1 text-xl font-black text-ink">{chapter === "全部章节" ? "全部公式卡片" : chapter}</h2>
            </div>
            <span className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-ink/48">{filtered.length} 张卡片</span>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((item, index) => (
                <FormulaCard active={selected?.id === item.id} index={index} item={item} key={item.id} onSelect={() => setSelectedId(item.id)} />
              ))}
            </div>
          ) : (
            <GameCard className="border border-dashed border-tide/25 bg-white/65 py-12 text-center">
              <Search className="mx-auto size-9 text-tide/45" />
              <h3 className="mt-3 text-lg font-black text-ink">没有找到匹配的公式</h3>
              <p className="mt-2 text-sm font-semibold text-ink/50">试试缩短关键词，或者切换到其他章节。</p>
            </GameCard>
          )}
        </div>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-5">
          {selected ? <FormulaDetail item={selected} /> : (
            <GameCard className="bg-white/70 text-center">
              <BookOpenCheck className="mx-auto size-9 text-tide/45" />
              <p className="mt-3 text-sm font-bold text-ink/50">选择一张公式卡片查看完整讲解。</p>
            </GameCard>
          )}
        </aside>
      </div>

      {import.meta.env.DEV && (
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button className="text-xs font-bold text-ink/35 underline decoration-ink/20 underline-offset-4 transition hover:text-tide" onClick={() => navigate("formulaAdmin")} type="button">
            开发工具：公式导入后台
          </button>
          <button className="text-xs font-bold text-ink/35 underline decoration-ink/20 underline-offset-4 transition hover:text-tide" onClick={() => navigate("formulaReview")} type="button">
            开发工具：导入审核台
          </button>
        </div>
      )}
    </div>
  );
}

function FormulaCard({ active, index, item, onSelect }: { active: boolean; index: number; item: FormulaItem; onSelect: () => void }) {
  const qualityIssues = item.imported ? getFormulaQualityIssues(item) : [];
  const roughTitle = item.imported && hasRoughFormulaTitle(item.name);
  const incompleteVariables = item.imported && hasIncompleteVariables(item);
  return (
    <button className="text-left" onClick={onSelect} type="button">
      <GameCard className={`h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(16,35,63,0.11)] ${active ? "border-tide/30 bg-tide/[0.06] ring-2 ring-tide/15" : "bg-white/78"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-black text-ink/48">{item.chapter}</span>
            {item.imported && <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-black text-ink">MinerU 导入</span>}
            {roughTitle && <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-black text-coral">待清洗</span>}
            {incompleteVariables && <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[10px] font-black text-coral">待补充变量解释</span>}
          </div>
          <span className="text-xs font-black text-gold">航点 {String(index + 1).padStart(2, "0")}</span>
        </div>
        <h3 className="mt-4 text-lg font-black text-ink">{item.name}</h3>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-ink px-3 py-2 text-center text-white">
          <MarkdownContent className="text-base font-bold" content={`$$${item.latex}$$`} />
        </div>
        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-ink/55">{item.scenario}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs font-black text-coral">{qualityIssues.length ? `待整理 ${qualityIssues.length} 项` : `易错点 ${item.commonMistakes.length} 个`}</span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-tide">查看详情<ChevronRight className="size-3.5" /></span>
        </div>
      </GameCard>
    </button>
  );
}

function FormulaDetail({ item }: { item: FormulaItem }) {
  return (
    <GameCard className={`bg-gradient-to-br ${formulaSubjectConfig[item.subject].color}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-tide">{formulaSubjectConfig[item.subject].label} · {item.chapter}</p>
          <h2 className="mt-1 text-xl font-black text-ink">{item.name}</h2>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/75 text-gold"><Sparkles className="size-5" /></span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-ink px-4 py-4 text-center text-white shadow-insetGame">
        <MarkdownContent className="text-lg font-black" content={`$$${item.latex}$$`} />
      </div>

      <DetailBlock title="变量解释">
        <div className="space-y-2">
          {item.variables.map((variable) => (
            <div className="grid grid-cols-[72px_1fr] gap-2 text-sm" key={variable.symbol}>
              <span className="rounded-xl bg-white/70 px-2 py-1 text-center font-black text-tide">{variable.symbol}</span>
              <span className="py-1 font-semibold leading-5 text-ink/62">{variable.meaning}</span>
            </div>
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title="使用步骤">
        <ol className="space-y-2">
          {item.steps.map((step, index) => (
            <li className="flex gap-2 text-sm font-semibold leading-5 text-ink/62" key={step}>
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-tide text-[10px] font-black text-white">{index + 1}</span>{step}
            </li>
          ))}
        </ol>
      </DetailBlock>

      <DetailBlock title="易错提醒">
        <div className="space-y-2">
          {item.commonMistakes.map((mistake) => (
            <p className="flex gap-2 text-sm font-semibold leading-5 text-coral" key={mistake}><AlertTriangle className="mt-0.5 size-4 shrink-0" />{mistake}</p>
          ))}
        </div>
      </DetailBlock>

      <DetailBlock title="示例题">
        <p className="text-sm font-semibold leading-6 text-ink/62">{item.example}</p>
      </DetailBlock>

      <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-coral px-4 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" type="button">
        <BookOpenCheck className="size-4" />加入练习（即将开放）
      </button>
    </GameCard>
  );
}

function DetailBlock({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-sm font-black text-ink">{title}</h3>
      {children}
    </div>
  );
}
