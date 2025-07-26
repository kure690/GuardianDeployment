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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Alert,
  FormLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import config from '../config';

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${config.GUARDIAN_SERVER_URL}${url}`;
};

const Teams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    teamName: '',
    description: '',
    assignment: '',
    teamLeader: '',
    deputyDriver: '',
    teamBadge: ''
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [responders, setResponders] = useState<any[]>([]);
  const [editMembers, setEditMembers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/opcen-teams/`);
        setTeams(res.data);
      } catch (err) {
        setTeams([]);
      }
      setLoading(false);
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/responders/`);
        setResponders(res.data);
      } catch (err) {
        setResponders([]);
      }
    };
    fetchResponders();
  }, []);

  const handleEditOpen = (team: any) => {
    setSelectedTeam(team);
    setEditFormData({
      teamName: team.teamName,
      description: team.description || '',
      assignment: team.assignment,
      teamLeader: team.teamLeader?._id || '',
      deputyDriver: team.deputyDriver?._id || '',
      teamBadge: team.teamBadge || ''
    });
    setEditMembers(team.members || []);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedTeam(null);
  };

  const handleDeleteConfirmOpen = (team: any) => {
    setSelectedTeam(team);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setSelectedTeam(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMember = (responder: any) => {
    setEditMembers(prev => [...prev, responder]);
  };

  const handleRemoveMember = (id: string) => {
    setEditMembers(prev => prev.filter(m => m._id !== id));
  };

  const handleEditSubmit = async () => {
    try {
      if (!selectedTeam) return;

      const memberIds = [
        ...new Set([
          ...editMembers.map(m => m._id),
          editFormData.teamLeader,
          editFormData.deputyDriver
        ])
      ];

      const payload = {
        ...editFormData,
        members: memberIds
      };

      await axios.put(`${config.GUARDIAN_SERVER_URL}/opcen-teams/${selectedTeam._id}`, payload);
      setSnackbar({
        open: true,
        message: 'Team updated successfully',
        severity: 'success'
      });
      handleEditClose();
      // Refresh teams list
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/opcen-teams/`);
      setTeams(res.data);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error updating team',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${config.GUARDIAN_SERVER_URL}/opcen-teams/${id}`);
      setSnackbar({
        open: true,
        message: 'Team deleted successfully',
        severity: 'success'
      });
      handleDeleteConfirmClose();
      // Refresh teams list
      const res = await axios.get(`${config.GUARDIAN_SERVER_URL}/opcen-teams/`);
      setTeams(res.data);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error deleting team',
        severity: 'error'
      });
    }
  };

  // Get available responders (not already in the team)
  const getAvailableResponders = () => {
    const currentMemberIds = new Set([
      ...editMembers.map(m => m._id),
      editFormData.teamLeader,
      editFormData.deputyDriver
    ]);
    return responders.filter(r => !currentMemberIds.has(r._id));
  };

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
      
        <Box sx={{ borderRadius: 1, boxShadow: 0, p: 4, border: 'none' }}>
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
                  <Avatar 
                    src={getImageUrl(team?.teamBadge || '')} 
                    variant="rounded" 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      bgcolor: '#f2f2f2', 
                      border: '1px solid #e0e0e0',
                      '& img': {
                        objectFit: 'cover'
                      }
                    }} 
                  />
                </Grid>
                <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 18, justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 24 }}>{team.teamName}</span>
                </Grid>
                <Grid size={{ md: 2.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', minHeight: 80, textTransform: 'capitalize' }}>
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
                <Grid size={{ md: 1.6 }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#29516a', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5 }}
                    onClick={() => handleEditOpen(team)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 13, px: 2, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }}
                    onClick={() => handleDeleteConfirmOpen(team)}
                  >
                    Delete
                  </Button>
                </Grid>
              </Grid>
            ))
          )}
        </Box>
  
      {/* Floating Add Button */}
      <Box sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 100 }}>
        <Tooltip title="Add Team">
          <IconButton color="primary" sx={{ bgcolor: '#4a6fa5', width: 80, height: 80, borderRadius: '50%', minWidth: 0, boxShadow: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, '&:hover': { bgcolor: '#29516a' } }} onClick={() => navigate('/add-teams')}>
            <AddIcon sx={{ fontSize: 48, color: 'white' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Edit Team Modal */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <Box sx={{ background: '#6b8e9e', p: 0}}>
          <DialogTitle sx={{ color: 'white', fontSize: 32, fontWeight: 400, p: 2, pb: 2 }}>Edit Team</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 2 }}>
          <Grid container spacing={3}>
            <Grid size={{ md: 6 }}>
              <FormLabel sx={{ fontWeight: 700, fontSize: 18, color: '#222' }}>Team Info</FormLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, mt: 2 }}>
                <TextField 
                  label="Team Name" 
                  variant="outlined" 
                  size="small" 
                  fullWidth 
                  name="teamName"
                  value={editFormData.teamName}
                  onChange={handleEditChange}
                  required
                />
                <TextField 
                  label="Description" 
                  variant="outlined" 
                  size="small" 
                  fullWidth 
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
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
                    <MenuItem value="Fire">Fire</MenuItem>
                    <MenuItem value="Police">Police</MenuItem>
                    <MenuItem value="Medical">Medical</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid size={{ md: 6 }}>
              <FormLabel sx={{ fontWeight: 700, fontSize: 18, color: '#222' }}>Team Members</FormLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Team Leader</InputLabel>
                  <Select
                    name="teamLeader"
                    value={editFormData.teamLeader}
                    onChange={handleEditSelectChange}
                    label="Team Leader"
                    required
                  >
                    {responders.map(r => (
                      <MenuItem key={r._id} value={r._id}>{r.firstName} {r.lastName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Deputy/Driver</InputLabel>
                  <Select
                    name="deputyDriver"
                    value={editFormData.deputyDriver}
                    onChange={handleEditSelectChange}
                    label="Deputy/Driver"
                    required
                  >
                    {responders.map(r => (
                      <MenuItem key={r._id} value={r._id}>{r.firstName} {r.lastName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid size={{ md: 6 }}>
              <Paper sx={{ maxHeight: 200, overflowY: 'auto', mb: 2, background: '#fafbfc', boxShadow: 0, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <List>
                  {getAvailableResponders().map(r => (
                    <ListItem key={r._id} onClick={() => handleAddMember(r)} sx={{ cursor: 'pointer' }}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" sx={{ bgcolor: '#f2f2f2', width: 32, height: 32 }} />
                      </ListItemAvatar>
                      <ListItemText primary={r.firstName + ' ' + r.lastName} />
                    </ListItem>
                  ))}
                  {getAvailableResponders().length === 0 && (
                    <ListItem><ListItemText primary="No available responders" /></ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            <Grid size={{ md: 6 }}>
              <Paper sx={{ maxHeight: 200, overflowY: 'auto', mb: 2, background: '#fafbfc', boxShadow: 0, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <List>
                  {editMembers.map(m => (
                    <ListItem key={m._id}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" sx={{ bgcolor: '#f2f2f2', width: 32, height: 32 }} />
                      </ListItemAvatar>
                      <ListItemText primary={m.firstName + ' ' + m.lastName} />
                      {m._id !== editFormData.teamLeader && m._id !== editFormData.deputyDriver && (
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(m._id)}>
                          <DeleteIcon sx={{ color: '#ef5350' }} />
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                  {editMembers.length === 0 && (
                    <ListItem><ListItemText primary="No members added" /></ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
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
            Are you sure you want to delete {selectedTeam?.teamName}? This action cannot be undone.
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
              if (selectedTeam) {
                handleDelete(selectedTeam._id);
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

export default Teams
