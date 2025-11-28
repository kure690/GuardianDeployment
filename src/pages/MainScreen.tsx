import {Navigate, useLocation, useNavigate, useParams} from "react-router-dom";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import {
  Avatar,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  Menu,
  MenuItem,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import avatarImg from "../assets/images/user.png";
import SystemSecurityUpdateWarningIcon from "@mui/icons-material/SystemSecurityUpdateWarning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import {useState, useEffect, useCallback} from "react";
import {StreamChat} from "stream-chat";

import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import config from "../config";
import msgTemplates from "../utils/MsgTemplates";
import medicalIcon from '../assets/images/Medical.png';
import generalIcon from '../assets/images/General.png';
import fireIcon from '../assets/images/Fire.png';
import crimeIcon from '../assets/images/Police.png';
import { getAddressFromCoordinates } from '../utils/geocoding';
import { useSocket } from "../utils/socket";
import OpCenConnectModal from '../components/OpCenConnectModal';
import ConnectingModal from '../components/ConnectingModal';
import { useIncidentData } from '../hooks/incident/useIncidentData';
import { useStreamChatClient } from '../hooks/chat/useStreamChatClient';
import { useStreamVideoClient } from '../hooks/video/useStreamVideoClient';
import { useElapsedTime } from '../hooks/utils/useElapsedTime';
import { useProfileImageUpsert } from '../hooks/chat/useProfileImageUpsert';
import { useOpCenConnectingStatus } from '../hooks/opcen/useOpCenConnectingStatus';
import { useResponderStatus } from '../hooks/incident/useResponderStatus';

import {
  StreamVideo,
  useCalls,
  StreamCall,
  useConnectedUser,
} from "@stream-io/video-react-sdk";
import { CallPanel } from '../components/CallPanel';
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { LogOutIcon } from "lucide-react";


type User = {
  id: string;
  email: string;
  name: string;
};


interface Incident {
  _id: string;
  incidentType: string;
  isVerified: boolean;
  isResolved: boolean;
  isAccepted: boolean;
  responderCoordinates?: {
    lat: number;
    lon: number;
  };
  incidentDetails?: {
    coordinates?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
}

const MainScreen = () => {
  const location = useLocation();
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  console.log("Logged-in user object from localStorage:", userStr2);
  const userId = userStr2?.id;
  const dispatcherTeamId = userStr2?.team;
  const token = localStorage.getItem("token");

  const user = {
    id: userId,
    name: userStr2?.name
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalIncident, setModalIncident] = useState<string>("");
  const [customIncidentType, setCustomIncidentType] = useState<string>("");
  const [modalIncidentDescription, setModalIncidentDescription] = useState<string>("");
  const [connectingModalOpen, setConnectingModalOpen] = useState(false);
  const [connectingOpCenName, setConnectingOpCenName] = useState<{ firstName: string; lastName: string } | null>(null);
  const [opCenConnectingAt, setOpCenConnectingAt] = useState<Date | null>(null);
  const [selectedOpCen, setSelectedOpCen] = useState<any>(null);
  const [connectionFinalStatus, setConnectionFinalStatus] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [lastUpsertedImages, setLastUpsertedImages] = useState<{[id: string]: string}>({});

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${config.GUARDIAN_SERVER_URL}${url}`;
  };
  const dispatcherAvatarUrl = getImageUrl(userStr2?.profileImage);
  const videoClient = useStreamVideoClient(userId, user.name, token, dispatcherAvatarUrl);

  const {
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
  } = useIncidentData(incidentId, token);

  const incidentLon = coordinates?.coordinates?.[0];
  const incidentLat = coordinates?.coordinates?.[1];
  const chatClient = useStreamChatClient(userId, user, userStr2?.name, token);
  const [onlineUsers, setOnlineUsers] = useState(new Set<string>());
  const { lapsTime, formatLapsTime } = useElapsedTime(acceptedAt);
  const imagesLoaded = useProfileImageUpsert(chatClient, userId, userStr2, userData, volunteerID);
  const { socket: globalSocket, isConnected } = useSocket();
  useOpCenConnectingStatus({
    globalSocket,
    isConnected,
    incidentId: incidentId || '',
    setConnectingModalOpen,
    setOpCenConnectingAt,
    setConnectionFinalStatus, 
  });

  const { 
    responderStatus, 
    showOnSceneNotification, 
    dismissOnSceneNotification, 
    showFinishedNotification,   
    dismissFinishedNotification 
  } = useResponderStatus({
    incidentId,
    token
  });

  useEffect(() => {
    if (globalSocket && isConnected) {
      const handleOnlineUsersUpdate = (usersArray: string[]) => {
        console.log('Received online users update:', usersArray);
        setOnlineUsers(new Set(usersArray));
      };

      // Listen for the broadcast from the server
      globalSocket.on('onlineUsersUpdate', handleOnlineUsersUpdate);

      // Clean up the listener when the component unmounts or the socket disconnects
      return () => {
        globalSocket.off('onlineUsersUpdate', handleOnlineUsersUpdate);
      };
    }
  }, [globalSocket, isConnected]);

  useEffect(() => {
    if (!connectionFinalStatus) return;

    if (connectionFinalStatus.status === 'connected') {
      console.log('OpCen connected. Sending confirmation message.');
      const { incidentType, incident, incidentDescription } = connectionFinalStatus;
      const channelId = `${incidentType.toLowerCase()}-${incidentId?.substring(4, 9)}`;
      if (chatClient) {
        const channel = chatClient.channel('messaging', channelId);
        channel.sendMessage({
          text: `Incident: ${incident || "Not specified"}\nDescription: ${incidentDescription || "No description provided"}`,
          user_id: userId,
        });
      }
    } else if (connectionFinalStatus.status === 'idle') {
      console.log('OpCen declined. Resetting selection.');
      setSelectedOpCen(null);
    }

    setConnectionFinalStatus(null);
  }, [connectionFinalStatus, chatClient, userId, incidentId, setSelectedOpCen]);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentIncidentId = incidentId;
      
      if (currentIncidentId) {
        try {
          const incidentResponse = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/${currentIncidentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!incidentResponse.ok) {
            console.error('Failed to fetch incident:', incidentResponse.status);
            return;
          }
          
          const incidentData = await incidentResponse.json();
          
          let userId;
          if (typeof incidentData.user === 'string') {
            userId = incidentData.user;
          } else if (incidentData.user && incidentData.user._id) {
            userId = incidentData.user._id;
          } else if (incidentData.user && typeof incidentData.user.toString === 'function') {
            userId = incidentData.user.toString();
          }
  
          setVolunteerID(userId);
          
          console.log('User ID extracted:', userId);
  
          if (userId) {
            const userResponse = await fetch(`${config.GUARDIAN_SERVER_URL}/volunteers/${userId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUserData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                profileImage: userData.profileImage
              });
            }
          }
          else {
            console.error('Could not extract valid volunteer ID from incident data', incidentData);
            setUserData({
              firstName: 'Unknown',
              lastName: 'User',
              phone: 'No phone number',
              profileImage: ''
            });
          }
        } catch (error) {
          console.error('Error fetching incident data:', error);
          setUserData({
            firstName: 'Unknown',
            lastName: 'User',
            phone: 'No phone number',
            profileImage: ''
          });
        }
      }
    };
  
    fetchUserData();
  }, [incidentId, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (acceptedAt) {
        const now = new Date();
        const acceptedTime = new Date(acceptedAt);
        const elapsedSeconds = Math.floor((now.getTime() - acceptedTime.getTime()) / 1000);
        // setLapsTime(elapsedSeconds); // This line is removed as per the edit hint
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [acceptedAt]);


  const handleCloseConnectingModal = () => {
    setConnectingModalOpen(false);
    setConnectingOpCenName(null);
    setOpCenConnectingAt(null);
  };

  const handleConnect = (opCenUser: any) => {
    if (!globalSocket || !isConnected) {
      console.error('Socket not connected, cannot send request.');
      return;
    }

    if (!incidentId) {
      console.error('No incident ID available');
      return;
    }
    const connectingTime = new Date();
    setOpCenConnectingAt(connectingTime);
    setConnectingOpCenName({ firstName: opCenUser.firstName, lastName: opCenUser.lastName });
    setConnectingModalOpen(true);
    const incidentTypeToSend = modalIncident === "Other" ? customIncidentType : modalIncident;

    globalSocket.emit('requestOpCenConnect', {
      incidentId: incidentId,
      opCenId: opCenUser._id,
      dispatcherId: userId, // This comes from the authenticated user's state
      connectingTime,
      incidentDetails: {
        coordinates: {
          type: 'Point',
          coordinates: [incidentLon, incidentLat] // [longitude, latitude]
        },
        incident: incidentTypeToSend,
        incidentDescription: modalIncidentDescription || "No description provided"
      }
    });
    setSelectedOpCen(opCenUser);
  };

  const handleLocationClick = () => {
    if (incidentLat && incidentLon) {
      const width = window.screen.width;
      const height = window.screen.height;
      const newWindow = window.open(`/map?incidentId=${incidentId}`, '_blank', `width=${width},height=${height},left=0,top=0`);

      if (newWindow) {
        newWindow.moveTo(0, 0);
        newWindow.resizeTo(screen.availWidth, screen.availHeight);
        newWindow.focus();
      }
    } else {
      console.error('Responder coordinates not available');
    }
  };

  const handleCreateRingCall = useCallback(() => {
    if (!incidentId || !volunteerID) {
      console.error("Missing incidentId or volunteerID, cannot start call");
      return;
    }

    console.log("Opening call window...");

    const url = `/call?id=${incidentId}&volunteer=${volunteerID}`;
    const width = window.screen.width;
    const height = window.screen.height;
    const newWindow = window.open(url, '_blank', `width=${width},height=${height},left=0,top=0`);

    if (newWindow) {
      newWindow.moveTo(0, 0);
      newWindow.resizeTo(screen.availWidth, screen.availHeight);
      newWindow.focus();
    } else {
      console.error("Failed to open new window! Pop-up might be blocked.");
      alert("Failed to open call window. Please check your pop-up blocker.");
    }
  }, [incidentId, volunteerID]);

  if (!user || !chatClient || !userData || !incidentType || !imagesLoaded || !videoClient) {
    return <div>Loading...</div>;
  }

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);
  const getIncidentIcon = (incidentType: string) => {
    const type = incidentType?.toLowerCase() || '';
    switch (type) {
      case 'medical':
      case 'Medical':
        return { icon: medicalIcon };
      case 'fire':
      case 'Fire':
        return { icon: fireIcon };
      case 'police':
      case 'Police':
        return { icon: crimeIcon };
      case 'general':
      case 'General':
      default:
        return { icon: generalIcon };
    }
  };
  const handleVerificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVerificationStatus = event.target.checked;
    setIsUpdating(true);
    try {
      if (!incidentId) {
        console.error('No incident ID available for update');
        return;
      }
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified: newVerificationStatus })
      });
      if (response.status === 500) {
        setIsVerified(newVerificationStatus);
      } else if (!response.ok) {
        setIsVerified(!newVerificationStatus);
        throw new Error('Failed to update incident');
      } else {
        setIsVerified(newVerificationStatus);
      }
    } catch (error) {
      setIsVerified(!newVerificationStatus);
    } finally {
      setIsUpdating(false);
    }
  };
  const handleTemplateSelect = (template: string) => setSelectedTemplate(template);
  const handleSendTemplate = async () => {
    if (!selectedTemplate || !chatClient) return;
    try {
      const channel = chatClient.channel('messaging', currentChannelId);
      await channel.sendMessage({ text: selectedTemplate });
      setSelectedTemplate(null);
    } catch (error) {}
  };
  const handleCloseIncident = async () => {
    if (!incidentId) return;
    try {
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isResolved: true })
      });
      if (response.status === 500 || response.ok) {
        setIsResolved(true);
        navigate('/');
      } else {
        throw new Error('Failed to update incident');
      }
    } catch (error) {
      alert('Failed to close incident. Please try again.');
    }
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
    <StreamVideo client={videoClient}>
      <div className="h-screen bg-[#1B4965] p-5">
      {/* // <div className="h-screen max-h-screen bg-[#1B4965] overflow-hidden"> */}
        <Container disableGutters={true} maxWidth={false} sx={{height: "100%"}}>
        <Grid container spacing={1}>
          <Grid size={{xs: 12}}
          width={"100%"}
          // backgroundColor={"red"} 
          height={"18vh"}
          sx={{ 
            minHeight: '120px', // Added a min-height for very small viewports
          }}>
            <Grid container spacing={{ xs: 1, md: 2 }} height={"100%"} sx={{ flexWrap: 'nowrap' }}>
              <Grid
                sx={{
                  flex: 1, 
                  minWidth: 0, 
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'start',
                  height: '100%',
                  gap: { xs: 1, md: 2 },
                  // backgroundColor: 'green',
                }}
              >

                <div style={{
                  width: 'clamp(3.5rem, 10vw, 6.5rem)',
                  height: 'clamp(3.5rem, 10vw, 6.5rem)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // backgroundColor: 'green',
                }}>
                  <img src={getIncidentIcon(incidentType || 'general').icon}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '100%',
                    border: 'solid white 1px',
                    boxShadow: '0 0 7px 0 white',
                    objectFit: 'contain'
                  }} />
                </div>


                <div style={{
                  color: 'white',
                  width: '75%',
                  // backgroundColor: 'red'
                }}>
                  <Typography sx={{}}>
                    ID: {currentChannelId.toUpperCase()}
                  </Typography>
                  <Typography sx={{fontWeight: "bold"}}>
                    {incidentType ? `${incidentType.toUpperCase()} CALL` : ""}
                  </Typography>
                  {/* <Typography sx={{fontWeight: "bold"}}>
                    {coordinates ? coordinates.lat + " " + coordinates.long : ""}
                  </Typography> */}
                  <Typography sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '350px',
                    // backgroundColor: 'red'
                  }}
                  title={address || "Loading address..."}>
                    {address || "Loading address..."}
                  </Typography>
                  
                </div>
              </Grid>
              <Grid
                sx={{
                  flex: 1, 
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 1, md: 2 },
                  height: '100%',
                  // backgroundColor: 'black',
                }}
              >
                <Avatar src={userData?.profileImage}
                sx={{
                  width: { xs: 60, sm: 80, md: 105 },
                  height: { xs: 60, sm: 80, md: 105 },
                  flexShrink: 0
                }}/>
                <div style={{
                  color: 'white',
                  width: '75%',
                  // backgroundColor: 'red'
                }}>
                {userData && (
                  <div className="text-white">
                    <Typography sx={{ fontWeight: "bold" }} variant="h5">
                      {userData.firstName.toUpperCase()} {userData.lastName.toUpperCase()}
                    </Typography>
                    <Typography sx={{}}>
                      {userData.phone}
                    </Typography>
                    <Typography sx={{}}>
                      GuardianPHOpcen
                    </Typography>
                    <Typography sx={{}}>
                      Angel Rank
                    </Typography>
                    {/* <Typography sx={{ fontWeight: "bold" }}>
                      Current Location: {currentAddress || "Loading location..."}
                    </Typography> */}
                  </div>
                )}
                </div>
              </Grid>
              
              <Grid
                sx={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // backgroundColor: 'red', 
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  // backgroundColor: 'blue',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem' // A static gap between the two rows
                }}>
                  <Box sx={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap', // Allows items to stack on small screens
                    gap: { xs: 1, md: 2 }
                    
                  }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid white',
                        color: 'white',
                        padding: '0.25rem',
                        borderRadius: '0.5rem'
                    }}>
                      <SystemSecurityUpdateWarningIcon
                        sx={{
                          fontSize: { xs: "1.7rem", md: "3rem" },
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <NotificationsActiveIcon
                        sx={{
                          fontSize: { xs: "1.7rem", md: "3rem" },
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                        onClick={handleOpenModal}
                      />
                      <MyLocationIcon
                        onClick={handleLocationClick}
                        sx={{
                          fontSize: { xs: "1.7rem", md: "3rem" },
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <VideoCallIcon
                        onClick={handleCreateRingCall}
                        sx={{
                          fontSize: { xs: "1.7rem", md: "3rem" },
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                      <AddIcCallIcon
                        sx={{
                          fontSize: { xs: "1.7rem", md: "3rem" },
                          border: "solid white 1px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          padding: "4px",
                          transition: "transform 150ms ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                    </div>
                    <Avatar
                      src={getImageUrl(userStr2?.profileImage) || ''}
                      onClick={handleAvatarClick}
                      alt={userStr2?.name || 'User'}
                      sx={{
                        width: { xs: 40, md: 64 },
                        height: { xs: 40, md: 64 },
                        border: '2px solid white',
                      }}
                    />
                    <Menu
                    anchorEl={anchorEl}
                    open={openMenu}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, boxShadow: 3} } }} // Custom Paper styling
        >
                    {/* 1. Header with User Info */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
                src={getImageUrl(userStr2?.profileImage) || undefined}
                sx={{ width: 56, height: 56, mb: 1 }}
            />
            <Typography variant="subtitle1" fontWeight="bold">
              {/* Uses the combined name from localStorage */}
              {userStr2?.name || `${userStr2?.firstName} ${userStr2?.lastName}`} 
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userStr2?.email}
            </Typography>
          </Box>

          <Divider /> {/* Visual separation */}
          
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
            <LogOutIcon/>
            Logout
          </MenuItem>
                    </Menu>
                  </Box>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%',}}>
                    <Paper
                      sx={{
                        backgroundColor: "lightgreen",
                        flex: "1 1 auto",
                        width: "fit-content",
                        maxWidth: '75%',
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingY: "3px",
                        color: 'white'
                      }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={isVerified}
                            onChange={handleVerificationToggle}
                            disabled={ isUpdating}
                          />
                        }
                        label={<Typography sx={{ typography: { xs: 'caption', sm: 'body2' } }}>{isUpdating ? "..." : "Incident Verified"}</Typography>}
                      />
                    </Paper>
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            size={{xs: 12}}
            // backgroundColor={"green"}
            height={"68vh"}
            sx={{border: "12px solid skyblue", borderRadius: "16px"}}>
            <div
              style={{
                height: "100%",
                display: "flex",
                gap: "8px",
                backgroundColor: "skyblue",
              }}>
              <div style={{flex: "3", minWidth: 0}}>
                <Chat client={chatClient} theme="messaging light">
                  <Channel channel={chatClient.channel("messaging", currentChannelId)}>
                    <Window>
                      <MessageList
                        closeReactionSelectorOnClick
                        hideDeletedMessages
                        messageActions={["edit", "delete", "react", "reply"]}
                      />
                      <MessageInput />
                    </Window>
                  </Channel>
                </Chat>
              </div>
              <div
                style={{
                  flex: "1",
                  backgroundColor: "white",
                  
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}>
                  <Box sx={{
                  backgroundColor: '#1B4965',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: "10px",
                  
                  }}>
                    <Typography
                  variant="h6"
                  sx={{textAlign: "center", color: 'white'}}>
                  Message Templates
                </Typography>

                  </Box>
                
                <Divider />
                <div
                  className="flex flex-col gap-3"
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: "16px",
                    marginTop: "16px",
                    padding: "16px",
                  }}>
                  {msgTemplates.map((template, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      onClick={() => handleTemplateSelect(template)}
                      sx={{
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor:
                          selectedTemplate === template ? "#e3f2fd" : "white",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                          transform: "translateX(4px)",
                        },
                      }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "0.9rem",
                          color: "#2c3e50",
                        }}>
                        {template}
                      </Typography>
                    </Paper>
                  ))}
                </div>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!selectedTemplate}
                  onClick={handleSendTemplate}
                  sx={{
                    backgroundColor: "#1B4965",
                    "&:hover": {
                      backgroundColor: "#163d54",
                    },
                  }}>
                  {selectedTemplate ? "Send Template" : "Select a Template"}
                </Button>
              </div>
            </div>
          </Grid>
          
          {/* <Grid size={{xs: 12}}>
            {videoClient && (
              <div style={{ display: 'contents' }}>
                <StreamVideo client={videoClient}>
                  
                  <VideoCallHandler incidentId={incidentId} />
                </StreamVideo>
              </div>
            )}
          </Grid> */}

        <Grid container size={{xs: 12}}
        marginBottom={"0px"}
        paddingLeft={"20px"}
        height={"6vh"}
        sx={{ 
          // backgroundColor: 'red',
        }}>

        <Grid size={{md: 6}}
        sx={{
          display: 'flex',
          // backgroundColor: 'green',
          }}>
            <Grid size={{md:6}}
            sx={{
              display: 'flex',
              gap: '20px'
              }}>
                
              <Typography variant="h6" sx={{ color: 'white' }}>
                RECEIVED:
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {acceptedAt ? new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : "Not Accepted"}
              </Typography>
            </Grid>

            <Grid size={{md:6}}sx={{
              display: 'flex',
              gap: '20px'
              }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                ELAPSED TIME:
              </Typography>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {formatLapsTime(lapsTime)}
              </Typography>
              
            </Grid>
          
          
        </Grid>
        <Grid size={{md: 6}}
        
        alignItems={"center"}
        sx={{ 
          // backgroundColor: 'yellow',
          display: 'flex',
          justifyContent: 'flex-end',
          paddingRight: '20px'
          }}>
          <Button
            onClick={handleCloseIncident}
            variant="contained"
            disabled={isResolved}
            sx={{
            backgroundColor: "#ef5350",
            height: "2.5rem",
            paddingLeft: "3rem",
            paddingRight: "3rem",
            borderRadius: "8px",
            "&:hover": {
            backgroundColor: "darkred",


            },}}
            >
          <Typography 
          color="white"
          sx={{ 
            fontSize: "18px"
          }}
        >
          Close Incident
        </Typography>
          </Button>
        </Grid>
        </Grid>
        </Grid>

      </Container>

      <VideoCallHandler />

      <OpCenConnectModal
        open={openModal}
        onClose={handleCloseModal}
        icon={getIncidentIcon(incidentType || 'general').icon}
        incidentType={incidentType}
        address={address}
        incidentCoordinates={incidentLat && incidentLon ? { lat: incidentLat, lon: incidentLon } : null}
        modalIncident={modalIncident}
        setModalIncident={setModalIncident}
        customIncidentType={customIncidentType}
        setCustomIncidentType={setCustomIncidentType}
        modalIncidentDescription={modalIncidentDescription}
        setModalIncidentDescription={setModalIncidentDescription}
        onlineUsers={onlineUsers}
        dispatcherTeamId={dispatcherTeamId}
        handleConnect={handleConnect}
      />
      
      <ConnectingModal
        open={connectingModalOpen}
        onClose={handleCloseConnectingModal} 
        connectingOpCenName={connectingOpCenName}
      />

      <Snackbar
        open={showOnSceneNotification}
        autoHideDuration={5000}
        onClose={dismissOnSceneNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={dismissOnSceneNotification} 
          severity="success" 
          sx={{ 
            width: '100%',
            backgroundColor: 'rgba(245, 248, 245, 0.8)', // transparent green
          }}
        >
          Responder has arrived on scene!
        </Alert>
      </Snackbar>

      <Snackbar
        open={showFinishedNotification}
        onClose={(event, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          dismissFinishedNotification();
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={dismissFinishedNotification} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          Incident has been closed. Redirecting to the status page in 5 seconds.
        </Alert>
      </Snackbar>
  
      </div>
    </StreamVideo>
  );
};

// const VideoCallHandler = ({ incidentId }: { incidentId: string | undefined }) => {
//   const calls = useCalls();

//   return (
//     <>
//       {calls.map((call) => {
//         // If the incidentId prop isn't ready yet, do nothing.
//         if (!incidentId) {
//           return null;
//         }

//         // Check if the call's ID is the same as the
//         // incidentId from the URL.
//         const isCurrentIncidentCall = call.id === incidentId;

//         // If the call's ID matches, it's the OUTGOING call.
//         // Render NOTHING. This kills the ghost.
//         if (isCurrentIncidentCall) {
//           console.log(`Ignoring current outgoing call (${call.id}) in MainScreen.`);
//           return null;
//         }

//         // If the call's ID is DIFFERENT, it is a true INCOMING call.
//         // Render the "Accept/Decline" UI.
//         console.log(`INCOMING call detected (${call.id}), rendering <StreamCall>`);
//         return (
//           <StreamCall call={call} key={call.cid}>
//             <CallPanel />
//           </StreamCall>
//         );
//       })}
//     </>
//   );
// };

// const VideoCallHandler = () => {
//   const calls = useCalls();
//   const user = useConnectedUser(); // Get the local dispatcher's user info
//   const localUserId = user?.id;

//   // Wait until we have the local user's ID
//   if (!localUserId) {
//     return null;
//   }
  
//   return (
//     <>
//       {calls.map((call) => {
        
//         // Get the creator. This might be null/undefined initially.
//         const creator = call.state.createdBy;

//         // --- THIS IS THE CRITICAL LOGIC ---
//         // We are *explicitly* checking for a true incoming call.
//         // A call is "incoming" if:
//         // 1. A creator exists (it's not in a weird temp state).
//         // 2. The creator's ID is NOT our own.
//         //
//         const isIncomingCall = creator && creator.id !== localUserId;

//         // If it is an incoming call, render the <StreamCall> wrapper
//         // and the <CallPanel> to show the "Accept/Decline" UI.
//         if (isIncomingCall) {
//           console.log(`INCOMING call detected (${call.id}), rendering <StreamCall>`);
//           return (
//             <StreamCall call={call} key={call.cid}>
//               <CallPanel />
//             </StreamCall>
//           );
//         }

//         // If it's our own outgoing call (isIncomingCall is false),
//         // or if the creator is still null (race condition),
//         // we render NOTHING.
//         // This is what kills the ghost.
//         console.log(`Ignoring call (${call.id}) in MainScreen.`);
//         return null;
//       })}
//     </>
//   );
// };
const VideoCallHandler = () => {
  const calls = useCalls();
  const user = useConnectedUser();
  const localUserId = user?.id;

  if (!localUserId) {
    return null;
  }

  return (
    <>
      {calls.map((call) => {
        const creator = call.state.createdBy;
        const isIncomingCall = creator && creator.id !== localUserId;

        if (isIncomingCall) {
          console.log(`INCOMING call detected (${call.id}), rendering <StreamCall>`);
          return (
            <StreamCall call={call} key={call.cid}>
              <CallPanel />
            </StreamCall>
          );
        }

        return null;
      })}
    </>
  );
};

export default MainScreen;
