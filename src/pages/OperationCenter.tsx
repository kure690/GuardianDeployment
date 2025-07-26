import React, { useState, useEffect } from 'react'
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button,
    Box,
    Avatar,
    Container,
    TextField,
    CircularProgress,
    Snackbar,
    Alert,
  } from '@mui/material';
import Grid from "@mui/material/Grid2";
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SearchIcon from '@mui/icons-material/Search';
import { useOpCen } from '../hooks/opcen/useOpCen';
import { getLatLngFromAddress, getAddressFromCoordinates } from '../utils/geocoding';
import axios from 'axios';
import config from '../config';
interface OpCenData {
  firstName: string;
  lastName: string;
  description: string;
  assignment: string;
  dateEstablished: Date;
  telNo: string;
  alternateNo: string;
  mobileNumber: string;
  email: string;
  website: string;
  shortHistory: string;
  profileImage: string;
  coverImage: string;
  markerImage: string;
  address: {
    coordinates: {
      lat: number;
      lng: number;
    }
  };
  socialMedia: {
    facebook: string;
    youtube: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${config.GUARDIAN_SERVER_URL}${url}`;
};

const OperationCenter = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { data: opcenData, isLoading, error, updateMutation } = useOpCen(user.id);
  const [formData, setFormData] = useState<Partial<OpCenData>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [address, setAddress] = useState('');
  const [uploading, setUploading] = useState({ profile: false, cover: false, marker: false });
  const [images, setImages] = useState({
    profile: '',
    cover: '',
    marker: ''
  });

  // Initialize form data and images when opcenData is loaded
  useEffect(() => {
    if (opcenData) {
      setFormData(opcenData);
      setImages({
        profile: opcenData.profileImage || '',
        cover: opcenData.coverImage || '',
        marker: opcenData.markerImage || ''
      });
      // Set address field from lat/lng if available
      if (opcenData.address?.coordinates?.lat && opcenData.address?.coordinates?.lng) {
        const fetchAddress = async () => {
          const addr = await getAddressFromCoordinates(
            opcenData.address.coordinates.lat.toString(),
            opcenData.address.coordinates.lng.toString()
          );
          setAddress(addr);
        };
        fetchAddress();
      }
    }
  }, [opcenData]);

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof OpCenData] as Record<string, string> || {}),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleAddressSearch = async () => {
    if (!address) return;
    const result = await getLatLngFromAddress(address);
    if (result) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          coordinates: {
            lat: result.lat,
            lng: result.lng
          }
        }
      }));
    } else {
      setSnackbar({ open: true, message: 'Address not found', severity: 'error' });
    }
  };

  const handleImageUpload = async (type: 'profile' | 'cover' | 'marker', file: File) => {
    try {
      setUploading(prev => ({ ...prev, [type]: true }));
      const formData = new FormData();
      formData.append(type === 'profile' ? 'profileImage' : type === 'cover' ? 'coverImage' : 'markerImage', file);

      const response = await axios.put(`${config.GUARDIAN_SERVER_URL}/opcens/${user.id}?imageType=${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update the images state with the new image URL
      setImages(prev => ({ ...prev, [type]: response.data[`${type}Image`] }));
      
      // Update formData to include the new image URL
      setFormData(prev => ({
        ...prev,
        [`${type}Image`]: response.data[`${type}Image`]
      }));

      setSnackbar({
        open: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} image uploaded successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to upload ${type} image`,
        severity: 'error'
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleImageChange = (type: 'profile' | 'cover' | 'marker') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(type, file);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">Error loading data</Typography>
      </Box>
    );
  }

  return (
    <div className="max-h-screen bg-white flex flex-col items-start justify-start">
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none'}}>
        <Box sx={{ width: '100%' }}>
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
                Operation Center Profile
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </AppBar>

      <Box sx={{ width: '100%', flex: 1, mt: 4, mb: 4, pl: 4, pr: 4 }}>
        <Grid container spacing={4}>
          {/* Left: Images */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {/* Profile Pic */}
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar 
                src={getImageUrl(images.profile)} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '2px solid #eee',
                  bgcolor: !images.profile ? '#e0e0e0' : 'transparent'
                }} 
              />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-image-upload"
                  type="file"
                  onChange={handleImageChange('profile')}
                  disabled={uploading.profile}
                />
                <label htmlFor="profile-image-upload">
                  <Button 
                    component="span" 
                    sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}
                    disabled={uploading.profile}
                  >
                    {uploading.profile ? <CircularProgress size={24} color="inherit" /> : <PhotoCamera />}
                  </Button>
                </label>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Profile Pic</Typography>
            </Box>

            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar 
                src={getImageUrl(images.cover)} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '2px solid #eee',
                  bgcolor: !images.cover ? '#e0e0e0' : 'transparent'
                }} 
              />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="cover-image-upload"
                  type="file"
                  onChange={handleImageChange('cover')}
                  disabled={uploading.cover}
                />
                <label htmlFor="cover-image-upload">
                  <Button 
                    component="span" 
                    sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}
                    disabled={uploading.cover}
                  >
                    {uploading.cover ? <CircularProgress size={24} color="inherit" /> : <PhotoCamera />}
                  </Button>
                </label>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Cover Photo</Typography>
            </Box>

            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar 
                src={getImageUrl(images.marker)} 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  border: '2px solid #eee', 
                  borderRadius: 0,
                  bgcolor: !images.marker ? '#e0e0e0' : 'transparent'
                }} 
              />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="marker-image-upload"
                  type="file"
                  onChange={handleImageChange('marker')}
                  disabled={uploading.marker}
                />
                <label htmlFor="marker-image-upload">
                  <Button 
                    component="span" 
                    sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}
                    disabled={uploading.marker}
                  >
                    {uploading.marker ? <CircularProgress size={24} color="inherit" /> : <PhotoCamera />}
                  </Button>
                </label>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Marker to appear in Live Map</Typography>
            </Box>
          </Grid>

          {/* Center: Form Fields */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              fullWidth 
              label="First Name" 
              variant="outlined" 
              size="small" 
              value={formData.firstName || ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Last Name" 
              variant="outlined" 
              size="small" 
              value={formData.lastName || ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Description" 
              variant="outlined" 
              size="small" 
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Assignment" 
              variant="outlined" 
              size="small" 
              value={formData.assignment || ''}
              onChange={(e) => handleChange('assignment', e.target.value)}
              select 
              slotProps={{select: {native: true,},}}
              sx={{ bgcolor: 'white', borderRadius: 1 }}
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </TextField>
            <TextField 
              fullWidth 
              label="Date established" 
              variant="outlined" 
              size="small" 
              type="date"
              value={formData.dateEstablished ? new Date(formData.dateEstablished).toISOString().split('T')[0] : ''}
              onChange={(e) => handleChange('dateEstablished', new Date(e.target.value).toISOString())}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Tel. No." 
              variant="outlined" 
              size="small" 
              value={formData.telNo || ''}
              onChange={(e) => handleChange('telNo', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Alternate No." 
              variant="outlined" 
              size="small" 
              value={formData.alternateNo || ''}
              onChange={(e) => handleChange('alternateNo', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Mobile Number" 
              variant="outlined" 
              size="small" 
              value={formData.mobileNumber || ''}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="E-Mail" 
              variant="outlined" 
              size="small" 
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Website" 
              variant="outlined" 
              size="small" 
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Short History" 
              variant="outlined" 
              size="small" 
              multiline 
              minRows={6} 
              value={formData.shortHistory || ''}
              onChange={(e) => handleChange('shortHistory', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
          </Grid>

          {/* Right: Map and Social Links */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ mb: 1 }}>
              <TextField 
                size="small" 
                placeholder="Search" 
                fullWidth 
                InputProps={{ startAdornment: <SearchIcon sx={{ color: '#888', mr: 1 }} /> }} 
                sx={{ background: 'white', borderRadius: 1, mb: 1 }} 
                value={address}
                onChange={handleAddressChange}
                onKeyDown={e => { if (e.key === 'Enter') handleAddressSearch(); }}
              />
              <iframe
                title="map"
                width="100%"
                height="180"
                style={{ border: 0, marginBottom: "1rem"}}
                src={`https://www.google.com/maps?q=${formData.address?.coordinates?.lat || 0},${formData.address?.coordinates?.lng || 0}&z=15&output=embed`}
                allowFullScreen
              ></iframe>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Social Media Links</Typography>
            <TextField 
              fullWidth 
              label="Facebook" 
              variant="outlined" 
              size="small" 
              value={formData.socialMedia?.facebook || ''}
              onChange={(e) => handleChange('socialMedia.facebook', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="YouTube" 
              variant="outlined" 
              size="small" 
              value={formData.socialMedia?.youtube || ''}
              onChange={(e) => handleChange('socialMedia.youtube', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Instagram" 
              variant="outlined" 
              size="small" 
              value={formData.socialMedia?.instagram || ''}
              onChange={(e) => handleChange('socialMedia.instagram', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="Twitter" 
              variant="outlined" 
              size="small" 
              value={formData.socialMedia?.twitter || ''}
              onChange={(e) => handleChange('socialMedia.twitter', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <TextField 
              fullWidth 
              label="LinkedIn" 
              variant="outlined" 
              size="small" 
              value={formData.socialMedia?.linkedin || ''}
              onChange={(e) => handleChange('socialMedia.linkedin', e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 1 }} 
            />
            <Button 
              variant="contained" 
              sx={{ mt: 2, bgcolor: '#1B4965', color: 'white', borderRadius: 1 }}
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </Box>

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
  )
}

export default OperationCenter
