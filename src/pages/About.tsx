import { ArrowRight, BookOpen, Brain, ClipboardCheck, Compass, GraduationCap, LibraryBig, Map, Sparkles, UsersRound } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";

const currentServices = [
  {
    icon: BookOpen,
    title: "学科题库练习",
    text: "目前已支持历史、政治、地理等学科内容，帮助学生围绕章节和考点进行稳定训练。"
  },
  {
    icon: Map,
    title: "闯关式学习地图",
    text: "把章节拆成一个个可完成的关卡，让复习不再只是一张长清单，而是一段看得见进度的路线。"
  },
  {
    icon: ClipboardCheck,
    title: "错题本与练习记录",
    text: "记录做错的题、答题结果和学习进度，帮助学生更清楚地看见自己的薄弱点。"
  },
  {
    icon: Brain,
    title: "AI 学习提示",
    text: "提供答题思路、错题分析、复习计划等提示词，让 AI 更像一个会引导思考的学习助手。"
  },
  {
    icon: LibraryBig,
    title: "教材与教辅参考",
    text: "围绕章节整理核心问题、高频考点和适合的学习资料，帮助学生更快找到下一步。"
  }
];

const futurePlans = [
  "语文、数学、英语、物理、化学、生物等更多学科岛屿",
  "AI 个性化学习计划",
  "根据错题自动推荐章节和练习",
  "更完整的账号系统与云端学习记录",
  "家长端学习报告",
  "老师端题库与班级管理",
  "更像游戏地图的长期学习成长体系"
];

const audiences = [
  { title: "初高中学生", text: "把复习拆小，把进步看见，在每天能完成的一关里积累信心。" },
  { title: "家长", text: "更清楚地了解孩子正在练什么、卡在哪里，以及下一步适合补什么。" },
  { title: "老师与内容创作者", text: "未来可以用更轻的方式整理题库、章节、讲解和班级学习任务。" }
];

export function About({ resetStats }: { resetStats: () => void }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8 text-ink">
      <PageHeader
        title="关于 SayHi 学习岛"
        subtitle="面向初高中学生的 AI 学习服务伙伴，把高中学习做成一段可以坚持、可以反馈、可以进步的闯关旅程。"
      />

      <section className="relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,#F7F1E4_0%,#FDF9F1_48%,#EAF5F2_100%)] p-5 shadow-[0_18px_46px_rgba(16,36,63,0.08)] sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-[#1496A3]/12 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-24 w-56 rounded-full bg-[#E95B4F]/8 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="inline-flex rounded-full bg-white/72 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#1496A3]">
            SayHi Study Island
          </p>
          <h2 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">我们想做的，不只是一个刷题工具。</h2>
          <p className="mt-4 text-sm font-semibold leading-7 text-ink/70 sm:text-base">
            我们希望在 AI 时代，为每一个愿意努力的学生，做一个耐心、可靠、始终在线的学习伙伴。SayHi 学习岛是一座陪你慢慢登岛、闯关、复盘、进步的学习地图。
          </p>
          <p className="mt-3 text-sm font-semibold leading-7 text-ink/70 sm:text-base">
            在这里，学习不是被一大堆任务压住，而是一步一步知道自己该去哪、该练什么、已经进步了多少。
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {audiences.map((item) => (
          <GameCard className="min-h-[150px]" key={item.title}>
            <UsersRound className="size-6 text-tide" />
            <h3 className="mt-3 text-lg font-black">{item.title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{item.text}</p>
          </GameCard>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Now Available</p>
          <h2 className="mt-1 text-2xl font-black">现在已经提供的服务</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {currentServices.map((service) => {
            const Icon = service.icon;
            return (
              <GameCard className="min-h-[168px]" key={service.title}>
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#EAF5F2] text-tide">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black">{service.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-ink/64">{service.text}</p>
                  </div>
                </div>
              </GameCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <GameCard className="bg-[#0B1F3A] text-white">
          <Sparkles className="size-7 text-[#F3B24A]" />
          <h2 className="mt-4 text-2xl font-black">即将开放</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-white/62">
            SayHi 学习岛会从文史类训练继续扩展到更多学科、更多角色和更完整的学习闭环。我们希望它越来越像一个真正懂学习节奏的伙伴。
          </p>
        </GameCard>

        <GameCard>
          <div className="grid gap-3 sm:grid-cols-2">
            {futurePlans.map((plan) => (
              <div className="flex items-start gap-2 rounded-2xl bg-[#F7F1E4]/72 p-3" key={plan}>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-[#E95B4F]" />
                <p className="text-sm font-bold leading-6 text-ink/72">{plan}</p>
              </div>
            ))}
          </div>
        </GameCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <GameCard className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#1496A3]/10 text-tide">
              <Compass className="size-5" />
            </span>
            <h2 className="text-xl font-black">写在最后</h2>
          </div>
          <p className="text-sm font-semibold leading-7 text-ink/68 sm:text-base">
            学习从来不是一瞬间的逆袭，而是一次次选择继续前进。SayHi 学习岛想做的，就是在你想放弃的时候，帮你看见下一关；在你学会一点点的时候，认真记录你的进步。
          </p>
        </GameCard>

        <GameCard className="space-y-3">
          <GraduationCap className="size-6 text-[#E95B4F]" />
          <h2 className="text-lg font-black">本机学习记录</h2>
          <p className="text-sm font-semibold leading-6 text-ink/62">
            如果你在这台设备上试用过学习记录，可以清空后重新开始。账号进度不会在这里被展示为开发说明。
          </p>
          <button className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame transition hover:-translate-y-0.5 hover:bg-[#1496A3]" onClick={resetStats} type="button">
            重置本机记录
          </button>
        </GameCard>
      </section>
    </div>
  );
}
