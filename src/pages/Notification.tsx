import React from 'react'
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
} from '@mui/material';
import Grid from "@mui/material/Grid2";

const Notification = () => {
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
            <TextField label="Title" fullWidth size="small" />
            <TextField label="Message" fullWidth size="small" multiline minRows={7} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>Demographics:</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select label="Gender" defaultValue="">
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Work Status</InputLabel>
                <Select label="Work Status" defaultValue="">
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Employed">Employed</MenuItem>
                  <MenuItem value="Unemployed">Unemployed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Civil Status</InputLabel>
                <Select label="Civil Status" defaultValue="">
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Married">Married</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Barangay" fullWidth size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="From Age" fullWidth size="small" type="number" />
              <TextField label="To Age" fullWidth size="small" type="number" />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Schedule Notification:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl>
                <RadioGroup row defaultValue="now">
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
              <Select label="Type" defaultValue="">
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
            <TextField label="Affected Area" fullWidth size="small" />
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
            <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white', width: '100%' }}>Send</Button>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Notification;