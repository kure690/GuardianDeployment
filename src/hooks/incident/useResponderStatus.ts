import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

interface UseResponderStatusProps {
  incidentId: string | undefined;
  token: string | null;
}

export const useResponderStatus = ({ incidentId, token }: UseResponderStatusProps) => {
  const [responderStatus, setResponderStatus] = useState<string | null>(null);
  const [showOnSceneNotification, setShowOnSceneNotification] = useState(false);
  const [showFinishedNotification, setShowFinishedNotification] = useState(false);


  const navigate = useNavigate();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

          if (incidentData.isFinished) {
            setShowFinishedNotification(true);
            // Set a timeout to redirect, and store its ID
            if (!redirectTimeoutRef.current) {
              redirectTimeoutRef.current = setTimeout(() => {
                navigate('/status');
              }, 5000);
            }
            // Stop polling since the incident is over
            clearInterval(interval);
            return;
          }

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

    return () => {
      clearInterval(interval);
      // Clean up the timeout if the component unmounts
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [incidentId, token, navigate]);

  const dismissOnSceneNotification = () => {
    setShowOnSceneNotification(false);
  };

  const dismissFinishedNotification = () => {
    setShowFinishedNotification(false);
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
  };

  return {
    responderStatus,
    showOnSceneNotification,
    dismissOnSceneNotification, 
    showFinishedNotification,     
    dismissFinishedNotification
  };
}; 