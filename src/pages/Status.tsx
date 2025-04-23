import { User } from "@stream-io/video-react-sdk";
import avatarImg from "../assets/images/user.png";
import { Paper, Avatar, Typography, Box, Button, Modal } from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { useChatContext } from 'stream-chat-react';
import { useState, useEffect, useRef } from 'react';
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';
import policeSound from '../assets/sounds/police.mp3';
import fireSound from '../assets/sounds/fire.mp3';
import ambulanceSound from '../assets/sounds/ambulance.mp3';
import generalSound from '../assets/sounds/general.mp3';
import config from "../config";
import { getAddressFromCoordinates } from '../utils/geocoding';

interface Incident {
  _id: string;
  incidentType: string;
  isVerified: boolean;
  isResolved: boolean;
  isAccepted: boolean;
  user: {
    "firstName": string;
    "lastName": string;
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
  const [lastCheck, setLastCheck] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [address, setAddress] = useState<string>('');
  const userId = userData?.id;
  const userRole = userData?.role;
  const userName = userData?.name || "Jolony Tangpuy";
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
        let response;
        if (userRole === 'LGU') {
          response = await fetch(`${config.PERSONAL_API}/incidents/lgu-connecting/${userId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        } else {
          response = await fetch(`${config.PERSONAL_API}/incidents`);
        }
        
        const incidents = await response.json();
        
        let relevantIncident;
        if (userRole === 'LGU') {
          relevantIncident = incidents.find((incident: Incident) => 
            incident.lgu === userId && 
            incident.lguStatus === "connecting"
          );
        } else {
          const unresolvedIncidents = incidents.filter((incident: Incident) => !incident.isAccepted);
          relevantIncident = unresolvedIncidents.sort((a: Incident, b: Incident) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        }
        
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
          setLastCheck(Date.now());

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
      }
    };

    checkForIncidents();
    interval = setInterval(checkForIncidents, 3000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentIncident, lastCheck, isInvisible, userId, userRole]);

  const handleLogout = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    localStorage.clear();
    navigate("/", { replace: true });
  };

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

  const getIncidentColors = (incidentType: string) => {
    const type = incidentType?.toLowerCase() || '';
    
    switch (type) {
      case 'medical':
        return {
          primary: '#1e4976',  
          secondary: '#4a7ab8',
          icon: medicalIcon
        };
      case 'fire':
        return {
          primary: '#1e4976',  
          secondary: '#F27572',
          icon: fireIcon
          
        };
      case 'police':
        return {
          primary: '#1e4976',  
          secondary: '#333333',
          icon: crimeIcon
        };
      case 'general':
      default:
        return {
          primary: '#1e4976',  
          secondary: '#66bb6a',
          icon: generalIcon
        };
    }
  };

  const getNextChannelId = async (incidentType: string, incidentId: string) => {
    try {
        // if (typeof window === 'undefined' || !crypto.subtle) {
        //     throw new Error("Web Crypto API is not available in this environment.");
        // }

        // const encoder = new TextEncoder();
        const data = incidentId.substring(5,9);

        // const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        // const hashArray = Array.from(new Uint8Array(hashBuffer));
        // const shortHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);

        return `${incidentType.toLowerCase()}-${data}`;
    } catch (error) {
        console.error('Error generating channel ID:', error);
        return `${incidentType.toLowerCase()}-error`;
    }
  };

  const handleAcceptIncident = async () => {
    if (!currentIncident || !userId) return;

    try {
      let response;
      if (userRole === 'LGU') {
        response = await fetch(`${config.PERSONAL_API}/incidents/update/${currentIncident._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            lguStatus: "connected",
            lguConnectedAt: new Date()
          })
        });
      } else {
        response = await fetch(`${config.PERSONAL_API}/incidents/update/${currentIncident._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            isAccepted: true,
            dispatcher: userId
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update incident');
      }

      const data = await response.json();
      console.log('Update response:', data);
      
      if (userRole !== 'LGU') {
        const channelId = await getNextChannelId(currentIncident.incidentType, currentIncident._id);
        
        const channel = client.channel('messaging', channelId, {
          name: `${currentIncident.incidentType} Incident #${channelId.split('-')[1]}`,
          members: [userId]
        });
        
        await channel.create();

        const initialMessage = `Your report ${currentIncident.incidentType} Call was received with a location at ${address || "Loading address..."}, can you verify the location, by giving us a landmark around you?`;

        await channel.sendMessage({
          text: initialMessage,
          user_id: userId
        });

        localStorage.setItem('currentIncidentId', currentIncident._id);
        localStorage.setItem('currentChannelId', channelId);

        navigate(`/main/${currentIncident._id}`, { 
          state: { 
            channelId: channelId
          } 
        });
      }
      
      setOpenModal(false);
      setCurrentIncident(null);
      
    } catch (error) {
      console.error('Error in handleAcceptIncident:', error);
    }
  };

  const user: User = {
    id: userId,
    name: userName,
  };

  return (
    <>
      <audio ref={audioRef} />
      <div className="min-h-screen bg-[#e3e5e8] flex items-center justify-center">
        <Avatar 
          src={avatarImg}
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
          alt={user.name}
          />
          {/* <Button
            variant="contained"
            onClick={handleLogout}
            sx={{
              position: 'absolute',
              top: 16,
              right: 100,
              backgroundColor: "#ef5350",
              color: "white",
              marginTop: "0.5rem",
              "&:hover": {
                backgroundColor: "#d32f2f",
              },
            }}
          >
            Logout
          </Button> */}
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
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="incident-modal"
          aria-describedby="incident-description"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {(() => {
            const colors = getIncidentColors(currentIncident.incidentType);
            
            return (
              <Paper 
                elevation={3} 
                className="shake_me"
                sx={{ 
                  width: '600px',
                  margin: '0 auto',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  padding: 0
                }}
              >
                <div style={{ 
                  backgroundColor: colors.primary, 
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    marginRight: '24px', 
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Avatar 
                    src={colors.icon}
                    sx={{ width: 96, height: 96 }}
                    alt={colors.icon}
                  />
                  </div>
                  <div>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {currentIncident.incidentType.toUpperCase()} INCIDENT
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'white',
                      // backgroundColor: 'red',
                      maxWidth: '300px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      }}
                      title={address || "Loading address..."}>
                      {address || "Loading address..."}
                    </Typography>
                  </div>
                </div>
                <div style={{ 
                  backgroundColor: colors.secondary, 
                  padding: '14px 40px 14px 40px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', maxWidth: '400px', }}>
                      {currentIncident.user.firstName.toUpperCase()} {currentIncident.user.lastName.toUpperCase()}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: 'white', 
                      // backgroundColor: 'red',
                      maxWidth: '390px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      }}
                      title={address || "Loading address..."}>
                      {address || "Loading address..."}
                    </Typography>
                  </div>
                  <Avatar 
                    src={avatarImg}
                    sx={{ width: 120, height: 120 }}
                    alt={user.name}
                  />
                </div>
                <div style={{ 
                  backgroundColor: colors.primary, 
                  padding: '24px', 
                  display: 'flex', 
                  justifyContent: 'center',
                  gap: '16px'
                }}>
                  <Button 
                    variant="contained" 
                    onClick={handleAcceptIncident}
                    sx={{ 
                      backgroundColor: '#6ad37a',
                      color: 'white',
                      padding: '5px 24px',
                      width: '40%',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#5bc26b'
                      },
                      '&:disabled': {
                        backgroundColor: '#97d8a1',
                        color: '#e0e0e0'
                      }
                    }}
                  >
                    ACCEPT
                  </Button>
                </div>
              </Paper>
            );
          })()}
        </Modal>
      )}
      </div>
    </>
  );
}