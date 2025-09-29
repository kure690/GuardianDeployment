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

let googleMapsLoaderPromise: Promise<typeof google> | null = null;

export const loadGoogleMaps = (apiKey?: string): Promise<typeof google> => {
  if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
    return Promise.resolve((window as any).google as typeof google);
  }
  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }
  const key = apiKey || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || (process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string);
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is missing'));
  }
  googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      (existing as HTMLScriptElement).addEventListener('load', () => resolve((window as any).google as typeof google));
      (existing as HTMLScriptElement).addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve((window as any).google as typeof google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleMapsLoaderPromise;
};