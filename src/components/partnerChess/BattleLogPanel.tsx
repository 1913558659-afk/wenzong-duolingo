import { GameCard } from "@/components/GameCard";

export function BattleLogPanel({ logs }: { logs: string[] }) {
  return (
    <GameCard className="bg-white/68">
      <h2 className="text-xl font-black text-ink">战斗日志</h2>
      <div className="mt-3 h-[280px] space-y-2 overflow-y-auto rounded-3xl bg-[#F7F3E7]/70 p-3 [scrollbar-width:thin]">
        {logs.length === 0 ? (
          <p className="rounded-2xl bg-white/72 px-3 py-3 text-sm font-bold text-ink/54">战斗开始后会在这里显示行动过程。</p>
        ) : (
          logs.map((log, index) => (
            <p className={`rounded-2xl border px-3 py-2 text-sm font-semibold leading-6 ${index === logs.length - 1 ? "border-tide/20 bg-tide/10 text-ink" : "border-white/70 bg-white/72 text-ink/68"}`} key={`${log}-${index}`}>
              {log}
            </p>
          ))
        )}
      </div>
    </GameCard>
  );
}
