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
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/45 bg-parchment/92 px-2 pb-2 pt-2 shadow-[0_-12px_30px_rgba(23,32,51,0.12)] backdrop-blur">
      <div className="mx-auto grid max-w-4xl grid-cols-9 gap-1">
        {items.map((item) => {
          const active = currentPage === item.id;

          return (
            <button
              aria-label={item.label}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-[11px] font-bold transition ${
                active ? "bg-ink text-white shadow-insetGame" : "text-ink/70 hover:bg-white/70 hover:text-ink"
              }`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
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
