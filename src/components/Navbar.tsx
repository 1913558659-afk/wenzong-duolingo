import { useState } from "react";
import type { AuthUser, PageId } from "@/types";

const items: { id: PageId; label: string; icon: string }[] = [
  { id: "home", label: "首页", icon: "I" },
  { id: "map", label: "闯关", icon: "M" },
  { id: "quiz", label: "练习", icon: "Q" },
  { id: "schedule", label: "课表", icon: "T" },
  { id: "prompts", label: "AI", icon: "A" },
  { id: "textbook", label: "教材", icon: "B" },
  { id: "studyAids", label: "教辅", icon: "R" },
  { id: "wrongBook", label: "错题", icon: "W" },
  { id: "profile", label: "我的", icon: "P" },
  { id: "auth", label: "登录", icon: "U" },
  { id: "about", label: "关于", icon: "?" }
];

type NavbarProps = {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  user: AuthUser | null;
};

export function Navbar({ currentPage, onLogout, onNavigate, user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = items.filter((item) => (user ? item.id !== "auth" : item.id !== "profile"));
  const currentItem = navItems.find((item) => item.id === currentPage) ?? navItems[0];

  function go(page: PageId) {
    onNavigate(page);
    setIsOpen(false);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/55 bg-parchment/96 px-3 pb-3 pt-2 shadow-[0_-12px_30px_rgba(23,32,51,0.12)] backdrop-blur">
      <div className="mx-auto max-w-5xl md:hidden">
        {isOpen && (
          <div className="mb-2 grid grid-cols-3 gap-2 rounded-2xl border border-white/70 bg-white/88 p-2 shadow-game">
            {navItems.map((item) => {
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
        <div className={`grid gap-2 ${user ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]"}`}>
          <button
            className="flex min-h-14 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-black text-white shadow-insetGame"
            onClick={() => setIsOpen((open) => !open)}
            type="button"
          >
            {isOpen ? "收起导航" : `当前：${currentItem.label}`}
          </button>
          {user && (
            <button
              className="min-h-14 rounded-2xl bg-coral px-5 text-sm font-black text-white shadow-insetGame"
              onClick={onLogout}
              type="button"
            >
              退出
            </button>
          )}
          <button
            className="min-h-14 rounded-2xl bg-tide px-5 text-sm font-black text-white shadow-insetGame"
            onClick={() => setIsOpen((open) => !open)}
            type="button"
          >
            {isOpen ? "关闭" : "菜单"}
          </button>
        </div>
      </div>

      <div className="mx-auto hidden max-w-5xl gap-1 md:grid md:grid-cols-10">
        {navItems.map((item) => {
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
      {user && (
        <div className="mx-auto mt-2 hidden max-w-5xl justify-end md:flex">
          <button className="rounded-full bg-white/72 px-3 py-1 text-xs font-black text-ink/58 transition hover:bg-coral/12 hover:text-coral" onClick={onLogout} type="button">
            当前用户：{user.name || user.email} · 退出
          </button>
        </div>
      )}
    </nav>
  );
}
