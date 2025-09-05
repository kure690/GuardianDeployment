import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, TrafficLayer, OverlayView } from '@react-google-maps/api';
import { Box, Typography, Alert, IconButton, Drawer, Button, TextField, InputAdornment } from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import config from "../config";
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';
import ambulanceIcon from '../assets/images/ambulance.png';
import policecarIcon from '../assets/images/policecar.png';
import firetruckIcon from '../assets/images/firetruck.png';
import hospitalIcon from '../assets/images/hospital.png';
import avatarImg from "../assets/images/user.png";
import { getAddressFromCoordinates } from '../utils/geocoding';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, MessageList, MessageInput, Window } from "stream-chat-react";
import { useSocket } from "../utils/socket";
import ConnectingResponderModal from '../components/ConnectingResponderModal';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const ResponderMap = () => {
  const navigate = useNavigate();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [responderCoords, setResponderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [incidentCoords, setIncidentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitalCoords, setHospitalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('');
  const [hospitalAddress, setHospitalAddress] = useState<string>('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [incidentType, setIncidentType] = useState<string>('');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [infoWindowPosition, setInfoWindowPosition] = useState<google.maps.LatLng | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: string, distance: string } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [incidentId, setIncidentId] = useState<string>('');
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const [secondChannelId, setSecondChannelId] = useState<string>('');
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; phone: string; profileImage: string } | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [lapsTime, setLapsTime] = useState(0);
  const [incident, setIncident] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [responderUsers, setResponderUsers] = useState<any[]>([]);
  const [onlineResponders, setOnlineResponders] = useState<any[]>([]);
  const [onlineRespondersWithDistance, setOnlineRespondersWithDistance] = useState<any[]>([]);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isSecondChatExpanded, setIsSecondChatExpanded] = useState(false);
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  const userId = userStr2?.id;
  const [destinationType, setDestinationType] = useState<string>('incident');
  const token = localStorage.getItem("token");
  const { socket, isConnected } = useSocket();
  const [responderData, setResponderData] = useState({
    firstName: '',
    lastName: '',
    assignment: '',
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [dispatchedResponder, setDispatchedResponder] = useState<any>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${config.GUARDIAN_SERVER_URL}${url}`;
  };
    

  const getIncidentIcon = useCallback((type: string): google.maps.Icon | undefined => {
    if (!isGoogleLoaded || !type) return undefined;
    const iconUrl = (() => {
      switch (type.toLowerCase()) {
        case 'medical': return medicalIcon;
        case 'fire': return fireIcon;
        case 'police': return crimeIcon;
        default: return generalIcon;
      }
    })();
    return { url: iconUrl, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 40) };
  }, [isGoogleLoaded]);

  const getIncidentIcon2 = useCallback((assignment: string): google.maps.Icon | undefined => {
    if (!isGoogleLoaded || !assignment) return undefined;
    const iconUrl = (() => {
      switch (assignment.toLowerCase()) {
        case 'ambulance': return ambulanceIcon;
        case 'firetruck': return firetruckIcon;
        case 'police': return policecarIcon;
        default: return ambulanceIcon;
      }
    })();
    return { url: iconUrl, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 40) };
  }, [isGoogleLoaded]);

  const getHospitalIcon = useCallback((): google.maps.Icon | undefined => {
    if (!isGoogleLoaded) return undefined;
    return { url: hospitalIcon, scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 40) };
  }, [isGoogleLoaded]);

  const fetchDirections = useCallback(async (origin: { lat: number; lng: number } | null, destination: { lat: number; lng: number } | null) => {
    if (!isGoogleLoaded || !origin || !destination) return;
    const directionsService = new google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirections(result);
      if (result.routes[0]?.legs[0]) {
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          duration: leg.duration?.text || '',
          distance: leg.distance?.text || ''
        });
        const path = result.routes[0].overview_path;
        if (path?.length > 0) {
          setInfoWindowPosition(path[Math.floor(path.length / 2)]);
        }
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  }, [isGoogleLoaded]);

  const getIncidentIconUrl = useCallback((type: string): string => {
    switch (type?.toUpperCase()) {
      case 'MEDICAL': return medicalIcon;
      case 'FIRE': return fireIcon;
      case 'POLICE': return crimeIcon;
      default: return generalIcon;
    }
  }, []);

  useEffect(() => {
    const fetchIncidentData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const incidentIdFromUrl = urlParams.get('incidentId');
      
      if (!incidentIdFromUrl) {
        setError('No incident ID found');
        setLoading(false);
        return;
      }

      setIncidentId(incidentIdFromUrl);
      setLoading(true);

      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${incidentIdFromUrl}`);
        if (!response.ok) throw new Error('Failed to fetch incident data');

        const data = await response.json();
        setIncidentType(data.incidentType);
        setIncident(data.incidentDetails?.incident || "Not specified");
        setCurrentChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${data._id.substring(4, 9)}`);
        setSecondChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${data._id.substring(5,10)}`);
        setAcceptedAt(data.acceptedAt);

        // --- THIS IS THE FIX ---
        // It now correctly parses the GeoJSON format from the database
        const geoCoords = data.incidentDetails?.coordinates;
        if (geoCoords && geoCoords.type === 'Point' && Array.isArray(geoCoords.coordinates)) {
          const [lon, lat] = geoCoords.coordinates;
          setIncidentCoords({ lat, lng: lon });
          const formattedAddress = await getAddressFromCoordinates(lat, lon);
          setAddress(formattedAddress);
        }

        if (data.responderCoordinates) {
          setResponderCoords({
            lat: Number(data.responderCoordinates.lat),
            lng: Number(data.responderCoordinates.lon)
          });
        }

        const volunteerId = data.user?._id || data.user;
        if (volunteerId) {
          const userResponse = await fetch(`${config.GUARDIAN_SERVER_URL}/volunteers/${volunteerId}`);
          if (userResponse.ok) setUserData(await userResponse.json());
        }

        const responderIdValue = data.responder?._id || data.responder;
        if (responderIdValue) {
          const responderResponse = await fetch(`${config.GUARDIAN_SERVER_URL}/responders/${responderIdValue}`);
          if (responderResponse.ok) setResponderData(await responderResponse.json());
        }

      } catch (err) {
        console.error('Error fetching incident data:', err);
        setError('Error fetching incident data');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidentData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAssignmentResponse = (data: any) => {
      // Check if the response is for the responder we are waiting on
      if (dispatchedResponder && data.responderId === dispatchedResponder._id) {
        setIsConnecting(false); // Close the modal
        setDispatchedResponder(null); // Clear the dispatched responder
        // You can add a success/failure toast message here
        console.log('Received assignment response:', data.message);
      }
    };
    
    socket.on('assignmentAccepted', handleAssignmentResponse);
    socket.on('assignmentDeclined', handleAssignmentResponse);

    // Cleanup listeners
    return () => {
      socket.off('assignmentAccepted', handleAssignmentResponse);
      socket.off('assignmentDeclined', handleAssignmentResponse);
    };
  }, [socket, dispatchedResponder]);

  // --- NEW: FUNCTION TO HANDLE CANCELLING THE DISPATCH ---
  const handleCancelDispatch = () => {
    if (socket && dispatchedResponder && incidentId) {
      console.log(`[DISPATCHER] Emitting 'cancelDispatch' for incident: ${incidentId} and responder: ${dispatchedResponder._id}`);
      socket.emit('cancelDispatch', {
        incidentId: incidentId,
        responderId: dispatchedResponder._id
      });
      console.log(`Dispatch for responder ${dispatchedResponder._id} cancelled by user.`);
    }
    setIsConnecting(false);
    setDispatchedResponder(null);
  };

  const handleDispatchResponder = async (responderToDispatch: any) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected. Cannot dispatch responder.');
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const incidentIdFromUrl = urlParams.get('incidentId');
      
      if (!incidentIdFromUrl) {
        console.error('No incident ID found for dispatching responder');
        return;
      }
      
      // --- 4. OPEN THE MODAL WHEN DISPATCHING ---
      setDispatchedResponder(responderToDispatch);
      setIsConnecting(true);

      socket.emit('requestResponderAssignment', {
        incidentId: incidentIdFromUrl,
        responderId: responderToDispatch._id,
      });

      console.log(`Sent assignment request for responder ${responderToDispatch._id} to incident ${incidentIdFromUrl}`);
      // Initial message logic can remain if needed
      // await sendInitialMessage(responderToDispatch._id);

    } catch (error) {
      console.error('Error dispatching responder:', error);
      setIsConnecting(false); // Close modal on error
      setDispatchedResponder(null);
    }
  };
    
  const sendInitialMessage = async (responderId: string) => {
    if (!chatClient || !userId || !token || !secondChannelId) {
      console.error('Missing required data for sending initial message');
      return;
    }
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const incidentIdFromUrl = urlParams.get('incidentId');
      
      if (!incidentIdFromUrl) {
        console.error('No incident ID found for sending initial message');
        return;
      }
      
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${incidentIdFromUrl}`);
      if (!response.ok) {
        console.error('Failed to fetch incident data for initial message');
        return;
      }
      
      const incidentData = await response.json();
      
      const incidentDetails = {
        incident: incidentData.incidentDetails?.incident || "Not specified",
        incidentDescription: incidentData.incidentDetails?.incidentDescription || "No description provided"
      };
      
      const channel = chatClient.channel("messaging", secondChannelId);
      await channel.create();
      await channel.sendMessage({
        text: `Incident: ${incidentDetails.incident}\nDescription: ${incidentDetails.incidentDescription}`,
        user_id: userId
      });
      
      console.log('Initial message sent to second channel after dispatch');
    } catch (error) {
      console.error('Error sending initial message to second channel:', error);
    }
  };

    useEffect(() => {
      const interval = setInterval(() => {
        if (acceptedAt) {
          const now = new Date();
          const acceptedTime = new Date(acceptedAt);
          const elapsedSeconds = Math.floor((now.getTime() - acceptedTime.getTime()) / 1000);
          setLapsTime(elapsedSeconds);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [acceptedAt]);

    const formatLapsTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} min ${remainingSeconds} sec`;
    };

    // useEffect(() => {
    //   const fetchResponderUsers = async () => {
    //     try {
    //       const response = await fetch(`${config.GUARDIAN_SERVER_URL}/responders`);
    //       if (response.ok) {
    //         const data = await response.json();
    //         // Filter out inactive responders
    //         const activeResponders = data.filter((responder: any) => responder.status === 'active');
    //         setResponderUsers(activeResponders);
    //         const respondersWithCoords = activeResponders.filter(
    //           (responder: any) =>
    //             responder.coordinates &&
    //             responder.coordinates.lat !== null &&
    //             responder.coordinates.lon !== null
    //         );
    //         setOnlineResponders(respondersWithCoords);
    //       } else {
    //         console.error('Failed to fetch responder users');
    //       }
    //     } catch (error) {
    //       console.error('Error fetching responder users:', error);
    //     }
    //   };

    //   fetchResponderUsers();
    // }, []);

  useEffect(() => {
    // Define the function that fetches and updates responders
    const fetchAndSetResponders = async () => {
      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/responders`);
        if (response.ok) {
          const data = await response.json();
          const activeResponders = data.filter((responder: any) => responder.status === 'active');
          
          // This state is for your dispatch list/drawer
          setResponderUsers(activeResponders);

          // Filter for responders who are "online" (have valid coordinates) to show on the map
          const respondersWithCoords = activeResponders.filter(
            (responder: any) =>
              responder.coordinates &&
              responder.coordinates.lat !== null &&
              responder.coordinates.lon !== null
          );
          setOnlineResponders(respondersWithCoords);

        } else {
          console.error('Failed to fetch responder users');
        }
      } catch (error) {
        console.error('Error fetching responder users:', error);
      }
    };

    // 1. Fetch immediately when the component first loads
    fetchAndSetResponders();

    // 2. Set up an interval to re-fetch the data every 5 seconds
    const intervalId = setInterval(fetchAndSetResponders, 5000);

    // 3. Cleanup function: This is important! It stops the interval 
    //    when the component is removed, preventing errors.
    return () => clearInterval(intervalId);
    
  }, []); // The empty array ensures this effect runs only on mount and unmount

  useEffect(() => {
    console.log("Distance Calculation Effect Triggered");

    // --- DEBUGGING CHECK ---
    if (!isGoogleLoaded) {
      console.log("Exiting: Google Maps not loaded yet.");
      return;
    }
    if (!incidentCoords) {
      console.log("Exiting: Incident coordinates not available yet.");
      return;
    }
    if (onlineResponders.length === 0) {
      console.log("Exiting: No online responders to calculate for.");
      // Clear the list if there are no responders
      setOnlineRespondersWithDistance([]);
      return;
    }
    
    console.log("Proceeding: All conditions met. Calling Distance Matrix API.");

    const distanceMatrixService = new google.maps.DistanceMatrixService();

    const origins = onlineResponders.map(r => ({
      lat: r.coordinates.lat,
      lng: r.coordinates.lon,
    }));

    const destination = { lat: incidentCoords.lat, lng: incidentCoords.lng };

    distanceMatrixService.getDistanceMatrix(
      {
        origins: origins,
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        // --- DEBUGGING CHECK ---
        console.log("Distance Matrix API Response Status:", status);
        if (status === 'OK' && response) {
          console.log("API Response Data:", response); // See the full response

          const respondersWithData = onlineResponders.map((responder, index) => {
            const result = response.rows[index]?.elements[0];
            if (result?.status === 'OK') {
              return {
                ...responder,
                distanceText: result.distance.text,
                durationText: result.duration.text,
              };
            }
            return responder;
          });
          setOnlineRespondersWithDistance(respondersWithData);
        } else {
          // This is a critical error message to look for
          console.error('Error fetching distance matrix:', status);
          // Fallback to the original list so the drawer doesn't break
          setOnlineRespondersWithDistance(onlineResponders);
        }
      }
    );
  }, [onlineResponders, incidentCoords, isGoogleLoaded]);

    useEffect(() => {
      if (responderCoords && isGoogleLoaded) {
        if (destinationType === 'hospital' && hospitalCoords) {
          // Route from responder to hospital
          fetchDirections(responderCoords, hospitalCoords);
        } else if (incidentCoords) {
          // Route from responder to incident
          fetchDirections(responderCoords, incidentCoords);
        }
        
        // Set up a timer to periodically refresh directions to get updated traffic info
        const intervalId = setInterval(() => {
          if (destinationType === 'hospital' && hospitalCoords) {
            fetchDirections(responderCoords, hospitalCoords);
          } else if (incidentCoords) {
            fetchDirections(responderCoords, incidentCoords);
          }
        }, 60000); // Refresh every minute
        
        return () => clearInterval(intervalId);
      }
    }, [responderCoords, incidentCoords, hospitalCoords, destinationType, fetchDirections, isGoogleLoaded]);

  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsGoogleLoaded(true);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
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
    }, [chatClient, userId, token, secondChannelId]);

    // Poll for updates to check if selectedHospital changes
    useEffect(() => {
      const pollInterval = setInterval(async () => {
        if (incidentId) {
          try {
            const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${incidentId}`);
            if (response.ok) {
              const data = await response.json();
              
              if (data.selectedHospital && data.selectedHospital !== selectedHospital) {
                setSelectedHospital(data.selectedHospital);
                
                // Fetch hospital details if we have a new selected hospital
                try {
                  const hospitalResponse = await fetch(`${config.GUARDIAN_SERVER_URL}/hospitals/${data.selectedHospital}`);
                  if (hospitalResponse.ok) {
                    const hospitalData = await hospitalResponse.json();
                    
                    if (hospitalData.coordinates) {
                      const hospitalCoords = {
                        lat: Number(hospitalData.coordinates.lat),
                        lng: Number(hospitalData.coordinates.lng)
                      };
                      setHospitalCoords(hospitalCoords);
                      setHospitalName(hospitalData.name || '');
                      setHospitalAddress(hospitalData.address || '');
                      setDestinationType('hospital');
                    }
                  }
                } catch (error) {
                  console.error('Error fetching hospital data:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error polling for updates:', error);
          }
        }
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollInterval);
    }, [incidentId, selectedHospital]);
    
    // Poll for updates to responder coordinates
    useEffect(() => {
      const responderPollInterval = setInterval(async () => {
        if (incidentId) {
          try {
            const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${incidentId}`);
            if (response.ok) {
              const data = await response.json();
              
              if (data.responderCoordinates) {
                const newResponderCoords = {
                  lat: Number(data.responderCoordinates.lat),
                  lng: Number(data.responderCoordinates.lon)
                };
                
                // Only update if coordinates have changed
                if (!responderCoords || 
                    responderCoords.lat !== newResponderCoords.lat || 
                    responderCoords.lng !== newResponderCoords.lng) {
                  
                  setResponderCoords(newResponderCoords);
                  
                  // Update responder address
                  try {
                    const responderFormattedAddress = await getAddressFromCoordinates(
                      newResponderCoords.lat.toString(),
                      newResponderCoords.lng.toString()
                    );
                    // If we had an address update functionality, we would use it here
                  } catch (error) {
                    console.error('Error fetching responder address:', error);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error polling for responder updates:', error);
          }
        }
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(responderPollInterval);
    }, [incidentId, responderCoords]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography>Loading...</Typography></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Alert severity="error">{error}</Alert></Box>;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Google Maps API key is missing</Alert>
      </Box>
    );
  }

  return (
      <Box sx={{ position: 'relative', height: '100vh' }}>
        <Drawer
          anchor="left"
          open={isDrawerOpen}
          onClose={toggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: '350px',
              backgroundColor: "rgba(27, 73, 101, 0.8)",
              color: 'white',
              top: 'calc(125px)',
              left: '10px',
              height: 'calc(100% - 80px - 1rem)',
            }
          }}
          variant="persistent"
        >
          <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold'}}>
                  DISPATCH
                </Typography>
              </Box>
              
              <Box sx={{
                backgroundColor: '#4285F4',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                py: 1,
                px: 1,
              }}>
                <Box sx={{
                  width: '25%',
                  // backgroundColor: 'white'
                }}>
                <Box 
              component="img" 
              src={getIncidentIconUrl(incidentType)}
              alt="Emergency Icon"
              sx={{ width: 65, height: 65}}
            />
                </Box>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  // backgroundColor: 'red',
                  width: '75%',
                  maxHeight: '100px'
                }}>
              <Typography variant="subtitle1" sx={{ textAlign: 'center', fontSize: '0.8rem'}}>
                {incidentType.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', }}>
              {incident}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center', 
                display: '-webkit-box',
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2em',
                maxHeight: '2.4em'
                }}
                title={address || "Loading address..."}>
                {address || "Loading address..."}
              </Typography>

                </Box>
              
              </Box>
              
            </Box>
            

          <Box sx={{ mb: 4, p: 1 }}>
          
          <Box sx={{ 
            display: 'flex', 
            mb: 1, 
            px: 1,
            gap: 1
          }}>
            <TextField
              size="small"
              placeholder="Search"
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { 
                  backgroundColor: 'white',
                  borderRadius: 1
                }
              }}
            />
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: '#4285F4',
                '&:hover': { backgroundColor: '#4285F4' }
              }}
            >
              Search
            </Button>
          </Box>

          <Typography sx={{ color: 'black', fontWeight: 'bold', fontSize: '1rem' }}>AMBULANCE</Typography>
          {responderUsers
            .filter(user => user.assignment === 'ambulance')
            .map((user) => {
              const onlineData = onlineRespondersWithDistance.find(onlineUser => onlineUser._id === user._id);
              return (
                <Box
                  key={user._id} // Use a unique ID for the key
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 0.7,
                    backgroundColor: 'rgba(255,255,255)',
                    width: '100%',
                    opacity: onlineData ? 1 : 0.6,
                    mb: '0.3rem',
                    height: '52px'
                  }}
                >
                  <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: onlineData ? '#2ecc71' : '#95a5a6', 
                        }} />
                  <Box sx={{color: 'black', display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                    <Box
                      sx={{
                        // backgroundColor: 'green',
                        width: '25%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                    <img className='w-12 h-6'
                      src={ambulanceIcon}
                      alt="Ambulance"
                    />
                    </Box>
                    <Box
                      sx={{
                        // backgroundColor: 'green',
                        width: '50%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'uppercase',
                      }}
                    >
                      
                      <Typography variant="caption" sx={{textAlign: 'center'}}>{user.firstName} {user.lastName}</Typography>
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '25%', textAlign: 'center'}}>
          
                      <Typography variant="caption">{onlineData ? onlineData.durationText : '--'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>{onlineData ? onlineData.distanceText : '--'}</Typography>
                    </Box>
                  </Box>
                  <Button
                    sx={{
                      backgroundColor: '#1976D2',
                      color: 'white',
                      '&:hover': { backgroundColor: '#1565C0' },
                      '&.Mui-disabled': { backgroundColor: '#bdc3c7' } 
                    }}
                    onClick={() => handleDispatchResponder(user)}
                    disabled={!onlineData} 
                  >
                    <Typography sx={{fontSize: '0.7rem'}}>Dispatch</Typography>
                  </Button>
                </Box>
              )
            })}
          
          <Typography sx={{color: 'black', fontSize: '1rem', fontWeight: 'bold'}}>FIRETRUCK</Typography>
          <Box sx={{  }}>
            
            {responderUsers
              .filter(user => user.assignment === 'firetruck')
              .map((user) => {
                const onlineData = onlineRespondersWithDistance.find(onlineUser => onlineUser._id === user._id);
                return (
                  <Box
                  key={user._id} // Use a unique ID for the key
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 0.7,
                    backgroundColor: 'rgba(255,255,255)',
                    width: '100%',
                    opacity: onlineData ? 1 : 0.6,
                    mb: '0.3rem',
                    height: '52px'
                  }}
                >
                  <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: onlineData ? '#2ecc71' : '#95a5a6', 
                        }} />
                  <Box sx={{color: 'black', display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                    <Box
                      sx={{
                        // backgroundColor: 'green',
                        width: '25%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                    <img className='w-12 h-6'
                      src={firetruckIcon}
                      alt="Ambulance"
                    />
                    </Box>
                    <Box
                      sx={{
                        // backgroundColor: 'green',
                        width: '50%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'uppercase',
                      }}
                    >
                      
                      <Typography variant="caption" sx={{textAlign: 'center'}}>{user.firstName} {user.lastName}</Typography>
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '25%', textAlign: 'center'}}>
          
                      <Typography variant="caption">{onlineData ? onlineData.durationText : '--'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>{onlineData ? onlineData.distanceText : '--'}</Typography>
                    </Box>
                  </Box>
                  <Button
                    sx={{
                      backgroundColor: '#1976D2',
                      color: 'white',
                      '&:hover': { backgroundColor: '#1565C0' },
                      '&.Mui-disabled': { backgroundColor: '#bdc3c7' } 
                    }}
                    onClick={() => handleDispatchResponder(user)}
                    disabled={!onlineData} 
                  >
                    <Typography sx={{fontSize: '0.7rem'}}>Dispatch</Typography>
                  </Button>
                </Box>
                )
              })}
          </Box>

  <Typography sx={{  color: 'black', fontSize: '1rem', fontWeight: 'bold'}}>POLICE</Typography>

          <Box sx={{ mb: 1 }}>
            
            {responderUsers
              .filter(user => user.assignment === 'police')
              .map((user) => {
                const onlineData = onlineRespondersWithDistance.find(onlineUser => onlineUser._id === user._id);
                return (
                  <Box
                  key={user._id} // Use a unique ID for the key
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 0.7,
                    backgroundColor: 'rgba(255,255,255)',
                    width: '100%',
                    opacity: onlineData ? 1 : 0.6,
                    mb: '0.3rem',
                    height: '52px'
                  }}
                >
                  <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: onlineData ? '#2ecc71' : '#95a5a6', 
                        }} />
                  <Box sx={{color: 'black', display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                    <Box
                      sx={{
                        // backgroundColor: 'green',
                        width: '25%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                    <img className='w-12 h-6'
                      src={policecarIcon}
                      alt="Ambulance"
                    />
                    </Box>
                    <Box
                      sx={{
                        // backgroundColor: 'green',
                        width: '50%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'uppercase',
                      }}
                    >
                      
                      <Typography variant="caption" sx={{textAlign: 'center'}}>{user.firstName} {user.lastName}</Typography>
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '25%', textAlign: 'center'}}>
          
                      <Typography variant="caption">{onlineData ? onlineData.durationText : '--'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>{onlineData ? onlineData.distanceText : '--'}</Typography>
                    </Box>
                  </Box>
                  <Button
                    sx={{
                      backgroundColor: '#1976D2',
                      color: 'white',
                      '&:hover': { backgroundColor: '#1565C0' },
                      '&.Mui-disabled': { backgroundColor: '#bdc3c7' } 
                    }}
                    onClick={() => handleDispatchResponder(user)}
                    disabled={!onlineData} 
                  >
                    <Typography sx={{fontSize: '0.7rem'}}>Dispatch</Typography>
                  </Button>
                </Box>
                )
              })}
          </Box>
          </Box>
          </Box>
        </Drawer>

          <GoogleMap
            mapContainerStyle={containerStyle}
            center={incidentCoords || { lat: 10.3157, lng: 123.8854 }}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            <TrafficLayer />

            {onlineResponders.map((responder) => (
              <Marker
                key={responder._id} // Use a unique key for each marker
                position={{
                  lat: responder.coordinates.lat,
                  lng: responder.coordinates.lon, // Make sure to use 'lon' for longitude
                }}
                icon={getIncidentIcon2(responder.assignment)}
                title={`${responder.firstName} ${responder.lastName} (${responder.assignment})`}
              />
            ))}
            
            {responderCoords && (
                <Marker
                    position={responderCoords}
                    icon={getIncidentIcon2(responderData.assignment)}
                    title="Responder Location"
                />
            )}
            
            {incidentCoords && (
                <Marker
                    position={incidentCoords}
                    icon={getIncidentIcon(incidentType)}
                    title="Incident Location"
                />
            )}
            
            {hospitalCoords && (
                <Marker
                    position={hospitalCoords}
                    icon={getHospitalIcon()}
                    title={hospitalName}
                />
            )}
            
            {directions && (
                <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />
            )}
            
            {infoWindowPosition && routeInfo && (
                <OverlayView position={infoWindowPosition} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div style={{ 
                        backgroundColor: 'white', 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        border: '2px solid #1976D2',
                        minWidth: '100px',
                        textAlign: 'center',
                        fontFamily: 'Arial, sans-serif'
                    }}>
                        <div style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            color: '#1976D2',
                            marginBottom: '4px'
                        }}>
                            {routeInfo.duration}
                        </div>
                        <div style={{ 
                            fontSize: '14px', 
                            color: '#666',
                            fontWeight: '500'
                        }}>
                            {routeInfo.distance}
                        </div>
                    </div>
                </OverlayView>
            )}
          </GoogleMap>
        <Grid container spacing={1}>
          <Grid size={{xs: 12}}
          sx = {{
            position: "absolute",
            top: "0",
            padding: "0.7rem",
            display: "flex",
            gap: "1rem",
            height: '125px',
            // backgroundColor: 'red'
          }}>
            <Grid size={{md: 9}}
            sx = {{
            padding: "2",
            borderRadius: '10px'
          }}>
            <Box sx={{ 
          backgroundColor: "rgba(27, 73, 101, 0.8)",
          // backgroundColor: "white",
          borderRadius: 2,
          color: 'white',
          padding: 0.7,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          height: "100%"
        }}>
    <Box sx={{ 
    display: 'flex', 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    width: '7%',
  }}>
    <button 
      onClick={toggleDrawer}
      aria-label="Menu"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '16px',
        justifyContent: 'space-between',
        padding: 0,
        marginLeft: '8px',
      }}
    >
      <span style={{ display: 'block', height: '2px', width: '20px', backgroundColor: 'white', borderRadius: '1px' }} />
      <span style={{ display: 'block', height: '2px', width: '20px', backgroundColor: 'white', borderRadius: '1px' }} />
      <span style={{ display: 'block', height: '2px', width: '20px', backgroundColor: 'white', borderRadius: '1px' }} />
    </button>
  </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center', 
            justifyContent: 'start',
            marginRight: 2,
            width: '31%',
            borderRight: '1px solid rgba(255,255,255,0.3)',
          }}>
            <Box 
              component="img" 
              src={getIncidentIconUrl(incidentType)}
              alt="Emergency Icon"
              sx={{ width: 70, height: 70}}
            />
            <Box sx ={{
              display: 'flex',
              flexDirection: 'column',
              marginLeft: '1rem'
            }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
              ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,9)}` : ""}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
              {incidentType ? `${incidentType.toUpperCase()} CALL` : ""}
            </Typography>
            <Typography variant="caption" sx={{ 
              fontSize: '0.7rem',
              display: '-webkit-box',
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.2em',
              maxHeight: '2.4em'
              }}
              title={address || "Loading address..."}>
              {address || "Loading address..."}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Coordinates: {incidentCoords ? incidentCoords.lat + " " + incidentCoords.lng : ""}
            </Typography>
            </Box>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center', 
            justifyContent: 'start',
            marginRight: 2,
            width: '31%',
            borderRight: '1px solid rgba(255,255,255,0.3)',
          }}>
            <Box 
              component="img" 
              src={getImageUrl(userData?.profileImage || '')}
              alt="Emergency Icon"
              sx={{ width: 70, height: 70, borderRadius: '50%'}}
            />
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              marginLeft: '1rem'
            }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              {userData ? userData.phone : 'Loading...'}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              GuardianPH OpCen
            </Typography>
            </Box>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            alignItems: 'center', 
            justifyContent: 'start',
            marginRight: 2,
            width: '31%',
          }}>
            <Box sx ={{
              display: 'flex',
              flexDirection: 'column',
              marginLeft: '1rem'
            }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              RECEIVED AT: {acceptedAt ? new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : "Not Accepted"}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              {incident}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              LAPS TIME: {formatLapsTime(lapsTime)}
            </Typography>
            </Box>
          </Box>
        </Box>
        </Grid>
        {responderCoords && responderData.firstName && (
          <>
            <Grid size={{md: 1.5}}
            sx ={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: "rgba(27, 73, 101, 0.8)",
              padding: "2",
              borderRadius: '10px',
              height: "100%"
            }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white'}}>
                1
              </Typography>
              <img className='w-20 ml-3'
                  src={getIncidentIcon2(responderData.assignment)?.url}
                  alt="Responder Vehicle" 
                />
            </Grid>
            <Grid size={{md: 1.5}}
            sx ={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: "rgba(27, 73, 101, 0.8)",
              padding: "2",
              borderRadius: '10px',
              height: "100%"
            }}>
              <Box 
                  component="img" 
                  src={getImageUrl(userStr2?.profileImage) || ''}
                  alt="Emergency Icon"
                  sx={{ width: 70, height: 70, borderRadius: '50%'}}
                />
            </Grid>
          </>
        )}
        
        
          </Grid>
          </Grid>
        
        {chatClient && currentChannelId && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 20,
              width: '350px',
              backgroundColor: 'white',
              borderRadius: '10px 10px 0 0',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              transition: 'height 0.3s ease',
              height: isChatExpanded ? '500px' : '50px',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            <Box
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              sx={{
                bgcolor: '#4a90e2',
                color: 'white',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <Typography sx={{ fontWeight: 'bold', textTransform: "uppercase" }}>
                {/* Channel ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,9)}` : ""} */}
                Channel ID: DISPATCHER-LGU
              </Typography>
              {isChatExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </Box>

            <Box
              sx={{
                height: 'calc(100% - 40px)',
                display: isChatExpanded ? 'block' : 'none'
              }}
            >
              <Chat client={chatClient} theme="messaging light">
                <Channel channel={chatClient.channel("messaging", currentChannelId)}>
                  <Window>
                    <MessageList />
                    <MessageInput />
                  </Window>
                </Channel>
              </Chat>
            </Box>
          </Box>
        )}
        
        {chatClient && secondChannelId && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              right: 380, 
              width: '350px',
              backgroundColor: 'white',
              borderRadius: '10px 10px 0 0',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              transition: 'height 0.3s ease',
              height: isSecondChatExpanded ? '500px' : '50px',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            <Box
              onClick={() => setIsSecondChatExpanded(!isSecondChatExpanded)}
              sx={{
                bgcolor: '#e53935', 
                color: 'white',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <Typography sx={{ fontWeight: 'bold', textTransform: "uppercase" }}>
                {/* Channel ID: {incidentType ? `${incidentType}-${incidentId?.substring(5,10)}` : ""} */}
                Channel ID: LGU-RESPONDER
              </Typography>
              {isSecondChatExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </Box>
            <Box
              sx={{
                height: 'calc(100% - 40px)',
                display: isSecondChatExpanded ? 'block' : 'none'
              }}
            >
              <Chat client={chatClient} theme="messaging light">
                <Channel channel={chatClient.channel("messaging", secondChannelId)}>
                  <Window>
                    <MessageList />
                    <MessageInput />
                  </Window>
                </Channel>
              </Chat>
            </Box>
          </Box>
        )}
        
        <ConnectingResponderModal 
          open={isConnecting}
          onClose={handleCancelDispatch}
          responderName={dispatchedResponder ? `${dispatchedResponder.firstName} ${dispatchedResponder.lastName}` : ''}
        />
      </Box>
    );
  };

  export default ResponderMap; 