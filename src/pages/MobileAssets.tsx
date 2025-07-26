import React, { useEffect, useState } from 'react'
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
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormLabel
  } from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

const MobileAssets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [opcenMap, setOpcenMap] = useState<Record<string, any>>({});
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    assignment: '',
    maker: '',
    yearModel: '',
    petrolType: '',
    baseAssignment: ''
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/mobile-assets/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAssets(res.data);
        
        // Fetch OpCen details for each asset
        const opcenIds = res.data
          .map((asset: any) => {
            // Handle both string ID and object cases
            if (typeof asset.baseAssignment === 'string') {
              return asset.baseAssignment;
            } else if (asset.baseAssignment && asset.baseAssignment._id) {
              return asset.baseAssignment._id;
            }
            return null;
          })
          .filter((id: string | null) => id);
        
        if (opcenIds.length > 0) {
          const opcenPromises = opcenIds.map((id: string) => 
            axios.get(`${config.GUARDIAN_SERVER_URL}/opcens/${id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
          );
          
          const opcenResponses = await Promise.all(opcenPromises);
          const opcenData = opcenResponses.reduce((acc: Record<string, any>, response) => {
            acc[response.data._id] = response.data;
            return acc;
          }, {});
          
          setOpcenMap(opcenData);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Error fetching mobile assets',
          severity: 'error'
        });
        setAssets([]);
      }
      setLoading(false);
    };
    fetchAssets();
  }, []);

  const handleDeleteClick = (id: string) => {
    setAssetToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.GUARDIAN_SERVER_URL}/mobile-assets/${assetToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSnackbar({
        open: true,
        message: 'Mobile asset deleted successfully',
        severity: 'success'
      });
      // Refresh the list
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/mobile-assets/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAssets(res.data);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error deleting mobile asset',
        severity: 'error'
      });
    }
    setDeleteConfirmOpen(false);
    setAssetToDelete(null);
  };

  const handleEditClick = (asset: any) => {
    setEditingAsset(asset);
    setEditFormData({
      name: asset.name || '',
      description: asset.description || '',
      assignment: asset.assignment || '',
      maker: asset.maker || '',
      yearModel: asset.yearModel || '',
      petrolType: asset.petrolType || '',
      baseAssignment: typeof asset.baseAssignment === 'string' 
        ? asset.baseAssignment 
        : asset.baseAssignment?._id || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingAsset) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${config.GUARDIAN_SERVER_URL}/mobile-assets/${editingAsset._id}`, editFormData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSnackbar({
        open: true,
        message: 'Mobile asset updated successfully',
        severity: 'success'
      });
      // Refresh the list
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/mobile-assets/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAssets(res.data);
      setEditModalOpen(false);
      setEditingAsset(null);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error updating mobile asset',
        severity: 'error'
      });
    }
  };

  return (
    <div>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Manage Mobile Assets
              </Typography>
            </Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
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
      {/* Table header and rows */}
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ background: '#fff', borderRadius: 2, p: 3, boxShadow: 0, border: 'none' }}>
          {/* Header */}
          <Grid container sx={{ borderBottom: '2px solid #bdbdbd', background: '#e0e4e6', p: 1, borderRadius: 1 }}>
            <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Photo</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Name/Call Sign</Grid>
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Assignment</Grid>
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Base Assignment</Grid>
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Teams</Grid>
            <Grid size={{ md: 1.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', }}>Actions</Grid>
          </Grid>
          {/* Rows */}
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>
          ) : (
            assets.map((asset, idx) => (
              <Grid container key={asset._id || idx} sx={{ background: 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '2px solid #e0e0e0', alignItems: 'center', p: 1.5, minHeight: 70 }}>
                <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#f2f2f2', border: '1px solid #e0e0e0' }} src={asset.photo} />
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 22 }}>{asset.name}</span>
                </Grid>
                <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ededed', borderRadius: 1, minHeight: 40 }}>
                  <span style={{ fontSize: 18 }}>{asset.assignment}</span>
                </Grid>
                <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, minHeight: 40 }}>
                  <span style={{ fontSize: 18 }}>
                    {asset.baseAssignment 
                      ? (typeof asset.baseAssignment === 'string'
                        ? (opcenMap[asset.baseAssignment] 
                          ? `${opcenMap[asset.baseAssignment].firstName} ${opcenMap[asset.baseAssignment].lastName}`
                          : 'N/A')
                        : (asset.baseAssignment.firstName && asset.baseAssignment.lastName
                          ? `${asset.baseAssignment.firstName} ${asset.baseAssignment.lastName}`
                          : 'N/A'))
                      : 'N/A'}
                  </span>
                </Grid>
                <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ededed', borderRadius: 1, minHeight: 40, mr: 2 }}>
                  <span style={{ fontSize: 18 }}>
                    {asset.teams?.map((team: any) => team.teamName).join(', ') || 'No teams assigned'}
                  </span>
                </Grid>
                <Grid size={{ md: 1.6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }}
                    onClick={() => handleEditClick(asset)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }}
                    onClick={() => handleDeleteClick(asset._id)}
                  >
                    Delete
                  </Button>
                </Grid>
              </Grid>
            ))
          )}
        </Box>
      </Container>
      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Tooltip title="Add Asset">
          <IconButton color="primary" sx={{ bgcolor: '#78909c', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, '&:hover': { bgcolor: '#607d8b' } }} onClick={() => navigate('/add-mobile-assets')}>
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
            Are you sure you want to delete this mobile asset? This action cannot be undone.
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

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Edit Mobile Asset</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <FormLabel sx={{ fontWeight: 700, fontSize: 18, color: '#222' }}>Asset Information</FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, mt: 2 }}>
            <TextField
              label="Name / Callsign"
              variant="outlined"
              size="small"
              fullWidth
              value={editFormData.name}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              label="Description"
              variant="outlined"
              size="small"
              fullWidth
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Assignment</InputLabel>
              <Select
                value={editFormData.assignment}
                label="Assignment"
                onChange={(e) => setEditFormData(prev => ({ ...prev, assignment: e.target.value }))}
                required
              >
                <MenuItem value="Fire">Fire</MenuItem>
                <MenuItem value="Police">Police</MenuItem>
                <MenuItem value="Medical">Medical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Maker"
              variant="outlined"
              size="small"
              fullWidth
              value={editFormData.maker}
              onChange={(e) => setEditFormData(prev => ({ ...prev, maker: e.target.value }))}
              required
            />
            <TextField
              label="Year Model"
              variant="outlined"
              size="small"
              fullWidth
              value={editFormData.yearModel}
              onChange={(e) => setEditFormData(prev => ({ ...prev, yearModel: e.target.value }))}
              required
            />
            <TextField
              label="Petrol Type"
              variant="outlined"
              size="small"
              fullWidth
              value={editFormData.petrolType}
              onChange={(e) => setEditFormData(prev => ({ ...prev, petrolType: e.target.value }))}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Base Assignment</InputLabel>
              <Select
                value={editFormData.baseAssignment}
                label="Base Assignment"
                onChange={(e) => setEditFormData(prev => ({ ...prev, baseAssignment: e.target.value }))}
                required
              >
                {Object.values(opcenMap).map((opcen: any) => (
                  <MenuItem key={opcen._id} value={opcen._id}>
                    {opcen.firstName} {opcen.lastName} - {opcen.assignment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 0 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} 
            onClick={() => setEditModalOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }}
            onClick={handleEditSubmit}
          >
            Save Changes
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
  )
}

export default MobileAssets
