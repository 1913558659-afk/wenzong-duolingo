export function SkillUnlockHint({ level }: { level: number }) {
  return (
    <span className="rounded-full bg-ink/8 px-2 py-1 text-[11px] font-black text-ink/42">
      Lv.{level} 解锁
    </span>
  );
}
