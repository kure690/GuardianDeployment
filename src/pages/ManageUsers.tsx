import React from 'react'
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
import { useState } from 'react';

const users = [
  {
    photo: '',
    name: 'Hazelll',
    completeName: 'Cloyd B. Dedicatoria',
    assignment: 'Fire',
    contact: '09173146624',
  },
  {
    photo: '',
    name: 'Hazelll',
    completeName: 'Cloyd B. Dedicatoria',
    assignment: 'Fire',
    contact: '09173146624',
  },
  {
    photo: '',
    name: 'Hazelll',
    completeName: 'Cloyd B. Dedicatoria',
    assignment: 'Fire',
    contact: '09173146624',
  },
];

const ManageUsers = () => {
  const [open, setOpen] = useState(false);
  const [passwordType, setPasswordType] = useState('create');
  const [askChange, setAskChange] = useState(true);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
          {users.map((user, idx) => (
            <Grid container key={idx} sx={{ background: idx % 2 === 0 ? '#f8fbfa' : 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '1.5px solid #e0e0e0', alignItems: 'center', p: 0.5, minHeight: 70 }}>
              <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#f2f2f2', border: '1px solid #e0e0e0' }} />
              </Grid>
              <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 22 }}>{user.name}</span>
              </Grid>
              <Grid size={{ md: 3 }} sx={{ display: 'flex', alignItems: 'center', color: '#444', fontSize: 16 }}>{user.completeName}</Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 22 }}>{user.assignment}</span>
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontSize: 16 }}>{user.contact}</Grid>
              <Grid size={{ md: 1.6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }}>Manage</Button>
                <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }}>Delete</Button>
              </Grid>
            </Grid>
          ))}
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
          <FormLabel sx={{ fontWeight: 700, fontSize: 18, mb: 2, color: '#222' }}>User Info</FormLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField label="First Name" variant="outlined" size="small" fullWidth />
            <TextField label="Last Name" variant="outlined" size="small" fullWidth />
            <TextField label="Primary Email" variant="outlined" size="small" fullWidth />
            <Typography variant="caption" sx={{ color: '#888', ml: 0.5, mb: 1 }}>This will be the email user signs in with</Typography>
            <TextField label="Mobile Number" variant="outlined" size="small" fullWidth />
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
              <TextField label="Password" variant="outlined" size="small" fullWidth />
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
          <Button variant="contained" sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, mr: 2 }}>
            Add New User
          </Button>
          <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default ManageUsers
