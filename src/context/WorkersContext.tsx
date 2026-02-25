import { createContext } from "react";
import type { Worker } from "../pages/Workers";
import type { WorkersConnectionStatus } from "../hooks/useWorkers";

export interface WorkersContextValue {
  workers: Worker[];
  connStatus: WorkersConnectionStatus;
}

export const WorkersContext = createContext<WorkersContextValue | null>(null);
