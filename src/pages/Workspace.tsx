import { useCallback, useState } from "react";
import {
  Layout,
  Model,
  type IJsonModel,
  TabNode,
  Actions,
  DockLocation,
} from "flexlayout-react";
import "flexlayout-react/style/dark.css";
import TerminalPanel from "../components/TerminalPanel";
import ProductListPanel from "../components/ProductListPanel";
import LatestProductPanel from "../components/LatestProductPanel";
import { DatasetPreviewPanel } from "../components/DatasetPreviewPanel";
import Runner from "./Runner";
import { Actions as ActionsPanel } from "./Actions";
import { Datasets } from "./Datasets";
import { DatasetPreviewContext } from "../context/DatasetPreviewContext";

const layoutJson = {
  global: {
    tabEnableClose: false,
    tabSetEnableDeleteWhenEmpty: false,
  },
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        id: "main-tabset",
        weight: 75,
        children: [
          {
            type: "tab",
            name: "Datasets",
            component: "datasets",
            enableClose: false,
          },
          {
            type: "tab",
            name: "Runner",
            component: "runner",
            enableClose: false,
          },
          {
            type: "tab",
            name: "Latest Product",
            component: "latestProduct",
            enableClose: false,
          },
        ],
      },
      {
        type: "column",
        weight: 25,
        children: [
          {
            type: "tabset",
            weight: 50,
            children: [
              {
                type: "tab",
                name: "Elements",
                component: "actions",
                enableClose: false,
              },
              {
                type: "tab",
                name: "Terminal",
                component: "terminal",
                enableClose: false,
              },
              {
                type: "tab",
                name: "Product List",
                component: "productList",
                enableClose: false,
              },
            ],
          },
        ],
      },
    ],
  },
};

const LAYOUT_STORAGE_KEY = "workspace.layout";

function loadModel(): Model {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as IJsonModel;
      return Model.fromJson(parsed);
    }
  } catch {
    // Corrupt or outdated — fall back to the default layout.
  }
  return Model.fromJson(layoutJson);
}

function Workspace() {
  const [model] = useState(() => loadModel());

  const handleModelChange = useCallback((updatedModel: Model) => {
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify(updatedModel.toJson()),
      );
    } catch {
      // Quota exceeded or private-browsing restriction — silently ignore.
    }
  }, []);

  // Open a dataset preview tab. If one is already open for the same dataset,
  // just select it instead of opening a duplicate.
  const openDatasetPreview = useCallback(
    (name: string) => {
      let existingId: string | null = null;
      model.visitNodes((node) => {
        if (
          node instanceof TabNode &&
          node.getComponent() === "datasetPreview" &&
          (node.getConfig() as { datasetName: string } | null)?.datasetName ===
            name
        ) {
          existingId = node.getId();
        }
      });

      if (existingId) {
        model.doAction(Actions.selectTab(existingId));
      } else {
        model.doAction(
          Actions.addNode(
            {
              type: "tab",
              name,
              component: "datasetPreview",
              config: { datasetName: name },
              enableClose: true,
            },
            "main-tabset",
            DockLocation.CENTER,
            -1,
          ),
        );
      }
    },
    [model],
  );

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    if (component === "terminal") return <TerminalPanel />;
    if (component === "productList") return <ProductListPanel />;
    if (component === "latestProduct") return <LatestProductPanel />;
    if (component === "runner") return <Runner />;
    if (component === "actions") return <ActionsPanel />;
    if (component === "datasets") return <Datasets />;
    if (component === "datasetPreview") {
      const cfg = node.getConfig() as { datasetName: string } | null;
      if (cfg?.datasetName)
        return <DatasetPreviewPanel datasetName={cfg.datasetName} />;
    }
    return null;
  };

  return (
    <div className="grid-glow">
      <div className="mx-auto flex h-[calc(100vh-160px)] w-full max-w-7xl flex-col gap-4 px-4 pb-8 pt-4 md:px-6">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Live runner layout
            </h1>
            <p className="text-sm text-slate-300">
              Dockable panes for terminal logs, latest product stream, and
              catalog list.
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-0 border rounded-2xl border-white/10 bg-white/5 shadow-panel">
          <DatasetPreviewContext.Provider value={openDatasetPreview}>
            <Layout
              model={model}
              factory={factory}
              onModelChange={handleModelChange}
            />
          </DatasetPreviewContext.Provider>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
