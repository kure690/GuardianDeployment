import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar, Container, ToggleButton, ToggleButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import avatarImg from "../assets/images/user.png";
import GuardianIcon from "../assets/images/Guardian.png";
import Grid from "@mui/material/Grid2";
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import General from "../assets/images/General.png";
import Police from "../assets/images/Police.png";
import Medical from "../assets/images/Medical.png";
import Fire from "../assets/images/Fire.png";
import FireTruckIcon from '@mui/icons-material/FireTruck';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAddressFromCoordinates } from '../utils/geocoding';
import config from "../config";
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
  useChatContext
} from "stream-chat-react";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import React from 'react';
import {
  StreamVideo,
  StreamCall,
  CallingState,
  StreamVideoClient,
  useCallStateHooks,
  useCalls,
  Call
} from "@stream-io/video-react-sdk";
import { CallPanel } from "../components/CallPanel";
import { RingingCall } from "../components/RingingCall";
import ambulanceIcon from '../assets/images/ambulance.png';
import policecarIcon from '../assets/images/policecar.png';
import firetruckIcon from '../assets/images/firetruck.png';
import policeSound from '../assets/sounds/police.mp3';
import fireSound from '../assets/sounds/fire.mp3';
import ambulanceSound from '../assets/sounds/ambulance.mp3';
import generalSound from '../assets/sounds/general.mp3';
import { useSocket } from "../utils/socket";

interface IncidentCountsState {
  medical: number | null;
  fire: number | null;
  police: number | null;
  general: number | null;
}

interface ResponderCountsState {
  fire: number | null;
  medical: number | null;
  police: number | null;
}


const getIncidentIcon = (incidentType: string) => {
  const type = incidentType?.toLowerCase() || '';
  switch (type) {
    case 'medical': return { icon: Medical };
    case 'fire': return { icon: Fire };
    case 'police': return { icon: Police };
    default: return { icon: General };
  }
};

  

const IncidentCard = ({ incident, handleMapClick, handleCreateRingCall, handleSelectIncidentForChat }: any) => {
  const formatLapsTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const formatReceivedTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const shortId = incident._id ? incident._id.substring(5, 9) : "";
  const [responderData, setResponderData] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState({ duration: '...', distance: '...' });

  // useEffect(() => {
  //   // --- THIS IS THE FIX ---
  //   // Add a more robust check to ensure the entire coordinate structure is valid before using it.
  //   const incidentGeoCoords = incident.incidentDetails?.coordinates;
  //   if (
  //     !responderData?.coordinates ||
  //     !incidentGeoCoords ||
  //     incidentGeoCoords.type !== 'Point' ||
  //     !Array.isArray(incidentGeoCoords.coordinates) ||
  //     incidentGeoCoords.coordinates.length < 2 ||
  //     !window.google
  //   ) {
  //     return; // Exit if data is not in the expected GeoJSON format
  //   }

  //   const service = new window.google.maps.DistanceMatrixService();

  //   const origin = { lat: responderData.coordinates.lat, lng: responderData.coordinates.lon };
    
  //   const [lon, lat] = incidentGeoCoords.coordinates;
  //   const destination = { lat, lng: lon };

  //   service.getDistanceMatrix(
  //     {
  //       origins: [origin],
  //       destinations: [destination],
  //       travelMode: google.maps.TravelMode.DRIVING,
  //     },
  //     (response, status) => {
  //       if (status === 'OK' && response) {
  //         const result = response.rows[0]?.elements[0];
  //         if (result?.status === 'OK') {
  //           setRouteInfo({ duration: result.duration.text, distance: result.distance.text });
  //         }
  //       } else {
  //         console.error(`Distance Matrix error for incident ${incident._id}:`, status);
  //       }
  //     }
  //   );
  // }, [responderData, incident]);


  useEffect(() => {
    // Get the incident's coordinates (destination)
    const incidentGeoCoords = incident.incidentDetails?.coordinates;
    // Get the responder's coordinates from the incident object (origin)
    const responderIncidentCoords = incident.responderCoordinates;

    // --- MODIFIED CHECK ---
    // Check if we have all the coordinates needed (both origin and destination)
    if (
      !responderIncidentCoords?.lat ||
      !responderIncidentCoords?.lon ||
      !incidentGeoCoords ||
      incidentGeoCoords.type !== 'Point' ||
      !Array.isArray(incidentGeoCoords.coordinates) ||
      incidentGeoCoords.coordinates.length < 2 ||
      !window.google
    ) {
      return; // Exit if data is not in the expected format
    }

    const service = new window.google.maps.DistanceMatrixService();

    // --- MODIFIED ORIGIN ---
    // The origin is now the coordinates stored on the incident
    const origin = { lat: responderIncidentCoords.lat, lng: responderIncidentCoords.lon };
    
    // The destination remains the incident's location
    const [lon, lat] = incidentGeoCoords.coordinates;
    const destination = { lat, lng: lon };

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const result = response.rows[0]?.elements[0];
          if (result?.status === 'OK') {
            setRouteInfo({ duration: result.duration.text, distance: result.distance.text });
          }
        } else {
          console.error(`Distance Matrix error for incident ${incident._id}:`, status);
        }
      }
    );
  // --- MODIFIED DEPENDENCY ---
  // This hook now only depends on the 'incident' prop, 
  // as 'responderData' is no longer used for this calculation.
  }, [incident]);

  useEffect(() => {
    const fetchResponderData = async () => {
      if (!incident.responder) return;
      const responderId = typeof incident.responder === 'object' ? incident.responder._id : incident.responder;
      if (!responderId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/responders/${responderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setResponderData(data);
        }
      } catch (error) {
        console.error("Error fetching responder data:", error);
      }
    };
    fetchResponderData();
  }, [incident.responder]);
    
  const getResponderIcon = (responderData: any) => {
    if (!responderData) return ambulanceIcon;
    const assignment = responderData.assignment?.toLowerCase() || '';
    if (assignment.includes('fire')) return firetruckIcon;
    if (assignment.includes('police')) return policecarIcon;
    return ambulanceIcon;
  };


  return (
    <Paper elevation={3} sx={{ width: '240px', borderRadius: '8px', overflow: 'hidden', m: 1.5 }}>
      {/* The rest of your IncidentCard JSX remains the same */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1, bgcolor: '#4a90e2', height: '75px' }}>
        <Avatar src={getIncidentIcon(incident.incidentType?.toLowerCase() || 'general').icon} sx={{ width: 55, height: 55, bgcolor: 'white', p: 0.8, flexShrink: 0 }} />
        <Box>
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                ID: {incident.incidentType ? `${incident.incidentType}-${shortId}` : ""}
            </Typography>
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
                {incident.incidentType ? `${incident.incidentType.toUpperCase()} CALL` : ""}
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '0.7rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2em', maxHeight: '2.4em' }} title={incident.address || "Loading address..."}>
                {incident.address || "Loading address..."}
            </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: '#2e7d32', fontSize: '0.8rem', fontWeight: 'bold' }}>
              RECEIVED : {formatReceivedTime(incident.receivedTime)}
          </Typography>
      </Box>
      <Box sx={{ bgcolor: 'white', p: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
              {incident.incidentDetails?.incident ? incident.incidentDetails.incident.toUpperCase() : (incident.incidentType ? incident.incidentType.toUpperCase() : "LOADING...")}
          </Typography>
      </Box>
      <Box sx={{ bgcolor: 'white', p: 0.7, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: 'red', fontSize: '0.8rem', fontWeight: 'bold' }}>
              LAPS TIME: {formatLapsTime(incident.timeLapsed)}
          </Typography>
      </Box>
      {!incident.responder ? (
          <Box sx={{ bgcolor: '#333', color: 'white', p: 0.8, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70px' }}>
              <Typography sx={{ fontSize: '0.8rem' }}>DISPATCH</Typography>
          </Box>
      ) : (
          <Box sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '70px', bgcolor: '#4a90e2' }}>
            <Box sx={{ color: 'white', p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, borderBottom: '2px solid grey' }}>
              <img src={getResponderIcon(responderData)} alt="Responder" style={{ width: '30px', height: '18px', objectFit: 'contain' }} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {responderData ? `${responderData.firstName || ''} ${responderData.lastName || ''}`.trim() || "RESPONDER" : "RESPONDER"}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', height: '100%' }}>
              <Box sx={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography sx={{ color: '#EE4B2B', fontWeight: 'bold', fontSize: '0.7rem', textAlign: 'center' }}>
                      {incident.responderStatus ? incident.responderStatus.toUpperCase() : "ENROUTE"}
                  </Typography>
              </Box>
              <Box sx={{ borderLeft: '2px solid grey', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '50%' }}>
                  <Typography sx={{ color: 'white', fontSize: '0.7rem', textAlign: 'center' }}>{routeInfo.duration}</Typography>
                  <Typography sx={{ color: 'white', fontSize: '0.7rem', textAlign: 'center' }}>{routeInfo.distance}</Typography>
              </Box>
            </Box>
          </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 0.7, bgcolor: 'white' }}>
          <Button sx={{ minWidth: 0, color: '#666', p: 0.4 }} onClick={() => handleSelectIncidentForChat(incident.channelId)}>💬</Button>
          <Button sx={{ minWidth: 0, color: '#666', p: 0.4 }} onClick={() => handleCreateRingCall(incident)}>📞</Button>
          <Button sx={{ minWidth: 0, color: '#666', p: 0.4 }}>📹</Button>
      </Box>
      <Button fullWidth sx={{ bgcolor: '#4a90e2', color: 'white', py: 0.8, borderRadius: 0, fontSize: '0.8rem', '&:hover': { bgcolor: '#357abd' } }} onClick={() => handleMapClick(incident._id)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>🗺️ VIEW MAP</Box>
      </Button>
    </Paper>
  );
};

const IncidentGridView = ({ incidents, handleMapClick, handleCreateRingCall, handleSelectIncidentForChat }: any) => {
  
  const formatLapsTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const formatReceivedTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const headerCellStyle = {
    fontWeight: 'bold',
    color: 'white',
    px: 2,
    py: 1,
    bgcolor: '#4a90e2', // Blue background on the cell itself
    borderTopLeftRadius: '4px', 
    borderTopRightRadius: '4px', 
    border: 'none',
  };

  const bodyCellStyle = {
    px: 2,
    py: 1.5,
    bgcolor: 'white', 
    // borderRadius: '4px', 
    border: 'none',
  };

  return (
    <Paper sx={{ 
      width: '100%', 
      overflow: 'hidden', 
      bgcolor: 'transparent', 
      boxShadow: 'none' 
    }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
        
        {/* --- MODIFIED: This is the key part --- */}
        <Table 
          stickyHeader 
          aria-label="incident grid view"
          sx={{
            borderCollapse: 'separate', 
            borderSpacing: '8px 0px',
          }}
        >
          
          {/* --- MODIFIED: Remove bgcolor from header row --- */}
          <TableHead>
            <TableRow>
              {/* --- MODIFIED: Using the new cell styles --- */}
              <TableCell sx={headerCellStyle}>ID</TableCell>
              <TableCell sx={headerCellStyle}>Type</TableCell>
              <TableCell sx={headerCellStyle}>Responders</TableCell>
              <TableCell sx={headerCellStyle}>Address</TableCell>
              <TableCell sx={headerCellStyle}>Received</TableCell>
              <TableCell sx={headerCellStyle}>Laps Time</TableCell>
              <TableCell sx={headerCellStyle}>Status</TableCell>
              <TableCell align="center" sx={headerCellStyle}>Actions</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody
            sx={{
              // Target the last 'tr' (TableRow) in this TableBody
              '& tr:last-child': {
                // Target every 'td' (TableCell) inside that last row
                'td': {
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px',
                }
              }
            }}
          >
            {incidents.map((incident: any) => {
              const shortId = incident._id ? incident._id.substring(5, 9) : "";
              const idString = incident.incidentType ? `${incident.incidentType}-${shortId}` : "";
              
              return (
                <TableRow 
                  hover 
                  tabIndex={-1} 
                  key={incident._id}
                  // --- MODIFIED: Remove all row-level borders ---
                  sx={{ 
                    'td, th': { border: 0 }
                  }}
                >
                  {/* --- MODIFIED: Using the new cell styles --- */}
                  <TableCell sx={bodyCellStyle}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {idString.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={bodyCellStyle}>{incident.incidentType?.toUpperCase()}</TableCell>
                  <TableCell sx={bodyCellStyle}>{!incident.responder ? 'N/A' : `${incident.responder.firstName || ''} ${incident.responder.lastName || ''}`.trim() || "RESPONDER"}</TableCell>
                  <TableCell sx={{ ...bodyCellStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={incident.address || ""}>
                    {incident.address || 'Loading...'}
                  </TableCell>
                  <TableCell sx={bodyCellStyle}>{formatReceivedTime(incident.receivedTime)}</TableCell>
                  <TableCell sx={bodyCellStyle}>
                    <Typography variant="body2" sx={{ color: 'red', fontWeight: 'bold' }}>
                      {formatLapsTime(incident.timeLapsed)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={bodyCellStyle}>
                    <Typography variant="body2" sx={{ color: '#EE4B2B', fontWeight: 'bold' }}>
                      {incident.responderStatus ? incident.responderStatus.toUpperCase() : "ENROUTE"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={bodyCellStyle}>
                    <Button sx={{ minWidth: 0, p: 0.5, color: '#666' }} onClick={() => handleMapClick(incident._id)}>🗺️</Button>
                    <Button sx={{ minWidth: 0, p: 0.5, color: '#666' }} onClick={() => handleSelectIncidentForChat(incident.channelId)}>💬</Button>
                    <Button sx={{ minWidth: 0, p: 0.5, color: '#666' }} onClick={() => handleCreateRingCall(incident)}>📞</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const LGUMain = () => {
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  const userId = userStr2?.id;
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInvisible, setIsInvisible] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [connectingIncident, setConnectingIncident] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const { client } = useChatContext();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [closingIncident, setClosingIncident] = useState<any>(null);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const { socket: globalSocket, isConnected } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [incidentCounts, setIncidentCounts] = useState<IncidentCountsState>({
    medical: null,
    fire: null,
    police: null,
    general: null,
  });

  const [responderCounts, setResponderCounts] = useState<ResponderCountsState>({
    fire: null,
    medical: null,
    police: null,
  });

  const fetchIncidents = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch incidents');
      
      const data = await response.json();
      const connectedIncidents = data.filter((incident: any) => 
        (incident.opCen?._id || incident.opCen) === userId && 
        incident.opCenStatus === 'connected' && 
        !incident.isFinished
      );
      
      const processedIncidents = await Promise.all(
        connectedIncidents.map(async (incident: any) => {
          let address = "Unknown location";
          const coordsObject = incident.incidentDetails?.coordinates;
          
          try {
            // --- THIS IS THE FIX ---
            // First, check for the new GeoJSON format
            if (coordsObject && coordsObject.type === 'Point' && Array.isArray(coordsObject.coordinates)) {
              const [lon, lat] = coordsObject.coordinates;
              if (typeof lat === 'number' && typeof lon === 'number') {
                address = await getAddressFromCoordinates(lat, lon);
              }
            } 
            // FALLBACK: If not GeoJSON, check for the old {lat, lon} format
            else if (coordsObject && typeof coordsObject.lat === 'number' && typeof coordsObject.lon === 'number') {
              address = await getAddressFromCoordinates(coordsObject.lat, coordsObject.lon);
            }
          } catch (error) {
            console.error(`Error fetching address for incident ${incident._id}:`, error);
          }
  
          const receivedTime = new Date(incident.acceptedAt || incident.createdAt);
          const now = new Date();
          const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
          
          return { ...incident, address, timeLapsed, receivedTime: receivedTime.toISOString() };
        })
      );
      setIncidents(processedIncidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, token]);

  const stopAlertSound = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; 
        audioRef.current = null; 
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${config.GUARDIAN_SERVER_URL}${url}`;
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `...`; // Keep your keyframes style
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (!isInvisible) {
          fetchIncidents();
          interval = setInterval(fetchIncidents, 3000);
      } else {
          setIsLoading(false);
      }
      return () => {
          if (interval) clearInterval(interval);
      };
  }, [isInvisible, fetchIncidents]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateIncidentTimes = () => {
      setIncidents(prevIncidents => 
        prevIncidents.map(incident => {
          const receivedTime = new Date(incident.receivedTime);
          const now = new Date();
          const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
          return { ...incident, timeLapsed };
        })
      );
    };
    const timer = setInterval(updateIncidentTimes, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleNotifyConnecting = async (data: any) => {
      if (!data || data.opCenId !== userId) return;
      
      setConnectingIncident(data.incident);
      setShowStatusModal(true);

      const geoCoords = data.incident.incidentDetails?.coordinates;
      if (geoCoords && geoCoords.type === 'Point' && Array.isArray(geoCoords.coordinates)) {
        const [lon, lat] = geoCoords.coordinates;
        const formattedAddress = await getAddressFromCoordinates(lat, lon);
        setAddress(formattedAddress);
      }

      if (data.incident.incidentType) {
        let soundSrc = generalSound;
        switch (data.incident.incidentType.toLowerCase()) {
          case 'police': soundSrc = policeSound; break;
          case 'fire': soundSrc = fireSound; break;
          case 'medical': soundSrc = ambulanceSound; break;
        }
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(soundSrc);
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      }
    };

    if (globalSocket && isConnected) {
      globalSocket.on('notifyOpCenConnecting', handleNotifyConnecting);
      return () => { globalSocket.off('notifyOpCenConnecting', handleNotifyConnecting); };
    }
  }, [userId, globalSocket, isConnected]);

  const toggleStatus = async () => {
    try {
      if (!client || !userId || !globalSocket || !isConnected) {
        console.error("Client or socket not ready.");
        return;
      }

      const newInvisibleState = !isInvisible;
      const newStatus = newInvisibleState ? 'unavailable' : 'available';
      
      await client.upsertUser({
        id: userId,
        invisible: newInvisibleState,
      });

      globalSocket.emit('updateOpCenAvailability', { status: newStatus });

      setIsInvisible(newInvisibleState);
      if (!newInvisibleState) {
        setShowStatusModal(false);
      }
    } catch (error) {
      console.error('Error toggling LGU status:', error);
    }
  };

  const getNextChannelId = async (incidentType: string, incidentId: string) => {
    try {
      const data = incidentId.substring(4,9);
      return `${incidentType.toLowerCase()}-${data}`;
    } catch (error) {
      console.error('Error generating channel ID:', error);
      return `${incidentType.toLowerCase()}-error`;
    }
  };

  const handleAcceptIncident = async () => {
    if (!connectingIncident || !globalSocket || !isConnected || !client) return;
    stopAlertSound();
    try {
        const channelId = await getNextChannelId(connectingIncident.incidentType, connectingIncident._id);
        const dispatcherId = connectingIncident.user?._id || connectingIncident.user;
        const channel = client.channel('messaging', channelId, {
            name: `${connectingIncident.incidentType} Incident #${channelId.split('-')[1]}`,
            members: [dispatcherId, userId]
        });
        await channel.create();
        globalSocket.emit('opcenAcceptIncident', {
            incidentId: connectingIncident._id,
            opCenId: userId,
            dispatcherId, 
            channelId,
        });
        setConnectingIncident(null);
        setShowStatusModal(false);
        fetchIncidents();
    } catch (error) {
        console.error('Error accepting incident:', error);
    }
  };

  const handleDeclineIncident = async () => {
    if (!connectingIncident || !globalSocket || !isConnected) return;
    stopAlertSound();
    try {
        const dispatcherId = connectingIncident.user?._id || connectingIncident.user;
        globalSocket.emit('opcenDeclineIncident', {
            incidentId: connectingIncident._id,
            opCenId: userId,
            dispatcherId, 
        });
        setConnectingIncident(null);
        setShowStatusModal(false);
    } catch (error) {
        console.error('Error declining incident:', error);
    }
  };

  const handleFinishIncident = async () => {
        if (!closingIncident) return;
        
        try {
            const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${closingIncident._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    isFinished: true
                })
            });
            
            if (response.ok) {
                console.log(`Incident ${closingIncident._id} marked as finished`);
                // Create direct message to the reporting volunteer
                try {
                    const volunteerId =
                        typeof closingIncident.user === 'object' && closingIncident.user !== null
                            ? closingIncident.user._id
                            : closingIncident.user;
                    await fetch(`${config.GUARDIAN_SERVER_URL}/messages/direct`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            title: 'Incident Closed',
                            message: `Your incident (ID: ${closingIncident._id}) has been marked as finished. Thank you for your report. If you need further assistance, please contact your local operation center.`,
                            type: 'Incident Report Confirmation',
                            volunteerId,
                        }),
                    });
                } catch (e) {
                    console.error('Failed to create direct message:', e);
                }
                
                setIncidents(prevIncidents => 
                    prevIncidents.map(incident => 
                        incident._id === closingIncident._id 
                            ? { ...incident, isFinished: true } 
                            : incident
                    )
                );
                
                setClosingIncident(null);
                setShowClosingModal(false);
                
                fetchIncidents();
            }
        } catch (error) {
            console.error('Error finishing incident:', error);
        }
    };

    const formatTime = () => {
      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      const seconds = currentTime.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    const formatDate = () => {
      const options = { 
        weekday: 'long' as const, 
        year: 'numeric' as const, 
        month: 'long' as const, 
        day: 'numeric' as const 
      };
      return currentTime.toLocaleDateString('en-US', options);
    };


    useEffect(() => {
      const initChatClient = async () => {
        console.log('Initializing chat client with userId:', userId);
        const chat = new StreamChat(config.STREAM_APIKEY);
        await chat.connectUser(
          {
            id: userId,
            name: userStr2?.firstName && userStr2?.lastName 
              ? `${userStr2.firstName} ${userStr2.lastName}` 
              : userStr2?.email || "Unknown User",
            image: avatarImg,
          },
          token
        );
        setChatClient(chat);
        console.log('Chat client initialized successfully');
      };

      if (userId && !chatClient) {
        initChatClient();
      } else {
        console.log('Skipping chat client initialization:', { userId, hasChatClient: !!chatClient });
      }

      return () => {
        if (chatClient) {
          chatClient.disconnectUser();
          setChatClient(null);
        }
      };
    }, [userId]);

    useEffect(() => {
      if (!videoClient && userId && token) {
        console.log("Initializing video client for user:", userId);
        
        try {
          const client = StreamVideoClient.getOrCreateInstance({
            apiKey: config.STREAM_APIKEY,
            user: {
              id: userId,
              name: userStr2?.firstName && userStr2?.lastName 
                ? `${userStr2.firstName} ${userStr2.lastName}` 
                : userStr2?.email || "Unknown User",
            },
            token: token,
            options: {
              logLevel: "info", 
            }
          });
          
          client.on('all', (event: any) => {
            if (event.type?.includes('call')) {
              console.log('Call event received:', {
                type: event.type,
                callCid: event.call_cid,
                details: event
              });
            }
          });
          
          client.on('connection.changed', (event: any) => {
            console.log('Connection state changed:', event);
          });
          
          setVideoClient(client);
          console.log("Video client initialized successfully");
        } catch (error) {
          console.error("Error initializing video client:", error);
        }
      }
    }, [userId, token]);

    useEffect(() => {
      const checkForClosingIncidents = () => {
        if (showClosingModal || closingIncident) {
          return;
        }
        
        const incidentToClose = incidents.find(incident => 
          incident.responderStatus === 'rtb' && !incident.isFinished
        );
        
        if (incidentToClose) {
          console.log('Found incident requesting to close:', incidentToClose._id);
          setClosingIncident(incidentToClose);
          setShowClosingModal(true);
        }
      };
      
      if (incidents.length > 0) {
        checkForClosingIncidents();
      }
    }, [incidents, showClosingModal, closingIncident]);

    useEffect(() => {
      const checkUserStatus = async () => {
        if (!client || !userId || !globalSocket || !isConnected) return;
        
        try {
          const response = await client.queryUsers({ id: userId });
          if (response.users && response.users.length > 0) {
            const userIsInvisible = !!response.users[0].invisible;
            
            setIsInvisible(userIsInvisible);
            const currentStatus = userIsInvisible ? 'unavailable' : 'available';
            console.log(`Syncing status with backend on initial load: ${currentStatus}`);
            globalSocket.emit('updateOpCenAvailability', { status: currentStatus });
            if (userIsInvisible) {
              setShowStatusModal(true);
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setIsInvisible(true);
          globalSocket.emit('updateOpCenAvailability', { status: 'unavailable' });
          setShowStatusModal(true);
        }
      };
      
      checkUserStatus();
    }, [client, userId, globalSocket, isConnected]);

    const handleCreateRingCall = async (incident: any) => {
        if (!videoClient || !incident?.responder) {
            console.error("Video client not initialized or no responder ID available");
            return;
        }
        
        try {
            setIsRinging(true);
            const responderId = typeof incident.responder === 'object' && incident.responder !== null
                ? incident.responder._id
                : incident.responder;
            let responderData = null;
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${config.GUARDIAN_SERVER_URL}/responders/${responderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    responderData = await response.json();
                }
            } catch (error) {
                console.error("Error fetching responder data for upsert:", error);
            }
            if (chatClient && responderData) {
                await chatClient.upsertUser({
                    id: responderId,
                    name: `${responderData.firstName || ''} ${responderData.lastName || ''}`.trim() || 'Responder',
                    image: responderData.profileImage || undefined
                });
            }
            console.log("Calling responder ID:", responderId);
            console.log("Video client state:", videoClient.state);
            
            const callId = `call-${Date.now()}`;
            console.log("Creating call with ID:", callId);
            
            const newCall = videoClient.call("default", callId);
            console.log("New call created with ID:", newCall.id);
            
            await newCall.getOrCreate({
                ring: true,
                data: {
                    members: [
                        { user_id: userId },
                        { user_id: responderId }
                    ],
                    settings_override: {
                        ring: {
                            incoming_call_timeout_ms: 30000,
                            auto_cancel_timeout_ms: 30000
                        }
                    }
                }
            });
            
            console.log("Ring call created successfully", {
                callId: newCall.id,
                isCreatedByMe: newCall.isCreatedByMe,
                members: newCall.state.members
            });
        } catch (error) {
            console.error("Error creating ring call:", error);
        } finally {
            setIsRinging(false);
        }
    };

    const handleMapClick = (incidentId: string) => {
        const width = window.screen.width;
        const height = window.screen.height;
        const newWindow = window.open(`/responder-map?incidentId=${incidentId}`, '_blank', `width=${width},height=${height},left=0,top=0`);
        if (newWindow) {
            newWindow.moveTo(0, 0);
            newWindow.resizeTo(screen.availWidth, screen.availHeight);
            newWindow.focus();
        }
    };

    useEffect(() => {
      const handleResponderCountUpdate = (counts: ResponderCountsState) => {
        console.log("Received responder counts:", counts);
        if (counts) {
          setResponderCounts(counts);
        }
      };
  
      if (globalSocket && isConnected) {
        // Listen for the broadcast from the server
        globalSocket.on('responderCountsUpdate', handleResponderCountUpdate);

        console.log("Requesting initial responder counts..."); // Optional log
        globalSocket.emit('getInitialResponderCounts');
  
        // Cleanup listener on unmount
        return () => {
          globalSocket.off('responderCountsUpdate', handleResponderCountUpdate);
        };
      }
    }, [globalSocket, isConnected]);

    useEffect(() => {
      // Function to update state when new data arrives
      const handleIncidentCountUpdate = (counts: {
        medical: number;
        fire: number;
        police: number;
        general: number;
      }) => {
        console.log('Received incident counts from server:', counts); 
        if (counts) {
          setIncidentCounts(counts);
        }
      };
  
      if (globalSocket && isConnected) {
        // Request initial counts when component mounts and is connected
        globalSocket.emit('getIncidentCounts');
  
        // Listen for live updates from the server
        globalSocket.on('incidentCountsUpdate', handleIncidentCountUpdate);
  
        // Cleanup: remove the listener when the component unmounts
        return () => {
          globalSocket.off('incidentCountsUpdate', handleIncidentCountUpdate);
        };
      }
    }, [globalSocket, isConnected]);

    function CallAudioHandler({ stopSound }: { stopSound: () => void }) {
        const calls = useCalls();
        useEffect(() => {
            if (!calls || calls.length === 0) return;
            let prevStates = calls.map(call => call.state.callingState);
            const interval = setInterval(() => {
                calls.forEach((call, idx) => {
                    const currentState = call.state.callingState;
                    if (prevStates[idx] === 'ringing' && currentState !== 'ringing') {
                        stopSound();
                        if (typeof call.leave === 'function' && currentState !== 'left' && currentState !== 'idle') {
                            call.leave({ reject: true, reason: 'cancel' });
                        }
                    }
                    prevStates[idx] = currentState;
                });
            }, 200);
            return () => clearInterval(interval);
        }, [calls, stopSound]);
        return null;
    }

    const handleSelectIncidentForChat = (channelId: string) => {
        setActiveCall(channelId);
        setIsChatExpanded(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">
                <Typography variant="h5" sx={{ color: 'white' }}>Loading...</Typography>
            </div>
        );
    }



    //start of the component//
    return (
      <div className="h-screen flex flex-col">
            {/* navbar section// */}
            <Container 
                disableGutters={true}
                maxWidth={false}
                sx={{
                  backgroundColor: "#F0F0F0",
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
            <Grid container spacing={1}>
                <Grid size={{xs: 12}}
                display= {"flex"}>
                    <Grid
                    size={{md: 4.5}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    padding = {"1rem 1rem 1rem 3rem"}
                    gap={"1rem"}>
                        <Avatar 
                        src={GuardianIcon}
                        sx={{   
                        width: 70, 
                        height: 70,
                        boxSizing: 'border-box',
                        borderRadius: '50%'
                        }}
                        alt={avatarImg}
                        />
                        
                        <Box>
                                    <Typography variant="h4" sx={{ fontWeight: "bold", color: "red", letterSpacing: '0.1em' }}>
                                        {formatTime()}
                                    </Typography>
                                    <Typography sx={{ fontWeight: "bold", letterSpacing: '0.1em', fontSize: "15px" }}>
                                        {formatDate()}
                                    </Typography>
                                </Box>

                        

                    </Grid>
                    
                    <Grid
                    size={{md: 3}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    gap={"1rem"}>
                        <Typography variant="h4" sx={{fontWeight: "bold", color: "red", letterSpacing: '0.1em'}}>
                            INCIDENTS
                        </Typography>
                    </Grid>
                    
                    <Grid
      size={{md: 3.5}}
      display={"flex"}
      flexDirection={"column"} 
      alignItems={"CENTER"}
    >
        LIVE DATA
      <Grid 
        display={"flex"}
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={"1rem"}
        padding={"0.5rem 0.5rem 0 0.5rem"}
      >
        <Box sx={{ 
          bgcolor: '#B93B48', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          minWidth: '65px'
        }}>
          <FireTruckIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{responderCounts.fire ?? '...'}</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          minWidth: '65px'
        }}>
          <MedicalServicesIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{responderCounts.medical ?? '...'}</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          minWidth: '65px'
        }}>
          <LocalPoliceIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{responderCounts.police ?? '...'}</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4A4740', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          minWidth: '65px'
        }}>
          <TwoWheelerIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>0</Typography>
        </Box>
      </Grid>
      <Grid 
        display={"flex"}
        flexDirection={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={"1rem"}
        padding={"0.5rem"}
      >
        <Box sx={{ 
          bgcolor: '#B93B48', 
          borderRadius: 1, 
          p: 0.5, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1 ,
          minWidth: '65px'
        }}>
          <Avatar 
                        src={Medical}
                        sx={{ width: 24, height: 24 }}
                        alt={Medical}
                      />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{incidentCounts.medical ?? '...'}</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1 ,
          minWidth: '65px'
        }}>
          <Avatar 
                        src={Fire}
                        sx={{ width: 24, height: 24 }}
                        alt={Fire}
                      />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{incidentCounts.fire ?? '...'}</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1 ,
          minWidth: '65px'
        }}>
          <Avatar 
                        src={Police}
                        sx={{ width: 24, height: 24 }}
                        alt={Police }
                      />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{incidentCounts.police ?? '...'}</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4A4740', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1 ,
          minWidth: '65px'
        }}>
          <Avatar 
                        src={General}
                        sx={{ width: 24, height: 24 }}
                        alt={General}
                      />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>{incidentCounts.general ?? '...'}</Typography>
        </Box>
      </Grid>
</Grid>
                    <Grid
                    size={{md: 1}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    padding = {"1rem 3rem 1rem 1rem"}
                    justifyContent={"center"}
                    gap={"1rem"}>
                        <Avatar 
                        src={getImageUrl(userStr2?.profileImage) || ''}
                        sx={{   
                        width: 70, 
                        height: 70,
                        boxSizing: 'border-box',
                        borderRadius: '50%',
                        border: `2px solid ${!isInvisible ? 'green' : 'red'}`,
                        cursor: 'pointer'
                        }}
                        alt={userStr2?.firstName + " " + userStr2?.lastName}
                        onClick={() => setShowStatusModal(true)}
                        />

                    </Grid>
                        
                        
                    
                </Grid>

            </Grid>
            
            </Container>


  {/* //middle section of the page// */}
    <div className="min-h-screen bg-[#1B4965] flex items-start justify-center w-full">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        px: 3,
                        pt: 3
                    }}

                    
                >

<Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 1, marginBottom: '3rem'}}>
                      <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(event, newView) => {
                          if (newView !== null) {
                            setViewMode(newView);
                          }
                        }}
                        aria-label="view mode"
                      >
                        <ToggleButton value="card" aria-label="card view" sx={{ 
                          color: 'white', 
                          borderColor: 'rgba(255,255,255,0.5)', 
                          '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.3)' } 
                        }}>
                          <ViewComfyIcon />
                        </ToggleButton>
                        <ToggleButton value="grid" aria-label="grid view" sx={{ 
                          color: 'white', 
                          borderColor: 'rgba(255,255,255,0.5)', 
                          '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.3)' } 
                        }}>
                          <ViewModuleIcon />
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>


                    {incidents.length > 0 ? (
                        viewMode === 'card' ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start',
                                    width: '90%',
                                    // backgroundColor: 'blue',
                                }}
                            >
                                {incidents.map((incident) => (
                                    <IncidentCard
                                        key={incident._id}
                                        incident={incident}
                                        handleMapClick={handleMapClick}
                                        handleCreateRingCall={handleCreateRingCall}
                                        handleSelectIncidentForChat={handleSelectIncidentForChat}
                                    />
                                ))}
                            </Box>
                        ) : (
                            // Render the new Grid View
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start',
                                    width: '90%',
                                    // backgroundColor: 'blue',
                                }}
                            >
                            <IncidentGridView
                                incidents={incidents}
                                handleMapClick={handleMapClick}
                                handleCreateRingCall={handleCreateRingCall}
                                handleSelectIncidentForChat={handleSelectIncidentForChat}
                            />
                            </Box>
                        )
                    ) : (
                        <Box
                            sx={{
                                textAlign: 'center',
                                p: 4,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                                No active incidents
                            </Typography>
                            <Typography sx={{ color: 'white' }}>
                                {isInvisible ? 
                                    "You are currently OFFLINE. Click on your avatar to change your status to ONLINE." : 
                                    "You are ONLINE. No active incidents are currently assigned to you. Completed incidents have been filtered out."
                                }
                            </Typography>
                        </Box>
                    )}
                    {/* --- END MODIFIED --- */}
                </Box>
            </div>

            {videoClient && (
                <StreamVideo client={videoClient}>
                    <CallAudioHandler stopSound={() => {}} />
                    <VideoCallHandler />
                </StreamVideo>
            )}
            <Modal
                open={showStatusModal}
                onClose={() => {
                    if (!connectingIncident) {
                        setShowStatusModal(false);
                    }
                }}
                aria-labelledby="status-modal"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    outline: 'none',
                }}
                disableAutoFocus
            >
                <div className="min-h-[250px] flex items-center justify-center" style={{ border: 'none', outline: 'none' }}>
                    {connectingIncident ? (
                        <Paper 
                        elevation={0} 
                        className="shake_me"
                        sx={{ 
                            width: '600px',
                            margin: '0 auto',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            padding: 0,
                            border: 'none'
                        }}
                    >
                        <div style={{ 
                            backgroundColor: "#1B4965", 
                            padding: '24px',
                            display: 'flex',
                            height: "50px",
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                        </div>
                        <div style={{ 
                            backgroundColor: "#F27572", 
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div>
                                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    NEW INCIDENT
                                </Typography>
                            </div>
                        </div>
                        <div style={{ 
                            backgroundColor: "#4a7ab8", 
                            padding: '14px', 
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 120px',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <Avatar 
                                    src={getIncidentIcon(connectingIncident.incidentType?.toLowerCase() || 'general').icon}
                                    sx={{ width: 120, height: 120 }}
                                    alt={avatarImg}
                                />
                            </div>
                    
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}>
                                <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '30px', textTransform: 'uppercase' }}>
                                    {connectingIncident.incidentType}
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {connectingIncident.incidentDetails.incident}
                                </Typography>
                                <Typography variant="body1" align="center" sx={{
                                    color: 'white',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2, 
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                                title={address || "Loading address..."}>
                                    {address || 'Loading address...'}
                                </Typography>
                            </div>
                    
                            <div></div>
                        </div>
                        <div style={{ 
                            backgroundColor: "#1B4965", 
                            padding: '24px', 
                            display: 'flex', 
                            justifyContent: 'center',
                            gap: '16px'
                        }}>
                            <Button
                                variant="contained"
                                onClick={handleAcceptIncident}
                                sx={{
                                    backgroundColor: '#4caf50',
                                    '&:hover': {
                                        backgroundColor: '#388e3c',
                                    },
                                }}
                            >
                                Accept
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleDeclineIncident}
                                sx={{
                                    backgroundColor: '#f44336',
                                    '&:hover': {
                                        backgroundColor: '#d32f2f',
                                    },
                                }}
                            >
                                Decline
                            </Button>
                        </div>
                    </Paper>
                    ) : (
                        <Box sx= {{
                            backgroundColor: 'gray',
                            width: '100vw',
                            display: 'flex',
                            justifyContent: 'center',
                        }}>

                        
                        <Box
                            sx={{
                                width: 600,
                                maxWidth: '90%',
                                bgcolor: 'red',
                                borderRadius: 0,
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: '#1D5673',
                                    padding: '20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography 
                                    variant="h2"
                                    sx={{ 
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        fontSize: '4rem',
                                        lineHeight: 1,
                                        color: isInvisible ? 'red' : 'green',
                                    }}
                                >
                                    {isInvisible ? "OFFLINE" : "ONLINE"}
                                </Typography>
                                <Typography 
                                    variant="h4"
                                    sx={{ 
                                        color: 'white',
                                        textTransform: 'uppercase',
                                        mt: 1,
                                    }}
                                >
                                    OPERATION CENTER
                                </Typography>
                            </Box>
                            
                            <Box
                                sx={{
                                    bgcolor: 'white',
                                    padding: '10px 20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography 
                                    variant="h6"
                                    sx={{ 
                                        color: 'red',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {!isInvisible ? "ON ACTIVE STAND-BY, WAITING DISPATCH" : "ON BREAK"}
                                </Typography>
                            </Box>
                            
                            <Box
                                sx={{
                                    bgcolor: '#1D5673',
                                    padding: '20px',
                                    textAlign: 'center',
                                }}
                            >
                                <Button 
                                    variant="contained" 
                                    onClick={toggleStatus}
                                    sx={{
                                        padding: '10px 40px',  
                                        fontSize: '16px',
                                        textTransform: 'uppercase', 
                                        fontWeight: 'bold',
                                        bgcolor: !isInvisible ? '#FF6B6B' : '#4AE54A',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: !isInvisible ? '#E05959' : '#3AC53A',
                                        },
                                        borderRadius: '25px',
                                    }}
                                >
                                    {!isInvisible ? "CHECK-OUT" : "CHECK-IN"}
                                </Button>
                            </Box>
                            </Box>
                        </Box>
                    )}
                </div>
            </Modal>
            
            <Modal
                open={showClosingModal}
                onClose={() => setShowClosingModal(false)}
                aria-labelledby="closing-modal"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    outline: 'none'
                }}
            >
                <div className="min-h-[250px] flex items-center justify-center" style={{ border: 'none', outline: 'none' }}>
                    {closingIncident && (
                        <Paper
                            elevation={0}
                            sx={{
                                width: '500px',
                                margin: '0 auto',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                padding: 0,
                                border: 'none'
                            }}
                        >
                            <div style={{
                                backgroundColor: "#1B4965",
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                                    INCIDENT CLOSURE REQUEST
                                </Typography>
                            </div>
                            
                            <div style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                            }}>
                                <Avatar
                                    src={getIncidentIcon(closingIncident.incidentType?.toLowerCase() || 'general').icon}
                                    sx={{ width: 80, height: 80 }}
                                    alt="Incident type"
                                />
                                
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        {closingIncident.incidentType?.toUpperCase()} INCIDENT
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 1, textTransform: "uppercase" }}>
                                        ID: {closingIncident.incidentType ? `${closingIncident.incidentType}-${closingIncident._id?.substring(5, 9)}` : ""}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                                        The responder has requested to close this incident.
                                    </Typography>
                                </Box>
                                
                                <Button
                                    variant="contained"
                                    onClick={handleFinishIncident}
                                    sx={{
                                        bgcolor: '#4caf50',
                                        color: 'white',
                                        padding: '8px 24px',
                                        '&:hover': {
                                            bgcolor: '#388e3c'
                                        }
                                    }}
                                >
                                    CLOSE INCIDENT
                                </Button>
                            </div>
                        </Paper>
                    )}
                </div>
            </Modal>
        </div>
    )

}

const VideoCallHandler = () => {
    const calls = useCalls();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (calls.length > 0) {
            console.log("Active calls in LGUMain:", calls.length);
            calls.forEach(call => {
                console.log(`Call ${call.cid} state:`, call.state.callingState);
            });
        }
    }, [calls]);
    
    return (
        <>
            {calls.map((call) => (
                <StreamCall call={call} key={call.cid}>
                    <CallPanel />
                </StreamCall>
            ))}
        </>
    );
};

export default LGUMain;