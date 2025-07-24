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
  StreamVideo,
  StreamCall,
  CallingState,
  StreamVideoClient,
  useCallStateHooks,
  useCalls,
  Call
} from "@stream-io/video-react-sdk";


import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import config from "../config";
import msgTemplates from "../utils/MsgTemplates";
import { CallPanel } from "../components/CallPanel";
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
      lat: number;
      lon: number;
    };
  };
}

const MainScreen = () => {
  const location = useLocation();
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const userStr2 = userStr ? JSON.parse(userStr) : null;
  const userId = userStr2?.id;
  const token = localStorage.getItem("token");

  const user = {
    id: userId,
    name: userStr2?.name
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("");
  const [isRinging, setIsRinging] = useState(false);
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

  const chatClient = useStreamChatClient(userId, user, userStr2?.name, token);
  const videoClient = useStreamVideoClient(userId, userStr2?.firstName + ' ' + userStr2?.lastName, token, avatarImg);
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
          const incidentResponse = await fetch(`${config.PERSONAL_API}/incidents/${currentIncidentId}`, {
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
            const userResponse = await fetch(`${config.PERSONAL_API}/volunteers/${userId}`);
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
        coordinates: { lat: Number(coordinates.lat), lon: Number(coordinates.long) },
        incident: incidentTypeToSend,
        incidentDescription: modalIncidentDescription || "No description provided"
      }
    });
    setSelectedOpCen(opCenUser);
  };

  const handleLocationClick = () => {
    if (coordinates.lat && coordinates.long && responderCoordinates) {
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

  const handleCreateRingCall = async () => {
    if (!videoClient || !volunteerID) {
      console.error("Video client not initialized or no volunteer ID available");
        return;
      }
      try {
      setIsRinging(true);
      const callId = `call-${Date.now()}`;
      const newCall = videoClient.call("default", callId);
      if (chatClient && volunteerID && userData?.profileImage) {
        try {
          await chatClient.upsertUser({
            id: volunteerID,
            image: userData.profileImage,
          });
      } catch (e) {
        }
      }
      await newCall.getOrCreate({
        ring: true,
        data: {
          members: [
            { user_id: userId },
            { user_id: volunteerID },
            // { user_id: "686e7d7211e2af2a6f9be5aa" },
          ],
          settings_override: {
            ring: {
              incoming_call_timeout_ms: 30000,
              auto_cancel_timeout_ms: 30000
            }
          }
        }
      });
    } catch (error) {
    } finally {
      setIsRinging(false);
    }
  };

  if (!user || !chatClient || !userData || !incidentType || !imagesLoaded) {
    return <div>Loading chat...</div>;
  }

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${config.PERSONAL_API}${url}`;
  };
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
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${incidentId}`, {
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
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${incidentId}`, {
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
    <div className="h-screen bg-[#1B4965] p-5">
    {/* // <div className="h-screen max-h-screen bg-[#1B4965] overflow-hidden"> */}
      <Container disableGutters={true} maxWidth={false} sx={{height: "100%"}}>
        <Grid container spacing={1}>
          <Grid size={{xs: 12}}
          width={"100%"}
          // backgroundColor={"red"} 
          height={"18vh"}>
            <Grid container spacing={8}>
              <Grid
                size={{md: 4}}
                display={"flex"}
                flexDirection={"row"}
                alignItems={"center"}
                gap={"1rem"}>

                <img src={getIncidentIcon(incidentType || 'general').icon}
                style={{
                  width: '6.5rem',
                  height: '6.5rem',
                  borderRadius: '100%',
                  border: 'solid white 1px',
                  boxShadow: '0 0 7px 0 white'
                  }} />


                <div className="text-white">
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
                    maxWidth: '250px',
                    // backgroundColor: 'red'
                  }}
                  title={address || "Loading address..."}>
                    {address || "Loading address..."}
                  </Typography>
                  
                </div>
              </Grid>
              <Grid
                size={{md: 4}}
                display={"flex"}
                flexDirection={"row"}
                alignItems={"center"}
                gap={"1rem"}>
                <Avatar src={userData?.profileImage} sx={{width: 105, height: 105}}/>
                <div className="text-white">
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
              
              <Grid size={{md: 4}}>
                <div className="flex flex-col gap-4 justify-center">
                  <div className="flex flex-row items-center gap-6">
                    <div className="flex flex-row items-center gap-3 border text-white p-1 rounded-lg">
                      <SystemSecurityUpdateWarningIcon
                        sx={{
                          fontSize: "3rem",
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
                          fontSize: "3rem",
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
                          fontSize: "3rem",
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
                          fontSize: "3rem",
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
                          fontSize: "3rem",
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
                      alt={userStr2?.name || 'User'}
                      sx={{
                        width: 64,
                        height: 64,
                        border: '2px solid white',
                        boxSizing: 'border-box',
                        backgroundColor: '#eee',
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
                  </div>
                  <div className="flex flex-row items-center gap-6">
                    <Paper
                      sx={{
                        backgroundColor: "lightgreen",
                        flex: "1 1 auto",
                        width: "fit-content",
                        display: "flex",
                        justifyContent: "center",
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
                        label={isUpdating ? "Updating..." : "Incident Verified"}
                      />
                    </Paper>
                    <div style={{width: "4rem"}}></div>
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
          
          <Grid size={{xs: 12}}
          >
            {videoClient && (
              <div style={{ display: 'contents' }}>
                <StreamVideo client={videoClient}>
                  <VideoCallHandler />
                </StreamVideo>
              </div>
            )}
          </Grid>

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
      <OpCenConnectModal
        open={openModal}
        onClose={handleCloseModal}
        icon={getIncidentIcon(incidentType || 'general').icon}
        incidentType={incidentType}
        address={address}
        modalIncident={modalIncident}
        setModalIncident={setModalIncident}
        customIncidentType={customIncidentType}
        setCustomIncidentType={setCustomIncidentType}
        modalIncidentDescription={modalIncidentDescription}
        setModalIncidentDescription={setModalIncidentDescription}
        handleConnect={handleConnect}
      />
      
      <ConnectingModal
        open={connectingModalOpen}
        onClose={handleCloseConnectingModal} 
        connectingOpCenName={connectingOpCenName}
      />
  
    </div>
  );
};

const VideoCallHandler = () => {
  const calls = useCalls();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (calls.length > 0) {
      console.log("Active calls:", calls.length);
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


export default MainScreen;
