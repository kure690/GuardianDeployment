import { User } from "@stream-io/video-react-sdk";
import { Paper, Avatar, Typography, Box, Button, MenuItem, Menu, Divider } from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { useChatContext } from 'stream-chat-react';
import { useState, useEffect, useRef } from 'react';
import policeSound from '../assets/sounds/police.mp3';
import fireSound from '../assets/sounds/fire.mp3';
import ambulanceSound from '../assets/sounds/ambulance.mp3';
import generalSound from '../assets/sounds/general.mp3';
import config from "../config";
// Updated import to include the new helper function
import { getAddressFromGeoPoint } from '../utils/geocoding';
import IncidentModal from '../components/IncidentModal';
import axios from 'axios';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import { EditIcon, LogOutIcon } from "lucide-react";

// --- THIS IS THE FIRST FIX ---
// The Incident interface now matches the new GeoJSON format from the database
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
    incident?: string | null;
    incidentDescription?: string | null;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
}

interface DispatcherProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string | null;
}

export default function Status() {
  const userStr = localStorage.getItem("user");
  const initialUserData = userStr ? JSON.parse(userStr) : null;
  const { client } = useChatContext();
  const navigate = useNavigate();
  const [isInvisible, setIsInvisible] = useState(true);
  const [openModal, setOpenModal] = useState(true);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [address, setAddress] = useState<string>('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<DispatcherProfile>({ 
      firstName: initialUserData?.firstName || '',
      lastName: initialUserData?.lastName || '',
      email: initialUserData?.email || '',
      phone: initialUserData?.phone || '',
      profileImage: initialUserData?.profileImage || null,
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const userId = initialUserData?.id;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userName = initialUserData?.name;
  const openMenu = Boolean(anchorEl);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${config.GUARDIAN_SERVER_URL}${url}`;
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(getImageUrl(initialUserData?.profileImage) || null);

  if (!initialUserData) {
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

        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/for-dispatcher`, {
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
          
          // --- THIS IS THE SECOND FIX ---
          // Use the new helper to get the address from the GeoJSON point
          const formattedAddress = await getAddressFromGeoPoint(relevantIncident.incidentDetails?.coordinates);
          setAddress(formattedAddress);

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
              case 'general':
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
  }, [currentIncident, isInvisible, userId]);

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
      
      const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents/update/${currentIncident._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok && response.status !== 500) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update Error Response:', errorData);
        throw new Error(errorData.message || `Failed to update incident: ${response.status}`);
      }

      try {
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

  const handleEditProfileOpen = () => {
    // Reset form data to current local storage data
    const currentData = JSON.parse(localStorage.getItem("user") || "{}");
    setProfileData({
      // Use currentData for all fields
      firstName: currentData.firstName || '',
      lastName: currentData.lastName || '',
      email: currentData.email || '',
      phone: currentData.phone || '',
      profileImage: currentData.profileImage || null,
  });
    // Set initial preview URL
    setPreviewUrl(getImageUrl(currentData.profileImage) || null);
    
    setSelectedFile(null); 
    setAnchorEl(null); 
    setEditProfileOpen(true);
  };

  const handleEditProfileClose = () => {
    setEditProfileOpen(false);
    setSelectedFile(null);
    // You might want to revoke the blob URL here if a file was selected but not saved
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

        if (file.size > MAX_FILE_SIZE) {
            setSnackbar({ open: true, message: 'File is too large. Maximum size is 10 MB.', severity: 'error' });
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        // Clean up old preview URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async () => {
    try {
        const token = localStorage.getItem('token');
        const data = new FormData();
        
        // Append all text fields
        data.append('firstName', profileData.firstName);
        data.append('lastName', profileData.lastName);
        data.append('email', profileData.email);
        data.append('phone', profileData.phone);
        
        // Append file if a new one was selected
        if (selectedFile) {
            data.append('profileImage', selectedFile);
        }

        const response = await axios.put(`${config.GUARDIAN_SERVER_URL}/dispatchers/${userId}`, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        const updatedUser = response.data;
        
        // Update local storage with new data
        localStorage.setItem("user", JSON.stringify({...initialUserData, ...updatedUser}));
        
        setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        handleEditProfileClose();
        // Force component refresh to show new name/image
        window.location.reload(); 

    } catch (error: any) {
        console.error('Error updating profile:', error);
        setSnackbar({ 
            open: true, 
            message: error.response?.data?.message || 'Error updating profile.', 
            severity: 'error' 
        });
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
    <>
      <audio ref={audioRef} />
      <div className="min-h-screen bg-[#e3e5e8] flex items-center justify-center">
        <Avatar 
          src={getImageUrl(initialUserData?.profileImage) || ''}
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
          slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, boxShadow: 3} } }} // Custom Paper styling
        >
          
          {/* 1. Header with User Info */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
                src={getImageUrl(initialUserData?.profileImage) || undefined}
                sx={{ width: 56, height: 56, mb: 1 }}
            />
            <Typography variant="subtitle1" fontWeight="bold">
              {/* Uses the combined name from localStorage */}
              {initialUserData?.name || `${initialUserData?.firstName} ${initialUserData?.lastName}`} 
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {initialUserData?.email}
            </Typography>
          </Box>

          <Divider /> {/* Visual separation */}

          {/* 2. Action Buttons with Icons */}
          <MenuItem onClick={handleEditProfileOpen} sx={{ py: 1.5 }}>
            <EditIcon/>
            Edit Profile
          </MenuItem>
          
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
            <LogOutIcon/>
            Logout
          </MenuItem>
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
      <Dialog open={editProfileOpen} onClose={handleEditProfileClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1B4965', color: 'white', fontSize: 24 }}>Edit Your Profile</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
            
            <Typography variant="h6" gutterBottom>Profile Picture</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Avatar 
                    src={previewUrl || undefined}
                    sx={{ width: 80, height: 80, bgcolor: '#f0f0f0' }} 
                />
                <Button variant="outlined" component="label">
                    Upload New Image
                    <input
                        type="file"
                        hidden
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                    />
                </Button>
            </Box>

            <Typography variant="h6" gutterBottom>Personal Info</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                    label="First Name" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                />
                <TextField 
                    label="Last Name" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                />
                <TextField 
                    label="Email" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled // Often, email is not easily editable
                />
                <TextField 
                    label="Mobile Number" 
                    variant="outlined" 
                    size="small" 
                    fullWidth 
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleEditProfileClose} 
            color="secondary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProfileSubmit} 
            variant="contained" 
            sx={{ bgcolor: '#29516a' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      {/* +++ END PROFILE EDITING MODAL +++ */}

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

      {/* Snackbar for error/success messages */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}