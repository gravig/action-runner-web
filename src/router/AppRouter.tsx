import { BrowserRouter, Route, Routes } from "react-router-dom";
import BaseLayout from "../components/BaseLayout";
import AuthGuard from "../components/AuthGuard";
import { ModuleContainer } from "../modules";
import { ModuleView } from "../pages/ModuleView";

function AppRouter() {
  const pages = ModuleContainer.getAll().filter(
    (m) => m.panel === "page" && m.route,
  );
  const shellPages = pages.filter((m) => !m.fullPage);
  const publicBarePages = pages.filter((m) => m.fullPage && m.public);
  const protectedBarePages = pages.filter((m) => m.fullPage && !m.public);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public bare pages (e.g. login) — no auth required */}
        {publicBarePages.map(({ id, route, component: Page }) => (
          <Route key={id} path={route} element={<Page />} />
        ))}

        {/* Protected shell pages */}
        <Route element={<AuthGuard />}>
          <Route element={<BaseLayout />}>
            {shellPages.map(({ id, route, component: Page }) => (
              <Route
                key={id}
                path={route === "/" ? undefined : route}
                index={route === "/"}
                element={<Page />}
              />
            ))}
          </Route>

          {/* Protected bare pages */}
          {protectedBarePages.map(({ id, route, component: Page }) => (
            <Route key={id} path={route} element={<Page />} />
          ))}

          {/* Pop-out: renders any registered module full-screen */}
          <Route path="/module/:id" element={<ModuleView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
