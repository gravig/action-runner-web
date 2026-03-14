import { useParams } from "react-router-dom";
import { ModuleContainer } from "../modules";
import { EventsProvider } from "../context/EventsContext";
import { WindowProvider } from "../context/WindowContext";
import "../modules/definitions";

/**
 * Full-screen single-module view.
 *
 * Opened by the pop-out button on workspace tabs via:
 *   window.open("/module/<id>")
 */
export function ModuleView() {
  const { id } = useParams<{ id: string }>();
  const def = id ? ModuleContainer.get(id) : undefined;

  if (!def) {
    return (
      <div className="flex items-center justify-center h-screen text-sm bg-night text-slate-400">
        Module <span className="ml-1 font-mono text-slate-200">"{id}"</span>
        &nbsp;not found.
      </div>
    );
  }

  const Component = def.component;
  const content = <Component />;
  const wrapped = def.events ? (
    <EventsProvider value={def.events}>{content}</EventsProvider>
  ) : (
    content
  );
  return (
    <div className="w-screen h-screen overflow-hidden bg-night text-slate-100">
      <WindowProvider value={{ isPopup: true }}>{wrapped}</WindowProvider>
    </div>
  );
}
