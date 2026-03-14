import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ModuleContainer } from "../modules";
import { logout } from "../services/authApi";
import type { AppDispatch } from "../store";

function BaseLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const navLinks = ModuleContainer.getAll().filter(
    (m) => m.panel === "page" && m.route && !m.fullPage,
  );

  function handleLogout() {
    dispatch(logout());
    navigate("/auth/login", { replace: true });
  }

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/0 px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </header>

        <main className="flex-1 flex min-h-0 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default BaseLayout;
