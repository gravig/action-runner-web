import { useGetDatasetsQuery } from "../../../../services/datasetsApi";
import { DeclarationProvider, TypeProvider } from "../providers";
import { buildDatasetInterface } from "../datasetUtils";
import { registerEnhancer } from "./registry";
import type { EnhancerProps } from "./types";

/**
 * Enhancer for UseDatasetAction.
 *
 * Reads the `dataset_name` param value, fetches the matching dataset schema,
 * and injects a concrete `interface Dataset { ... }` declaration so that
 * `DatasetAPI<T extends Dataset = Dataset>` resolves to the right row type
 * without needing to explicitly parametrize `getDataset`'s type.
 */
export function UseDatasetActionEnhancer({ value, children }: EnhancerProps) {
  const datasetName = value.params?.dataset_name?.value as string | undefined;
  const declarations = (value.shape?.declarations || []) as string[];
  const types = (value.shape?.context || []) as {
    name: string;
    type: string;
  }[];

  const { data: datasets } = useGetDatasetsQuery();
  const dataset = datasetName
    ? datasets?.find((d) => d.name === datasetName)
    : undefined;

  if (!dataset) return <>{children}</>;

  const { declaration } = buildDatasetInterface(dataset, "Dataset");

  const allDeclarations = [declaration, ...declarations];

  return (
    <TypeProvider entries={types}>
      <DeclarationProvider declarations={allDeclarations}>
        {children}
      </DeclarationProvider>
    </TypeProvider>
  );
}

registerEnhancer("UseDatasetAction", UseDatasetActionEnhancer);
