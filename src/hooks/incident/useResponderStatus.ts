import { useState, useEffect } from 'react';
import config from '../../config';

interface UseResponderStatusProps {
  incidentId: string | undefined;
  token: string | null;
}

export const useResponderStatus = ({ incidentId, token }: UseResponderStatusProps) => {
  const [responderStatus, setResponderStatus] = useState<string | null>(null);
  const [showOnSceneNotification, setShowOnSceneNotification] = useState(false);

  useEffect(() => {
    if (!incidentId || !token) return;

    const checkResponderStatus = async () => {
      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${incidentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const incidentData = await response.json();
          const currentStatus = incidentData.responderStatus;
          const notificationStatus = incidentData.responderNotification; 
          
          setResponderStatus(currentStatus);

          // Show notification if status is 'onscene' and notification is 'unread'
          if (currentStatus === 'onscene' && notificationStatus === 'unread') {
            setShowOnSceneNotification(true);
            
            // Mark notification as read
            await markNotificationAsRead();
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
              setShowOnSceneNotification(false);
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Error checking responder status:', error);
      }
    };

    const markNotificationAsRead = async () => {
      try {
        await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${incidentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            responderNotification: 'read'
          })
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    };

    // Initial check
    checkResponderStatus();

    // Set up interval to check every 3 seconds
    const interval = setInterval(checkResponderStatus, 3000);

    return () => clearInterval(interval);
  }, [incidentId, token]);

  const dismissNotification = () => {
    setShowOnSceneNotification(false);
  };

  return {
    responderStatus,
    showOnSceneNotification,
    dismissNotification
  };
}; 