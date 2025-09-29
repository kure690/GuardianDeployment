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
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import config from '../config';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const AddTeams = () => {
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [assignment, setAssignment] = useState('');
  const [teamLeader, setTeamLeader] = useState('');
  const [deputyDriver, setDeputyDriver] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [teamBadge, setTeamBadge] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const fetchDispatchers = async () => {
      try {
        const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/dispatchers/`);
        setDispatchers(res.data);
      } catch (err) {
        setDispatchers([]);
      }
    };
    fetchDispatchers();
  }, []);

  const handleAddMember = (dispatcher: any) => {
    setMembers(prev => [...prev, dispatcher]);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m._id !== id));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTeamBadge(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (!teamName || !description || !assignment || !teamLeader || !deputyDriver) {
        setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
        return;
      }

      const formData = new FormData();
      formData.append('teamName', teamName);
      formData.append('description', description);
      formData.append('assignment', assignment);
      formData.append('teamLeader', teamLeader);
      formData.append('deputyDriver', deputyDriver);
      
      const memberIds = [
        ...new Set([
          ...members.map(m => m._id),
          teamLeader,
          deputyDriver
        ])
      ];
      
      memberIds.forEach(memberId => {
        formData.append('members', memberId);
      });

      if (teamBadge) {
        formData.append('teamBadge', teamBadge);
      }

      await axios.post(`${config.GUARDIAN_SERVER_URL}/opcen-teams/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSnackbar({ open: true, message: 'Team created successfully!', severity: 'success' });
      setTeamName('');
      setDescription('');
      setAssignment('');
      setTeamLeader('');
      setDeputyDriver('');
      setMembers([]);
      setTeamBadge(null);
      setPreviewUrl('');
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error creating team', severity: 'error' });
    }
  };

  const getUniqueMembers = () => {
    const ids = new Set<string>();
    const result: any[] = [];
    if (teamLeader) {
      const leader = dispatchers.find(d => d._id === teamLeader);
      if (leader && !ids.has(leader._id)) {
        ids.add(leader._id);
        result.push(leader);
      }
    }
    if (deputyDriver) {
      const deputy = dispatchers.find(d => d._id === deputyDriver);
      if (deputy && !ids.has(deputy._id)) {
        ids.add(deputy._id);
        result.push(deputy);
      }
    }
    for (const m of members) {
      if (!ids.has(m._id)) {
        ids.add(m._id);
        result.push(m);
      }
    }
    return result;
  };

  const availableDispatchers = dispatchers.filter(d =>
    !d.team && // check if dispatcher's team field is null
    d._id !== teamLeader &&
    d._id !== deputyDriver &&
    !members.some(m => m._id === d._id)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fa' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
            <Grid size={{ md: 9 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start', p: '1rem 2rem 1rem 2rem' }}>
              <Typography variant="h6" component="div">
                Add Team
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </AppBar>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ md: 3, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start' }}>
            <Paper 
              sx={{ 
                width: 160, 
                height: 160, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 2,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Team Badge Preview" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }} 
                />
              ) : (
                <img 
                  src="https://via.placeholder.com/120x100?text=+" 
                  alt="Team Badge" 
                  style={{ opacity: 0.5 }} 
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </Paper>
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            <Typography variant="subtitle1" sx={{ color: '#888' }}>Team Badge</Typography>
          </Grid>
          <Grid size={{ md: 5, xs: 12 }}>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Team Leader</InputLabel>
                <Select
                  label="Team Leader"
                  value={teamLeader}
                  onChange={e => setTeamLeader(e.target.value)}
                >
                  <MenuItem value="">Select Team Leader</MenuItem>
                  {/* Show current leader if already selected, plus all available */}
                  {dispatchers
                    .filter(d => !d.team || d._id === teamLeader)
                    .map(d => (
                    <MenuItem key={d._id} value={d._id}>{d.firstName} {d.lastName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Deputy/Driver</InputLabel>
                <Select
                  label="Deputy/Driver"
                  value={deputyDriver}
                  onChange={e => setDeputyDriver(e.target.value)}
                >
                  <MenuItem value="">Select Deputy/Driver</MenuItem>
                  {dispatchers
                    .filter(d => !d.team || d._id === deputyDriver) // Filter for unassigned or currently selected
                    .map(d => (
                    <MenuItem key={d._id} value={d._id}>{d.firstName} {d.lastName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField label="Team Name" fullWidth size="small" sx={{ mb: 2 }} value={teamName} onChange={e => setTeamName(e.target.value)} />
            <TextField label="Description" fullWidth size="small" sx={{ mb: 2 }} value={description} onChange={e => setDescription(e.target.value)} />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Assignment</InputLabel>
              <Select label="Assignment" value={assignment} onChange={e => setAssignment(e.target.value)}>
                <MenuItem value="">Select Assignment</MenuItem>
                <MenuItem value="Fire">Fire</MenuItem>
                <MenuItem value="Police">Police</MenuItem>
                <MenuItem value="Medical">Medical</MenuItem>
              </Select>
            </FormControl>
            <Paper sx={{ maxHeight: 160, minHeight: 80, overflowY: 'auto', mb: 2, background: '#fafbfc', boxShadow: 0, border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <List>
                {availableDispatchers.map(d => (
                  <ListItem key={d._id} onClick={() => setMembers(prev => [...prev, d])} sx={{ cursor: 'pointer' }}>
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ bgcolor: '#f2f2f2', width: 32, height: 32 }} />
                    </ListItemAvatar>
                    <ListItemText primary={d.firstName + ' ' + d.lastName} />
                  </ListItem>
                ))}
                {availableDispatchers.length === 0 && (
                  <ListItem><ListItemText primary="No available dispatchers" /></ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          <Grid size={{ md: 4, xs: 12 }}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 2, height: '500px' }}>
              <Box sx={{ background: '#23607a', p: 1.5, }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Members</Typography>
              </Box>
              <List>
                {getUniqueMembers().map(m => (
                  <ListItem key={m._id}>
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ bgcolor: '#f2f2f2', width: 32, height: 32 }} />
                    </ListItemAvatar>
                    <ListItemText primary={m.firstName + ' ' + m.lastName} />
                    {/* Only allow removing if not team leader or deputy */}
                    {m._id !== teamLeader && m._id !== deputyDriver && (
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(m._id)}>
                        <DeleteIcon sx={{ color: '#ef5350' }} />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
            <Button variant="contained" fullWidth sx={{ bgcolor: '#43a047', color: 'white', height: 48, fontSize: 18, borderRadius: 2 }} onClick={handleSave}>Save</Button>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
              <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Grid>
        </Grid>
      </Container>
    </div>
  )
}

export default AddTeams
