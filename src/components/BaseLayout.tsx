import { Link, Outlet, useLocation } from "react-router-dom";
import { ModuleContainer } from "../modules";

function BaseLayout() {
  const location = useLocation();
  const navLinks = ModuleContainer.getAll().filter(
    (m) => m.panel === "page" && m.route && !m.fullPage,
  );

  return (
    <div className="min-h-screen bg-night text-slate-100">
      <div className="flex min-h-screen w-full flex-col px-4 pb-10 pt-6 md:px-8">
        <header className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-panel backdrop-blur">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-lagoon">
              Action Runner
            </span>
          </div>
          <nav className="flex gap-2">
            {navLinks.map(({ id, route, name }) => {
              const isActive = location.pathname === route;
              return (
                <Link
                  key={id}
                  to={route!}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-lagoon text-night shadow-lg shadow-lagoon/30"
                      : "border border-white/10 bg-white/0 text-slate-100 hover:border-lagoon/40 hover:text-lagoon"
                  }`}
                >
                  {name}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 flex min-h-0 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default BaseLayout;
