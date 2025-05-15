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
  Tooltip
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

const teams = [
  {
    badge: '',
    callSign: 'Alpha 1',
    members: [
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
    ],
    assignment: 'Fire',
    teamLeader: 'John Chris',
  },
  {
    badge: '',
    callSign: 'Alpha 2',
    members: [
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
    ],
    assignment: 'Police',
    teamLeader: 'John Chris',
  },
  {
    badge: '',
    callSign: 'Alpha 3',
    members: [
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
      'Juan Dela Cruz',
    ],
    assignment: 'Medical',
    teamLeader: 'John Chris',
  },
];

const Teams = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafa', position: 'relative' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Create and manage your team
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
      {/* Table header */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ background: '#e9f0f3', borderRadius: 1, boxShadow: 0, p: 0, border: 'none' }}>
          <Grid container sx={{ borderBottom: '2px solid #cfd8dc', background: '#cfd8dc', p: 1, fontWeight: 600 }}>
            <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Badge</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Name/Call Sign</Grid>
            <Grid size={{ md: 2.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Members</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Assignment</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Team Leader</Grid>
            <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Actions</Grid>
          </Grid>
          {/* Team rows */}
          {teams.map((team, idx) => (
  <Grid container key={idx} sx={{ background: 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '1.5px solid #e0e0e0', alignItems: 'space-between', justifyContent: 'space-between', p: 2, minHeight: 120 }}>
    <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: '#f2f2f2', border: '1px solid #e0e0e0' }} />
    </Grid>
    <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18, justifyContent: 'center' }}>
      <span style={{ fontWeight: 700, fontSize: 24 }}>{team.callSign}</span>
    </Grid>
    <Grid size={{ md: 2.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', minHeight: 80 }}>
      <Box>
        {team.members.map((member, i) => (
          <Typography key={i} sx={{ fontSize: 15, color: '#222', lineHeight: 1.2 }}>{member}</Typography>
        ))}
      </Box>
    </Grid>
    <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
      <span style={{ fontWeight: 700, fontSize: 28 }}>{team.assignment}</span>
    </Grid>
    <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', minHeight: 80, maxWidth: '200px', mr: 2 }}>
      <span style={{ fontWeight: 500, fontSize: 22 }}>{team.teamLeader}</span>
    </Grid>
    <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 2, justifyContent: 'end' }}>
      <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 16, px: 4, py: 1, width: '100%' }}>Manage</Button>
      <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 16, px: 4, py: 1, width: '100%', '&:hover': { bgcolor: '#d32f2f' } }}>Delete</Button>
    </Grid>
  </Grid>
))}
        </Box>
      </Container>
      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Tooltip title="Add Team">
          <IconButton color="primary" sx={{ bgcolor: '#4a6fa5', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, '&:hover': { bgcolor: '#29516a' } }}>
            <AddIcon sx={{ fontSize: 48, color: 'white' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </div>
  )
}

export default Teams
