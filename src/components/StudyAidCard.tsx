import { GameCard } from "@/components/GameCard";
import { SubjectPill } from "@/components/SubjectPill";
import { buildBuyLinks } from "@/lib/buyLinks";
import { difficultyLabels } from "@/lib/labels";
import type { StudyAid } from "@/types";

type StudyAidCardProps = {
  aid: StudyAid;
  onOpen: (aidId: string) => void;
};

export function StudyAidCard({ aid, onOpen }: StudyAidCardProps) {
  const [primaryBuyLink] = buildBuyLinks(aid.searchKeyword);

  return (
    <GameCard className="flex h-full flex-col p-0 transition hover:-translate-y-0.5">
      <div className={`rounded-t-2xl ${aid.coverColor} p-4 text-white shadow-insetGame`}>
        <p className="text-xs font-black opacity-80">{aid.grade} · {aid.type}</p>
        <h3 className="mt-2 min-h-14 text-xl font-black leading-tight">{aid.title}</h3>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          <SubjectPill subject={aid.subject} />
          <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-black text-ink/58">难度：{difficultyLabels[aid.difficulty]}</span>
          <span className="rounded-full bg-gold/24 px-3 py-1 text-xs font-black text-ink/70">{aid.priceRange}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-black text-tide">适合阶段</p>
            <p className="mt-1 text-sm font-bold text-ink">{aid.grade} · {aid.type}</p>
          </div>
          <div>
            <p className="text-xs font-black text-leaf">适合人群</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/66">{aid.fitFor}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {aid.highlights.slice(0, 2).map((item) => (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/52" key={item}>{item}</span>
          ))}
        </div>

        <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
          <a className="rounded-2xl bg-coral px-4 py-3 text-center text-sm font-black text-white shadow-insetGame" href={primaryBuyLink.url} rel="noreferrer" target="_blank">
            购买入口
          </a>
          <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame" onClick={() => onOpen(aid.id)} type="button">
            查看详情
          </button>
        </div>
      </div>
    </GameCard>
  );
}
