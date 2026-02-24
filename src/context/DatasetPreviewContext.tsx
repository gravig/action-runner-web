import { createContext, useContext } from "react";

/**
 * Provides the `openDatasetPreview(name)` callback.
 * Workspace.tsx sets the actual implementation; components deep in the tree
 * (e.g. Datasets panel rendered inside flexlayout) call it to open a new tab.
 */
export const DatasetPreviewContext = createContext<(name: string) => void>(
  () => {},
);

export function useDatasetPreview() {
  return useContext(DatasetPreviewContext);
}
