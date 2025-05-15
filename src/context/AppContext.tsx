import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import config from '../config';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: string;
}

interface Incident {
  _id: string;
  incidentType: string;
  isVerified: boolean;
  isResolved: boolean;
  isAccepted: boolean;
  acceptedAt?: string;
  lguStatus?: string;
  channelId?: string;
  user: User | string;
  receivedTime: string;
  timeLapsed?: number;
  createdAt: string;
  incidentDetails?: {
    incident?: string;
    incidentDescription?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  responderCoordinates?: {
    lat: number;
    lon: number;
  };
  lgu?: string;
  lguConnectedAt?: string;
  isFinished?: boolean;
}

interface AppContextType {
  incidents: Incident[];
  lguUsers: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  fetchIncidents: () => Promise<void>;
  fetchLguUsers: () => Promise<void>;
  updateIncident: (incidentId: string, updates: Partial<Incident>) => Promise<void>;
  getIncidentById: (incidentId: string) => Incident | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [lguUsers, setLguUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.PERSONAL_API}/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }

      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLguUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.PERSONAL_API}/users/role/LGU`);
      if (response.ok) {
        const data = await response.json();
        setLguUsers(data.users || []);
      } else {
        throw new Error('Failed to fetch LGU users');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error fetching LGU users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIncident = async (incidentId: string, updates: Partial<Incident>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.PERSONAL_API}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update incident');
      }

      // Update local state
      setIncidents(prevIncidents => 
        prevIncidents.map(incident => 
          incident._id === incidentId 
            ? { ...incident, ...updates }
            : incident
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error updating incident:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIncidentById = (incidentId: string) => {
    return incidents.find(incident => incident._id === incidentId);
  };

  // Initialize context data
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchIncidents();
    fetchLguUsers();
  }, []);

  const value = {
    incidents,
    lguUsers,
    currentUser,
    loading,
    error,
    fetchIncidents,
    fetchLguUsers,
    updateIncident,
    getIncidentById
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 