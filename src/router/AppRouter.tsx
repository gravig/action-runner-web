import { BrowserRouter, Route, Routes } from "react-router-dom";
import BaseLayout from "../components/BaseLayout";
import Terminal from "../components/Terminal";
import Home from "../pages/Home";
import Workspace from "../pages/Workspace";
import Products from "../pages/Products";
import Discovery from "../pages/Discovery";
import Runner from "../pages/Runner";
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BaseLayout />}>
          <Route index element={<Home />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="terminal" element={<Terminal />} />
          <Route path="products" element={<Products />} />
          <Route path="runner" element={<Runner />} />
        </Route>
        <Route path="discovery" element={<Discovery />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
