import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { StudyAidCard } from "@/components/StudyAidCard";
import { studyAids } from "@/data/studyAids";
import { subjectLabels } from "@/lib/labels";
import type { StudyAid, Subject } from "@/types";

const subjects: ("all" | Subject)[] = ["all", "history", "politics", "geography", "biology", "math", "english"];

type StudyAidListProps = {
  openDetail: (aidId: string) => void;
};

export function StudyAidList({ openDetail }: StudyAidListProps) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<"all" | Subject>("all");

  const filteredAids = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return studyAids.filter((aid: StudyAid) => {
      const matchSubject = subject === "all" || aid.subject === subject;
      const text = [aid.title, aid.fitFor, aid.type, aid.grade, ...aid.relatedChapters, ...aid.highlights].join(" ").toLowerCase();
      return matchSubject && (!keyword || text.includes(keyword));
    });
  }, [query, subject]);

  return (
    <div>
      <PageHeader title="教辅雷达" subtitle="先用本地数据介绍常见教辅类型，帮你按学科、难度和使用场景做选择。" />

      <GameCard className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm transition focus:border-tide"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索书名、章节、适合人群"
            value={query}
          />
          <div className="grid gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap">
            {subjects.map((item) => (
              <button
                className={`min-h-11 rounded-2xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                  subject === item ? "bg-ink text-white shadow-insetGame" : "bg-white text-ink/64 hover:bg-white/80 hover:text-ink"
                }`}
                key={item}
                onClick={() => setSubject(item)}
                type="button"
              >
                {item === "all" ? "全部" : subjectLabels[item]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-gold/14 px-3 py-2 text-xs font-bold leading-5 text-ink/58">价格仅供参考，实际以平台为准。购买入口会跳转到平台搜索页，不绑定具体商品。</p>
      </GameCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAids.map((aid) => (
          <StudyAidCard aid={aid} key={aid.id} onOpen={openDetail} />
        ))}
      </div>

      {filteredAids.length === 0 && (
        <GameCard className="mt-4 text-center">
          <p className="text-sm font-bold text-ink/58">暂时没有匹配的教辅，可以换个关键词试试。</p>
        </GameCard>
      )}
    </div>
  );
}
