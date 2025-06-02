import React, { useEffect, useState } from 'react';
import {
    AppBar,
    Typography,
    Button,
    Box,
    Avatar,
    Container,
    Paper,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { getAddressFromCoordinates } from '../utils/geocoding';

const Facilities = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<string | null>(null);
  const [addressMap, setAddressMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${config.PERSONAL_API}/facilities/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setFacilities(res.data);
        // Fetch addresses for each facility
        res.data.forEach(async (facility: any) => {
          const coords = facility.location?.coordinates;
          if (coords && coords.lat && coords.lng) {
            const addr = await getAddressFromCoordinates(coords.lat.toString(), coords.lng.toString());
            setAddressMap(prev => ({ ...prev, [facility._id]: addr }));
          }
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Error fetching facilities',
          severity: 'error'
        });
        setFacilities([]);
      }
      setLoading(false);
    };
    fetchFacilities();
  }, []);

  const handleDeleteClick = (id: string) => {
    setFacilityToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!facilityToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.PERSONAL_API}/facilities/${facilityToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSnackbar({
        open: true,
        message: 'Facility deleted successfully',
        severity: 'success'
      });
      // Refresh the list
      const res = await axios.get(`${config.PERSONAL_API}/facilities/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFacilities(res.data);
      // Re-fetch addresses
      res.data.forEach(async (facility: any) => {
        const coords = facility.location?.coordinates;
        if (coords && coords.lat && coords.lng) {
          const addr = await getAddressFromCoordinates(coords.lat.toString(), coords.lng.toString());
          setAddressMap(prev => ({ ...prev, [facility._id]: addr }));
        }
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error deleting facility',
        severity: 'error'
      });
    }
    setDeleteConfirmOpen(false);
    setFacilityToDelete(null);
  };

  const handleManageClick = (facility: any) => {
    navigate(`/add-facilities?id=${facility._id}`);
  };

  return (
    <div>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Manage your facilities
              </Typography>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end', p: '1rem 2rem 1rem 2rem' }}>
              <div style={{ display: 'flex', width: '80%' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <SearchIcon style={{ position: 'absolute', left: '8px', color: '#757575', fontSize: '20px' }} />
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      flex: 1,
                      color: 'black',
                      height: '38px',
                      padding: '8px 12px 8px 36px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      backgroundColor: 'white',
                      fontSize: '1.1rem',
                    }}
                  />
                </div>
              </div>
            </Grid>
          </Grid>
        </Container>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header Row */}
        <Box sx={{ maxWidth: 1500, mx: 'auto', mb: 2 }}>
          <Box sx={{ display: 'flex', background: '#e5e8ea', borderRadius: 1, p: 0.5, alignItems: 'center', border: '1.5px solid #d1d3d4' }}>
            <Box sx={{ flex: '0 0 10%', fontWeight: 700, fontSize: 18, textAlign: 'center', py: 1, borderRight: '2px solid #d1d3d4' }}>Photo</Box>
            <Box sx={{ flex: '0 0 15%', fontWeight: 700, fontSize: 18, textAlign: 'center', py: 1, borderRight: '2px solid #d1d3d4' }}>Name/Call Sign</Box>
            <Box sx={{ flex: '0 0 20%', fontWeight: 700, fontSize: 18, textAlign: 'center', py: 1, borderRight: '2px solid #d1d3d4' }}>Contact Persons</Box>
            <Box sx={{ flex: '0 0 18%', fontWeight: 700, fontSize: 18, textAlign: 'center', py: 1, borderRight: '2px solid #d1d3d4' }}>Contact Numbers</Box>
            <Box sx={{ flex: '0 0 25%', fontWeight: 700, fontSize: 18, textAlign: 'center', py: 1, borderRight: '2px solid #d1d3d4' }}>Address</Box>
            <Box sx={{ flex: '0 0 10%', fontWeight: 700, fontSize: 18, textAlign: 'center', py: 1 }}>Actions</Box>
          </Box>
        </Box>
        {/* Facility Rows */}
        <Box sx={{ maxWidth: 1500, mx: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>
          ) : (
            facilities.map((facility, idx) => (
              <Paper key={facility._id || idx} elevation={0} sx={{ display: 'flex', alignItems: 'center', borderRadius: 2, border: '2px solid #e0e0e0', mb: 3, px: 2, py: 2, minHeight: 100, boxShadow: 0 }}>
                {/* Photo */}
                <Box sx={{ flex: '0 0 10%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar variant="rounded" sx={{ width: 70, height: 70, bgcolor: '#e0e0e0', border: '1.5px solid #bdbdbd' }} src={facility.photos && facility.photos[0]} />
                </Box>
                {/* Name/Call Sign */}
                <Box sx={{ flex: '0 0 15%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 20, textAlign: 'center', wordBreak: 'break-word' }}>{facility.name}</Typography>
                </Box>
                {/* Contact Persons */}
                <Box sx={{ flex: '0 0 20%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                  <Box sx={{ width: '100%', background: '#ededed', borderRadius: 1, px: 2, py: 1, minHeight: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    {facility.contactPersons?.map((person: any, i: number) => (
                      <Typography key={i} sx={{ fontSize: 16 }}>{person.title} {person.firstName} {person.lastName}</Typography>
                    ))}
                  </Box>
                </Box>
                {/* Contact Numbers */}
                <Box sx={{ flex: '0 0 18%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1 }}>
                  <Box sx={{ width: '100%', borderRadius: 1, px: 2, py: 1, minHeight: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    {facility.contactPersons?.map((person: any, i: number) => (
                      <Typography key={i} sx={{ fontWeight: 700, fontSize: 18 }}>{person.mobileNumber}</Typography>
                    ))}
                  </Box>
                </Box>
                {/* Address */}
                <Box sx={{ flex: '0 0 25%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 1, mr: 2 }}>
                  <Box sx={{ width: '100%', background: '#ededed', borderRadius: 1, px: 2, py: 1, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 14, textAlign: 'left', wordBreak: 'break-word' }}>{addressMap[facility._id] || ''}</Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Grid size={{ md: 1.6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }}
                    onClick={() => handleManageClick(facility)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }}
                    onClick={() => handleDeleteClick(facility._id)}
                  >
                    Delete
                  </Button>
                </Grid>


                
              </Paper>
            ))
          )}
        </Box>
      </Container>
      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Tooltip title="Add Facility">
          <IconButton color="primary" sx={{ bgcolor: '#78909c', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, '&:hover': { bgcolor: '#607d8b' } }} onClick={() => navigate('/add-facilities')}>
            <AddIcon sx={{ fontSize: 56, color: 'white' }} />
          </IconButton>
        </Tooltip>
      </Box>
      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontSize: 24, fontWeight: 500, p: 3, pb: 1 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Typography>
            Are you sure you want to delete this facility? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 1 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }}
            onClick={() => setDeleteConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }}
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
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

export default Facilities;