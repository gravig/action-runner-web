import { type ReactElement } from "react";
import { Link } from "react-router-dom";

type NavItem = {
  title: string;
  description: string;
  to: string;
  icon: ReactElement;
};

const navItems: NavItem[] = [
  {
    title: "Workspace",
    description:
      "Dockable tabbed layout combining the terminal log stream, datasets, and runner panels in one view.",
    to: "/workspace",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    title: "Runner",
    description:
      "Compose and execute action pipelines. Connect shape slots, pick a worker, and trigger a run.",
    to: "/runner",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <polygon points="5,3 19,12 5,21" />
      </svg>
    ),
  },
  {
    title: "Projections",
    description:
      "Create and manage data projections with a visual component editor and configurable grid layout.",
    to: "/projections",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
      </svg>
    ),
  },
  {
    title: "Assets",
    description:
      "Manage JSON, text, and Markdown asset files. Create, edit, preview, and delete local assets.",
    to: "/assets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Terminal",
    description:
      "Live log stream from the FastAPI backend delivered over WebSocket in real time.",
    to: "/terminal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <polyline points="4,17 10,11 4,5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    title: "Discovery",
    description:
      "Search across products, categories, and banners with a full-screen search interface.",
    to: "/discovery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
];

function Home() {
  return (
    <div className="grid-glow flex-1">
      <div className="mx-auto max-w-2xl px-6 py-10 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Action Runner
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Select a section below to get started.
          </p>
        </div>

        {/* Navigation list */}
        <nav className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-panel">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors group-hover:border-lagoon/40 group-hover:text-lagoon">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-white">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                  {item.description}
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 flex-shrink-0 text-slate-600 transition-colors group-hover:text-lagoon"
              >
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Home;
