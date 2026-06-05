import { useState } from "react";
import type { PageId } from "@/types";

const items: { id: PageId; label: string; icon: string }[] = [
  { id: "home", label: "首页", icon: "I" },
  { id: "map", label: "闯关", icon: "M" },
  { id: "quiz", label: "练习", icon: "Q" },
  { id: "schedule", label: "课表", icon: "T" },
  { id: "prompts", label: "AI", icon: "A" },
  { id: "textbook", label: "教材", icon: "B" },
  { id: "studyAids", label: "教辅", icon: "R" },
  { id: "wrongBook", label: "错题", icon: "W" },
  { id: "about", label: "关于", icon: "?" }
];

type NavbarProps = {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
};

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentItem = items.find((item) => item.id === currentPage) ?? items[0];

  function go(page: PageId) {
    onNavigate(page);
    setIsOpen(false);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/55 bg-parchment/96 px-3 pb-3 pt-2 shadow-[0_-12px_30px_rgba(23,32,51,0.12)] backdrop-blur">
      <div className="mx-auto max-w-5xl md:hidden">
        {isOpen && (
          <div className="mb-2 grid grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/88 p-2 shadow-game">
            {items.map((item) => {
              const active = currentPage === item.id;

              return (
                <button
                  aria-label={item.label}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-2 text-[12px] font-black transition ${
                    active ? "bg-ink text-white shadow-insetGame" : "bg-white text-ink/70 hover:bg-parchment hover:text-ink"
                  }`}
                  key={item.id}
                  onClick={() => go(item.id)}
                  type="button"
                >
                  <span className="grid size-5 place-items-center text-sm leading-none">{item.icon}</span>
                  <span className="mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            className="flex min-h-14 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame"
            onClick={() => setIsOpen((open) => !open)}
            type="button"
          >
            {isOpen ? "收起导航" : `当前：${currentItem.label}`}
          </button>
          <button
            className="min-h-14 rounded-2xl bg-tide px-5 text-sm font-black text-white shadow-insetGame"
            onClick={() => setIsOpen((open) => !open)}
            type="button"
          >
            {isOpen ? "关闭" : "菜单"}
          </button>
        </div>
      </div>

      <div className="mx-auto hidden max-w-5xl gap-1 md:grid md:grid-cols-9">
        {items.map((item) => {
          const active = currentPage === item.id;

          return (
            <button
              aria-label={item.label}
              className={`flex min-h-14 min-w-[64px] flex-col items-center justify-center rounded-xl px-2 text-[11px] font-bold transition md:min-w-0 ${
                active ? "bg-ink text-white shadow-insetGame" : "text-ink/70 hover:bg-white/75 hover:text-ink"
              }`}
              key={item.id}
              onClick={() => go(item.id)}
              type="button"
            >
              <span className="grid size-5 place-items-center text-sm leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
