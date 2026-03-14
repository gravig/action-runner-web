import type { ComponentType } from "react";
import { ModuleContainer } from "./ModuleContainer";
import type { IModule, ModuleDef } from "./types";

export interface ModuleOptions {
  id?: string;
  name?: string;
  /**
   * Which panel this tab lives in. Defaults to `"main"`.
   * - `"main"` — large central tabset
   * - `"sidebar"` — narrow right-hand column
   * - `"page"` — top-level route (not a workspace tab)
   */
  panel?: "main" | "sidebar" | "page";
  /**
   * URL path for `panel: "page"` modules (e.g. `"/workspace"`).
   */
  route?: string;
  /**
   * When `true` the page renders full-screen without the BaseLayout shell.
   * Only relevant for `panel: "page"` modules.
   */
  fullPage?: boolean;
  /** Optional icon component shown in the tab header (future use). */
  icon?: ComponentType;
  /** Optional tags for filtering / discovery (future use). */
  tags?: string[];
}

/**
 * Class decorator that registers the decorated class as a workspace module
 * in {@link ModuleContainer}.
 *
 * The decorated class **must** implement {@link IModule} — it must have a
 * `render` property that holds the React component to mount inside the tab.
 * The class will be instantiated once (eagerly, at decoration time) to read
 * that property; its constructor should therefore be side-effect-free.
 *
 * @example
 * ```ts
 * import { Module, type IModule } from "../modules";
 * import { ActionsPanel } from "./ActionsPanel";
 *
 * @Module({ id: "actions", name: "Elements" })
 * export class ElementsModule implements IModule {
 *   render = ActionsPanel;
 * }
 * ```
 */
export function Module(options: ModuleOptions = {}) {
  return function <T extends abstract new () => IModule>(
    target: T,
    context: ClassDecoratorContext<T>,
  ): void {
    const className = String(context.name ?? "UnknownModule");
    const name = options.name ?? className;
    const id = options.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Eagerly instantiate to extract `render`.
    // Because `useDefineForClassFields: true` is set in tsconfig, all class
    // fields (including `render`) are initialised during `new`, so this is safe.
    const instance = new (target as unknown as new () => IModule)();

    const def: ModuleDef = {
      id,
      name,
      component: instance.render,
      panel: options.panel ?? "main",
      ...(options.route ? { route: options.route } : {}),
      ...(options.fullPage ? { fullPage: options.fullPage } : {}),
      ...(options.icon ? { icon: options.icon } : {}),
      ...(options.tags ? { tags: options.tags } : {}),
      ...(instance.events ? { events: instance.events } : {}),
    };

    ModuleContainer.register(def);
  };
}
