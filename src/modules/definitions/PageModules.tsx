import { Module } from "../Module";
import type { IModule } from "../types";
import Home from "../../pages/Home";
import Workspace from "../../pages/Workspace";
import Products from "../../pages/Products";
import Discovery from "../../pages/Discovery";
import { Projections } from "../../pages/Projections";
import Assets from "../../pages/Assets";
import Runner from "../../pages/Runner";
import Terminal from "../../components/Terminal";

@Module({ id: "home", name: "Home", panel: "page", route: "/" })
export class HomeModule implements IModule {
  render = Home;
}

@Module({
  id: "workspace",
  name: "Workspace",
  panel: "page",
  route: "/workspace",
})
export class WorkspaceModule implements IModule {
  render = Workspace;
}

@Module({ id: "products", name: "Products", panel: "page", route: "/products" })
export class ProductsModule implements IModule {
  render = Products;
}

@Module({ id: "runner-page", name: "Runner", panel: "page", route: "/runner" })
export class RunnerPageModule implements IModule {
  render = Runner;
}

@Module({
  id: "projections-page",
  name: "Projections",
  panel: "page",
  route: "/projections",
})
export class ProjectionsPageModule implements IModule {
  render = Projections;
}

@Module({ id: "assets-page", name: "Assets", panel: "page", route: "/assets" })
export class AssetsPageModule implements IModule {
  render = Assets;
}

@Module({
  id: "terminal-page",
  name: "Terminal",
  panel: "page",
  route: "/terminal",
})
export class TerminalPageModule implements IModule {
  render = Terminal;
}

/** Discovery uses a full-screen layout (no BaseLayout shell). */
@Module({
  id: "discovery",
  name: "Discovery",
  panel: "page",
  route: "/discovery",
  fullPage: true,
})
export class DiscoveryModule implements IModule {
  render = Discovery;
}
