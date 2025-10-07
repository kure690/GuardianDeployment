import { useState, useEffect } from 'react';
import { Incident } from '../types';
import config from '../../../config'; // Adjust path to your config file if needed

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);

        // Call the API directly using fetch and the config URL
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const responseData = await response.json();

        // Safely access the array, whether it's the data itself or nested
        const incidentsArray = Array.isArray(responseData.incidents) 
          ? responseData.incidents 
          : Array.isArray(responseData) 
          ? responseData 
          : [];

        // Filter for active incidents
        const activeIncidents = incidentsArray.filter((incident: Incident) => !incident.isFinished);
        setIncidents(activeIncidents);
        setError(null);

      } catch (err) {
        setError('Failed to fetch incidents. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    // Set up a polling mechanism to refresh data every 30 seconds
    const intervalId = setInterval(fetchIncidents, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return { incidents, loading, error };
};