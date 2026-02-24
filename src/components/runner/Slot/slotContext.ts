import { createContext } from "react";
import type { JsContextEntry } from "../../../types/actions";

export type TypeContextValue = Record<string, string>;
export type DeclarationContextValue = Record<string, string>;

/** Keyed by variable name → TS type string */
export const TypeContext = createContext<TypeContextValue>({});

/** Keyed by declaration content → deduplicates identical declarations */
export const DeclarationContext = createContext<DeclarationContextValue>({});

// Re-export for convenience
export type { JsContextEntry };
