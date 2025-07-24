import React, { useState, useRef, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Paper,
  Alert,
  Snackbar,
  SelectChangeEvent,
  IconButton,
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

interface FormData {
  title: string;
  message: string;
  type: string;
  images: string[];
  affectedArea: string;
  demographics: {
    gender: string;
    workStatus: string;
    civilStatus: string;
    barangay: string;
    fromAge: string;
    toAge: string;
  };
  schedule: {
    sendNow: boolean;
    scheduledDate: Date | null;
  };
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loading
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        // Wait for existing script to load
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
    
    // Define callback
    window.initMap = () => {
      resolve();
    };
    
    script.onerror = (error) => {
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

const Notification = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    message: '',
    type: '',
    images: [],
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

  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);
  const [barangayCoords, setBarangayCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // eslint-disable-next-line
  }, [barangayCoords, formData.affectedArea, map]);

  // Geocode barangay on change
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof FormData] as Record<string, any>;
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
        const parentObj = prev[parent as keyof FormData] as Record<string, any>;
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

  const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sendNow = e.target.value === 'now';
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        sendNow,
        scheduledDate: sendNow ? null : new Date() // Set current date as default when switching to schedule
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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 4 images
      const newFiles = files.slice(0, 4 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...newFiles]);
      
      // Create previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'demographics' || key === 'schedule') {
          submitData.append(key, JSON.stringify(value));
        } else if (key !== 'images') {
          submitData.append(key, value as string);
        }
      });

      // Append images - change the field name to match Multer configuration
      selectedImages.forEach((file, index) => {
        submitData.append('files', file); // Changed from 'images' to 'file'
      });

      // Log the FormData contents for debugging
      console.log('Form Data Contents:');
      for (let pair of submitData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post(
        `${config.PERSONAL_API}/notifications/`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const sendNotif = await axios.post(
        `${config.PERSONAL_API}/notifications/send-to-all`,
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
          console.log(values); // [3, 1337, "foo"]
        });


      // console.log('Server Response:', response.data);

      setSnackbar({
        open: true,
        message: 'Notification created successfully!',
        severity: 'success'
      });
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        type: '',
        images: [],
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
      setSelectedImages([]);
      setImagePreviews([]);
    } catch (err: any) {
      console.error('Error details:', err.response?.data);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating notification',
        severity: 'error'
      });
    }
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none'}}>
        <Container disableGutters={true} maxWidth={false} sx={{}}>
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
                Detailed Notification
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </AppBar>
      
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Left: Image Uploads */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                {imagePreviews.map((preview, index) => (
                  <Paper 
                    key={index} 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={preview} 
                      alt={`preview ${index + 1}`} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
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
                ))}
                {[...Array(4 - imagePreviews.length)].map((_, index) => (
                  <Paper 
                    key={`empty-${index}`} 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      bgcolor: '#f5f5f5',
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img 
                      src="https://placehold.co/60x50" 
                      alt="placeholder" 
                      style={{ opacity: 0.5 }} 
                    />
                  </Paper>
                ))}
              </Box>
              <Button 
                variant="contained" 
                sx={{ bgcolor: '#43a047', color: 'white' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photos
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
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Schedule Notification:</Typography>
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
                    minDate={new Date()} // Prevent selecting past dates
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

            {/* Right: Type, Map, Send */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  <MenuItem value="Awareness">Awareness</MenuItem>
                </Select>
              </FormControl>
              <TextField 
                label="Affected Area (km)" 
                fullWidth 
                size="small"
                name="affectedArea"
                value={formData.affectedArea}
                onChange={handleTextChange}
                type="number"
              />
              {/* <TextField label="Search" fullWidth size="small" sx={{ mt: 1 }} /> */}
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

export default Notification;