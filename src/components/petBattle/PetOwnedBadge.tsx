export function PetOwnedBadge({
  state
}: {
  state: "boss" | "capturable" | "owned" | "unowned";
}) {
  const styles = {
    boss: "bg-ink/10 text-ink/60 ring-ink/10",
    capturable: "bg-gold/12 text-gold ring-gold/20",
    owned: "bg-tide/12 text-tide ring-tide/20",
    unowned: "bg-ink/6 text-ink/42 ring-ink/8"
  };
  const labels = {
    boss: "Boss 暂不可捕捉",
    capturable: "可捕捉",
    owned: "已拥有",
    unowned: "未拥有"
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-black ring-1 ${styles[state]}`}>
      {labels[state]}
    </span>
  );
}
