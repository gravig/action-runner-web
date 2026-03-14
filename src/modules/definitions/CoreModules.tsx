import { Module } from "../Module";
import type { IModule } from "../types";
import TerminalPanel from "../../components/TerminalPanel";
import ProductListPanel from "../../components/ProductListPanel";
import LatestProductPanel from "../../components/LatestProductPanel";
import Runner from "../../pages/Runner";
import { Datasets } from "../../pages/Datasets";
import { Workers } from "../../pages/Workers";
import { Projections } from "../../pages/Projections";
import Assets from "../../pages/Assets";

@Module({ id: "terminal", name: "Terminal", panel: "sidebar" })
export class TerminalModule implements IModule {
  render = TerminalPanel;
}

@Module({ id: "productList", name: "Product List", panel: "sidebar" })
export class ProductListModule implements IModule {
  render = ProductListPanel;
}

@Module({ id: "latestProduct", name: "Latest Product" })
export class LatestProductModule implements IModule {
  render = LatestProductPanel;
}

@Module({ id: "runner", name: "Runner" })
export class RunnerModule implements IModule {
  render = Runner;
}

@Module({ id: "datasets", name: "Datasets" })
export class DatasetsModule implements IModule {
  render = Datasets;
}

@Module({ id: "workers", name: "Workers" })
export class WorkersModule implements IModule {
  render = Workers;
}

@Module({ id: "projections", name: "Projections" })
export class ProjectionsModule implements IModule {
  render = Projections;
}

@Module({ id: "assets", name: "Assets" })
export class AssetsModule implements IModule {
  render = Assets;
}
