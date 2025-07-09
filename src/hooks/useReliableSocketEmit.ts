import { useCallback, useEffect, useRef } from "react";
import { useSocket } from "../utils/socket";

/**
 * Reliable socket emit hook: buffers emits until socket is connected.
 * Usage: const reliableEmit = useReliableSocketEmit();
 *        reliableEmit('event', payload);
 */
export function useReliableSocketEmit() {
  const { socket, isConnected } = useSocket();
  const queue = useRef<Array<{ event: string; args: any[] }>>([]);

  // Log connection state changes
  useEffect(() => {
    if (isConnected) {
      console.log("[Socket] Connected");
    } else {
      console.log("[Socket] Disconnected");
    }
  }, [isConnected]);

  // Flush queue when connected
  useEffect(() => {
    if (isConnected && socket) {
      queue.current.forEach(({ event, args }) => {
        socket.emit(event, ...args);
      });
      queue.current = [];
    }
  }, [isConnected, socket]);

  // Reliable emit function
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