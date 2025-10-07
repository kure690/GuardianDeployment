// src/components/incidents-dashboard/IncidentList.tsx

import React from 'react';
import { Incident } from './types';
import { getIncidentIcon } from './map-icons';

interface IncidentListProps {
  incidents: Incident[];
  onIncidentSelect: (incident: Incident) => void;
  selectedIncident: Incident | null;
}

const IncidentList: React.FC<IncidentListProps> = ({ incidents, onIncidentSelect, selectedIncident }) => {
  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <div style={{ padding: '10px', background: '#f4f6f8', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>Active Incidents ({incidents.length})</h2>
      {incidents.length === 0 ? (
        <p>No active incidents.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {incidents.map(incident => {
            const icon = getIncidentIcon(incident.incidentType);
            const isSelected = selectedIncident?._id === incident._id;
            return (
              <li
                key={incident._id}
                onClick={() => onIncidentSelect(incident)}
                style={{
                  padding: '12px',
                  background: isSelected ? '#cce5ff' : '#fff',
                  border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  flexShrink: 0
                }}>
                  <img src={icon.url} alt={incident.incidentType} style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{incident.incidentDetails.incident || incident.incidentType}</div>
                  <div style={{ fontSize: '0.9rem', color: '#555' }}>
                    Reported by: {incident.user.firstName}
                  </div>
                   <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '4px' }}>
                    {timeSince(incident.createdAt)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default IncidentList;

