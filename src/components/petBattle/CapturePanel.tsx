export function CapturePanel({
  canCapture,
  isBoss,
  onCapture,
  rate
}: {
  canCapture: boolean;
  isBoss: boolean;
  onCapture: () => void;
  rate: number;
}) {
  if (!canCapture && !isBoss) return null;

  return (
    <div className="mb-4 rounded-3xl border border-gold/30 bg-gold/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-ink">捕捉机会</p>
          <p className="mt-1 text-xs font-bold leading-5 text-ink/58">
            {isBoss ? "Boss 暂不可直接捕捉，胜利后可获得类型碎片。" : `当前成功率约 ${rate}%，失败后敌人会立刻行动。`}
          </p>
        </div>
        <button
          className={`min-h-11 rounded-2xl px-4 text-sm font-black shadow-insetGame transition ${
            canCapture ? "bg-gold text-ink hover:-translate-y-0.5 hover:bg-tide hover:text-white" : "cursor-not-allowed bg-ink/10 text-ink/35"
          }`}
          disabled={!canCapture}
          onClick={onCapture}
          type="button"
        >
          捕捉
        </button>
      </div>
    </div>
  );
}
