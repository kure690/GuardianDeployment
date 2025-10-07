// src/components/incidents-dashboard/hooks/useIncidents.ts

import { useState, useEffect } from 'react';
import { Incident } from '../types';
import axios from 'axios';

const API_URL = '/api/incidents'; // Your backend route

export const useIncidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Incident[]>(API_URL);
        // Filter for active incidents on the client-side
        const activeIncidents = response.data.filter(incident => !incident.isFinished);
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