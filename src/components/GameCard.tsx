import type { ReactNode } from "react";

type GameCardProps = {
  children: ReactNode;
  className?: string;
};

export function GameCard({ children, className = "" }: GameCardProps) {
  return (
    <section className={`min-w-0 rounded-2xl border border-white/70 bg-white/82 p-4 shadow-game backdrop-blur-sm sm:p-5 ${className}`}>
      {children}
    </section>
  );
}
