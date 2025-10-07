// src/components/incidents-dashboard/IncidentMap.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Incident } from './types';
import { loadGoogleMaps } from '../../utils/maps'; 
import { getIncidentIcon, getResponderIcon } from './map-icons';


interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onMarkerClick: (incident: Incident) => void;
}

const CEBU_CITY_COORDS = { lat: 10.3157, lng: 123.8854 };
const MAP_ZOOM = 12;

// ✨ REPLACED: The ref now holds the classic google.maps.Marker
const IncidentMap: React.FC<IncidentMapProps> = ({ incidents, selectedIncident, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const responderMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  useEffect(() => {
    loadGoogleMaps()
      .then((google) => {
        if (mapRef.current && !map) {
          // ✨ REMOVED: No mapId is needed for classic Markers
          const newMap = new google.maps.Map(mapRef.current, {
            center: CEBU_CITY_COORDS,
            zoom: MAP_ZOOM,
          });
          setMap(newMap);
        }
      })
      .catch(console.error);
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const currentIncidentIds = new Set(incidents.map(inc => inc._id));

    // Remove markers for incidents that are no longer active
    Object.keys(markersRef.current).forEach(incidentId => {
      if (!currentIncidentIds.has(incidentId)) {
        // ✨ REPLACED: Use setMap(null) to remove classic markers
        markersRef.current[incidentId].setMap(null);
        delete markersRef.current[incidentId];
      }
    });

    // Add or update markers for current incidents
    incidents.forEach(incident => {
      const [lon, lat] = incident.incidentDetails.coordinates.coordinates;
      const position = { lat, lng: lon };
      const isSelected = selectedIncident?._id === incident._id;
      const iconDetails = getIncidentIcon(incident.incidentType);

      // ✨ REPLACED: Create a google.maps.Icon object instead of a PinElement
      const markerIcon: google.maps.Icon = {
        url: iconDetails.url,
        scaledSize: new google.maps.Size(isSelected ? 48 : 32, isSelected ? 48 : 32),
        anchor: new google.maps.Point(isSelected ? 24 : 16, isSelected ? 48 : 32),
      };

      if (markersRef.current[incident._id]) {
        // ✨ REPLACED: Update existing marker's position and icon
        const existingMarker = markersRef.current[incident._id];
        existingMarker.setPosition(position);
        existingMarker.setIcon(markerIcon);
      } else {
        // ✨ REPLACED: Create a new classic google.maps.Marker
        const marker = new google.maps.Marker({
          position,
          map,
          title: `${incident.incidentType}: ${incident.incidentDetails.incident || 'N/A'}`,
          icon: markerIcon,
        });

        marker.addListener('click', () => onMarkerClick(incident));
        markersRef.current[incident._id] = marker;
      }
    });
  }, [map, incidents, onMarkerClick, selectedIncident]);
  
  // This effect remains the same
  useEffect(() => {
    // ✨ CHANGE: Create the service here, it's lightweight
    const directionsService = new google.maps.DirectionsService();

    // 1. ✨ CHANGE: More robust cleanup. Remove the entire renderer from the map.
    responderMarkerRef.current?.setMap(null);
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
    
    if (!map) return;

    // 2. Check if we need to draw a route
    if (selectedIncident && selectedIncident.responder && selectedIncident.responderCoordinates) {
      // ✨ CHANGE: Create a BRAND NEW renderer instance
      const newDirectionsRenderer = new google.maps.DirectionsRenderer({
        map: map, // Attach it to the map immediately
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#1976d2',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });

      // Store the new renderer in the ref
      directionsRendererRef.current = newDirectionsRenderer;

      const { responder, incidentDetails } = selectedIncident;
      const resCoords = selectedIncident.responderCoordinates;
      const origin = { lat: resCoords.lat, lng: resCoords.lon };
      const [incLon, incLat] = incidentDetails.coordinates.coordinates;
      const destination = { lat: incLat, lng: incLon };

      responderMarkerRef.current = new google.maps.Marker({
        position: origin,
        map,
        icon: getResponderIcon(responder.assignment),
        title: `Responder: ${responder.firstName}`,
      });
      
      directionsService.route(
        { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Set directions on the new renderer instance
            newDirectionsRenderer.setDirections(result);
          } else {
            console.error(`Directions request failed due to ${status}`);
          }
        }
      );

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.panToBounds(bounds, 50);

    } else if (selectedIncident) {
      const [lon, lat] = selectedIncident.incidentDetails.coordinates.coordinates;
      map.panTo({ lat, lng: lon });
    }

  }, [map, selectedIncident]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default IncidentMap;