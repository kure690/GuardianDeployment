import React, { useState, useEffect } from 'react'
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button,
    Box,
    useMediaQuery,
    useTheme,
    Avatar,
    Container,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Snackbar,
    Alert,
    SelectChangeEvent,
  } from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import axios from 'axios';
import config from '../config';

const ManageUsers = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState<any>(null);
  const [passwordType, setPasswordType] = useState('create');
  const [askChange, setAskChange] = useState(true);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    assignment: '',
    status: 'active',
    requirePasswordChange: false
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    assignment: '',
    status: 'active'
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResponders, setFilteredResponders] = useState([]);

  useEffect(() => {
    fetchResponders();
  }, []);

  useEffect(() => {
    if (responders.length > 0) {
      const filtered = responders.filter((responder: any) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          responder.firstName.toLowerCase().includes(searchLower) ||
          responder.lastName.toLowerCase().includes(searchLower) ||
          responder.email.toLowerCase().includes(searchLower) ||
          responder.phone.toLowerCase().includes(searchLower) ||
          responder.assignment.toLowerCase().includes(searchLower)
        );
      });
      setFilteredResponders(filtered);
    }
  }, [searchQuery, responders]);

  const fetchResponders = async () => {
    try {
      const response = await axios.get(`${config.PERSONAL_API}/responders/`);
      setResponders(response.data);
      setLoading(false);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: 'Error fetching responders',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${config.PERSONAL_API}/responders/${id}`);
      setSnackbar({
        open: true,
        message: 'Responder deleted successfully',
        severity: 'success'
      });
      fetchResponders(); // Refresh the list
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error deleting responder',
        severity: 'error'
      });
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      assignment: '',
      status: 'active',
      requirePasswordChange: false
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.email || !formData.password) {
        setSnackbar({
          open: true,
          message: 'Email and password are required',
          severity: 'error'
        });
        return;
      }

      const submitData = {
        ...formData,
        requirePasswordChange: passwordType === 'auto'
      };

      await axios.post(`${config.PERSONAL_API}/responders/`, submitData);
      setSnackbar({
        open: true,
        message: 'Responder created successfully',
        severity: 'success'
      });
      handleClose();
      fetchResponders(); // Refresh the list
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error creating responder',
        severity: 'error'
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEditOpen = (responder: any) => {
    setSelectedResponder(responder);
    setEditFormData({
      firstName: responder.firstName,
      lastName: responder.lastName,
      email: responder.email,
      phone: responder.phone,
      assignment: responder.assignment,
      status: responder.status
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedResponder(null);
  };

  const handleDeleteConfirmOpen = (responder: any) => {
    setSelectedResponder(responder);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setSelectedResponder(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleEditSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      if (!selectedResponder) return;

      await axios.put(`${config.PERSONAL_API}/responders/${selectedResponder._id}`, editFormData);
      setSnackbar({
        open: true,
        message: 'Responder updated successfully',
        severity: 'success'
      });
      handleEditClose();
      fetchResponders(); // Refresh the list
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error updating responder',
        severity: 'error'
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafcfc', position: 'relative' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none'}}>
        <Container disableGutters={true} maxWidth={false} sx={{}}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965',  height: '80px' }}>
            <Grid
              size={{ md: 9 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                p: '1rem 2rem 1rem 2rem'
              }}
            >
              <Typography variant="h6" component="div">
                Create and manage your users
              </Typography>
            </Grid>
            <Grid
              size={{ md: 3 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                p: '1rem 2rem 1rem 2rem'
              }}
            >
              <div style={{display: 'flex', width: '80%'}}> 
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                }}>
                  <SearchIcon style={{
                    position: 'absolute',
                    left: '8px',
                    color: '#757575',
                    fontSize: '20px'
                  }} />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={handleSearchChange}
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
      {/* Table header */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ background: 'white', borderRadius: 1, boxShadow: 0, p: 0, border: 'none' }}>
          <Grid container sx={{ borderBottom: '2px solid #f2f2f2', background: '#f8fafa', p: 1, fontWeight: 600 }}>
            <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Photo</Grid>
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Name/Call Sign</Grid>
            <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Complete Name</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Assignment</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Contact Number</Grid>
            <Grid size={{ md: 1.6 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>Actions</Grid>
          </Grid>
          {/* User rows */}
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>
          ) : (
            filteredResponders.map((responder: any, idx: number) => (
              <Grid container key={responder._id} sx={{ background: idx % 2 === 0 ? '#f8fbfa' : 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '1.5px solid #e0e0e0', alignItems: 'center', p: 0.5, minHeight: 70 }}>
                <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#f2f2f2', border: '1px solid #e0e0e0' }} />
                </Grid>
                <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18, textTransform: 'capitalize' }}>
                  <span style={{ fontWeight: 700, fontSize: 22 }}>{responder.firstName}</span>
                </Grid>
                <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', color: '#444', fontSize: 16, textTransform: 'capitalize' }}>
                  {`${responder.firstName} ${responder.lastName}`}
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 22, textTransform: 'capitalize' }}>{responder.assignment}</span>
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>{responder.phone}</Grid>
                <Grid size={{ md: 1.6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }}
                    onClick={() => handleEditOpen(responder)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }}
                    onClick={() => handleDeleteConfirmOpen(responder)}
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
        <Button variant="contained" sx={{ bgcolor: '#29516a', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }} onClick={handleOpen}>
          <AddIcon sx={{ fontSize: 48 }} />
        </Button>
      </Box>
      
      {/* Add User Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Add User</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <FormLabel sx={{ fontWeight: 700, fontSize: 18, color: '#222' }}>Responder Info</FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, mt: 2 }}>
            <TextField 
              label="First Name" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <TextField 
              label="Last Name" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <TextField 
              label="Primary Email" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Typography variant="caption" sx={{ color: '#888', ml: 0.5, mb: 1 }}>This will be the email user signs in with</Typography>
            <TextField 
              label="Mobile Number" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Assignment</InputLabel>
              <Select
                name="assignment"
                value={formData.assignment}
                onChange={handleSelectChange}
                label="Assignment"
                required
              >
                <MenuItem value="ambulance">Ambulance</MenuItem>
                <MenuItem value="firetruck">Firetruck</MenuItem>
                <MenuItem value="police">Police</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <FormLabel sx={{ fontWeight: 700, fontSize: 18, mb: 1, color: '#222' }}>Password</FormLabel>
          <RadioGroup
            value={passwordType}
            onChange={e => setPasswordType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="auto" control={<Radio />} label={<span style={{ fontSize: 15 }}>Automatically generate a strong password with 16 character</span>} />
            <FormControlLabel value="create" control={<Radio />} label={<span style={{ fontSize: 15 }}>Create password</span>} />
          </RadioGroup>
          {passwordType === 'create' && (
            <Box sx={{ mb: 1 }}>
              <TextField 
                label="Password" 
                variant="outlined" 
                size="small" 
                fullWidth 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Typography variant="caption" sx={{ color: '#888', ml: 0.5 }}>Password must have at least 8 characters</Typography>
            </Box>
          )}
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={askChange} onChange={e => setAskChange(e.target.checked)} />}
              label={<span style={{ fontSize: 15 }}>Ask user to change their password when they sign in</span>}
            />
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 0 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} 
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }}
            onClick={handleSubmit}
          >
            Add New User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Edit User</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <FormLabel sx={{ fontWeight: 700, fontSize: 18, color: '#222' }}>Responder Info</FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, mt: 2 }}>
            <TextField 
              label="First Name" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="firstName"
              value={editFormData.firstName}
              onChange={handleEditChange}
              required
            />
            <TextField 
              label="Last Name" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="lastName"
              value={editFormData.lastName}
              onChange={handleEditChange}
              required
            />
            <TextField 
              label="Primary Email" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="email"
              value={editFormData.email}
              onChange={handleEditChange}
              required
            />
            <TextField 
              label="Mobile Number" 
              variant="outlined" 
              size="small" 
              fullWidth 
              name="phone"
              value={editFormData.phone}
              onChange={handleEditChange}
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Assignment</InputLabel>
              <Select
                name="assignment"
                value={editFormData.assignment}
                onChange={handleEditSelectChange}
                label="Assignment"
                required
              >
                <MenuItem value="ambulance">Ambulance</MenuItem>
                <MenuItem value="firetruck">Firetruck</MenuItem>
                <MenuItem value="police">Police</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={editFormData.status}
                onChange={handleEditSelectChange}
                label="Status"
                required
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 0 }}>
          
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} 
            onClick={handleEditClose}
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}
      >
        <DialogTitle sx={{ fontSize: 24, fontWeight: 500, p: 3, pb: 1 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Typography>
            Are you sure you want to delete {selectedResponder?.firstName} {selectedResponder?.lastName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', p: 3, pt: 1 }}>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }}
            onClick={handleDeleteConfirmClose}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }}
            onClick={() => {
              if (selectedResponder) {
                handleDelete(selectedResponder._id);
                handleDeleteConfirmClose();
              }
            }}
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
  )
}

export default ManageUsers
