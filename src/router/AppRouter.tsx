import { BrowserRouter, Route, Routes } from "react-router-dom";
import BaseLayout from "../components/BaseLayout";
import { ModuleContainer } from "../modules";
import { ModuleView } from "../pages/ModuleView";

function AppRouter() {
  const pages = ModuleContainer.getAll().filter(
    (m) => m.panel === "page" && m.route,
  );
  const shellPages = pages.filter((m) => !m.fullPage);
  const barePages = pages.filter((m) => m.fullPage);

  return (
    <BrowserRouter>
      <Routes>
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
        {barePages.map(({ id, route, component: Page }) => (
          <Route key={id} path={route} element={<Page />} />
        ))}
        {/* Pop-out: renders any registered module full-screen */}
        <Route path="/module/:id" element={<ModuleView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
