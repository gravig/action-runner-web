import { useContext } from "react";
import type { JsContextEntry } from "../../../types/actions";
import { TypeContext, DeclarationContext } from "./slotContext";

// ─── TypeProvider ─────────────────────────────────────────────────────────────

export function TypeProvider({
  entries,
  children,
}: {
  entries?: JsContextEntry[];
  children: React.ReactNode;
}) {
  const parent = useContext(TypeContext);
  if (!entries?.length) return <>{children}</>;
  const patch: Record<string, string> = {};
  for (const e of entries) patch[e.name] = e.type;
  return (
    <TypeContext.Provider value={{ ...parent, ...patch }}>
      {children}
    </TypeContext.Provider>
  );
}

// ─── DeclarationProvider ──────────────────────────────────────────────────────

export function DeclarationProvider({
  declarations,
  children,
}: {
  declarations?: string[];
  children: React.ReactNode;
}) {
  const parent = useContext(DeclarationContext);
  if (!declarations?.length) return <>{children}</>;
  const patch: Record<string, string> = {};
  for (const d of declarations) patch[d] = d;
  return (
    <DeclarationContext.Provider value={{ ...parent, ...patch }}>
      {children}
    </DeclarationContext.Provider>
  );
}
