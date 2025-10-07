// src/components/incidents-dashboard/IncidentDetails.tsx

import React from 'react';
import { Incident } from './types';

interface IncidentDetailsProps {
  incident: Incident | null;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ marginBottom: '12px' }}>
    <strong style={{ display: 'block', color: '#555', fontSize: '0.9rem' }}>{label}</strong>
    <span style={{ fontSize: '1rem' }}>{value || 'N/A'}</span>
  </div>
);


const IncidentDetails: React.FC<IncidentDetailsProps> = ({ incident }) => {
  if (!incident) {
    return (
      <div style={{ padding: '20px', background: '#fff', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Select an incident to see details</p>
      </div>
    );
  }

  const [lon, lat] = incident.incidentDetails.coordinates.coordinates;

  return (
    <div style={{ padding: '20px', background: '#fff', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>Incident Details</h3>
      <DetailRow label="Case ID" value={incident._id} />
      <DetailRow label="Type" value={incident.incidentType} />
      <DetailRow label="Specific Incident" value={incident.incidentDetails.incident} />
      <DetailRow label="Description" value={incident.incidentDetails.incidentDescription} />
      <DetailRow label="Coordinates" value={`${lat.toFixed(6)}, ${lon.toFixed(6)}`} />
      <DetailRow label="Reported At" value={new Date(incident.createdAt).toLocaleString()} />
      <DetailRow label="Reporter" value={`${incident.user.firstName} ${incident.user.lastName}`} />
      <DetailRow 
        label="Assigned Responder" 
        value={
          incident.responder
            ? `${incident.responder.firstName} ${incident.responder.lastName}` 
            : 'Not Assigned'
        } 
      />
      {/* <DetailRow
        label="Responder Coordinates"
        value={
          incident.responder && incident.responderCoordinates 
            ? `${incident.responderCoordinates.lat}, ${incident.responderCoordinates.lon}` 
            : 'Not Assigned'
        } 
      /> */}
      {/* <DetailRow label="Responder" value={`${incident.responder.firstName} ${incident.responder.lastName}`} /> */}
    </div>
  );
};

export default IncidentDetails;