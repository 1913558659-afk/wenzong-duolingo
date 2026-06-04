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
      <div className="space-y-5">
        {orderedCategories.map((category) => {
          const prompts = aiPrompts
            .filter((item) => item.category === category)
            .sort((first, second) => Number(second.id === activePromptId) - Number(first.id === activePromptId));

          return (
            <section key={category}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-black text-ink">{promptCategoryLabels[category]}</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/52">{prompts.length} 个提示词</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {prompts.map((item) => (
                  <GameCard className={item.id === activePromptId ? "ring-2 ring-tide" : ""} key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black text-ink">{item.title}</h3>
                      <CopyPromptButton text={item.prompt} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-tide">{item.useCase}</p>
                    <p className="mt-3 rounded-2xl bg-ink/5 p-3 text-sm font-semibold leading-6 text-ink/72">{item.prompt}</p>
                    <p className="mt-3 text-xs font-semibold leading-5 text-ink/52">{item.example}</p>
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
