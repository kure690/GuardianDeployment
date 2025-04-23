export const generateMapUrl = (
  currentLat: number,
  currentLng: number,
  incidentLat: string,
  incidentLng: string
): string => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  // Create markers for both locations
  const currentMarker = `markers=color:blue%7C${currentLat},${currentLng}`;
  const incidentMarker = `markers=color:red%7C${incidentLat},${incidentLng}`;
  
  // Create path between points
  const path = `path=color:0x0000ff|weight:5|${currentLat},${currentLng}|${incidentLat},${incidentLng}`;
  
  // Calculate center point for the map
  const centerLat = (currentLat + parseFloat(incidentLat)) / 2;
  const centerLng = (currentLng + parseFloat(incidentLng)) / 2;
  
  // Construct the URL
  return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${currentLat},${currentLng}&destination=${incidentLat},${incidentLng}&mode=driving`;
}; 