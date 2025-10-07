// src/components/incidents-dashboard/types.ts

export interface Incident {
    _id: string;
    incidentType: 'Medical' | 'Fire' | 'Crime' | 'Other';
    isVerified: boolean;
    isResolved: boolean;
    isFinished: boolean;
    isAccepted: boolean;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
    dispatcher?: string;
    opCen?: string;
    responder?: {
      _id: string;
      firstName: string;
      lastName: string;
      assignment?: string;
      operationCenter?: {
        profileImage?: string;
        firstName: string;
        lastName: string;
      };
    };
    incidentDetails: {
      incident?: string;
      incidentDescription?: string;
      coordinates: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
      };
    };
    responderCoordinates?: {
      lat: number;
      lon: number;
    };
    createdAt: string;
    updatedAt: string;
  }