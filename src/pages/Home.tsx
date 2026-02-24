import { Link } from "react-router-dom";

const views = [
  {
    title: "Terminal",
    description:
      "Live view for server logs streamed over WebSocket once the FastAPI backend is online.",
    to: "/terminal",
    status: "Available",
  },
  {
    title: "Workspace",
    description:
      "Dockable layout that combines terminal logs, latest product stream, and the product list.",
    to: "/workspace",
    status: "Available",
  },
  {
    title: "Products",
    description:
      "Browse the latest products fetched from the FastAPI catalog endpoint.",
    to: "/products",
    status: "Available",
  },
  {
    title: "Settings",
    description:
      "Planned area to configure FastAPI endpoints, authentication, and stream filters.",
    status: "Planned",
  },
  {
    title: "Runs",
    description:
      "Placeholder for viewing recent action runs and their statuses.",
    status: "Planned",
  },
];

function Home() {
  return (
    <div className="grid-glow">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <div className="glass-panel mb-8 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Views
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Navigate the workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Pick a view to open or scan what is coming next. Terminal is ready
            today; additional views will land as backend features arrive.
          </p>
        </div>

        <div className="space-y-3">
          {views.map((view) => {
            const isLink = Boolean(view.to);
            return (
              <div
                key={view.title}
                className="glass-panel flex items-start justify-between gap-4 px-6 py-4 text-slate-100"
              >
                <div className="space-y-2">
                  {isLink ? (
                    <Link
                      to={view.to!}
                      className="text-lg font-semibold text-white hover:text-lime"
                    >
                      {view.title}
                    </Link>
                  ) : (
                    <span className="text-lg font-semibold text-white">
                      {view.title}
                    </span>
                  )}
                  <p className="text-sm text-slate-300">{view.description}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                    view.status === "Available"
                      ? "bg-lime/10 text-lime"
                      : "border border-white/15 bg-white/5 text-white/70"
                  }`}
                >
                  {view.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
