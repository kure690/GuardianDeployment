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
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AddAPhoto from '@mui/icons-material/AddAPhoto';

const OperationCenter = () => {
  return (
    <div className="max-h-screen bg-white flex flex-col items-start justify-start">
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none'}}>
        <Container disableGutters={true} maxWidth={false} sx={{}}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965',  height: '80px' }}>
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
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1, p: 2 }}>
        <Grid container spacing={4}>
          {/* Left: Images */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {/* Profile Pic */}
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar src="" sx={{ width: 120, height: 120, border: '2px solid #eee' }} />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <Button sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}>
                  <PhotoCamera />
                </Button>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Profile Pic</Typography>
            </Box>

            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar src="" sx={{ width: 120, height: 120, border: '2px solid #eee' }} />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <Button sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}>
                  <PhotoCamera />
                </Button>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Cover Photo</Typography>
            </Box>

            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar src="" sx={{ width: 120, height: 120, border: '2px solid #eee', borderRadius: 0  }} />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <Button sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}>
                  <PhotoCamera />
                </Button>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Marker to appear in Live Map</Typography>
            </Box>
            {/* Cover Photo */}
            {/* <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar src="" variant="rounded" sx={{ width: 120, height: 80, border: '2px solid #eee' }} />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <Button sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}>
                  <AddAPhoto />
                </Button>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Cover Photo</Typography>
            </Box> */}
            {/* Map Marker Photo */}
            {/* <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar src="" variant="rounded" sx={{ width: 80, height: 80, border: '2px solid #eee' }} />
              <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'white', borderRadius: '50%' }}>
                <Button sx={{ minWidth: 0, p: 1, bgcolor: '#43a047', color: 'white', borderRadius: '50%' }}>
                  <PhotoCamera />
                </Button>
              </Box>
              <Typography align="center" variant="caption" sx={{ mt: 1 }}>Marker to appear in the Map</Typography>
            </Box> */}
          </Grid>

          
          {/* Center: Form Fields */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Name" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Description" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Assignment" variant="outlined" size="small" select slotProps={{select: {native: true,},}} sx={{ bgcolor: 'white', borderRadius: 1 }}>
              <option value="A">A</option>
              <option value="B">B</option>
            </TextField>
            <TextField fullWidth label="Date established" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Tel. No." variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Alternate No." variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Mobile Number" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="E-Mail" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Website" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Short History" variant="outlined" size="small" multiline minRows={6} sx={{ bgcolor: 'white', borderRadius: 1 }} />
          </Grid>
          {/* Right: Map and Social Links */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Address" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1, mb: 1 }} />
            <Box sx={{ width: '100%', height: 180, borderRadius: 2, overflow: 'hidden', mb: 2, border: '1px solid #e0e0e0' }}>
              <iframe
                title="map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.838377964839!2d123.8854373153607!3d10.31569989262639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9991f1b1b1b1b%3A0x1b1b1b1b1b1b1b1b!2sCebu!5e0!3m2!1sen!2sph!4v1680000000000!5m2!1sen!2sph"
                allowFullScreen
              ></iframe>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Social Media Links</Typography>
            <TextField fullWidth label="Facebook" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="YouTube" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Instagram" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="Twitter" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <TextField fullWidth label="LinkedIn" variant="outlined" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />
            <Button variant="contained" sx={{ mt: 2, bgcolor: '#1B4965', color: 'white', borderRadius: 1 }}>Save</Button>
          </Grid>
        </Grid>
      </Container>
    </div>
  )
}

export default OperationCenter
