import { useState, useEffect } from 'react';
import { Modal, Paper, Typography, Button, Box, Avatar } from '@mui/material';
import config from '../config';
import avatarImg from "../assets/images/user.png";
import { useChatContext } from 'stream-chat-react';
import { useNavigate } from 'react-router-dom';
import { getAddressFromCoordinates } from '../utils/geocoding';

interface Incident {
  _id: string;
  incidentType: string;
  incidentDetails: {
    incident: string;
    incidentDescription: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  lgu: string;
  lguStatus: string;
  channelId?: string;
  user: {
    firstName: string;
    lastName: string;
    _id: string;
  };
  dispatcher: string;
}

const LGUStatus = () => {
  const navigate = useNavigate();
  const { client } = useChatContext();
  const [connectingIncident, setConnectingIncident] = useState<Incident | null>(null);
  const [isInvisible, setIsInvisible] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [address, setAddress] = useState<string>('');
  const lguId = user?.id;

  const toggleStatus = async () => {
    await client.upsertUser({
      id: lguId,
      invisible: !isInvisible,
    });
    setIsInvisible(!isInvisible);
  };

  useEffect(() => {
    const checkConnectingIncidents = async () => {
      if (!lguId || isInvisible) return; 

      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const connectingIncident = data.find((incident: Incident) => 
            incident.lgu === lguId && incident.lguStatus === 'connecting'
          );
          
          if (connectingIncident) {
            setConnectingIncident(connectingIncident);
            setOpenModal(true);
            
            if (connectingIncident.incidentDetails.coordinates.lat && connectingIncident.incidentDetails.coordinates.lon) {
              const formattedAddress = await getAddressFromCoordinates(
                connectingIncident.incidentDetails.coordinates.lat.toString(),
                connectingIncident.incidentDetails.coordinates.lon.toString()
              );
              setAddress(formattedAddress);
            }
          } else if (connectingIncident && connectingIncident.lguStatus === 'idle') {
            setConnectingIncident(null);
            setOpenModal(false);
            setAddress('');
          }
        }
      } catch (error) {
        console.error('Error checking connecting incidents:', error);
      }
    };

    const interval = setInterval(checkConnectingIncidents, 5000); 
    return () => clearInterval(interval);
  }, [lguId, token, isInvisible]); 

  const getNextChannelId = async (incidentType: string, incidentId: string) => {
    try {
        const data = incidentId.substring(4,9);
        return `${incidentType.toLowerCase()}-${data}`;
    } catch (error) {
        console.error('Error generating channel ID:', error);
        return `${incidentType.toLowerCase()}-error`;
    }
  };

  const handleAccept = async () => {
    if (!connectingIncident) return;

    try {
      const channelId = await getNextChannelId(connectingIncident.incidentType, connectingIncident._id);
      
      const channel = client.channel('messaging', channelId, {
        name: `${connectingIncident.incidentType} Incident #${channelId.split('-')[1]}`,
        members: [connectingIncident.user._id, lguId]
      });
      
      await channel.create();

      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${connectingIncident._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lguStatus: 'connected',
          lguConnectedAt: new Date(),
          lgu: lguId,
          channelId: channelId
        })
      });

      if (response.ok) {
        localStorage.setItem('currentIncidentId', connectingIncident._id);
        localStorage.setItem('currentChannelId', channelId);

        setConnectingIncident(null);
        setOpenModal(false);
        navigate(`/lgu-main/${connectingIncident._id}`);
      }
    } catch (error) {
      console.error('Error accepting incident:', error);
    }
  };

  const handleDecline = async () => {
    if (!connectingIncident) return;

    try {
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${connectingIncident._id}`, {
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
        setOpenModal(false);
      }
    } catch (error) {
      console.error('Error declining incident:', error);
    }
  };

  return (
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
        alt={user?.name}
      />

      <Paper elevation={3}
        sx={{ 
          padding: '0 4px 0 4px',
          width: '100%',
          height: '250px',
          backgroundColor: 'gray',
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
          }}
        >
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
                OPERATION CENTER
              </Typography>
              <Box
                sx={{
                  background: '#f7faff',
                  width: '100%'
                }}
              >
                <Typography variant="h6" sx={{ color: 'RED' }}>
                  {!isInvisible ? "ON ACTIVE STAND-BY, WAITING DISPATCH" : "ON BREAK"}
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

      <Modal
        open={openModal}
        onClose={() => {}} 
        aria-labelledby="incident-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          className="shake_me"
          sx={{ 
            width: '550px',
            margin: '0 auto',
            borderRadius: '20px',
            overflow: 'hidden',
            padding: 0,
            border: `1px solid white`,
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
            padding: '14px 40px 14px 40px', 
            display: 'flex', 
            justifyContent: 'start',
            alignItems: 'center',
            gap: '1rem'
          }}>
              <Avatar 
              src={avatarImg}
              sx={{ width: 96, height: 96 }}
              alt={avatarImg}
            />
            <div
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {connectingIncident && (
                <>
                  <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '30px', textTransform: 'uppercase' }}>
                  {connectingIncident.incidentType}
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {connectingIncident.incidentDetails.incident}
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {address || 'Loading address...'}
                  </Typography>
                </>
              )}
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
            onClick={handleAccept}
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
            onClick={handleDecline}
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
      </Modal>
    </div>
  );
};

export default LGUStatus;
