export const generateMapUrl = (
  currentLat: number,
  currentLng: number,
  incidentLat: string,
  incidentLng: string
): string => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  const currentMarker = `markers=color:blue%7C${currentLat},${currentLng}`;
  const incidentMarker = `markers=color:red%7C${incidentLat},${incidentLng}`;
  const path = `path=color:0x0000ff|weight:5|${currentLat},${currentLng}|${incidentLat},${incidentLng}`;
  const centerLat = (currentLat + parseFloat(incidentLat)) / 2;
  const centerLng = (currentLng + parseFloat(incidentLng)) / 2;

  return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${currentLat},${currentLng}&destination=${incidentLat},${incidentLng}&mode=driving`;
}; 