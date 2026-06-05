export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-5 sm:mb-6">
      <p className="text-sm font-black text-tide">文综岛</p>
      <h1 className="mt-1 text-3xl font-black leading-tight tracking-normal text-ink sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-ink/64 sm:text-base">{subtitle}</p>
    </header>
  );
}
