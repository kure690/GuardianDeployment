import React, { useState } from 'react'
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
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import axios from 'axios';
import config from '../config';

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
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        sendNow: e.target.value === 'now'
      }
    }));
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

      const response = await axios.post(
        `${config.PERSONAL_API}/notifications/`,
        formData
      );

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
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating notification',
        severity: 'error'
      });
    }
  };

  return (
    <div>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                {[1,2,3,4].map(i => (
                  <Paper key={i} sx={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                    <img src="https://via.placeholder.com/60x50?text=+" alt="placeholder" style={{ opacity: 0.5 }} />
                  </Paper>
                ))}
              </Box>
              <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white' }}>Upload Photos</Button>
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
                  onChange={handleTextChange}
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
                  <RadioGroup row value={formData.schedule.sendNow ? 'now' : 'schedule'} onChange={handleScheduleChange}>
                    <FormControlLabel value="now" control={<Radio />} label="Send Now" />
                    <FormControlLabel value="schedule" control={<Radio />} label="" />
                  </RadioGroup>
                </FormControl>
                <Paper sx={{ width: 180, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                  Calendar
                </Paper>
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
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Commercial</InputLabel>
                <Select label="Commercial" defaultValue="">
                  <MenuItem value="">Default</MenuItem>
                  <MenuItem value="Default Image">Default Image</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Default Image</InputLabel>
                <Select label="Default Image" defaultValue="">
                  <MenuItem value="">Default Image</MenuItem>
                </Select>
              </FormControl>
              <TextField 
                label="Affected Area" 
                fullWidth 
                size="small"
                name="affectedArea"
                value={formData.affectedArea}
                onChange={handleTextChange}
              />
              <TextField label="Search" fullWidth size="small" sx={{ mt: 1 }} />
              <Box sx={{ width: '100%', height: 180, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', mb: 2 }}>
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.838377964839!2d123.8854373153607!3d10.31569989262639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9991f1b1b1b1b%3A0x1b1b1b1b1b1b1b1b!2sCebu!5e0!3m2!1sen!2sph!4v1680000000000!5m2!1sen!2sph"
                  allowFullScreen
                ></iframe>
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