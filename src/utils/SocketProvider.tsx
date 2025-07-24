import React, { useEffect, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import config from "../config";
import SocketContext, { SocketContextType } from "./socket";

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // We only want to set up the socket once the token is available.
  // This useEffect will run when the component mounts and re-run if the token changes (e.g., on login/logout).
  useEffect(() => {
    // Retrieve the token from localStorage. Your App.js already handles storing this.
    const token = localStorage.getItem("token");

    // Only attempt to connect if the user is authenticated (has a token).
    if (token) {
      const socketInstance = io(config.GUARDIAN_SERVER_URL || "http://localhost:3000", {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        // This is the key change: send the token in the 'auth' payload.
        auth: {
          token: token,
        },
      });

      setSocket(socketInstance);

      const handleConnect = () => {
        console.log('[SocketProvider] Connected with socket ID:', socketInstance.id);
        setIsConnected(true);
      }
      const handleDisconnect = () => setIsConnected(false);
      const handleConnectError = (err: any) => {
        // This will catch authentication errors from your middleware
        console.error('[SocketProvider] Connection Error:', err.message);
        // You might want to handle this globally, e.g., by logging the user out.
      };

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);
      socketInstance.on("connect_error", handleConnectError);

      return () => {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
        socketInstance.off("connect_error", handleConnectError);
        socketInstance.disconnect();
        setSocket(null);
      };
    }
  }, []); // Re-run if the user logs in/out, which should re-render the provider.

  const contextValue: SocketContextType = useMemo(() => ({
    socket,
    isConnected,
  }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;