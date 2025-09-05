import { useState, useEffect } from 'react';
import config from '../../config';
import { getAddressFromCoordinates } from '../../utils/geocoding';

export interface VolunteerData {
  firstName: string;
  lastName: string;
  phone: string;
  profileImage: string;
}

type GeoJsonPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export function useIncidentData(incidentId: string | undefined, token: string | null) {
  const [isResolved, setIsResolved] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const [coordinates, setCoordinates] = useState<GeoJsonPoint | null>(null);
  const [volunteerID, setVolunteerID] = useState<string>('');
  const [userData, setUserData] = useState<VolunteerData | null>(null);
  const [address, setAddress] = useState<string>('');
  const [responderCoordinates, setResponderCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!incidentId) return;
    const fetchIncidentData = async () => {
      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${incidentId}`);
        if (response.ok) {
          const data = await response.json();
          setIsResolved(data.isResolved);
          setAcceptedAt(data.acceptedAt);
          setIsVerified(data.isVerified);
          setIncidentType(data.incidentType);
          setCurrentChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${incidentId.substring(5,9)}`);
          const geoCoordinates = data.incidentDetails?.coordinates;
          if (geoCoordinates && geoCoordinates.type === 'Point' && Array.isArray(geoCoordinates.coordinates)) {
            // Set the entire GeoJSON object in state
            setCoordinates(geoCoordinates);
            
            // Extract lon and lat for the address lookup
            const [lon, lat] = geoCoordinates.coordinates;
            const formattedAddress = await getAddressFromCoordinates(lat, lon);
            setAddress(formattedAddress);
          }
          
          setResponderCoordinates(data.responderCoordinates || null);

          if (data.user) {
            let userId = typeof data.user === 'string' ? data.user : data.user._id;
            setVolunteerID(userId);
            const userResponse = await fetch(`${config.GUARDIAN_SERVER_URL}/volunteers/${userId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUserData({
                firstName: userData.firstName || 'Unknown',
                lastName: userData.lastName || 'User',
                phone: userData.phone || 'No phone number',
                profileImage: userData.profileImage || ''
              });
            } else {
               setUserData({ firstName: 'Unknown', lastName: 'User', phone: 'No phone number', profileImage: '' });
            }
          }
        }
      } catch (error) {
        console.error("Error in useIncidentData:", error);
        setUserData({ firstName: 'Unknown', lastName: 'User', phone: 'No phone number', profileImage: '' });
      }
    };
    fetchIncidentData();
  }, [incidentId, token]);

  return {
    isResolved,
    setIsResolved,
    acceptedAt,
    setAcceptedAt,
    isVerified,
    setIsVerified,
    incidentType,
    setIncidentType,
    currentChannelId,
    setCurrentChannelId,
    coordinates,
    setCoordinates,
    volunteerID,
    setVolunteerID,
    userData,
    setUserData,
    address,
    setAddress,
    responderCoordinates,
    setResponderCoordinates,
  };
} 