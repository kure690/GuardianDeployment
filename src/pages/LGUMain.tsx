import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar, Container } from '@mui/material';
import avatarImg from "../assets/images/user.png";
import GuardianIcon from "../assets/images/Guardian.png";
import Grid from "@mui/material/Grid2";
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import General from "../assets/images/General.png";
import Police from "../assets/images/Police.png";
import Medical from "../assets/images/Medical.png";
import Fire from "../assets/images/Fire.png";
import FireTruckIcon from '@mui/icons-material/FireTruck';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
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

const getIncidentIcon = (incidentType: string) => {
    const type = incidentType?.toLowerCase() || '';

    switch (type) {
      case 'medical':
      case 'Medical':
        return {
          icon: Medical
        };
      case 'fire':
      case 'Fire':
        return {
          icon: Fire
        };
      case 'police':
      case 'Police':
        return {
          icon: Police
        };
      case 'general':
      case 'General':
      default:
        return {
          icon: General
        };
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
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const shortId = incident._id ? incident._id.substring(5, 9) : "";

    // State for responder data
    const [responderData, setResponderData] = useState<any>(null);
    
    // Fetch responder data if incident has a responder
    useEffect(() => {
        const fetchResponderData = async () => {
            if (!incident.responder) return;
            
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${config.PERSONAL_API}/users/${incident.responder}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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
        
        const type = responderData.type?.toLowerCase() || '';
        const firstName = responderData.firstName?.toLowerCase() || '';
        
        if (type.includes('ambulance') || type.includes('medical') || firstName.includes('ambu')) {
            return ambulanceIcon;
        } else if (type.includes('fire') || firstName.includes('fire')) {
            return firetruckIcon;
        } else if (type.includes('police') || firstName.includes('police')) {
            return policecarIcon;
        }
        
        return ambulanceIcon; // Default
    };

    return (
        <Paper
            elevation={3}
            sx={{
                width: '240px',
                borderRadius: '8px',
                overflow: 'hidden',
                m: 1.5,
            }}
        >
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1,
                bgcolor: '#4a90e2',
                height: '75px',
            }}>
                <Avatar
                    src={getIncidentIcon(incident.incidentType?.toLowerCase() || 'general').icon}
                    sx={{
                        width: 55,
                        height: 55,
                        bgcolor: 'white',
                        p: 0.8,
                        flexShrink: 0,
                        
                    }}
                />
                <Box>
                    <Typography sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase'
                        }}>
                        ID: {incident.incidentType ? `${incident.incidentType}-${shortId}` : ""}
                    </Typography>
                    <Typography sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                    }}>
                        {incident.incidentType ? `${incident.incidentType.toUpperCase()} CALL` : ""}
                    </Typography>
                    <Typography 
                        sx={{
                            color: 'white',
                            fontSize: '0.7rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.2em',
                            maxHeight: '2.4em'
                        }}
                        title={incident.address || "Loading address..."}
                    >
                        {incident.address || "Loading address..."}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{
                // bgcolor: '#e8f5e9',
                p: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Typography sx={{
                    color: '#2e7d32',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    RECEIVED : {formatReceivedTime(incident.receivedTime)}
                </Typography>
            </Box>
            <Box sx={{
                bgcolor: 'white',
                p: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Typography sx={{
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                }}>
                    {incident.incidentDetails?.incident ? incident.incidentDetails.incident.toUpperCase() : (incident.incidentType ? incident.incidentType.toUpperCase() : "LOADING...")}
                </Typography>
            </Box>
            <Box sx={{
                bgcolor: 'white',
                p: 0.7,
                borderTop: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Typography sx={{
                    color: 'red',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    LAPS TIME: {formatLapsTime(incident.timeLapsed)}
                </Typography>
            </Box>
            {!incident.responder ? (
                // Display "DISPATCH" if no responder is assigned
                <Box sx={{
                    bgcolor: '#333',
                    color: 'white',
                    p: 0.8,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '70px'
                }}>
                    <Typography sx={{ 
                        fontSize: '0.8rem'
                    }}>
                        DISPATCH
                    </Typography>
                </Box>
            ) : (
                // Display responder info if a responder is assigned
                <Box sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '70px',
                    bgcolor: '#4a90e2',
                }}>
                    {/* Blue responder name section */}
                    <Box sx={{
                        // bgcolor: '#4a90e2',
                        color: 'white',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        borderBottom: '2px solid grey'
                    }}>
                        <img 
                            src={getResponderIcon(responderData)} 
                            alt="Responder" 
                            style={{ 
                                width: '30px', 
                                height: '18px',
                                objectFit: 'contain'
                            }} 
                        />
                        <Typography sx={{ 
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }}>
                            {responderData ? 
                                `${responderData.firstName || ''} ${responderData.lastName || ''}`.trim() || 
                                (responderData.type === "ambulance" ? "AMBU 123" : "RESPONDER") 
                                : 
                                incident.responder ? "RESPONDER" : "UNKNOWN"
                            }
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        height: '100%'
                    }}>

                    <Box sx={{
                        // backgroundColor: '#4a90e2',
                        width: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <Typography sx={{ 
                                color: '#EE4B2B',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                textAlign: 'center',
                            }}>
                                {incident.responderStatus ? incident.responderStatus.toUpperCase() : "ENROUTE"}
                            </Typography>

                    </Box>
                   
                        
                            
                            <Box sx={{
                            borderLeft: '2px solid grey',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            // backgroundColor: 'blue',
                            width: '50%',
                            }}>
                                <Typography sx={{ 
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    textAlign: 'center',
                                }}>
                                    13 min
                                </Typography>
                                <Typography sx={{ 
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    textAlign: 'center',
                                }}>
                                    2.3 km
                                </Typography>
                            </Box>
                        </Box>

                    </Box>
                    
            )}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-around',
                p: 0.7,
                bgcolor: 'white'
            }}>
                <Button 
                    sx={{ minWidth: 0, color: '#666', p: 0.4 }}
                    onClick={() => incident.channelId && handleSelectIncidentForChat(incident.channelId)}
                >
                    💬
                </Button>
                <Button 
                    sx={{ minWidth: 0, color: '#666', p: 0.4 }}
                    onClick={() => handleCreateRingCall(incident)}
                >
                    📞
                </Button>
                <Button sx={{ minWidth: 0, color: '#666', p: 0.4 }}>📹</Button>
            </Box>
            <Button
                fullWidth
                sx={{
                    bgcolor: '#4a90e2',
                    color: 'white',
                    py: 0.8,
                    borderRadius: 0,
                    fontSize: '0.8rem',
                    '&:hover': {
                        bgcolor: '#357abd'
                    }
                }}
                onClick={() => handleMapClick(incident._id)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🗺️ VIEW MAP
                </Box>
            </Button>
        </Paper>
    );
};

const LGUMain = () => {
    const location = useLocation();
    const navigate = useNavigate();
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
    const [address, setAddress] = useState<string>('');
    const [isInvisible, setIsInvisible] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [connectingIncident, setConnectingIncident] = useState<any>(null);
    const [lastIncidentId, setLastIncidentId] = useState<string | null>(null);
    const { client } = useChatContext();
    const [incidents, setIncidents] = useState<any[]>([]);
    const [activeCall, setActiveCall] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
    const [pendingAudioType, setPendingAudioType] = useState<string | null>(null);
    const [closingIncident, setClosingIncident] = useState<any>(null);
    const [showClosingModal, setShowClosingModal] = useState(false);
    const handleSelectIncidentForChat = (channelId: string) => {
        setActiveCall(channelId);
        setIsChatExpanded(true);
    };
    
    const fetchIncidents = async () => {
        if (!userId) {
            setIsLoading(false);
            navigate('/');
            return;
        }

        try {
            const response = await fetch(`${config.PERSONAL_API}/incidents`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch incidents');
            }

            const data = await response.json();
            
            console.log(`Total incidents: ${data.length}`);
            
            const connectedIncidents = data.filter((incident: any) => {
                // Get the LGU ID whether it's an object or string
                const lguId = incident.lgu ? (typeof incident.lgu === 'object' ? incident.lgu._id : incident.lgu) : null;
                // Show incidents that are assigned to this LGU and either connected or connecting
                const matches = lguId === userId && 
                              (incident.lguStatus === 'connected' || incident.lguStatus === 'connecting') && 
                              !incident.isFinished;
                
                if (lguId === userId) {
                    console.log('Incident status:', {
                        id: incident._id,
                        lguStatus: incident.lguStatus,
                        isFinished: incident.isFinished
                    });
                }
                return matches;
            });
            
            console.log(`After filtering, showing ${connectedIncidents.length} incidents`);
            
            const processedIncidents = await Promise.all(
                connectedIncidents.map(async (incident: any) => {
                    let address = "";
                    if (incident.incidentDetails?.coordinates?.lat && incident.incidentDetails?.coordinates?.lon) {
                        try {
                            address = await getAddressFromCoordinates(
                                incident.incidentDetails.coordinates.lat.toString(),
                                incident.incidentDetails.coordinates.lon.toString()
                            );
                        } catch (error) {
                            console.error('Error getting address:', error);
                            address = "Unknown location";
                        }
                    }
                    
                    const receivedTime = new Date(incident.acceptedAt || incident.createdAt);
                    const now = new Date();
                    const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
                    
                    return {
                        ...incident,
                        address,
                        timeLapsed,
                        receivedTime: incident.acceptedAt || incident.createdAt
                    };
                })
            );
            
            setIncidents(processedIncidents);
        } catch (error) {
            console.error('Error fetching incidents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          .shake_me {
            animation: shake 0.5s;
            animation-iteration-count: infinite;
          }
          
          @keyframes shake {
            0% {transform: translate(1px, 1px) rotate(0deg);}
            10% {transform: translate(-1px, -2px) rotate(-1deg);}
            20% {transform: translate(-3px, 0px) rotate(1deg);}
            30% {transform: translate(3px, 2px) rotate(0deg);}
            40% {transform: translate(1px, -1px) rotate(1deg);}
            50% {transform: translate(-1px, 2px) rotate(-1deg);}
            60% {transform: translate(-3px, 1px) rotate(0deg);}
            70% {transform: translate(3px, 1px) rotate(-1deg);}
            80% {transform: translate(-1px, -1px) rotate(1deg);}
            90% {transform: translate(1px, 2px) rotate(0deg);}
            100% {transform: translate(1px, -2px) rotate(-1deg);}
          }
        `;
        document.head.appendChild(style);
        
        return () => {
          document.head.removeChild(style);
        };
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
    }, [isInvisible, userId, token]);

    // Check for incidents with responderStatus "close"
    useEffect(() => {
        const checkForClosingIncidents = () => {
            // Only show modal if we're not already showing it and there's no incident being processed
            if (showClosingModal || closingIncident) {
                return;
            }
            
            // Find an incident with responderStatus "close" that isn't finished yet
            const incidentToClose = incidents.find(incident => 
                incident.responderStatus === 'close' && !incident.isFinished
            );
            
            if (incidentToClose) {
                console.log('Found incident requesting to close:', incidentToClose._id);
                setClosingIncident(incidentToClose);
                setShowClosingModal(true);
            }
        };
        
        // Only run the check if we have incidents loaded
        if (incidents.length > 0) {
            checkForClosingIncidents();
        }
    }, [incidents, showClosingModal, closingIncident]);

useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
}, []);


useEffect(() => {
    const updateIncidentTimes = () => {
        setIncidents(prevIncidents => 
            prevIncidents.map(incident => {
                const receivedTime = new Date(incident.receivedTime);
                const now = new Date();
                const timeLapsed = Math.floor((now.getTime() - receivedTime.getTime()) / 1000);
                
                return {
                    ...incident,
                    timeLapsed
                };
            })
        );
    };
    
    updateIncidentTimes();
    const timer = setInterval(updateIncidentTimes, 1000);
    
    return () => clearInterval(timer);
}, []);

    // Preload audio files
    useEffect(() => {
        // Create and preload audio elements
        const preloadAudio = (src: string) => {
            const audio = new Audio();
            audio.src = src;
            audio.load();
        };

        // Preload all sound files
        preloadAudio(policeSound);
        preloadAudio(fireSound);
        preloadAudio(ambulanceSound);
        preloadAudio(generalSound);

        // Initialize the main audio element
        if (audioRef.current) {
            audioRef.current.volume = 1.0;
        }
    }, []);

    // Function to enable audio
    const enableAudio = () => {
        setAudioEnabled(true);
        
        // If there's a pending audio type, play it
        if (pendingAudioType && audioRef.current) {
            switch (pendingAudioType.toLowerCase()) {
                case 'police':
                    audioRef.current.src = policeSound;
                    break;
                case 'fire':
                    audioRef.current.src = fireSound;
                    break;
                case 'medical':
                    audioRef.current.src = ambulanceSound;
                    break;
                default:
                    audioRef.current.src = generalSound;
            }
            
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1;
            audioRef.current.play().catch(error => {
                console.error('Error playing sound after user interaction:', error);
            });
        }
    };

    // Add event listeners for user interaction
    useEffect(() => {
        // Enable audio automatically when component mounts
        setAudioEnabled(true);
        
        const handleUserInteraction = () => {
            if (!audioEnabled) {
                enableAudio();
            }
        };

        // Add event listeners to various user interactions
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioEnabled]);

    const toggleStatus = async () => {
        try {
            if (!client || !userId) return;
            
            await client.upsertUser({
                id: userId,
                invisible: !isInvisible,
            });

            setIsInvisible(!isInvisible);
            if (!isInvisible) {
                setShowStatusModal(false);
            }
        } catch (error) {
            console.error('Error toggling LGU status:', error);
        }
    };
    useEffect(() => {
        const checkUserStatus = async () => {
            if (!client || !userId) return;
            
            try {
                const user = await client.queryUsers({ id: userId });
                if (user.users && user.users.length > 0) {
                    setIsInvisible(!!user.users[0].invisible);
                    
                    // Only show status modal if user is offline/invisible
                    if (user.users[0].invisible) {
                        setShowStatusModal(true);
                    }
                }
            } catch (error) {
                console.error('Error checking user status:', error);
                setIsInvisible(true);
                setShowStatusModal(true);
            }
        };
        
        checkUserStatus();
    }, [client, userId]);
    useEffect(() => {
        const checkConnectingIncidents = async () => {
            if (!userId || isInvisible) {
                console.log('Skipping check - userId:', userId, 'isInvisible:', isInvisible);
                return; 
            }

            try {
                console.log('Checking for connecting incidents...');
                const response = await fetch(`${config.PERSONAL_API}/incidents`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched incidents:', data.length);
                    
                    const connectingIncident = data.find((incident: any) => {
                        // Handle cases where lgu might be null, an object, or a string
                        const lguId = incident.lgu ? (typeof incident.lgu === 'object' ? incident.lgu._id : incident.lgu) : null;
                        const matches = lguId === userId && incident.lguStatus === 'connecting';
                        if (lguId === userId) {
                            console.log('Found incident with matching LGU:', {
                                incidentId: incident._id,
                                lguStatus: incident.lguStatus,
                                lguId: lguId,
                                userId: userId
                            });
                        }
                        return matches;
                    });
                    
                    if (connectingIncident) {
                        console.log('Found connecting incident:', connectingIncident);
                        // Check if this is a new connecting incident
                        if (lastIncidentId !== connectingIncident._id) {
                            console.log('New incident detected:', connectingIncident.incidentType);
                            setLastIncidentId(connectingIncident._id);
                            setConnectingIncident(connectingIncident);
                            setShowStatusModal(true);
                            console.log('Modal state set to true for incident:', connectingIncident._id);
                            if (connectingIncident.incidentDetails?.coordinates?.lat && connectingIncident.incidentDetails?.coordinates?.lon) {
                                const formattedAddress = await getAddressFromCoordinates(
                                    connectingIncident.incidentDetails.coordinates.lat.toString(),
                                    connectingIncident.incidentDetails.coordinates.lon.toString()
                                );
                                setAddress(formattedAddress);
                            }
                        }
                    } else {
                        console.log('No connecting incident found for LGU:', userId);
                    }
                }
            } catch (error) {
                console.error('Error checking connecting incidents:', error);
            }
        };
    
        const interval = setInterval(checkConnectingIncidents, 2000); 
        return () => clearInterval(interval);
    }, [userId, token, isInvisible, lastIncidentId]);
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
        if (!connectingIncident) return;
    
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            
            // Clear pending audio
            setPendingAudioType(null);
            
            const channelId = await getNextChannelId(connectingIncident.incidentType, connectingIncident._id);
            const channel = client.channel('messaging', channelId, {
                name: `${connectingIncident.incidentType} Incident #${channelId.split('-')[1]}`,
                members: [connectingIncident.user._id, userId]
            });
            
            await channel.create();
    
            const response = await fetch(`${config.PERSONAL_API}/incidents/update/${connectingIncident._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lguStatus: 'connected',
                    lguConnectedAt: new Date(),
                    lgu: userId,
                    channelId: channelId
                })
            });
    
            if (response.ok) {
                localStorage.setItem('currentIncidentId', connectingIncident._id);
                localStorage.setItem('currentChannelId', channelId);
    
                setConnectingIncident(null);
                setShowStatusModal(false);
                fetchIncidents();
            }
        } catch (error) {
            console.error('Error accepting incident:', error);
        }
    };
    
    const handleDeclineIncident = async () => {
        if (!connectingIncident) return;
    
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            
            // Clear pending audio
            setPendingAudioType(null);
            
            const response = await fetch(`${config.PERSONAL_API}/incidents/update/${connectingIncident._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lguStatus: 'idle',
                    lgu: null
                })
            });
    
            if (response.ok) {
                setConnectingIncident(null);
                setShowStatusModal(false);
            }
        } catch (error) {
            console.error('Error declining incident:', error);
        }
    };

    const handleFinishIncident = async () => {
        if (!closingIncident) return;
        
        try {
            const response = await fetch(`${config.PERSONAL_API}/incidents/update/${closingIncident._id}`, {
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
                
                // Update the incident in the local state
                setIncidents(prevIncidents => 
                    prevIncidents.map(incident => 
                        incident._id === closingIncident._id 
                            ? { ...incident, isFinished: true } 
                            : incident
                    )
                );
                
                // Clear modal state
                setClosingIncident(null);
                setShowClosingModal(false);
                
                // Fetch the latest incidents (not immediately needed since we updated local state)
                // This will run in the background to ensure data consistency
                fetchIncidents();
            }
        } catch (error) {
            console.error('Error finishing incident:', error);
        }
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

    // useEffect(() => {
    //     const timer = setInterval(() => {
    //         setCurrentTime(new Date());
    //         if (receivedTime) {
    //             const received = new Date(receivedTime);
    //             const now = new Date();
    //             const diff = Math.floor((now.getTime() - received.getTime()) / 1000);
    //             setLapsTime(diff);
    //         }
    //     }, 1000);

    //     return () => clearInterval(timer);
    // }, [receivedTime]);

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

    const handleCreateRingCall = async (incident: any) => {
        if (!videoClient || !incident?.responder) {
            console.error("Video client not initialized or no responder ID available");
            return;
        }
        
        try {
            setIsRinging(true);
            const responderId = incident.responder.toString();
            console.log("Creating new ring call with user ID:", userId);
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
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#1B4965] flex items-center justify-center">
                <Typography variant="h5" sx={{ color: 'white' }}>Loading...</Typography>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#1B4965] flex items-center justify-center">
            <audio ref={audioRef} preload="auto" />
            <Container 
                disableGutters={true}
                maxWidth={false}
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#F0F0F0"
                }}
            >
            <Grid container spacing={1}>
                <Grid size={{xs: 12}}
                // backgroundColor = {"blue"}
                display= {"flex"}>
                    <Grid
                    size={{md: 4.5}}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    // backgroundColor = {"green"}
                    padding = {"1rem 1rem 1rem 3rem"}
                    gap={"1rem"}>
                        {/* <AccountCircleIcon
                        sx={{
                            fontSize: "4rem",
                            color: "black",
                        }}
                        /> */}
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
                    // backgroundColor = {"red"}
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
    //   backgroundColor={"yellow"}
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
          gap: 1 
        }}>
          <FireTruckIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1 
        }}>
          <DirectionsCarIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1 
        }}>
          <LocalPoliceIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4A4740', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1 
        }}>
          <TwoWheelerIcon sx={{ color: 'white' }} />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
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
          gap: 1 
        }}>
          <Avatar 
                        src={Medical}
                        sx={{ width: 24, height: 24 }}
                        alt={Medical}
                      />
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1 
        }}>
          <Avatar 
                        src={Fire}
                        sx={{ width: 24, height: 24 }}
                        alt={Fire}
                      />
          {/* <DirectionsCarIcon sx={{ color: 'white' }} /> */}
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4285A8', 
          borderRadius: 1, 
          p: 0.5, 
          display: 'flex', 
          alignItems: 'center',
          gap: 1 
        }}>
          <Avatar 
                        src={Police}
                        sx={{ width: 24, height: 24 }}
                        alt={Police }
                      />
          {/* <DirectionsCarIcon sx={{ color: 'white' }} /> */}
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>20</Typography>
        </Box>
        
        <Box sx={{ 
          bgcolor: '#4A4740', 
          borderRadius: 1, 
          p: 0.5,
          display: 'flex', 
          alignItems: 'center',
          gap: 1 
        }}>
          <Avatar 
                        src={General}
                        sx={{ width: 24, height: 24 }}
                        alt={General}
                      />
          {/* <TwoWheelerIcon sx={{ color: 'white' }} /> */}
          <Typography sx={{ color: 'white', fontWeight: 'bold' }}>10</Typography>
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
                    // backgroundColor = {"orange"}
                    gap={"1rem"}>
                        <Avatar 
                        src={avatarImg}
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
            <div className="min-h-screen bg-[#1B4965] flex items-center justify-center pt-32">
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        width: '100%',
                        maxWidth: '1200px',
                        px: 2
                    }}
                >
                    {incidents.length > 0 ? (
                        incidents.map((incident) => (
                            <IncidentCard
                                key={incident._id}
                                incident={incident}
                                handleMapClick={handleMapClick}
                                handleCreateRingCall={handleCreateRingCall}
                                handleSelectIncidentForChat={handleSelectIncidentForChat}
                            />
                        ))
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
                </Box>
            </div>

            {videoClient && (
                <StreamVideo client={videoClient}>
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
                                display: 'flex', 
                                justifyContent: 'start',
                                alignItems: 'center',
                                // gap: '1rem',
                            }}>
                                <div style={{
                                    // backgroundColor: "red", 
                                    display: 'flex', 
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                <Avatar 
                                    src={getIncidentIcon(connectingIncident.incidentType?.toLowerCase() || 'general').icon}
                                    sx={{ width: 120, height: 120,  }}
                                    alt={avatarImg}
                                />
                                </div>

                                
                                <div
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        // backgroundColor: "red",
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
            {/* Closing Incident Modal */}
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


