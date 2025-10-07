// src/components/incidents-dashboard/IncidentMap.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Incident } from './types';
import { loadGoogleMaps } from '../../utils/maps';
import { getIncidentIcon, getResponderIcon } from './map-icons';
import IncidentDetails from './IncidentDetails';
import { createRoot } from 'react-dom/client';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onMarkerClick: (incident: Incident) => void;
  onInfoWindowClose: () => void;
}

const CEBU_CITY_COORDS = { lat: 10.3157, lng: 123.8854 };
const MAP_ZOOM = 12;

const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  selectedIncident,
  onMarkerClick,
  onInfoWindowClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, google.maps.Marker>>({});
  const responderMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    loadGoogleMaps()
      .then((google) => {
        if (mapRef.current && !map) {
          const newMap = new google.maps.Map(mapRef.current, {
            center: CEBU_CITY_COORDS,
            zoom: MAP_ZOOM,
          });
          setMap(newMap);
          infoWindowRef.current = new google.maps.InfoWindow({
            content: "",
            pixelOffset: new google.maps.Size(0, -30)
          });
          infoWindowRef.current.addListener('closeclick', () => {
            onInfoWindowClose();
          });
        }
      })
      .catch(console.error);
  }, [map, onInfoWindowClose]);

  useEffect(() => {
    if (!map) return;

    // ... (code for removing/updating all incident markers remains the same)
    const currentIncidentIds = new Set(incidents.map(inc => inc._id));
    Object.keys(markersRef.current).forEach(incidentId => {
      if (!currentIncidentIds.has(incidentId)) {
        markersRef.current[incidentId].setMap(null);
        delete markersRef.current[incidentId];
      }
    });
    incidents.forEach(incident => {
      const [lon, lat] = incident.incidentDetails.coordinates.coordinates;
      const position = { lat, lng: lon };
      const isSelected = selectedIncident?._id === incident._id;
      const iconDetails = getIncidentIcon(incident.incidentType);
      const markerIcon: google.maps.Icon = {
        url: iconDetails.url,
        scaledSize: new google.maps.Size(isSelected ? 48 : 32, isSelected ? 48 : 32),
        anchor: new google.maps.Point(isSelected ? 24 : 16, isSelected ? 48 : 32),
      };
      if (markersRef.current[incident._id]) {
        markersRef.current[incident._id].setPosition(position);
        markersRef.current[incident._id].setIcon(markerIcon);
      } else {
        const marker = new google.maps.Marker({ position, map, title: `${incident.incidentType}: ${incident.incidentDetails.incident || 'N/A'}`, icon: markerIcon });
        marker.addListener('click', () => {
          onMarkerClick(incident);
        });
        markersRef.current[incident._id] = marker;
      }
    });

    if (!selectedIncident && infoWindowRef.current) {
      infoWindowRef.current.close();
    } else if (selectedIncident && infoWindowRef.current && map) {
      const markerToOpen = markersRef.current[selectedIncident._id];
      // ✨ FIX 2: Removed the check for '.getMap()'
      if (markerToOpen) {
        const contentDiv = document.createElement('div');
        const root = createRoot(contentDiv);
        root.render(<IncidentDetails incident={selectedIncident} />);
        infoWindowRef.current.setContent(contentDiv);
        infoWindowRef.current.open(map, markerToOpen);
      }
    }
  }, [map, incidents, onMarkerClick, selectedIncident, onInfoWindowClose]);

  useEffect(() => {
    const directionsService = new google.maps.DirectionsService();

    responderMarkerRef.current?.setMap(null);
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    if (!map) return;

    if (selectedIncident && selectedIncident.responder && selectedIncident.responderCoordinates) {
      const newDirectionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#1976d2',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
      directionsRendererRef.current = newDirectionsRenderer;

      const { responder, incidentDetails } = selectedIncident;
      const resCoords = selectedIncident.responderCoordinates;
      
      // ✨ FIX 1: Add a final guard clause to satisfy TypeScript
      if (!resCoords) return;

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
      map.setZoom(15);
    }
  }, [map, selectedIncident]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default IncidentMap;