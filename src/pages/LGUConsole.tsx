import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Typography, 
  Button,
  Box,
  Avatar,
  Container,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GuardianIcon from "../assets/images/icon-removebg-preview.png";
import SearchIcon from '@mui/icons-material/Search';
import Grid from "@mui/material/Grid2";
import HomeIcon from '@mui/icons-material/Home';
import SpeedIcon from '@mui/icons-material/Speed';
import FolderIcon from '@mui/icons-material/Folder';
import DevicesIcon from '@mui/icons-material/Devices';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { useOpCen } from '../hooks/opcen/useOpCen';

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${config.GUARDIAN_SERVER_URL}${url}`;
};

const LGUConsole = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { data: opcenData } = useOpCen(user.id);
    const [respondersCount, setRespondersCount] = useState(0);
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    useEffect(() => {
      const fetchResponders = async () => {
        try {
          const response = await axios.get(`${config.GUARDIAN_SERVER_URL}/responders/`);
          const activeResponders = response.data.filter((responder: any) => 
            responder.status === 'active' && responder.operationCenter === user.id
          );
          setRespondersCount(activeResponders.length);
        } catch (err) {
          console.error('Error fetching responders:', err);
        }
      };

      fetchResponders();
    }, []);

    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
    };

    const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleLogout = () => {
      localStorage.clear();
      window.location.href = '/';
    };

    return (
      <div className="max-h-screen overflow-hidden bg-white flex flex-col items-start justify-start">
            <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
              <Container disableGutters={true} maxWidth={false} sx={{}}>
                <Grid container spacing={1} sx={{ backgroundColor: '#1B4965', height: '80px' }}>
                  

                    {/* First grid */}

                    <Grid
                    size={{ md: 2 }}
                    sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'start',
                    // backgroundColor: 'blue',
                    p: '1rem 1rem 1rem 1rem'
                    }}
                    >
                      <MenuIcon fontSize="large" onClick={toggleSidebar} sx={{ cursor: 'pointer' }} />
                      <Box
                      component="img"
                      src={GuardianIcon}
                      alt="Guardian Icon"
                      sx={{
                      width: 45,
                      height: 45,
                      ml: 3,
                      mr: 3,
                      borderColor: 'white',
                      borderWidth: 0.1,
                      borderStyle: 'solid',
                      borderRadius: '10%'
                      }}
                      />
                      <Typography variant="h6" component="div">
                      Admin
                      </Typography>
                    </Grid>

                  {/* Second grid */}

                  <Grid
                  size={{md: 9}}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // backgroundColor: 'red',
                    p: '1rem 1rem 1rem 1rem'
                  }}>
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
                    height: '48px',
                    padding: '12px 12px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    backgroundColor: 'white',
                    fontSize: '1.1rem',
                    }} 
                    /> 
                    </div>
                    </div>
                  </Grid> 

                  {/* Third grid */}

                    <Grid
                    size={{md: 1}}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      // backgroundColor: 'green',
                      p: '1rem 1rem 1rem 1rem'
                    }}>
                      <Box sx={{ display: 'flex'}}>
                        <Avatar 
                          src={getImageUrl(opcenData?.profileImage || '')}
                          alt="Avatar Image"
                          sx={{   
                            color: 'white',
                            width: 50, 
                            height: 50,
                            boxSizing: 'border-box',
                            borderRadius: '50%',
                            bgcolor: !opcenData?.profileImage ? '#e0e0e0' : 'grey',
                            cursor: 'pointer'
                          }}
                          onClick={handleAvatarClick}
                        />
                        <Menu
                          anchorEl={anchorEl}
                          open={openMenu}
                          onClose={handleMenuClose}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                      </Box>
                    </Grid>  
                </Grid>
              </Container>
          </AppBar>
          

          <div className="flex flex-row w-full h-screen">
            

          {sidebarOpen && (
          <Box
            sx={{
              width: 180,
              minWidth: 90,
              height: '100vh',
              // background: '#f5f8fa',
              // borderRight: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: 3,
              pl: 5,
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }}>
                <HomeIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12 }}>Home</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }} onClick={() => navigate('/data-dashboard')} style={{ cursor: 'pointer' }}>
                <SpeedIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12, cursor: 'pointer' }}>Dashboard</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }}>
                <FolderIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12 }}>Directory</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }}>
                <DevicesIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12 }}>Devices</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }}>
                <NotificationImportantIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12 }}>Alerts</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }}>
                <BarChartIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12 }}>Reporting</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: 1 }}>
                <AccountBalanceIcon sx={{ color: '#1B4965' }} />
                <Typography variant="caption" sx={{ color: '#1B4965', fontSize: 12 }}>Account</Typography>
              </Box>
            </Box>
          </Box>
          )}

          <div className="flex flex-col w-full">

          <div className="flex flex-row w-full">
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                pl: 4,
                pr: 4,
                // backgroundColor: 'red',
              }}
            >
              <Box
                sx={{
                  // backgroundColor: 'green',
                  width: { xs: '100%', md: '5%' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #e0e0e0',
                  height: '100%',
                }}
              >
                <Avatar 
                        src={getImageUrl(opcenData?.profileImage || '')}
                        alt="Avatar Image"
                        sx={{   
                          color: 'white',
                          width: 50, 
                          height: 50,
                          boxSizing: 'border-box',
                          borderRadius: '50%',
                          bgcolor: !opcenData?.profileImage ? '#e0e0e0' : 'grey'
                        }}
                      />
              </Box>

              <Box
                sx={{
                  // backgroundColor: 'red',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 1,
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="h6">{opcenData ? `${opcenData.firstName} ${opcenData.lastName}` : ''}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Welcome to the GuardianPH Admin Console
                </Typography>
              </Box>
            </Box>
          </div>
          
          

          <div className="flex flex-row w-full h-screen">
            
          <Box sx={{ flex: 1, overflow: 'auto', background: 'white', width: '100%' }}>
            <Box sx={{ mt: 4, mb: 4, width: '100%', p: 4 }}>
              <Grid container spacing={3} justifyContent="center">
                <Grid size={{ xs: 12, md: 4 }}
                sx={{
                  // backgroundColor: 'red',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                  <Box sx={{
                    background: '#f8fbfd',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 3,
                    minHeight: 260,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Users</Typography>
                      <Button size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/usermanagement')}>Manage</Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Active</Typography>
                    <Typography variant="h4" sx={{ mb: 2 }}>{respondersCount}</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Add a user</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Delete a user</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Update a user's name or email</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Create an alternative email address</Button>
                    </Box>
                  </Box>
                  <Box sx={{
                    background: '#f8fbfd',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 3,
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Directory</Typography>
                      <Button size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/teams')}>Manage</Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>View and download reports</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Add Team</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Manage Team</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }} onClick={() => navigate('/facilities')}>Add Facility</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Manage Facility</Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}
                sx={{
                  // backgroundColor: 'blue',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                  <Box sx={{
                    background: '#f8fbfd',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 3,
                    minHeight: 260,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Alerts</Typography>
                      <Button size="small" sx={{ textTransform: 'none' }}>Manage</Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Send messages to your users</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }} onClick={() => navigate('/notification')}>Create a notification</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Delete a notification</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Update notification</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }} onClick={() => navigate('/announcements')}>Create a announcement</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Delete a announcement</Button>    
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Update announcement</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }} onClick={() => navigate('/messages')}>Create a message</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Delete a message</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Update message</Button>
                    </Box>
                  </Box>
                  <Box sx={{
                    background: '#f8fbfd',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 3,
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Devices</Typography>
                      <Button size="small" sx={{ textTransform: 'none' }}>Manage</Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Add or manage users</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}
                sx={{
                  // backgroundColor: 'green',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}>
                  <Box sx={{
                    background: '#f8fbfd',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 3,
                    minHeight: 260,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Reporting</Typography>
                      <Button size="small" sx={{ textTransform: 'none' }} onClick={() =>navigate('/reports')}>Manage</Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>View and download reports</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>View report with incident ID</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>View report by type and date</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>View reports by dispatcher</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>View reports by location</Button>
                    </Box>
                  </Box>

                  <Box sx={{
                    background: '#f8fbfd',
                    borderRadius: 3,
                    boxShadow: 1,
                    p: 3,
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">Account</Typography>
                      <Button size="small" sx={{ textTransform: 'none' }} onClick={() => navigate('/opcen')}>Manage</Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Send messages to your users</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Settings</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Licences</Button>
                      <Button size="small" sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>Change Password</Button>
                    </Box>
                  </Box>

                </Grid>

            
              </Grid>
            </Box>
          </Box>

          </div>
            
          </div>

          
        </div>
        </div>
    );
};

export default LGUConsole
