import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "../../utils/socket";

export function useReliableSocketEmit() {
  const { socket, isConnected } = useSocket();
  const queue = useRef<Array<{ event: string; args: any[] }>>([]);

  useEffect(() => {
    if (isConnected) {
      console.log("[Socket] Connected");
    } else {
      console.log("[Socket] Disconnected");
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected && socket) {
      queue.current.forEach(({ event, args }) => {
        socket.emit(event, ...args);
      });
      queue.current = [];
    }
  }, [isConnected, socket]);

  const reliableEmit = useCallback(
    (event: string, ...args: any[]) => {
      if (socket && isConnected) {
        socket.emit(event, ...args);
      } else {
        queue.current.push({ event, args });
      }
    },
    [socket, isConnected]
  );

  return reliableEmit;
} 