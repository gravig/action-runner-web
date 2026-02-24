import { useContext } from "react";
import { SocketContext, type SocketKey } from "../context/SocketContext";

export function useSocket(key: SocketKey = "logs") {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return {
    ...ctx.sockets[key],
    send: (payload: string) => ctx.send(key, payload),
    connect: (overrideUrl?: string) => ctx.connect(key, overrideUrl),
    disconnect: () => ctx.disconnect(key),
  };
}
