import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Layout,
  Model,
  type IJsonModel,
  TabNode,
  Actions,
  DockLocation,
  type ITabRenderValues,
} from "flexlayout-react";
import { ModuleContainer } from "../modules";
import "flexlayout-react/style/dark.css";
import { DatasetPreviewPanel } from "../components/DatasetPreviewPanel";
import { DatasetPreviewContext } from "../context/DatasetPreviewContext";
import { WorkersProvider } from "../context/WorkersProvider";
import { EventsProvider } from "../context/EventsContext";
import { WindowProvider } from "../context/WindowContext";

// ---------------------------------------------------------------------------
// Module-level external store for popped-out tab ids.
// flexlayout renders tab content in React portals which break context
// propagation — useSyncExternalStore works fine across portal boundaries.
// ---------------------------------------------------------------------------
let _poppedOut: ReadonlySet<string> = new Set();
const _poppedOutListeners = new Set<() => void>();
function getPoppedOut(): ReadonlySet<string> {
  return _poppedOut;
}
function setPoppedOut(next: ReadonlySet<string>): void {
  _poppedOut = next;
  _poppedOutListeners.forEach((fn) => fn());
}
function subscribePoppedOut(listener: () => void): () => void {
  _poppedOutListeners.add(listener);
  return () => _poppedOutListeners.delete(listener);
}
function usePoppedOut(): ReadonlySet<string> {
  return useSyncExternalStore(subscribePoppedOut, getPoppedOut);
}

// Placeholder shown inside the tab while the module lives in another window.
function PoppedOutPlaceholder({ component }: { component: string }) {
  const def = ModuleContainer.get(component);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-8 h-8 opacity-40"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-4.5 6-1.5m0 0-1.5 6m1.5-6L12 12"
        />
      </svg>
      <p className="text-xs">
        <span className="font-medium text-slate-400">
          {def?.name ?? component}
        </span>{" "}
        is open in an external window
      </p>
    </div>
  );
}

// Wrapper rendered by factory — reads pop-out state via useSyncExternalStore
// so it re-renders even inside flexlayout portals.
function TabContent({
  component,
  datasetName,
}: {
  component: string | null | undefined;
  datasetName?: string;
}) {
  const poppedOut = usePoppedOut();

  if (component === "datasetPreview") {
    return datasetName ? (
      <DatasetPreviewPanel datasetName={datasetName} />
    ) : null;
  }
  if (component && poppedOut.has(component)) {
    return <PoppedOutPlaceholder component={component} />;
  }
  const def = component ? ModuleContainer.get(component) : undefined;
  const DynamicComponent = def?.component;
  if (!DynamicComponent) return null;
  const inner = def?.events ? (
    <EventsProvider value={def.events}>
      <DynamicComponent />
    </EventsProvider>
  ) : (
    <DynamicComponent />
  );
  return <WindowProvider value={{ isPopup: false }}>{inner}</WindowProvider>;
}

/** Stable key stored alongside saved layout to detect module-set changes. */
const LAYOUT_MODULES_KEY = "workspace.layout.modules";

function moduleTabIds(): string {
  return ModuleContainer.getAll()
    .map((m) => m.id)
    .sort()
    .join(",");
}

function buildLayoutJson() {
  const toTab = (id: string, name: string) => ({
    type: "tab",
    name,
    component: id,
    enableClose: false,
  });

  const main = ModuleContainer.getAll().filter((m) => m.panel === "main");
  const sidebar = ModuleContainer.getAll().filter((m) => m.panel === "sidebar");

  return {
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
          children: main.map((m) => toTab(m.id, m.name)),
        },
        ...(sidebar.length > 0
          ? [
              {
                type: "column",
                weight: 25,
                children: [
                  {
                    type: "tabset",
                    weight: 50,
                    children: sidebar.map((m) => toTab(m.id, m.name)),
                  },
                ],
              },
            ]
          : []),
      ],
    },
  };
}

const LAYOUT_STORAGE_KEY = "workspace.layout";

function loadModel(): Model {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    const savedModules = localStorage.getItem(LAYOUT_MODULES_KEY);
    if (raw && savedModules === moduleTabIds()) {
      const parsed = JSON.parse(raw) as IJsonModel;
      return Model.fromJson(parsed);
    }
  } catch {
    // Corrupt or outdated — fall back to the generated layout.
  }
  // Modules changed (or first run) — rebuild layout from registry.
  localStorage.removeItem(LAYOUT_STORAGE_KEY);
  return Model.fromJson(buildLayoutJson());
}

function Workspace() {
  const [model] = useState(() => loadModel());

  // Track which module components are currently open in external windows.
  const openWindows = useRef<Map<string, Window>>(new Map());
  // Cleanup functions for cross-window event bridges.
  const openBridges = useRef<Map<string, () => void>>(new Map());

  // Poll every second to detect externally closed windows.
  useEffect(() => {
    const id = setInterval(() => {
      openWindows.current.forEach((win, component) => {
        if (win.closed) {
          openWindows.current.delete(component);
          openBridges.current.get(component)?.();
          openBridges.current.delete(component);
          setPoppedOut(
            new Set([...getPoppedOut()].filter((id) => id !== component)),
          );
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleModelChange = useCallback((updatedModel: Model) => {
    try {
      localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify(updatedModel.toJson()),
      );
      localStorage.setItem(LAYOUT_MODULES_KEY, moduleTabIds());
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

  const onRenderTab = useCallback(
    (node: TabNode, renderValues: ITabRenderValues) => {
      const component = node.getComponent();
      if (!component || component === "datasetPreview") return;

      const isPopped = getPoppedOut().has(component);

      renderValues.buttons.push(
        <button
          key="popout"
          title={
            isPopped
              ? `Return "${node.getName()}" to workspace`
              : `Open "${node.getName()}" in new window`
          }
          onClick={(e) => {
            e.stopPropagation();
            if (isPopped) {
              openWindows.current.get(component)?.focus();
              return;
            }
            const w = Math.min(1200, Math.round(window.screen.width * 0.75));
            const h = Math.min(900, Math.round(window.screen.height * 0.8));
            const left = Math.round((window.screen.width - w) / 2);
            const top = Math.round((window.screen.height - h) / 2);
            const win = window.open(
              `/module/${component}`,
              `module:${component}`,
              `popup,width=${w},height=${h},left=${left},top=${top}`,
            );
            if (win) {
              openWindows.current.set(component, win);
              // const def = ModuleContainer.get(component);
              setPoppedOut(new Set([...getPoppedOut(), component]));
            }
          }}
          className={`ml-1 flex h-4 w-4 items-center justify-center rounded
                     transition-colors hover:bg-white/10
                     ${isPopped ? "text-teal-400 hover:text-teal-200" : "text-slate-500 hover:text-slate-200"}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-2.5 h-2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-4.5 6-1.5m0 0-1.5 6m1.5-6L12 12"
            />
          </svg>
        </button>,
      );
    },
    [],
  );

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const cfg = node.getConfig() as { datasetName?: string } | null;
    return <TabContent component={component} datasetName={cfg?.datasetName} />;
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
          <WorkersProvider>
            <DatasetPreviewContext.Provider value={openDatasetPreview}>
              <Layout
                model={model}
                factory={factory}
                onModelChange={handleModelChange}
                onRenderTab={onRenderTab}
              />
            </DatasetPreviewContext.Provider>
          </WorkersProvider>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
