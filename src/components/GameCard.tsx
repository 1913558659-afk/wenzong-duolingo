import type { ReactNode } from "react";

type GameCardProps = {
  children: ReactNode;
  className?: string;
};

export function GameCard({ children, className = "" }: GameCardProps) {
  return (
    <section className={`rounded-2xl border border-white/65 bg-white/78 p-4 shadow-game ${className}`}>
      {children}
    </section>
  );
}
