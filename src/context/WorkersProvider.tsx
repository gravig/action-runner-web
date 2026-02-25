import { useEffect, useRef, useState, type ReactNode } from "react";
import { API } from "../services/api";
import type { Worker } from "../pages/Workers";
import type {
  WorkerStreamMessage,
  WorkersConnectionStatus,
} from "../hooks/useWorkers";
import { WorkersContext } from "./WorkersContext";

export function WorkersProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [connStatus, setConnStatus] =
    useState<WorkersConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;
      setConnStatus("connecting");

      const ws = new WebSocket(API.adminWorkersStream);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!unmountedRef.current) setConnStatus("connected");
      };

      ws.onmessage = (event) => {
        if (unmountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as WorkerStreamMessage;
          if (Array.isArray(msg)) setWorkers(msg);
        } catch {
          // non-JSON frame — ignore
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setConnStatus("disconnected");
        reconnectRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectRef.current != null) clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  return (
    <WorkersContext.Provider value={{ workers, connStatus }}>
      {children}
    </WorkersContext.Provider>
  );
}
