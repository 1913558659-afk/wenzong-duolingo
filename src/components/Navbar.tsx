import { useState } from "react";
import { BookOpen, Brain, CalendarDays, ClipboardList, Compass, Home, LibraryBig, LogIn, LogOut, Map, Menu, Shield, UserRound, X } from "lucide-react";
import type { AuthUser, PageId } from "@/types";

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof Home;
  secondary?: boolean;
  adminOnly?: boolean;
  authOnly?: boolean;
  guestOnly?: boolean;
};

const items: NavItem[] = [
  { id: "home", label: "首页", icon: Home },
  { id: "map", label: "闯关", icon: Map },
  { id: "wrongBook", label: "错题", icon: ClipboardList },
  { id: "prompts", label: "AI", icon: Brain },
  { id: "profile", label: "我的", icon: UserRound, authOnly: true },
  { id: "auth", label: "登录", icon: LogIn, guestOnly: true },
  { id: "schedule", label: "课表", icon: CalendarDays, secondary: true },
  { id: "textbook", label: "教材", icon: BookOpen, secondary: true },
  { id: "studyAids", label: "教辅", icon: LibraryBig, secondary: true },
  { id: "quiz", label: "练习", icon: Compass, secondary: true },
  { id: "adminQuestions", label: "题库", icon: Shield, secondary: true, adminOnly: true },
  { id: "about", label: "关于", icon: Compass, secondary: true }
];

type NavbarProps = {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  user: AuthUser | null;
};

export function Navbar({ currentPage, onLogout, onNavigate, user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = items.filter((item) => {
    if (item.authOnly && !user) return false;
    if (item.guestOnly && user) return false;
    if (item.adminOnly && user?.role !== "admin") return false;
    return true;
  });
  const primaryItems = navItems.filter((item) => !item.secondary).slice(0, 5);
  const secondaryItems = navItems.filter((item) => item.secondary);
  const currentItem = navItems.find((item) => item.id === currentPage) ?? navItems[0];

  function go(page: PageId) {
    onNavigate(page);
    setIsOpen(false);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 pt-2 pointer-events-none">
      <div className="mx-auto max-w-5xl pointer-events-auto">
        <div className="md:hidden">
          {isOpen && (
            <div className="mb-3 rounded-[1.5rem] border border-white/80 bg-white/94 p-3 shadow-[0_-18px_40px_rgba(16,24,40,0.12)] backdrop-blur">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">更多入口</p>
                <button className="grid size-9 place-items-center rounded-full bg-[#101828]/6 text-[#667085]" onClick={() => setIsOpen(false)} type="button">
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {secondaryItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;

                  return (
                    <button
                      aria-label={item.label}
                      className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-[12px] font-black transition ${
                        active ? "bg-[#101828] text-white" : item.adminOnly ? "bg-[#101828]/5 text-[#667085]" : "bg-[#F7F3EA] text-[#101828]/72 hover:bg-[#E8F5F3]"
                      }`}
                      key={item.id}
                      onClick={() => go(item.id)}
                      type="button"
                    >
                      <Icon className="size-4" />
                      <span className="mt-1">{item.label}</span>
                    </button>
                  );
                })}
                {user && (
                  <button
                    className="flex min-h-14 flex-col items-center justify-center rounded-2xl bg-[#E95B4F]/10 px-2 text-[12px] font-black text-[#E95B4F]"
                    onClick={onLogout}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    <span className="mt-1">退出</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-[1.55rem] border border-white/80 bg-white/96 px-2 py-2 shadow-[0_-16px_42px_rgba(16,24,40,0.14)] backdrop-blur">
            <div className="grid grid-cols-6 gap-1">
              {primaryItems.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;

                return (
                  <button
                    aria-label={item.label}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-black transition ${
                      active ? "bg-[#101828] text-white shadow-[inset_0_-3px_0_rgba(255,255,255,0.12)]" : "text-[#667085] hover:bg-[#E8F5F3] hover:text-[#101828]"
                    }`}
                    key={item.id}
                    onClick={() => go(item.id)}
                    type="button"
                  >
                    <Icon className="size-5" />
                    <span className="mt-1">{item.label}</span>
                  </button>
                );
              })}
              <button
                aria-label="更多"
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-black transition ${
                  isOpen || secondaryItems.some((item) => item.id === currentPage) ? "bg-[#1496A3] text-white" : "text-[#667085] hover:bg-[#E8F5F3] hover:text-[#101828]"
                }`}
                onClick={() => setIsOpen((open) => !open)}
                type="button"
              >
                <Menu className="size-5" />
                <span className="mt-1">更多</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden rounded-[1.5rem] border border-white/80 bg-white/92 px-3 py-2 shadow-[0_-12px_34px_rgba(16,24,40,0.10)] backdrop-blur md:block">
          <div className="flex items-center gap-1">
            <div className="mr-2 hidden min-w-0 flex-1 items-center gap-2 px-2 lg:flex">
              <div className="grid size-9 place-items-center rounded-xl bg-[#101828] text-white">
                <Map className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#101828]">文综岛</p>
                <p className="truncate text-xs font-bold text-[#667085]">当前：{currentItem.label}</p>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;

              return (
                <button
                  aria-label={item.label}
                  className={`flex min-h-12 min-w-[58px] flex-col items-center justify-center rounded-2xl px-2 text-[11px] font-bold transition ${
                    active
                      ? "bg-[#101828] text-white"
                      : item.adminOnly
                        ? "text-[#667085]/76 hover:bg-[#101828]/5 hover:text-[#101828]"
                        : "text-[#667085] hover:bg-[#E8F5F3] hover:text-[#101828]"
                  }`}
                  key={item.id}
                  onClick={() => go(item.id)}
                  type="button"
                >
                  <Icon className="size-4" />
                  <span className="mt-0.5">{item.label}</span>
                </button>
              );
            })}

            {user && (
              <button className="ml-auto hidden rounded-full bg-[#101828]/5 px-3 py-2 text-xs font-black text-[#667085] transition hover:bg-[#E95B4F]/10 hover:text-[#E95B4F] lg:block" onClick={onLogout} type="button">
                {user.name || user.email} · 退出
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
