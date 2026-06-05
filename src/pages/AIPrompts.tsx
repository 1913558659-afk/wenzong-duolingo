import { CopyPromptButton } from "@/components/CopyPromptButton";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { aiPrompts } from "@/data/aiPrompts";
import { promptCategoryLabels } from "@/lib/labels";
import type { PromptCategory } from "@/types";

const categories: PromptCategory[] = ["history", "politics", "geography", "wrongReview", "recitePlan"];

export function AIPrompts({ activeCategory, activePromptId }: { activeCategory?: PromptCategory; activePromptId?: string }) {
  const orderedCategories = activeCategory ? [activeCategory, ...categories.filter((item) => item !== activeCategory)] : categories;

  return (
    <div>
      <PageHeader title="AI 学习提示词页" subtitle="选一个你现在需要的方向，一键复制后把自己的题目或材料补进去。" />
      <div className="mb-5 flex flex-wrap gap-2">
        {orderedCategories.map((category) => (
          <span
            className={`rounded-full px-4 py-2 text-sm font-black ${
              category === activeCategory ? "bg-ink text-white shadow-insetGame" : "bg-white/80 text-ink/62"
            }`}
            key={category}
          >
            {promptCategoryLabels[category]}
          </span>
        ))}
      </div>
      <div className="space-y-6">
        {orderedCategories.map((category) => {
          const prompts = aiPrompts
            .filter((item) => item.category === category)
            .sort((first, second) => Number(second.id === activePromptId) - Number(first.id === activePromptId));

          return (
            <section key={category}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-ink">{promptCategoryLabels[category]}</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/52">{prompts.length} 个提示词</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {prompts.map((item) => (
                  <GameCard className={item.id === activePromptId ? "ring-2 ring-tide" : ""} key={item.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-lg font-black text-ink">{item.title}</h3>
                      <CopyPromptButton text={item.prompt} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-tide/8 p-3">
                      <p className="text-xs font-black text-tide">适用场景</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink/72">{item.useCase}</p>
                    </div>
                    <p className="mt-3 rounded-2xl bg-ink/5 p-3 text-sm font-semibold leading-6 text-ink/72">{item.prompt}</p>
                    <p className="mt-3 rounded-2xl bg-white/70 p-3 text-xs font-semibold leading-5 text-ink/52">{item.example}</p>
                  </GameCard>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
