// src/components/incidents-dashboard/map-icons.ts

// ✨ CHANGE: Removed hardcoded white color from the base URLs

import medicalIcon from '../../assets/images/Medical.png';
import generalIcon from '../../assets/images/General.png';
import fireIcon from '../../assets/images/Fire.png';
import crimeIcon from '../../assets/images/Police.png';
import ambulanceIcon from '../../assets/images/ambulance.png';
import firetruckIcon from '../../assets/images/firetruck.png';
import policecarIcon from '../../assets/images/policecar.png';


const MEDICAL_ICON_BASE = medicalIcon;
const FIRE_ICON_BASE = fireIcon;
const POLICE_ICON_BASE = crimeIcon;
const OTHER_ICON_BASE = generalIcon;
const AMBULANCE_ICON_BASE = ambulanceIcon;
const FIRETRUCK_ICON_BASE = firetruckIcon;
const POLICECAR_ICON_BASE = policecarIcon;

export const getIncidentIcon = (incidentType: 'Medical' | 'Fire' | 'Crime' | 'Other') => {
  let baseUrl: string;
  let color: string;

  switch (incidentType) {
    case 'Medical':
      baseUrl = MEDICAL_ICON_BASE;
      color = '#d32f2f'; // Red
      break;
    case 'Fire':
      baseUrl = FIRE_ICON_BASE;
      color = '#ff9800'; // Orange
      break;
    case 'Crime':
      baseUrl = POLICE_ICON_BASE;
      color = '#1976d2'; // Blue
      break;
    default:
      baseUrl = OTHER_ICON_BASE;
      color = '#757575'; // Grey
      break;
  }

  // ✨ CHANGE: Dynamically build the final URL with the correct color.
  // The '#' in the hex code is URL-encoded to '%23'.
  const encodedColor = color.replace('#', '%23');
  
  return {
    url: `${baseUrl}?color=${encodedColor}`,
    bgColor: color, // This is still used by the IncidentList
  };
};

export const getResponderIcon = (assignment?: string) => {
  let iconUrl: string;

  switch (assignment) {
    case 'ambulance':
      iconUrl = AMBULANCE_ICON_BASE;
      break;
    case 'firetruck':
      iconUrl = FIRETRUCK_ICON_BASE;
      break;
    case 'police':
      iconUrl = POLICECAR_ICON_BASE;
      break;
    default:
      // Default to ambulance icon if assignment is not specified
      iconUrl = AMBULANCE_ICON_BASE;
      break;
  }

  return {
    url: iconUrl,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20),
  };
};