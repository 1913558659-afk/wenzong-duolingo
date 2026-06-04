export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4">
      <p className="text-sm font-black text-tide">文综岛</p>
      <h1 className="mt-1 text-3xl font-black tracking-normal text-ink">{title}</h1>
      <p className="mt-2 text-sm font-semibold text-ink/64">{subtitle}</p>
    </header>
  );
}
