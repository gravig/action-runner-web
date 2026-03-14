import { Module } from "../Module";
import type { IModule } from "../types";
import { Actions } from "../../pages/Actions";
import { EventEmitter } from "../../lib/EventEmitter";
import type { ActionShape } from "../../types/actions";

/**
 * Singleton event emitter for the Elements module.
 *
 * External consumers (outside React) can subscribe like this:
 * ```ts
 * import { ElementsEvents } from "./modules/definitions/ElementsModule";
 *
 * ElementsEvents.on("onSelectElement", (shape) => {
 *   console.log("selected:", shape);
 * });
 * ```
 *
 * The `+` button in the palette is only visible when at least one subscriber
 * is active on `onSelectElement`.
 */
export const ElementsEvents = new EventEmitter<{
  onSelectElement: ActionShape;
}>();

/**
 * Registers the existing "actions" workspace tab via the module system.
 * The `id` matches the flexlayout `component` key already used in
 * Workspace.tsx so either path resolves to the same component.
 */
@Module({ id: "actions", name: "Elements", panel: "sidebar" })
export class ElementsModule implements IModule {
  render = Actions;
  events = ElementsEvents;
}
