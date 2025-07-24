import { useEffect } from 'react';

export function useOpCenConnectingStatus({
  globalSocket,
  isConnected,
  incidentId,
  chatClient,
  userId,
  setOpCenConnectingAt,
  setConnectingModalOpen,
  setConnectingOpCenName,
  setOpenModal,
  setSelectedOpCen,
}: {
  globalSocket: any;
  isConnected: boolean;
  incidentId: string;
  chatClient: any;
  userId: string;
  setOpCenConnectingAt: (value: any) => void;
  setConnectingModalOpen: (open: boolean) => void;
  setConnectingOpCenName: (name: { firstName: string; lastName: string } | null) => void;
  setOpenModal: (open: boolean) => void;
  setSelectedOpCen: (opcen: any) => void;
}) {
  useEffect(() => {
    const handleStatus = (data: any) => {
      if (!incidentId) return;
      if (data.incidentId !== incidentId) return;
      if (data.status === 'connected') {
        const channelId = `${data.incidentType.toLowerCase()}-${incidentId.substring(4,9)}`;
        if (chatClient) {
          const channel = chatClient.channel('messaging', channelId);
          channel.sendMessage({
            text: `Incident: ${data.incident || "Not specified"}\nDescription: ${data.incidentDescription || "No description provided"}`,
            user_id: userId
          });
        }
        setOpCenConnectingAt(null);
        setConnectingModalOpen(false);
        setConnectingOpCenName(null);
        setOpenModal(false);
      } else if (data.status === 'idle') {
        setOpCenConnectingAt(null);
        setConnectingModalOpen(false);
        setConnectingOpCenName(null);
        setSelectedOpCen(null);
      } else if (data.status === 'connecting') {
        setConnectingModalOpen(true);
      }
    };
    if (globalSocket && isConnected) {
      globalSocket.on('opcen-connecting-status', handleStatus);
      return () => {
        globalSocket.off('opcen-connecting-status', handleStatus);
      };
    }
    return;
  }, [incidentId, chatClient, userId, globalSocket, isConnected, setOpCenConnectingAt, setConnectingModalOpen, setConnectingOpCenName, setOpenModal, setSelectedOpCen]);
} 