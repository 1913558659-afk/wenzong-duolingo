import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { SubjectPill } from "@/components/SubjectPill";
import { textbookArticles } from "@/data/textbookGuides";
import { studyAids } from "@/data/studyAids";
import { subjectLabels } from "@/lib/labels";
import type { PromptCategory, Subject } from "@/types";

const subjects: Subject[] = ["history", "politics", "geography"];

type TextbookGuideProps = {
  startPractice: (levelId: string) => void;
  openPrompts: (category: PromptCategory, promptId?: string) => void;
  openStudyAid: (aidId: string) => void;
};

export function TextbookGuide({ startPractice, openPrompts, openStudyAid }: TextbookGuideProps) {
  return (
    <div>
      <PageHeader title="教材解读页" subtitle="按历史、政治、地理整理章节：先抓核心问题，再看高频考点和易错点。" />
      <div className="space-y-5">
        {subjects.map((subject) => {
          const articles = textbookArticles.filter((article) => article.subject === subject);

          return (
            <section key={subject}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-ink">{subjectLabels[subject]}</h2>
                <SubjectPill subject={subject} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {articles.map((article) => {
                  const recommendedAids = studyAids
                    .filter((aid) => aid.subject === article.subject && aid.relatedChapters.includes(article.chapter))
                    .slice(0, 2);

                  return (
                  <GameCard className="h-full" key={article.id}>
                    <h3 className="text-xl font-black text-ink">{article.chapter}</h3>
                    <p className="mt-1 text-xs font-bold text-ink/48">{article.book}</p>
                    <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/18 p-3">
                      <p className="text-xs font-black text-ink/52">核心问题</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink">{article.coreQuestion}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-black text-leaf">关键知识</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {article.keyPoints.map((point) => (
                          <span className="rounded-full bg-leaf/10 px-3 py-1 text-xs font-black text-leaf" key={point}>{point}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-tide/8 p-3">
                      <p className="text-xs font-black text-tide">高频考点</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {article.examFocus.map((point) => (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink/66 shadow-sm" key={point}>{point}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-coral/8 p-3">
                      <p className="text-xs font-black text-coral">易错点</p>
                      <ul className="mt-2 space-y-1">
                        {article.commonMistakes.map((mistake) => (
                          <li className="rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold leading-6 text-ink/68" key={mistake}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                    {recommendedAids.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-black text-gold">推荐教辅</p>
                        <div className="mt-2 grid gap-2">
                          {recommendedAids.map((aid) => (
                            <button
                              className="rounded-2xl bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-game"
                              key={aid.id}
                              onClick={() => openStudyAid(aid.id)}
                              type="button"
                            >
                              <p className="text-sm font-black text-ink">{aid.title}</p>
                              <p className="mt-1 text-xs font-semibold text-ink/58">{aid.fitFor}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" onClick={() => startPractice(article.relatedQuizId)} type="button">
                        跳转练习
                      </button>
                      <button className="rounded-2xl bg-tide px-4 py-3 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-ink" onClick={() => openPrompts(article.subject, article.relatedPromptId)} type="button">
                        跳转 AI 提示词
                      </button>
                    </div>
                  </GameCard>
                );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
