// src/components/incidents-dashboard/IncidentsDashboard.tsx

import React, { useState } from 'react';
import { Incident } from './types';
import { useIncidents } from './hooks/useIncidents';
import IncidentMap from './IncidentMap';
import IncidentList from './IncidentList';
import IncidentDetails from './IncidentDetails';

const IncidentsDashboard: React.FC = () => {
  const { incidents, loading, error } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const dashboardStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '350px 1fr 350px', // List | Map | Details
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
  };

  const mapContainerStyle: React.CSSProperties = {
    position: 'relative',
    background: '#e0e0e0', // Placeholder background
  };

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  return (
    <div style={dashboardStyle}>
      <IncidentList 
        incidents={incidents}
        onIncidentSelect={handleIncidentSelect}
        selectedIncident={selectedIncident}
      />

      <div style={mapContainerStyle}>
        {loading && <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: '5px', zIndex: 10 }}>Loading Incidents...</div>}
        <IncidentMap 
            incidents={incidents}
            selectedIncident={selectedIncident}
            onMarkerClick={handleIncidentSelect}
        />
      </div>
      
      <IncidentDetails incident={selectedIncident} />
    </div>
  );
};

export default IncidentsDashboard;