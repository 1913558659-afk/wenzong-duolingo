import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { SubjectPill } from "@/components/SubjectPill";
import { studyAids } from "@/data/studyAids";
import { buildBuyLinks } from "@/lib/buyLinks";
import { difficultyLabels } from "@/lib/labels";

type StudyAidDetailProps = {
  aidId: string | null;
  backToList: () => void;
};

export function StudyAidDetail({ aidId, backToList }: StudyAidDetailProps) {
  const aid = studyAids.find((item) => item.id === aidId) ?? studyAids[0];
  const buyLinks = buildBuyLinks(aid.searchKeyword);

  return (
    <div>
      <PageHeader title={aid.title} subtitle="从适合阶段、使用场景和注意事项来判断这本资料是否适合你。" />
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.45fr]">
        <GameCard>
          <div className={`min-h-48 rounded-2xl ${aid.coverColor} p-5 text-white shadow-insetGame`}>
            <p className="text-sm font-black opacity-80">{aid.grade} · {aid.type}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">{aid.title}</h1>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SubjectPill subject={aid.subject} />
            <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-black text-ink/58">{difficultyLabels[aid.difficulty]}</span>
            <span className="rounded-full bg-gold/24 px-3 py-1 text-xs font-black text-ink/70">{aid.priceRange}</span>
          </div>
          <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/18 p-3">
            <p className="text-xs font-black text-ink/52">价格说明</p>
            <p className="mt-1 text-sm font-bold leading-6 text-ink/70">{aid.priceRange}，仅供参考，实际以平台为准；版本和库存以购买页面为准。</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {buyLinks.map((link) => (
              <a className="rounded-2xl bg-coral px-4 py-3 text-center text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" href={link.url} key={link.label} rel="noreferrer" target="_blank">
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-2 grid gap-2">
            <button className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-tide" onClick={backToList} type="button">
              返回教辅雷达
            </button>
          </div>
        </GameCard>

        <div className="space-y-4">
          <GameCard>
            <p className="text-xs font-black text-tide">适合谁</p>
            <p className="mt-2 text-base font-semibold leading-7 text-ink/70">{aid.fitFor}</p>
          </GameCard>
          <GameCard>
            <p className="text-xs font-black text-leaf">亮点</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {aid.highlights.map((item) => (
                <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-black text-leaf" key={item}>{item}</span>
              ))}
            </div>
          </GameCard>
          <GameCard>
            <p className="text-xs font-black text-coral">使用前提醒</p>
            <ul className="mt-2 space-y-1">
              {aid.cautions.map((item) => (
                <li className="rounded-2xl bg-coral/8 px-3 py-2 text-sm font-semibold leading-6 text-ink/68" key={item}>{item}</li>
              ))}
            </ul>
          </GameCard>
          <GameCard>
            <p className="text-xs font-black text-tide">关联章节</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {aid.relatedChapters.map((item) => (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/66" key={item}>{item}</span>
              ))}
            </div>
          </GameCard>
        </div>
      </div>
    </div>
  );
}
