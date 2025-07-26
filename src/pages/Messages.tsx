import React, { useState, useRef, useEffect } from 'react'
import {
  AppBar,
  Typography,
  Button,
  Box,
  Container,
  TextField,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from "@mui/material/Grid2";
import axios from 'axios';
import config from '../config';
import { getLatLngFromAddress } from '../utils/geocoding';

declare global {
  interface Window {
    initMap: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogle);
            resolve();
          }
        }, 100);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      resolve();
    };
    
    script.onerror = (error) => {
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

const Messages = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: '',
    image: null as File | null,
    affectedArea: '',
    demographics: {
      gender: '',
      workStatus: '',
      civilStatus: '',
      barangay: '',
      fromAge: '',
      toAge: ''
    },
    schedule: {
      sendNow: true,
      scheduledDate: null as Date | null
    }
  });

  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);
  const [barangayCoords, setBarangayCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY).then(() => {
      if (isMounted && mapRef.current && !map) {
        const gmap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 10.3157, lng: 123.8854 },
          zoom: 13,
        });
        setMap(gmap);
      }
    });
    return () => { isMounted = false; };
  }, [mapRef, map]);

  // Update marker and circle when barangay or affectedArea changes
  useEffect(() => {
    if (!map) return;
    if (barangayCoords) {
      map.setCenter(barangayCoords);
      map.setZoom(15);
      if (marker) marker.setMap(null);
      const newMarker = new window.google.maps.Marker({
        position: barangayCoords,
        map,
        title: 'Barangay',
      });
      setMarker(newMarker);
      // Draw circle
      if (circle) circle.setMap(null);
      const radius = formData.affectedArea ? parseFloat(formData.affectedArea) * 1000 : 0;
      if (radius > 0) {
        const newCircle = new window.google.maps.Circle({
          map,
          center: barangayCoords,
          radius,
          fillColor: '#1976D2',
          fillOpacity: 0.2,
          strokeColor: '#1976D2',
          strokeOpacity: 0.7,
          strokeWeight: 2,
        });
        setCircle(newCircle);
      }
    } else {
      if (marker) marker.setMap(null);
      if (circle) circle.setMap(null);
    }
  }, [barangayCoords, formData.affectedArea, map]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    if (name?.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name as string]: value
      }));
    }
  };

  const handleBarangayChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTextChange(e);
    const value = e.target.value;
    if (!value) {
      setBarangayCoords(null);
      return;
    }
    const coords = await getLatLngFromAddress(value + ', Cebu, Philippines');
    if (coords) {
      setBarangayCoords(coords);
    } else {
      setSnackbar({ open: true, message: 'Barangay not found', severity: 'error' });
      setBarangayCoords(null);
    }
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sendNow = e.target.value === 'now';
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        sendNow,
        scheduledDate: sendNow ? null : new Date()
      }
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        scheduledDate: date
      }
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.title || !formData.message || !formData.type) {
        setSnackbar({
          open: true,
          message: 'Title, message, and type are required',
          severity: 'error'
        });
        return;
      }

      // Create FormData object for multipart/form-data
      const submitData = new FormData();
      
      // Append form fields
      submitData.append('title', formData.title);
      submitData.append('message', formData.message);
      submitData.append('type', formData.type);
      submitData.append('affectedArea', formData.affectedArea);
      submitData.append('demographics', JSON.stringify(formData.demographics));
      submitData.append('schedule', JSON.stringify(formData.schedule));
      
      // Append image if exists
      if (formData.image) {
        submitData.append('file', formData.image);
      }

      const response = await axios.post(
        `${config.GUARDIAN_SERVER_URL}/messages/`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const sendNotif = await axios.post(
        `${config.GUARDIAN_SERVER_URL}/notifications/send-to-all`,
        {
          title: formData.title,
          body: formData.message
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      await Promise.all([response, sendNotif]).then((values) => {
        console.log(values); 
      });

      setSnackbar({
        open: true,
        message: 'Message created successfully!',
        severity: 'success'
      });
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: '',
        image: null,
        affectedArea: '',
        demographics: {
          gender: '',
          workStatus: '',
          civilStatus: '',
          barangay: '',
          fromAge: '',
          toAge: ''
        },
        schedule: {
          sendNow: true,
          scheduledDate: null
        }
      });
      setImagePreview(null);
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating message',
        severity: 'error'
      });
    }
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none'}}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid
              size={{ md: 12 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                p: '1rem 2rem 1rem 2rem'
              }}
            >
              <Typography variant="h6" component="div">
                Messages
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </AppBar>
      
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Left: Image Upload */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {imagePreview ? (
                  <Paper 
                    sx={{ 
                      width: 240, 
                      height: 240, 
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={imagePreview} 
                      alt="preview" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ) : (
                  <Paper 
                    sx={{ 
                      width: 240, 
                      height: 240, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      bgcolor: '#f5f5f5',
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img 
                      src="https://placehold.co/120x100" 
                      alt="placeholder" 
                      style={{ opacity: 0.5 }} 
                    />
                  </Paper>
                )}
              </Box>
              <Button 
                variant="contained" 
                sx={{ bgcolor: '#43a047', color: 'white' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </Button>
            </Grid>

            {/* Center: Main Form */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                label="Title" 
                fullWidth 
                size="small" 
                name="title"
                value={formData.title}
                onChange={handleTextChange}
                required
              />
              <TextField 
                label="Message" 
                fullWidth 
                size="small" 
                multiline 
                minRows={7}
                name="message"
                value={formData.message}
                onChange={handleTextChange}
                required
              />
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select 
                  label="Type" 
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  required
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Commercial">Commercial</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>Demographics:</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select 
                    label="Gender" 
                    name="demographics.gender"
                    value={formData.demographics.gender}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Work Status</InputLabel>
                  <Select 
                    label="Work Status" 
                    name="demographics.workStatus"
                    value={formData.demographics.workStatus}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="Employed">Employed</MenuItem>
                    <MenuItem value="Unemployed">Unemployed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Civil Status</InputLabel>
                  <Select 
                    label="Civil Status" 
                    name="demographics.civilStatus"
                    value={formData.demographics.civilStatus}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  label="Barangay" 
                  fullWidth 
                  size="small"
                  name="demographics.barangay"
                  value={formData.demographics.barangay}
                  onChange={handleBarangayChange}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  label="From Age" 
                  fullWidth 
                  size="small" 
                  type="number"
                  name="demographics.fromAge"
                  value={formData.demographics.fromAge}
                  onChange={handleTextChange}
                />
                <TextField 
                  label="To Age" 
                  fullWidth 
                  size="small" 
                  type="number"
                  name="demographics.toAge"
                  value={formData.demographics.toAge}
                  onChange={handleTextChange}
                />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Schedule Message:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl>
                  <RadioGroup 
                    row 
                    value={formData.schedule.sendNow ? 'now' : 'schedule'} 
                    onChange={handleScheduleChange}
                  >
                    <FormControlLabel value="now" control={<Radio />} label="Send Now" />
                    <FormControlLabel value="schedule" control={<Radio />} label="Schedule" />
                  </RadioGroup>
                </FormControl>
                {!formData.schedule.sendNow && (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Schedule Date"
                      value={formData.schedule.scheduledDate}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      slotProps={{
                        textField: {
                          size: "small",
                          required: true
                        }
                      }}
                    />
                  </LocalizationProvider>
                )}
              </Box>
            </Grid>

            {/* Right: Map and Affected Area */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                label="Affected Area (km)" 
                fullWidth 
                size="small"
                name="affectedArea"
                value={formData.affectedArea}
                onChange={handleTextChange}
                type="number"
              />
              <Box sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', mb: 2 }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
              </Box>
              <Button 
                type="submit"
                variant="contained" 
                sx={{ bgcolor: '#43a047', color: 'white', width: '100%' }}
              >
                Send
              </Button>
            </Grid>
          </Grid>
        </form>
      </Container>

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
    </div>
  );
};

export default Messages; 