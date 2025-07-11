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
  Modal,
  Box,
  TextField,
  Menu,
  MenuItem
} from "@mui/material";
import avatarImg from "../assets/images/user.png";
import Icon from "../assets/images/Medical.png";
import SystemSecurityUpdateWarningIcon from "@mui/icons-material/SystemSecurityUpdateWarning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {useState, useEffect, useCallback} from "react";
import {StreamChat} from "stream-chat";
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
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
import { useReliableSocketEmit } from "../hooks/useReliableSocketEmit";


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

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>("");
  const [isRinging, setIsRinging] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [coordinates, setcoordinates] = useState<{ lat: string; long: string }>({ lat: "", long: "" });
  const [volunteerID, setVolunteerID] = useState<string>("");
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; phone: string; profileImage: string } | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [lapsTime, setLapsTime] = useState(0);
  const [opCenUsers, setOpCenUsers] = useState<any[]>([]);
  const [selectedOpCen, setSelectedOpCen] = useState<any>(null);
  const [modalIncident, setModalIncident] = useState<string>("");
  const [customIncidentType, setCustomIncidentType] = useState<string>("");
  const [modalIncidentDescription, setModalIncidentDescription] = useState<string>("");
  const [connectingModalOpen, setConnectingModalOpen] = useState(false);
  const [connectingOpCenName, setConnectingOpCenName] = useState<{ firstName: string; lastName: string } | null>(null);
  const [opCenConnectingAt, setOpCenConnectingAt] = useState<Date | null>(null);
  const [address, setAddress] = useState<string>('');
  const [responderCoordinates, setResponderCoordinates] = useState<{lat: number; lon: number} | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [lastUpsertedImages, setLastUpsertedImages] = useState<{[id: string]: string}>({});
  
  const { socket: globalSocket, isConnected } = useSocket();
  const reliableEmit = useReliableSocketEmit();

  

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
        return {
          icon: medicalIcon
        };
      case 'fire':
      case 'Fire':
        return {
          icon: fireIcon
        };
      case 'police':
      case 'Police':
        return {
          icon: crimeIcon
        };
      case 'general':
      case 'General':
      default:
        return {
          icon: generalIcon
        };
    }
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !chatClient) return;

    try {
      const channel = chatClient.channel("messaging", currentChannelId);
      await channel.sendMessage({
        text: selectedTemplate,
      });
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error sending message:", error);
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

      console.log('Updating verification status for incident:', incidentId);
      
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isVerified: newVerificationStatus
        })
      });

      if (response.status === 500) {
        console.log('Update completed but population failed - proceeding with flow');
        setIsVerified(newVerificationStatus);
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update Error Response:', errorData);
        setIsVerified(!newVerificationStatus);
        throw new Error(errorData.message || `Failed to update incident: ${response.status}`);
      } else {
        setIsVerified(newVerificationStatus);
      }
    } catch (error) {
      setIsVerified(!newVerificationStatus);
      console.error('Error updating incident:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseIncident = async () => {
    if (!incidentId) {
      console.error('No incident ID available for closing');
      return;
    }
    
    try {
      const response = await fetch(`${config.PERSONAL_API}/incidents/update/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isResolved: true
        })
      });

      if (response.status === 500) {
        console.log('Update completed but population failed - proceeding with flow');
        setIsResolved(true);
        navigate("/");
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update Error Response:', errorData);
        throw new Error(errorData.message || `Failed to update incident: ${response.status}`);
      } else {
        setIsResolved(true);
        navigate("/");
      }
    } catch (error) {
      console.error('Error closing incident:', error);
      alert('Failed to close incident. Please try again.');
    }
  };

  const fetchIncidentData = async () => {
    if (!incidentId) return;

    try {
      const response = await fetch(`${config.PERSONAL_API}/incidents/${incidentId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched incident data:', data);
        
        setIsResolved(data.isResolved);
        setAcceptedAt(data.acceptedAt);
        setIsVerified(data.isVerified);
        setIncidentType(data.incidentType);
        setCurrentChannelId(data.channelId || `${data.incidentType.toLowerCase()}-${incidentId.substring(5,9)}`);
        
        if (data.incidentDetails?.coordinates) {
          setcoordinates({
            lat: data.incidentDetails.coordinates.lat.toString(),
            long: data.incidentDetails.coordinates.lon.toString()
          });
          
          const formattedAddress = await getAddressFromCoordinates(
            data.incidentDetails.coordinates.lat.toString(),
            data.incidentDetails.coordinates.lon.toString()
          );
          setAddress(formattedAddress);
        }

        setResponderCoordinates(data.responderCoordinates || null);
        if (data.user) {
          let userId = typeof data.user === 'string' ? data.user : data.user._id;
          setVolunteerID(userId);
          
          const userResponse = await fetch(`${config.PERSONAL_API}/volunteers/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('Volunteer data fetched:', userData);
            
            setUserData({
              firstName: userData.firstName || 'Unknown',
              lastName: userData.lastName || 'User',
              phone: userData.phone || 'No phone number',
              profileImage: userData.profileImage || ''
            });
          } else if (userResponse.status === 404) {
            console.log('Volunteer not found, setting default values');
            setUserData({
              firstName: 'Unknown',
              lastName: 'User',
              phone: 'No phone number',
              profileImage: ''
            });
          } else {
            console.error('Failed to fetch volunteer:', userResponse.status);
            setUserData({
              firstName: 'Unknown',
              lastName: 'User',
              phone: 'No phone number',
              profileImage: ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching incident data:', error);
    }
  };

  useEffect(() => {
    if (globalSocket && userId && incidentId) {
        // Create an async function to fetch the opCenId and then rejoin
        const rejoinIncident = async () => {
            try {
                console.log('Dispatcher attempting to rejoin incident:', incidentId);
                const token = localStorage.getItem("token");

                const response = await fetch(`${config.PERSONAL_API}/incidents/${incidentId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch incident data for rejoin: ${response.status}`);
                }

                const incident = await response.json();
                // The 'opCen' field in the incident holds the ID we need
                const activeOpCenId = incident.opCen;

                if (activeOpCenId) {
                    console.log(`Found OpCen ID (${activeOpCenId}), rejoining room...`);
                    globalSocket.emit('dispatcherRejoin', {
                        incidentId: incidentId,
                        dispatcherId: userId,
                        opCenId: activeOpCenId,
                    });
                } else {
                    // This is normal if the incident is not yet connected to an OpCen
                    console.log('No active OpCen found for this incident, no rejoin needed.');
                }
            } catch (error) {
                console.error('Error during dispatcher rejoin attempt:', error);
            }
        };

        // Execute the async function
        rejoinIncident();
    }
}, [globalSocket, userId, incidentId, token]);

  useEffect(() => {
    if (!incidentId) {
      console.log('MainScreen Component - No Incident ID received');
      return;
    }
    
    console.log('MainScreen Component - Received Incident ID:', incidentId);
    fetchIncidentData();
  }, [incidentId]);

  useEffect(() => {
    const initChatClient = async () => {
      const chat = new StreamChat(config.STREAM_APIKEY);
      await chat.connectUser(
        {
          id: userId,
          image: user,
          name: userStr2?.name
        },
        token
      );
      setChatClient(chat);
    };

    if (userId && !chatClient) {
      initChatClient();
      console.log(token);
      console.log(userId);
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
            name: userStr2?.firstName + " " + userStr2?.lastName,
            image: avatarImg,
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


  const handleCreateRingCall = async () => {
    if (!videoClient || !volunteerID) {
      console.error("Video client not initialized or no volunteer ID available");
      return;
    }
    
    try {
      setIsRinging(true);
      console.log("Creating new ring call with user ID:", userId);
      console.log("Calling volunteer ID:", volunteerID);
      console.log("Video client state:", videoClient.state);
      
      const callId = `call-${Date.now()}`;
      console.log("Creating call with ID:", callId);
      
      const newCall = videoClient.call("default", callId);
      console.log("New call created with ID:", newCall.id);
      
      // Update the callee's user object in Stream to include the profile image before making the call
      if (chatClient && volunteerID && userData?.profileImage) {
        try {
          await chatClient.upsertUser({
            id: volunteerID,
            image: userData.profileImage,
          });
        } catch (e) {
          console.warn('Failed to upsert callee user image in Stream:', e);
        }
      }
      await newCall.getOrCreate({
        ring: true,
        data: {
          members: [
            { user_id: userId },
            { user_id: volunteerID }
            // { user_id: "68387f94be8626b569038fb3" },
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
  }


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
        setLapsTime(elapsedSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [acceptedAt]);

  useEffect(() => {
    if (opCenConnectingAt === null) {
      setConnectingModalOpen(false);
      setConnectingOpCenName(null);
    }
  }, [opCenConnectingAt]);

  const handleCloseConnectingModal = () => {
    setConnectingModalOpen(false);
    setConnectingOpCenName(null);
    setOpCenConnectingAt(null);
  };
  const formatLapsTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const fetchOpCenUsers = async () => {
    try {
      const response = await fetch(`${config.PERSONAL_API}/dispatchers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // setOpCenUsers(data || []);
        // // Filter users to only those with dispatcherType === 'LGU'
        const filtered = (data || []).filter((user: any) => user.dispatcherType === 'LGU');
        setOpCenUsers(filtered);
      } else if (response.status === 404) {
        // If no opCen users found, set empty array
        setOpCenUsers([]);
        console.log('No opCen users found');
      } else {
        console.error('Failed to fetch opCen users:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setOpCenUsers([]);
      }
    } catch (error) {
      console.error('Error fetching opCen users:', error);
      setOpCenUsers([]);
    }
  };

  useEffect(() => {
    fetchOpCenUsers();
  }, []);

  const handleConnect = (opCenUser: any) => {
    const id = location.state?.incident?._id || incidentId;
    if (!id) {
      console.error('No incident ID available');
      return;
    }
    const connectingTime = new Date();
    setOpCenConnectingAt(connectingTime);
    setConnectingOpCenName({ firstName: opCenUser.firstName, lastName: opCenUser.lastName });
    setConnectingModalOpen(true);
    const incidentTypeToSend = modalIncident === "Other" ? customIncidentType : modalIncident;
    // Emit socket event to request opcen connection, now with dispatcherId
    reliableEmit('requestOpCenConnect', {
      incidentId: id,
      opCenId: opCenUser._id,
      dispatcherId: userId, // <-- include dispatcherId
      connectingTime,
      incidentDetails: {
        coordinates: {
          lat: Number(coordinates.lat),
          lon: Number(coordinates.long)
        },
        incident: incidentTypeToSend,
        incidentDescription: modalIncidentDescription || "No description provided"
      }
    });
    setSelectedOpCen(opCenUser);
  };

  useEffect(() => {
    // Listen for opcen-connecting-status updates from server
    const handleStatus = (data: any) => {
      if (!incidentId) return;
      if (data.incidentId !== incidentId) return;
      if (data.status === 'connected') {
        const channelId = `${data.incidentType.toLowerCase()}-${incidentId.substring(4,9)}`;
        if (chatClient) {
          const channel = chatClient.channel('messaging', channelId);
          channel.sendMessage({
            text: `Incident: ${data.incident || "Not specified"}\nDescription: ${data.incidentDescription || "No description provided"}`,
            user_id: userId
          });
        }
        setOpCenConnectingAt(null);
        setConnectingModalOpen(false); // Always close modal on connected
        setConnectingOpCenName(null);
        setOpenModal(false);
      } else if (data.status === 'idle') {
        setOpCenConnectingAt(null);
        setConnectingModalOpen(false); // Always close modal on idle
        setConnectingOpCenName(null);
        setSelectedOpCen(null);
      } else if (data.status === 'connecting') {
        setConnectingModalOpen(true); // Only open modal if status is connecting
      }
    };
    if (globalSocket && isConnected) {
      globalSocket.on('opcen-connecting-status', handleStatus);
      return () => {
        globalSocket.off('opcen-connecting-status', handleStatus);
      };
    }
    return;
  }, [incidentId, chatClient, userId, globalSocket, isConnected]);


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

  useEffect(() => {
    const loadProfileImages = async () => {
      if (!chatClient || !userId || !userStr2 || !userData || !volunteerID) return;

      const updates: any[] = [];
      if (lastUpsertedImages[userId] !== (userStr2.profileImage || '')) {
        updates.push({ id: userId, image: userStr2.profileImage || '' });
      }
      if (lastUpsertedImages[volunteerID] !== (userData.profileImage || '')) {
        updates.push({ id: volunteerID, image: userData.profileImage || '' });
      }
      if (updates.length === 0) {
        setImagesLoaded(true);
        return;
      }
      try {
        for (const user of updates) {
          await chatClient.upsertUser(user);
        }
        setLastUpsertedImages((prev) => ({
          ...prev,
          ...Object.fromEntries(updates.map(u => [u.id, u.image]))
        }));
        setImagesLoaded(true);
      } catch (e) {
        console.warn('Failed to upsert user images in Stream:', e);
        setImagesLoaded(true); // Allow to proceed even if upsert fails
      }
    };
    loadProfileImages();
    // Only rerun if the images actually change
  }, [chatClient, userId, userStr2?.profileImage, userData?.profileImage, volunteerID]);

  // Register dispatcher on socket connect
  useEffect(() => {
    if (globalSocket && userId) {
      globalSocket.emit('registerDispatcher', { dispatcherId: userId });
    }
  }, [globalSocket, userId]);

  if (!user || !chatClient || !userData || !incidentType || !imagesLoaded) {
    return <div>Loading chat...</div>;
  }

  const handleCloseModal = () => setOpenModal(false);
  const handleOpenModal = () => setOpenModal(true);

  const { icon } = getIncidentIcon(incidentType || 'general');

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

                <img src={icon}
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
        {/* {videoClient && (
          <div style={{ 
            position: 'fixed', 
            bottom: 10, 
            right: 10, 
            backgroundColor: 'green', 
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000 
          }}>
            Video Client Connected
          </div>
        )} */}

        
        

      </Container>

     


      
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="incident-modal"
        aria-describedby="incident-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-80px',
        }}
      >
      <Paper 
        elevation={3}
        sx={{
        boxShadow: 24,
        p: 0,
        borderRadius: 2,
        width: '60%',
        background: '#1e4976',
      
      }}>
      
      <Box
  sx={{
    background: '#ef5350',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between', 
    padding: '10px',
    marginTop: '15px' 
  }}>
  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', margin: '0 auto' }}>
    CONNECT TO OPERATION CENTER
  </Typography>
  
  <IconButton 
    onClick={handleCloseModal}
    sx={{ 
      color: 'white',
      padding: '2px',
      border: '2px solid white', 
      borderRadius: '50%',
      '& .MuiSvgIcon-root': { 
        fontSize: '18px', 
      }
    }}
    aria-label="close"
    size="small"
  >
    <CloseIcon />
  </IconButton>
  
</Box>
      <Box
        sx={{
          background: '#1e4976',
          p: '5px 0 5px 0',
          display: 'flex',
          height: '100%',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <Box 
          sx={{ 
          width: '50%',
          borderRight: '1px solid white',
          padding: 3,
          boxSizing: 'border-box'
        }}
        >
        <div style={{
        display: 'flex',
        gap: '9px',
        }}>
        <div>
        <Avatar 
          src={icon}
          sx={{ width: 80, height: 80 }}
          alt={Icon}
        />
        </div>
        <div style={{
        padding: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        flexDirection: 'column',
        }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          {incidentType ? `${incidentType.toUpperCase()} CALL` : ""}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold',
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
        padding: '15px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
        }}>
        <Typography variant="h6" sx={{ color: '#ef5350', fontWeight: 'bold' }}>
          {incidentType?.toLowerCase() === 'medical' ? 'NEED AMBULANCE' :
          incidentType?.toLowerCase() === 'fire' ? 'NEED FIRETRUCK' :
          incidentType?.toLowerCase() === 'police' ? 'NEED POLICE CAR' :
          'NEED ASSISTANCE'}
        </Typography>
        </div>
        <div>
        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
          Type
        </Typography>
        {modalIncident === 'Other' ? (
          <TextField
            fullWidth
            placeholder="Enter custom incident type"
            value={customIncidentType}
            onChange={(e) => setCustomIncidentType(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ 
              mb: 1,
              backgroundColor: 'white',
              borderRadius: 1,
            }}
          />
        ) : (
          <TextField
            select
            fullWidth
            value={modalIncident}
            onChange={(e) => {
              console.log("Selected incident type:", e.target.value);
              setModalIncident(e.target.value);
            }}
            variant="outlined"
            size="small"
            sx={{ 
              mb: 1,
              backgroundColor: 'white',
              borderRadius: 1,
            }}
            SelectProps={{
              native: true,
            }}
          >
            {incidentType?.toLowerCase() === 'medical' ? (
              <>
                <option value="Vehicular crash">Vehicular crash</option>
                <option value="Workplace injury">Workplace injury</option>
                <option value="Fall/slip">Fall/slip</option>
                <option value="Allergic reaction">Allergic reaction</option>
                <option value="Sudden illness">Sudden illness</option>
                <option value="Other">Other (specify)</option>
              </>
            ) : incidentType?.toLowerCase() === 'fire' ? (
              <>
                <option value="Structure fire">Structure fire</option>
                <option value="Wildland fire">Wildland fire</option>
                <option value="Hazardous materials release">Hazardous materials release</option>
                <option value="Gas leak">Gas leak</option>
                <option value="Electrical malfunction">Electrical malfunction</option>
                <option value="Other">Other (specify)</option>
              </>
            ) : incidentType?.toLowerCase() === 'police' ? (
              <>
                <option value="Suspected robbery">Suspected robbery</option>
                <option value="Domestic disturbance">Domestic disturbance</option>
                <option value="Trespassing">Trespassing</option>
                <option value="Traffic violation">Traffic violation</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Other">Other (specify)</option>
              </>
            ) : (
              <>
                <option value="Utility outage">Utility outage</option>
                <option value="Flooding">Flooding</option>
                <option value="Downed trees/power lines">Downed trees/power lines</option>
                <option value="Public disturbance">Public disturbance</option>
                <option value="Lost person">Lost person</option>
                <option value="Other">Other (specify)</option>
              </>
            )}
          </TextField>
        )}
        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
          Message
        </Typography>
        <TextField
          multiline
          rows={3}
          fullWidth
          value={modalIncidentDescription}
          onChange={(e) => setModalIncidentDescription(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ 
            backgroundColor: 'white',
            borderRadius: 1,
          }}
        />
        </div>

        
        </Box>
        <Box 
  sx={{ 
    flex: 1,
    borderLeft: '1px solid white',
    p: 2,
  }}
>
  <div style={{background: '#f5f5f5', padding: '10px', borderRadius: '6px'}}>
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Available Operation Center</Typography>
    
    <div style={{display: 'flex', marginBottom: '10px'}}>
      <input type="text" placeholder="Search" style={{flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc'}} />
      <button style={{marginLeft: '8px', padding: '6px 10px', background: '#1e5a71', color: 'white', border: 'none', borderRadius: '4px'}}>Search</button>
    </div>
    
    <div style={{maxHeight: '200px', overflowY: 'auto'}}>
      {opCenUsers.length > 0 ? (
        opCenUsers.map((user) => (
          <div key={user._id} style={{display: 'flex', alignItems: 'center', padding: '6px', borderBottom: '1px solid #eee', marginBottom: '3px'}}>
            <div style={{flex: 1}}>
              <div style={{fontSize: '14px'}}>{user.firstName} {user.lastName}</div>
            </div>
            <div style={{marginRight: '10px', textAlign: 'right'}}>
              <div style={{fontSize: '12px'}}>13 Min</div>
              <div style={{fontSize: '12px'}}>2.3 KM</div>
            </div>
            <button 
              onClick={() => handleConnect(user)}
              style={{padding: '4px 8px', background: '#1e5a71', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px'}}
            >
              Connect
            </button>
          </div>
        ))
      ) : (
        <div style={{
          textAlign: 'center', 
          padding: '20px', 
          color: '#666', 
          fontSize: '14px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          margin: '10px'
        }}>
          No Operation Centers are currently available
        </div>
      )}
    </div>
    
    <div style={{textAlign: 'center', marginTop: '6px'}}>
      <button style={{background: 'none', border: 'none', color: '#1e5a71', fontSize: '14px'}}>More</button>
    </div>
  </div>
</Box>
      </Box>
      </Paper>
      

      




      </Modal>
      
      <Modal
        open={connectingModalOpen}
        onClose={handleCloseConnectingModal} 
        aria-labelledby="connecting-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          bgcolor: 'transparent',  
          backdropFilter: 'none',  
          boxShadow: 'none',       
          '& .MuiBackdrop-root': {
            backgroundColor: 'transparent',
            opacity: 0            
          }
        }}
      >
        <div style={{
          backgroundColor: "rgba(220, 53, 69, 0.4)",
          width: '100%',
          height: 'fit-content',
          borderTop: '1px solid white',
          borderBottom: '1px solid white',
        }}
        >
        <Paper 
          elevation={3} 
          sx={{ 
            width: '550px',
            margin: '0 auto',
            overflow: 'hidden',
            padding: 0
          }}
        >
          <div style={{ 
            backgroundColor: "#1e4976", 
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                CONNECTING...
              </Typography>
            </div>
          </div>
          <div style={{ 
            backgroundColor: "#ffffff", 
            padding: '14px 40px 14px 40px', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
              {connectingOpCenName && (
                <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold', mb: 3 }}>
                  {connectingOpCenName.firstName} {connectingOpCenName.lastName} Command Center
                </Typography>
              )}
          </div>
          <div style={{ 
            backgroundColor: "#1e4976", 
            padding: '24px', 
            display: 'flex', 
            justifyContent: 'center',
            gap: '16px'
          }}>
          </div>
        </Paper>

        </div>
        
      </Modal>
  
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
