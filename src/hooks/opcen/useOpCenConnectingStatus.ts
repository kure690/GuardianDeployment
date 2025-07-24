import { useEffect } from 'react';

/**
 * A custom hook to monitor the connection status with an OpCen.
 * It listens for server events and updates the UI state accordingly.
 *
 * @param {object} props - The properties for the hook.
 * @param {any} props.globalSocket - The active Socket.IO client instance.
 * @param {boolean} props.isConnected - The current connection state of the socket.
 * @param {string} props.incidentId - The ID of the incident being monitored.
 * @param {function} props.setConnectingModalOpen - State setter to control the visibility of the "Connecting..." modal.
 * @param {function} props.setOpCenConnectingAt - State setter for the timestamp when the connection attempt started.
 * @param {function} props.setConnectionFinalStatus - State setter to pass the final status payload ('connected' or 'idle') back to the parent component.
 */
export function useOpCenConnectingStatus({
  globalSocket,
  isConnected,
  incidentId,
  setConnectingModalOpen,
  setOpCenConnectingAt,
  setConnectionFinalStatus,
}: {
  globalSocket: any;
  isConnected: boolean;
  incidentId: string;
  setConnectingModalOpen: (open: boolean) => void;
  setOpCenConnectingAt: (date: Date | null) => void;
  setConnectionFinalStatus: (status: any) => void;
}) {
  useEffect(() => {
    // Do not set up listeners if the socket is not ready.
    if (!globalSocket || !isConnected) {
      return;
    }

    const handleStatusUpdate = (data: any) => {
      console.log('[DEBUG] Client hook received opcen-connecting-status event:', data);
      // Ensure the event is for the incident we are currently viewing.
      if (data.incidentId !== incidentId) {
        return;
      }

      // Check for a final status (either accepted or declined).
      if (data.status === 'connected' || data.status === 'idle') {
        console.log(`[useOpCenConnectingStatus] Received status '${data.status}'. Closing modal.`);
        
        // Close the "Connecting..." modal.
        setConnectingModalOpen(false);
        
        // Clear the connection start time.
        setOpCenConnectingAt(null);
        
        // Pass the final status data back to the MainScreen component so it can perform other actions (like sending a chat message).
        setConnectionFinalStatus(data);
      }
    };

    // Attach the event listener.
    globalSocket.on('opcen-connecting-status', handleStatusUpdate);

    // Cleanup: Remove the listener when the component unmounts or dependencies change.
    return () => {
      globalSocket.off('opcen-connecting-status', handleStatusUpdate);
    };

  // The dependency array includes all external variables used in the effect.
  }, [globalSocket, isConnected, incidentId, setConnectingModalOpen, setOpCenConnectingAt, setConnectionFinalStatus]);
}