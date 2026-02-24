import { createContext } from "react";

export type SocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type SocketKey = "logs" | "products";

export type SocketState = {
  socket: WebSocket | null;
  status: SocketStatus;
  lastMessage: string | null;
  error: string | null;
};

export type SocketContextValue = {
  sockets: Record<SocketKey, SocketState>;
  send: (key: SocketKey, payload: string) => void;
  connect: (key: SocketKey, overrideUrl?: string) => void;
  disconnect: (key?: SocketKey) => void;
};

export const SocketContext = createContext<SocketContextValue | undefined>(
  undefined,
);
