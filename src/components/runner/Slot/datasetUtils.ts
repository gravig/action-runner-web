import type { Dataset, DatasetParam } from "../../../types/datasets";

// ─── Type mapping ─────────────────────────────────────────────────────────────

function primitiveToTs(typeName: string): string {
  switch (typeName) {
    case "String":
      return "string";
    case "Number":
      return "number";
    case "Boolean":
      return "boolean";
    default:
      return "unknown";
  }
}

function paramToTs(param: DatasetParam): string {
  const base = param.type[0];

  if (base === "Array" && param.items?.declaration) {
    const inner = Object.entries(param.items.declaration)
      .map(([k, v]) => `${k}: ${v.type}`)
      .join("; ");
    return `{ ${inner} }[]`;
  }

  if (base === "Array" && param.items) {
    return `${primitiveToTs(param.items.type[0])}[]`;
  }

  if ((base === "Object" || base === "Dict") && param.items?.declaration) {
    const inner = Object.entries(param.items.declaration)
      .map(([k, v]) => `${k}: ${v.type}`)
      .join("; ");
    return `{ ${inner} }`;
  }

  return primitiveToTs(base);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type DatasetInterfaceResult = {
  /** TypeScript interface name, e.g. "DatasetRow_my_dataset" */
  name: string;
  /** Full interface declaration string, ready to inject into Monaco */
  declaration: string;
};

/**
 * Converts a Dataset's params into a TypeScript interface usable as
 * the generic argument to `DatasetAPI<T>`.
 */
export function buildDatasetInterface(
  dataset: Dataset,
  interfaceName?: string,
): DatasetInterfaceResult {
  const safeName =
    interfaceName ?? `DatasetRow_${dataset.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const fields = (dataset.params ?? [])
    .map((p) => `  ${p.name}${p.required ? "" : "?"}: ${paramToTs(p)};`)
    .join("\n");

  return {
    name: safeName,
    declaration: `interface ${safeName} {\n${fields}\n}`,
  };
}
