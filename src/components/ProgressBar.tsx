export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-ink/12">
      <div
        className="h-full rounded-full bg-gradient-to-r from-leaf via-gold to-coral"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
