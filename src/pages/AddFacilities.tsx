import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Typography,
  Button,
  Box,
  Avatar,
  Container,
  Paper,
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import config from '../config';
import { getLatLngFromAddress, getAddressFromCoordinates } from '../utils/geocoding';
import { useLocation, useNavigate } from 'react-router-dom';

const initialContact = {
  title: '',
  firstName: '',
  lastName: '',
  position: '',
  landline: '',
  mobileNumber: '',
  alternatePhone: ''
};

type ContactPerson = typeof initialContact;

const initialFacility = {
  name: '',
  description: '',
  photos: [],
  marker: '',
  assignment: '',
  telNo: '',
  alternatePhone: '',
  email: '',
  location: {
    coordinates: {
      lat: 0,
      lng: 0
    }
  },
  contactPersons: []
};

const AddFacilities = () => {
  const [formData, setFormData] = useState(initialFacility);
  const [contactPerson, setContactPerson] = useState<ContactPerson>(initialContact);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [address, setAddress] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactPerson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSelectChange = (e: any) => {
    const { name, value } = e.target;
    setContactPerson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddContact = () => {
    if (!contactPerson.title || !contactPerson.firstName || !contactPerson.lastName || !contactPerson.position || !contactPerson.mobileNumber) {
      setSnackbar({ open: true, message: 'Please fill in all required contact fields', severity: 'error' });
      return;
    }
    setContactPersons(prev => [...prev, contactPerson]);
    setContactPerson(initialContact);
  };

  const handleRemoveContact = (idx: number) => {
    setContactPersons(prev => prev.filter((_, i) => i !== idx));
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
        location: {
          ...prev.location,
          coordinates: {
            lat: Number(result.lat),
            lng: Number(result.lng)
          }
        }
      }));
    } else {
      setSnackbar({ open: true, message: 'Address not found', severity: 'error' });
    }
  };

  useEffect(() => {
    if (isEditMode && formData.photos && formData.photos.length > 0) {
      setImagePreviews(formData.photos);
    }
  }, [isEditMode, formData.photos]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = files.slice(0, 4 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...newFiles]);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setIsEditMode(true);
      setFacilityId(id);
      const fetchFacility = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/facilities/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const data = res.data;
          setFormData({
            ...initialFacility,
            ...data,
            location: data.location || initialFacility.location,
            contactPersons: data.contactPersons || [],
            photos: data.photos || [],
          });
          setContactPersons(data.contactPersons || []);
          if (data.location?.coordinates?.lat && data.location?.coordinates?.lng) {
            const addr = await getAddressFromCoordinates(
              data.location.coordinates.lat.toString(),
              data.location.coordinates.lng.toString()
            );
            setAddress(addr);
          }
        } catch (err) {
          setSnackbar({ open: true, message: 'Error loading facility', severity: 'error' });
        }
      };
      fetchFacility();
    }
  }, [location.search]);

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.assignment || !formData.telNo || !formData.location.coordinates.lat || !formData.location.coordinates.lng) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'location' || key === 'contactPersons') {
          payload.append(key, JSON.stringify(value));
        } else if (Array.isArray(value) && value.length === 0) {
        } else if (typeof value === 'string' && value.trim() === '') {
        } else if (value !== undefined && value !== null) {
          payload.append(key, value as any);
        }
      });
      payload.set('contactPersons', JSON.stringify(contactPersons));
      if (selectedImages.length > 0) {
        selectedImages.forEach((file) => {
          payload.append('files', file);
        });
      }
      if (isEditMode && selectedImages.length === 0 && imagePreviews.length > 0) {
        payload.append('existingPhotos', JSON.stringify(imagePreviews));
      }
      if (isEditMode && facilityId) {
        await axios.put(`${config.GUARDIAN_SERVER_URL}/facilities/${facilityId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        });
        setSnackbar({ open: true, message: 'Facility updated successfully', severity: 'success' });
        navigate('/facilities');
      } else {
        await axios.post(`${config.GUARDIAN_SERVER_URL}/facilities/`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        });
        setSnackbar({ open: true, message: 'Facility created successfully', severity: 'success' });
        setFormData(initialFacility);
        setContactPersons([]);
        setAddress('');
        setSelectedImages([]);
        setImagePreviews([]);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error creating facility', severity: 'error' });
    }
  };

  return (
    <div>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Add Facility
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, background: '#f7f7f7' }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
                      sx={{ width: 90, height: 90, position: 'relative', overflow: 'hidden' }}
                    >
                      <img
                        src={preview}
                        alt={`preview ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                  {[...Array(4 - imagePreviews.length)].map((_, index) => (
                    <Paper
                      key={`empty-${index}`}
                      sx={{ width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img src="https://placehold.co/60x50" alt="placeholder" style={{ opacity: 0.5 }} />
                    </Paper>
                  ))}
                </Box>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#43a047', color: 'white', width: '80%', fontWeight: 600, mb: 2 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Photos
                </Button>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                  <Avatar variant="rounded" sx={{ width: 90, height: 90, bgcolor: '#e0e0e0', border: '1px solid #bdbdbd' }} />
                  <Typography variant="caption" sx={{ mt: 1, color: '#222' }}>Marker to appear in Live Map</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Name / Callsign" 
                  size="small" 
                  fullWidth 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <TextField 
                  label="Description" 
                  size="small" 
                  fullWidth 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                <FormControl size="small" fullWidth required>
                  <InputLabel>Assignment</InputLabel>
                  <Select 
                    label="Assignment" 
                    name="assignment"
                    value={formData.assignment}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Fire">Fire</MenuItem>
                    <MenuItem value="Police">Police</MenuItem>
                    <MenuItem value="Medical">Medical</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  label="Tel. No." 
                  size="small" 
                  fullWidth 
                  name="telNo"
                  value={formData.telNo}
                  onChange={handleChange}
                  required
                />
                <TextField 
                  label="Alternate No." 
                  size="small" 
                  fullWidth 
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                />
                <TextField 
                  label="E-Mail" 
                  size="small" 
                  fullWidth 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <TextField 
                  label="Facility location" 
                  size="small" 
                  fullWidth 
                  name="facilityLocation"
                  value={address}
                  onChange={handleAddressChange}
                  onBlur={handleAddressSearch}
                  sx={{ mb: 1 }}
                />
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
                    src={`https://www.google.com/maps?q=${formData.location.coordinates.lat},${formData.location.coordinates.lng}&z=15&output=embed`}
                    allowFullScreen
                  ></iframe>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 1 }}>Add Contact Person:</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ width: '30%' }}>
                    <InputLabel>Title</InputLabel>
                    <Select
                      label="Title"
                      name="title"
                      value={contactPerson.title}
                      onChange={handleContactSelectChange}
                    >
                      <MenuItem value="Mr">Mr</MenuItem>
                      <MenuItem value="Mrs">Mrs</MenuItem>
                      <MenuItem value="Ms">Ms</MenuItem>
                      <MenuItem value="Dr">Dr</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField size="small" label="First Name" name="firstName" value={contactPerson.firstName} onChange={handleContactChange} sx={{ width: '35%' }} />
                  <TextField size="small" label="Last Name" name="lastName" value={contactPerson.lastName} onChange={handleContactChange} sx={{ width: '35%' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" label="Position" name="position" value={contactPerson.position} onChange={handleContactChange} sx={{ width: '50%' }} />
                  <TextField size="small" label="Land Line" name="landline" value={contactPerson.landline} onChange={handleContactChange} sx={{ width: '50%' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" label="Mobile Number" name="mobileNumber" value={contactPerson.mobileNumber} onChange={handleContactChange} sx={{ width: '50%' }} />
                  <TextField size="small" label="Alternate Mobile" name="alternatePhone" value={contactPerson.alternatePhone} onChange={handleContactChange} sx={{ width: '50%' }} />
                </Box>
                <Button 
                  variant="contained" 
                  sx={{ bgcolor: '#43a047', color: 'white', borderRadius: 1, textTransform: 'none', fontWeight: 600, width: '100%' }}
                  onClick={handleAddContact}
                >
                  Add
                </Button>
                <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 1, mt: 2 }}>Contacts</Typography>
                <Paper sx={{ background: '#45788c', color: 'white', borderRadius: 1, mb: 1, p: 0, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', p: 1, fontWeight: 600, fontSize: 16 }}>
                    <Box sx={{ flex: 2 }}>Name</Box>
                    <Box sx={{ flex: 2 }}>Position</Box>
                    <Box sx={{ flex: 2 }}>Mobile</Box>
                    <Box sx={{ flex: 0.5 }}></Box>
                  </Box>
                </Paper>
                <Paper sx={{ background: '#f7f7f7', borderRadius: 1, mb: 1, p: 0, overflow: 'hidden' }}>
                  {contactPersons.map((person: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: idx < contactPersons.length - 1 ? '1px solid #e0e0e0' : 'none', p: 1 }}>
                      <Box sx={{ flex: 2 }}>{person.title} {person.firstName} {person.lastName}</Box>
                      <Box sx={{ flex: 2 }}>{person.position}</Box>
                      <Box sx={{ flex: 2 }}>{person.mobileNumber}</Box>
                      <Box sx={{ flex: 0.5 }}>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveContact(idx)} sx={{ color: '#e53935' }}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Paper>
                <Button 
                  variant="contained" 
                  sx={{ bgcolor: '#43a047', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 18, fontWeight: 600, mt: 'auto', py: 1 }}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
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

export default AddFacilities;