import { useState, useEffect, useCallback } from 'react';
import { getAddressFromCoordinates } from '../../utils/geocoding';
import config from '../../config';

export function useIncidents(userId: string, token: string | null, isInvisible: boolean) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchIncidents = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data = await response.json();
      const connectedIncidents = data.filter((incident: any) => {
        const opCenId = incident.opCen ? (typeof incident.opCen === 'object' ? incident.opCen._id : incident.opCen) : null;
        return opCenId === userId && incident.opCenStatus === 'connected' && !incident.isFinished;
      });
      const processedIncidents = await Promise.all(
        connectedIncidents.map(async (incident: any) => {
          let address = '';
          const geoCoordinates = incident.incidentDetails?.coordinates;
          if (geoCoordinates && geoCoordinates.type === 'Point' && Array.isArray(geoCoordinates.coordinates)) {
            try {
              const [lon, lat] = geoCoordinates.coordinates;
              address = await getAddressFromCoordinates(lat, lon);
            } catch {
              address = 'Could not fetch address';
            }
          }
          const receivedTime = new Date(incident.acceptedAt || incident.createdAt);
          const now = new Date();
          const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
          return {
            ...incident,
            address,
            timeLapsed,
            receivedTime: incident.acceptedAt || incident.createdAt
          };
        })
      );
      setIncidents(processedIncidents);
    } catch (error) {
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isInvisible) {
      fetchIncidents();
      interval = setInterval(fetchIncidents, 3000);
    } else {
      setIsLoading(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInvisible, userId, token, fetchIncidents]);

  useEffect(() => {
    const updateIncidentTimes = () => {
      setIncidents(prevIncidents =>
        prevIncidents.map(incident => {
          const receivedTime = new Date(incident.receivedTime);
          const now = new Date();
          const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
          return {
            ...incident,
            timeLapsed
          };
        })
      );
    };
    updateIncidentTimes();
    const timer = setInterval(updateIncidentTimes, 1000);
    return () => clearInterval(timer);
  }, []);

  return { incidents, setIncidents, isLoading, fetchIncidents };
} 