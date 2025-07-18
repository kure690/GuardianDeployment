import { User } from "@stream-io/video-react-sdk";
import { Paper, Avatar, Typography, Box, Button, MenuItem, Menu } from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { useChatContext } from 'stream-chat-react';
import { useState, useEffect, useRef } from 'react';
import policeSound from '../assets/sounds/police.mp3';
import fireSound from '../assets/sounds/fire.mp3';
import ambulanceSound from '../assets/sounds/ambulance.mp3';
import generalSound from '../assets/sounds/general.mp3';
import config from "../config";
import { getAddressFromCoordinates } from '../utils/geocoding';
import IncidentModal from '../components/IncidentModal';

interface Incident {
  _id: string;
  incidentType: string;
  isVerified: boolean;
  isResolved: boolean;
  isAccepted: boolean;
  user: {
    "firstName": string;
    "lastName": string;
    "profileImage": string;
    _id: string;
  };
  createdAt: string;
  channelId?: string;
  lgu?: string;
  lguStatus?: string;
  incidentDetails?: {
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
}

export default function Status() {
  const userStr = localStorage.getItem("user");
  const userData = userStr ? JSON.parse(userStr) : null;
  const { client } = useChatContext();
  const navigate = useNavigate();
  const [isInvisible, setIsInvisible] = useState(true);
  const [openModal, setOpenModal] = useState(true);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [address, setAddress] = useState<string>('');
  const userId = userData?.id;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userName = userData?.name;
  const openMenu = Boolean(anchorEl);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${config.PERSONAL_API}${url}`;
  };

  if (!userData) {
    return <Navigate to="/" replace />;
  }

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
    if (!userId || isInvisible) {
      setCurrentIncident(null);
      setOpenModal(false);
      return;
    }
    
    let interval: NodeJS.Timeout;

    const checkForIncidents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch(`${config.PERSONAL_API}/incidents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server error response:', errorData);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
        }
        
        const incidents = await response.json();
        
        const unresolvedIncidents = Array.isArray(incidents) ? incidents.filter((incident: Incident) => !incident.isAccepted) : [];
        const relevantIncident = unresolvedIncidents.sort((a: Incident, b: Incident) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        if (relevantIncident && (!currentIncident || currentIncident._id !== relevantIncident._id)) {
          if (relevantIncident.incidentDetails?.coordinates) {
            const formattedAddress = await getAddressFromCoordinates(
              relevantIncident.incidentDetails.coordinates.lat,
              relevantIncident.incidentDetails.coordinates.lon
            );
            setAddress(formattedAddress);
          }

          setCurrentIncident(relevantIncident);
          setOpenModal(true);

          if (audioRef.current) {
            switch (relevantIncident.incidentType.toLowerCase()) {
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
            audioRef.current.play().catch(error => {
              console.error('Error playing sound:', error);
            });
          }
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
        // Don't throw the error further since this is in an interval
      }
    };

    checkForIncidents();
    interval = setInterval(checkForIncidents, 3000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentIncident, isInvisible, userId, userData]);

  const handleCloseModal = () => {
    setOpenModal(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const toggleStatus = async () => {
    try {
      await client.upsertUser({
        id: userId,
        invisible: !isInvisible,
      });
      setIsInvisible(!isInvisible);
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const getNextChannelId = async (incidentType: string, incidentId: string) => {
    try {
        const data = incidentId.substring(5,9);
        return `${incidentType.toLowerCase()}-${data}`;
    } catch (error) {
        console.error('Error generating channel ID:', error);
        return `${incidentType.toLowerCase()}-error`;
    }
  };

  const handleAcceptIncident = async () => {
    if (!currentIncident || !userId) return;

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        isAccepted: true,
        dispatcher: userId,
        acceptedAt: new Date().toISOString()
      };
      
      console.log('Dispatcher Update Data:', updateData);
      
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${currentIncident._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.status === 500) {
        console.log('Update completed but population failed - proceeding with flow');
        try {
          const errorData = await response.json();
          console.log('Population error details:', errorData);
        } catch (e) {
          console.log('No additional error details available');
        }
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update Error Response:', errorData);
        throw new Error(errorData.message || `Failed to update incident: ${response.status}`);
      }

      try {
        console.log('Creating chat channel for incident:', currentIncident._id);
        const channelId = await getNextChannelId(currentIncident.incidentType, currentIncident._id);
        
        const channel = client.channel('messaging', channelId, {
          name: `${currentIncident.incidentType} Incident #${channelId.split('-')[1]}`,
          members: [userId]
        });
        
        await channel.create();
        console.log('Chat channel created successfully');

        const initialMessage = `Your report ${currentIncident.incidentType} Call was received with a location at ${address || "Loading address..."}, can you verify the location, by giving us a landmark around you?`;

        await channel.sendMessage({
          text: initialMessage,
          user_id: userId
        });
        console.log('Initial message sent');

        localStorage.setItem('currentIncidentId', currentIncident._id);
        localStorage.setItem('currentChannelId', channelId);

        navigate(`/main/${currentIncident._id}`, { 
          state: { 
            channelId: channelId
          } 
        });
      } catch (channelError) {
        console.error('Error in channel creation process:', channelError);
        setOpenModal(false);
        setCurrentIncident(null);
      }
      
    } catch (error) {
      console.error('Error in handleAcceptIncident:', error);
      alert('Failed to accept incident. Please try again.');
    }
  };

  const user: User = {
    id: userId,
    name: userName,
  };

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <>
      <audio ref={audioRef} />
      <div className="min-h-screen bg-[#e3e5e8] flex items-center justify-center">
        <Avatar 
          src={getImageUrl(userData?.profileImage) || ''}
          alt={user.name}
          sx={{ 
              position: 'absolute', 
              top: 16,  
              right: 16,  
              width: 70, 
              height: 70,
              border: `2px solid ${!isInvisible ? 'green' : 'red'}`,
              boxSizing: 'border-box',
              borderRadius: '50%'
          }}
          onClick={handleAvatarClick}
        />
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
        <Paper elevation={3}
          sx={{ 
          padding: '0 4px 0 4px',
          width: '100%',
          height: '250px',
          backgroundColor: '#f74343',
          display: 'flex',
          justifyContent: 'center',
          border: 'none',
          borderRadius: 0
          }}
        >

          <Paper elevation={0}
          sx={{
              padding: '16px 0 16px 0',
              backgroundColor: '#1B4965',
              width: '60%',
              border: 'none',
              borderRadius: 0,
              display: 'flex',
              justifyContent: 'center',
          }}>

          <div className="flex flex-col items-center gap-4 w-full">
          <Typography 
          variant="h3"
          sx={{ 
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '2px', 
              color: isInvisible ? 'red' : 'green',
          }}
          >
          {isInvisible ? "Offline" : "Online"}
          </Typography>
            <div className="text-center w-full">
              <Typography variant="h4" sx={{ mb: 1, color: 'white' }}>
                EMERGENCY DISPATCH OPERATOR
              </Typography>
              <Box
              sx= {{
                  background: '#f7faff',
                  width: '100%'
              }}>
              <Typography variant="h6" sx={{ color: 'RED' }}>
              {!isInvisible ? "ON ACTIVE STAND-BY, WAITING FOR A CALL" : "ON BREAK"}
              </Typography>
              </Box>
              
              <div className="flex items-center justify-center mt-4">
              <Button 
              variant="contained" 
              color={!isInvisible ? "error" : "success"}
              onClick={toggleStatus}
              sx={{
                  padding: '10px 20px',  
                  fontSize: '15px',       
                  textTransform: 'none', 
                  width: '150px',     
              }}
              >
              {!isInvisible ? "CHECK-OUT" : "CHECK-IN"}
              </Button>
              </div>
            </div>
          </div>
          </Paper>
        </Paper>
        
        {currentIncident && (
        <IncidentModal
          open={openModal}
          onClose={handleCloseModal}
          incident={currentIncident}
          address={address}
          onAccept={handleAcceptIncident}
          userName={user.name ?? ''}
        />
      )}
      </div>
    </>
  );
}