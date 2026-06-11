import { useState } from "react";
import { BookOpen, Brain, CalendarDays, ClipboardList, Compass, Crown, Home, LibraryBig, LogIn, LogOut, Map, Menu, Palmtree, PawPrint, PenSquare, Shield, Swords, UserRound, X } from "lucide-react";
import type { AuthUser, PageId } from "@/types";

type NavItem = {
  id: PageId;
  label: string;
  icon: typeof Home;
  adminOnly?: boolean;
  authOnly?: boolean;
  guestOnly?: boolean;
  mobilePrimary?: boolean;
};

const items: NavItem[] = [
  { id: "home", label: "首页", icon: Home, mobilePrimary: true },
  { id: "map", label: "闯关", icon: Map, mobilePrimary: true },
  { id: "petBattle", label: "伙伴岛", icon: PawPrint },
  { id: "partnerChess", label: "战棋场", icon: Swords },
  { id: "wrongBook", label: "错题本", icon: ClipboardList, mobilePrimary: true },
  { id: "quiz", label: "练习", icon: PenSquare },
  { id: "schedule", label: "课表", icon: CalendarDays },
  { id: "prompts", label: "AI学习", icon: Brain, mobilePrimary: true },
  { id: "textbook", label: "教材", icon: BookOpen },
  { id: "studyAids", label: "教辅", icon: LibraryBig },
  { id: "auth", label: "登录", icon: LogIn, guestOnly: true, mobilePrimary: true },
  { id: "profile", label: "我的", icon: UserRound, authOnly: true, mobilePrimary: true },
  { id: "adminQuestions", label: "题库管理", icon: Shield, adminOnly: true },
  { id: "about", label: "关于", icon: Compass }
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
  const mobilePrimary = navItems.filter((item) => item.mobilePrimary).slice(0, 5);
  const mobileMore = navItems.filter((item) => !item.mobilePrimary);

  function go(page: PageId) {
    onNavigate(page);
    setIsOpen(false);
  }

  return (
    <>
      <aside className="fixed bottom-3 left-3 top-3 z-50 hidden w-[240px] flex-col overflow-y-auto overscroll-contain rounded-[1.4rem] bg-[#0B1F3A] p-4 text-white shadow-[0_24px_60px_rgba(11,31,58,0.22)] [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin] md:flex">
        <button className="flex items-center gap-3 rounded-2xl px-2 py-3 text-left" onClick={() => go("home")} type="button">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#F7F1E4]/10 text-[#F3B24A]">
            <Palmtree className="size-6" />
          </div>
          <div>
            <p className="text-lg font-black leading-none">SayHi 学习岛</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">全科学习</p>
          </div>
        </button>

        <div className="mt-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                aria-label={item.label}
                className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-black transition ${
                  active
                    ? "bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : item.adminOnly
                      ? "text-white/42 hover:bg-white/8 hover:text-white/72"
                      : "text-white/68 hover:bg-white/8 hover:text-white"
                }`}
                key={item.id}
                onClick={() => go(item.id)}
                type="button"
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto rounded-[1.2rem] border border-white/8 bg-white/[0.06] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-[#F3B24A]/15 text-[#F3B24A]">
              <Crown className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black">学习达人</p>
              <p className="text-xs font-bold text-white/45">稳定输入，稳步提分</p>
            </div>
          </div>
          <p className="text-xs font-bold leading-5 text-white/56">连续学习记录会保存在当前账号或浏览器中。</p>
          {user && (
            <button className="mt-3 inline-flex text-xs font-black text-[#E95B4F] hover:text-white" onClick={onLogout} type="button">
              退出当前账号
            </button>
          )}
        </div>
      </aside>

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 pt-2 md:hidden">
        <div className="pointer-events-auto mx-auto max-w-md">
          {isOpen && (
            <div className="mb-3 rounded-[1.35rem] border border-white/80 bg-white/95 p-3 shadow-[0_-18px_42px_rgba(16,36,63,0.14)] backdrop-blur">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#667085]">更多入口</p>
                <button className="grid size-9 place-items-center rounded-full bg-[#0B1F3A]/6 text-[#667085]" onClick={() => setIsOpen(false)} type="button">
                  <X className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mobileMore.map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.id;

                  return (
                    <button
                      aria-label={item.label}
                      className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-[12px] font-black transition ${
                        active ? "bg-[#0B1F3A] text-white" : item.adminOnly ? "bg-[#0B1F3A]/5 text-[#667085]" : "bg-[#F7F1E4] text-[#10243F]/72"
                      }`}
                      key={item.id}
                      onClick={() => go(item.id)}
                      type="button"
                    >
                      <Icon className="size-4" />
                      <span className="mt-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
                {user && (
                  <button className="flex min-h-14 flex-col items-center justify-center rounded-2xl bg-[#E95B4F]/10 px-2 text-[12px] font-black text-[#E95B4F]" onClick={onLogout} type="button">
                    <LogOut className="size-4" />
                    <span className="mt-1">退出</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-[1.45rem] border border-white/80 bg-white/96 px-2 py-2 shadow-[0_-16px_42px_rgba(16,36,63,0.16)] backdrop-blur">
            <div className="grid grid-cols-6 gap-1">
              {mobilePrimary.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;

                return (
                  <button
                    aria-label={item.label}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-black transition ${
                      active ? "bg-[#0B1F3A] text-white" : "text-[#667085] hover:bg-[#EAF5F2] hover:text-[#10243F]"
                    }`}
                    key={item.id}
                    onClick={() => go(item.id)}
                    type="button"
                  >
                    <Icon className="size-5" />
                    <span className="mt-1 truncate">{item.label}</span>
                  </button>
                );
              })}
              <button
                aria-label="更多"
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-black transition ${
                  isOpen || mobileMore.some((item) => item.id === currentPage) ? "bg-[#1496A3] text-white" : "text-[#667085] hover:bg-[#EAF5F2] hover:text-[#10243F]"
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
      </nav>
    </>
  );
}
