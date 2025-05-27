import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import axios from 'axios';
import config from '../config';

const Teams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(`${config.PERSONAL_API}/opcen-teams/`);
        setTeams(res.data);
      } catch (err) {
        setTeams([]);
      }
      setLoading(false);
    };
    fetchTeams();
  }, []);

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
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>
          ) : (
            teams.map((team, idx) => (
              <Grid container key={team._id || idx} sx={{ background: 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '1.5px solid #e0e0e0', alignItems: 'space-between', justifyContent: 'space-between', p: 2, minHeight: 120 }}>
                <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: '#f2f2f2', border: '1px solid #e0e0e0' }} />
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18, justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 24 }}>{team.teamName}</span>
                </Grid>
                <Grid size={{ md: 2.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', minHeight: 80 }}>
                  <Box>
                    {team.members && team.members.length > 0 ? (
                      team.members.map((member: any, i: number) => (
                        <Typography key={i} sx={{ fontSize: 15, color: '#222', lineHeight: 1.2 }}>
                          {member.firstName ? `${member.firstName} ${member.lastName}` : member}
                        </Typography>
                      ))
                    ) : (
                      <Typography sx={{ fontSize: 15, color: '#888' }}>No members</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                  <span style={{ fontWeight: 700, fontSize: 28 }}>{team.assignment}</span>
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', minHeight: 80, maxWidth: '200px', mr: 2, textTransform: 'capitalize' }}>
                  <span style={{ fontWeight: 500, fontSize: 22 }}>
                    {team.teamLeader && team.teamLeader.firstName
                      ? `${team.teamLeader.firstName} ${team.teamLeader.lastName}`
                      : team.teamLeader || 'N/A'}
                  </span>
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 2, justifyContent: 'end' }}>
                  <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 16, px: 4, py: 1, width: '100%' }}>Manage</Button>
                  <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 16, px: 4, py: 1, width: '100%', '&:hover': { bgcolor: '#d32f2f' } }}>Delete</Button>
                </Grid>
              </Grid>
            ))
          )}
        </Box>
      </Container>
      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Tooltip title="Add Team">
          <IconButton color="primary" sx={{ bgcolor: '#4a6fa5', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, '&:hover': { bgcolor: '#29516a' } }} onClick={() => navigate('/add-teams')}>
            <AddIcon sx={{ fontSize: 48, color: 'white' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </div>
  )
}

export default Teams
