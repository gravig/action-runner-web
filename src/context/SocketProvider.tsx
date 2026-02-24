import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  SocketContext,
  type SocketContextValue,
  type SocketKey,
  type SocketState,
} from "./SocketContext";

const defaultUrls: Record<SocketKey, string> = {
  logs:
    (import.meta.env.VITE_WS_LOGS_URL as string | undefined) ??
    "ws://localhost:8000/ws/logs",
  products:
    (import.meta.env.VITE_WS_PRODUCTS_URL as string | undefined) ??
    "ws://localhost:8000/ws/products",
};

const baseState: SocketState = {
  socket: null,
  status: "idle",
  lastMessage: null,
  error: null,
};

export function SocketProvider({
  children,
  logsUrl,
  productsUrl,
}: {
  children: ReactNode;
  logsUrl?: string;
  productsUrl?: string;
}) {
  const [sockets, setSockets] = useState<Record<SocketKey, SocketState>>({
    logs: { ...baseState },
    products: { ...baseState },
  });
  const socketRefs = useRef<Record<SocketKey, WebSocket | null>>({
    logs: null,
    products: null,
  });

  const targets = useMemo(
    () => ({
      logs: logsUrl ?? defaultUrls.logs,
      products: productsUrl ?? defaultUrls.products,
    }),
    [logsUrl, productsUrl],
  );

  const updateState = useCallback(
    (key: SocketKey, patch: Partial<SocketState>) => {
      setSockets((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    },
    [],
  );

  const disconnect = useCallback(
    (key?: SocketKey) => {
      const keys = key
        ? [key]
        : (Object.keys(socketRefs.current) as SocketKey[]);
      keys.forEach((k) => {
        const instance = socketRefs.current[k];
        if (instance && instance.readyState === WebSocket.OPEN) {
          instance.close();
        }
        socketRefs.current[k] = null;
        updateState(k, { socket: null, status: "closed" });
      });
    },
    [updateState],
  );

  const connect = useCallback(
    (key: SocketKey, overrideUrl?: string) => {
      const nextUrl = overrideUrl ?? targets[key];
      disconnect(key);
      updateState(key, { status: "connecting", error: null });

      try {
        const ws = new WebSocket(nextUrl);
        socketRefs.current[key] = ws;
        updateState(key, { socket: ws });

        ws.onopen = () => updateState(key, { status: "open" });
        ws.onmessage = (event) => {
          const payload =
            typeof event.data === "string"
              ? event.data
              : JSON.stringify(event.data);
          updateState(key, { lastMessage: payload });
        };
        ws.onerror = () =>
          updateState(key, {
            status: "error",
            error: "Socket connection error",
          });
        ws.onclose = () => {
          updateState(key, { status: "closed", socket: null });
          socketRefs.current[key] = null;
        };
      } catch (err) {
        updateState(key, { status: "error", error: (err as Error).message });
      }
    },
    [disconnect, targets, updateState],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      connect("logs");
      connect("products");
    });
    return () => {
      cancelAnimationFrame(frame);
      disconnect();
    };
  }, [connect, disconnect]);

  const send = useCallback((key: SocketKey, payload: string) => {
    const ws = socketRefs.current[key];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({ sockets, send, connect, disconnect }),
    [sockets, send, connect, disconnect],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
