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
import { useNavigate } from 'react-router-dom';

const assets = [
  {
    photo: '',
    name: 'Penetrator',
    contactPerson: 'Alpha 1',
    contactNumber: 'Fire',
    address: 'Subangdaku',
  },
  {
    photo: '',
    name: 'Penetrator',
    contactPerson: 'Alpha 1',
    contactNumber: 'Fire',
    address: 'Subangdaku',
  },
  {
    photo: '',
    name: 'Penetrator',
    contactPerson: 'Alpha 1',
    contactNumber: 'Fire',
    address: 'Subangdaku',
  },
  {
    photo: '',
    name: 'Penetrator',
    contactPerson: 'Alpha 1',
    contactNumber: 'Fire',
    address: 'Subangdaku',
  },
];

const MobileAssets = () => {
  const navigate = useNavigate();
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
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Contact Persons</Grid>
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Contact Numbers</Grid>
            <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', mr: 1 }}>Address</Grid>
            <Grid size={{ md: 1.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16,  bgcolor: '#f2f2f2', }}>Actions</Grid>
          </Grid>
          {/* Rows */}
          {assets.map((asset, idx) => (
            <Grid container key={idx} sx={{ background: 'white', borderRadius: 2, mt: 2, mb: 0, boxShadow: 0, border: '2px solid #e0e0e0', alignItems: 'center', p: 1.5, minHeight: 70 }}>
              <Grid size={{ md: 1.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#f2f2f2', border: '1px solid #e0e0e0' }} />
              </Grid>
              <Grid size={{ md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 22 }}>{asset.name}</span>
              </Grid>
              <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ededed', borderRadius: 1, minHeight: 40 }}>
                <span style={{ fontSize: 18 }}>{asset.contactPerson}</span>
              </Grid>
              <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, minHeight: 40 }}>
                <span style={{ fontWeight: 700, fontSize: 28 }}>{asset.contactNumber}</span>
              </Grid>
              <Grid size={{ md: 2.2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ededed', borderRadius: 1, minHeight: 40, mr: 2 }}>
                <span style={{ fontSize: 18 }}>{asset.address}</span>
              </Grid>
              <Grid size={{ md: 1.8 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Button variant="contained" sx={{ bgcolor: '#43a047', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 15, px: 3, py: 0.5 }}>Manage</Button>
                <Button variant="contained" sx={{ bgcolor: '#ef5350', color: 'white', borderRadius: 1, textTransform: 'none', fontSize: 15, px: 3, py: 0.5, '&:hover': { bgcolor: '#d32f2f' } }}>Delete</Button>
              </Grid>
            </Grid>
          ))}
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
    </div>
  )
}

export default MobileAssets
