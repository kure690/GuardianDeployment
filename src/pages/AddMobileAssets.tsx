import React from 'react'
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
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider
  } from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

const assignedTeams = [
  { name: 'Alpha 1', sched: 'MWF', time: '0800 - 1700' },
  { name: 'Alpha 2', sched: 'MWF', time: '1701 - 0200' },
];

const AddMobileAssets = () => {
  return (
    <div>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid size={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Add Mobile Assets
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, background: '#f7f7f7' }}>
          <Grid container spacing={3}>
            {/* Left: Image uploads and marker */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  {[0,1,2,3].map(i => (
                    <Avatar key={i} variant="rounded" sx={{ width: 90, height: 90, bgcolor: '#e0e0e0', border: '1px solid #bdbdbd' }} />
                  ))}
                </Box>
                <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white', width: '80%', fontWeight: 600, mb: 2 }}>Upload Photos</Button>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                  <Avatar variant="rounded" sx={{ width: 90, height: 90, bgcolor: '#e0e0e0', border: '1px solid #bdbdbd' }} />
                  <Typography variant="caption" sx={{ mt: 1, color: '#222' }}>Marker to appear in Live Map</Typography>
                </Box>
              </Box>
            </Grid>
            {/* Center: Form fields and map */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Name / Callsign" size="small" fullWidth />
                <TextField label="Description" size="small" fullWidth />
                <FormControl size="small" fullWidth>
                  <InputLabel>Assignment</InputLabel>
                  <Select label="Assignment" defaultValue="">
                    <MenuItem value="Fire">Fire</MenuItem>
                    <MenuItem value="Police">Police</MenuItem>
                    <MenuItem value="Medical">Medical</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Maker" size="small" fullWidth />
                <TextField label="Year Model" size="small" fullWidth />
                <TextField label="Petrol Type" size="small" fullWidth />
                <TextField label="Base assignment" size="small" fullWidth />
                <Box sx={{ mt: 1 }}>
                <iframe
                title="map"
                width="100%"
                height="100%"
                style={{ border: 0, marginBottom: "1rem"}}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.838377964839!2d123.8854373153607!3d10.31569989262639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9991f1b1b1b1b%3A0x1b1b1b1b1b1b1b1b!2sCebu!5e0!3m2!1sen!2sph!4v1680000000000!5m2!1sen!2sph"
                allowFullScreen
                ></iframe>
                  <TextField size="small" placeholder="Search" fullWidth InputProps={{ startAdornment: <SearchIcon sx={{ color: '#888', mr: 1 }} /> }} sx={{ background: 'white', borderRadius: 1 }} />
                </Box>
              </Box>
            </Grid>
            {/* Right: Assign team and assigned teams */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 1 }}>Assign a team:</Typography>
                <TextField size="small" placeholder="Search Team" fullWidth sx={{ background: 'white', borderRadius: 1 }} />
                <Paper sx={{ minHeight: 90, background: '#f7f7f7', boxShadow: 0, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }} />
                <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 1, mt: 2 }}>Assigned team:</Typography>
                <Paper sx={{ background: '#e0e0e0', borderRadius: 1, mb: 1, p: 0, overflow: 'hidden' }}>
                  <Box sx={{ background: '#45788c', color: 'white', p: 1, fontWeight: 600, fontSize: 16, display: 'flex', flexDirection: 'row' }}> 
                    <Box sx={{ flex: 1, textAlign: 'center' }}>Team</Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>Sched</Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>Time</Box>
                  </Box>
                  <List sx={{ p: 0 }}>
                    {assignedTeams.map((team, idx) => (
                      <React.Fragment key={team.name+idx}>
                        <ListItem sx={{ py: 0.5, px: 1 }}
                          secondaryAction={
                            <IconButton edge="end" aria-label="delete" sx={{ color: '#e53935' }}>
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>{team.name}</Box>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>{team.sched}</Box>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>{team.time}</Box>
                          </Box>
                        </ListItem>
                        {idx < assignedTeams.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
                <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 18, fontWeight: 600, mt: 'auto', py: 1 }}>Save</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </div>
  )
}

export default AddMobileAssets
