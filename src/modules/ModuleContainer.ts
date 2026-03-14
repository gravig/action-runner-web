import type { ComponentType } from "react";
import type { ModuleDef } from "./types";

/**
 * Central registry that holds every module registered via @Module.
 *
 * Modules are added automatically when their file is first imported
 * (the decorator runs at class-declaration time). Import the module
 * definitions barrel once near the app root to ensure all modules
 * are registered before any component reads this container.
 */
class ModuleRegistry {
  private readonly _modules = new Map<string, ModuleDef>();

  /**
   * Register a module definition. Called automatically by the @Module decorator.
   * Logs a warning if the id is already taken (overwrite still happens).
   */
  register(def: ModuleDef): void {
    if (this._modules.has(def.id)) {
      console.warn(
        `[ModuleContainer] Module with id "${def.id}" is already registered – overwriting.`,
      );
    }
    this._modules.set(def.id, def);
    if (import.meta.env.DEV) {
      console.debug(
        `[ModuleContainer] Registered module "${def.name}" (id: "${def.id}")`,
      );
    }
  }

  /** Look up a module definition by its id. */
  get(id: string): ModuleDef | undefined {
    return this._modules.get(id);
  }

  /** All registered modules in insertion order. */
  getAll(): ModuleDef[] {
    return [...this._modules.values()];
  }

  has(id: string): boolean {
    return this._modules.has(id);
  }

  /**
   * Resolve the React component for a given module id.
   * Convenient for use inside a flexlayout `factory` function:
   *
   * @example
   * const Component = ModuleContainer.resolve(node.getComponent());
   * return Component ? <Component /> : null;
   */
  resolve(id: string | null | undefined): ComponentType | undefined {
    return this._modules.get(id ?? "")?.component;
  }
}

/** Singleton module registry. Populated via the @Module decorator. */
export const ModuleContainer = new ModuleRegistry();
