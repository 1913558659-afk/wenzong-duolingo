import type { DailyTrainingProgress } from "@/utils/petTrainingSave";

function TaskRow({ done, label, progress, reward }: { done: boolean; label: string; progress: string; reward: string }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${done ? "border-leaf/20 bg-leaf/10" : "border-white/70 bg-white/60"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-ink">{label}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${done ? "bg-leaf/15 text-leaf" : "bg-ink/6 text-ink/48"}`}>
          {done ? "已领取" : progress}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-bold text-ink/52">{reward}</p>
    </div>
  );
}

export function DailyTrainingRewardPanel({ progress }: { progress: DailyTrainingProgress }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/58 p-4">
      <div className="mb-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Daily Training</p>
        <h3 className="mt-1 text-lg font-black text-ink">每日训练奖励</h3>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <TaskRow done={progress.claimedFirstEntry} label="首次进入训练场" progress="可领取" reward="学习币 +20" />
        <TaskRow done={progress.claimedFirstWin} label="首次训练胜利" progress={`${progress.dailyWins}/1`} reward="学习币 +50" />
        <TaskRow done={progress.claimedThreeBattles} label="完成 3 次训练" progress={`${Math.min(3, progress.dailyBattles)}/3`} reward="学习币 +80 · 类型碎片 +1" />
        <TaskRow done={progress.claimedCaptureBonus} label="首次捕捉成功" progress={`${progress.dailyCaptures}/1`} reward="对应类型碎片 +2" />
      </div>
    </div>
  );
}
