import { useContext } from "react";
import { WorkersContext } from "../context/WorkersContext";
import type { Worker } from "../pages/Workers";

export type WorkerStreamMessage = Worker[] | { type: "pong" };
export type WorkersConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected";

export function useWorkers() {
  const ctx = useContext(WorkersContext);
  if (!ctx) {
    throw new Error("useWorkers must be used inside <WorkersProvider>");
  }
  return ctx;
}
