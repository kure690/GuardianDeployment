import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import config from "./config";
import Login from "./pages/Login";
import StandBy from "./pages/StandBy";
import MainScreen from "./pages/MainScreen";
import Register from "./pages/Register";
import Calls from "./pages/Calls";
import Status from "./pages/Status";
import LGUMain from "./pages/LGUMain";
import MapView from "./pages/MapView";
import ResponderMap from "./pages/ResponderMap";
import LGUConsole from "./pages/LGUConsole";
import OperationCenter from "./pages/OperationCenter";
import ManageUsers from "./pages/ManageUsers";
import Teams from "./pages/Teams"
import MobileAssets from "./pages/MobileAssets";
import AddMobileAssets from "./pages/AddMobileAssets";
import Notification from "./pages/Notification";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterOpcen from "./pages/RegisterOpcen";
import AddTeams from "./pages/AddTeams";
import Facilities from "./pages/Facilities";
import AddFacilities from "./pages/AddFacilities";
import Announcements from "./pages/Announcements";
import Messages from "./pages/Messages";
import Reports from "./pages/ManageReporting"
import SocketProvider from "./utils/SocketProvider";
import { LoadScript } from '@react-google-maps/api';
import ClusterManagement from "./pages/ClusterManager";
import IncidentsDashboard from "./components/incidents-dashboard/IncidentsDashboard";
import DataDashboard from "./pages/DataDashboard";
import RecordingsPage from "./pages/RecordingsPage";

const theme = createTheme({
  typography: {
    fontFamily: 'Verdana, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Verdana, sans-serif',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'Verdana, sans-serif',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Verdana, sans-serif',
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      retry: 1, 
    },
  },
});

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      const storedChatClient = localStorage.getItem('chatClient');

      if (storedUser && storedToken && storedChatClient) {
        try {
          const user = JSON.parse(storedUser);
          const chatClient = new StreamChat(config.STREAM_APIKEY);
          
          await chatClient.connectUser(
            {
              id: user._id || user.id,
              name: user.name || (user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email || "Unknown User"),
            },
            storedToken
          );
          
          setClient(chatClient);
          setUserRole(user.role);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error connecting to Stream Chat:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('chatClient');
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, []);


  if (isLoading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1B4965'}}><span style={{color: 'white', fontSize: 24}}>Connecting to server...</span></div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>

        
        <SocketProvider>
          <main>
            {client ? (
              <Chat client={client}>
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      isAuthenticated 
                        ? (() => {
                            const user = JSON.parse(localStorage.getItem('user') || '{}');
                            if (user.type === 'opcen') {
                              return <Navigate to="/lgu-console" replace />;
                            } else if (user.type === 'dispatcher') {
                              return user.dispatcherType === 'Guardian' 
                                ? <Navigate to="/status" replace />
                                : <Navigate to="/lgu-main" replace />;
                            }
                            return <Navigate to="/status" replace />;
                          })()
                        : <Login />
                    } 
                  />
                  <Route path="/standby" element={<StandBy />} />
                  <Route path="/main/:incidentId" element={isAuthenticated ? <MainScreen /> : <Navigate to="/" replace />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/call" element={isAuthenticated ? <Calls /> : <Navigate to="/" replace />} />
                  <Route path="/status" element={isAuthenticated ? <Status /> : <Navigate to="/" replace />} />
                  <Route path="/lgu-main" element={isAuthenticated ? <LGUMain /> : <Navigate to="/" replace />} />
                  <Route path="/map" element={isAuthenticated ? <MapView /> : <Navigate to="/" replace />} />
                  <Route path="/responder-map" element={isAuthenticated ? <ResponderMap /> : <Navigate to="/" replace />} />
                  <Route path="/lgu-console" element={isAuthenticated ? <LGUConsole /> : <Navigate to="/" replace />} />
                  <Route path="/opcen" element={isAuthenticated ? <OperationCenter /> : <Navigate to="/" replace />} />
                  <Route path="/usermanagement" element={isAuthenticated ? <ManageUsers /> : <Navigate to="/" replace />} />
                  <Route path="/teams" element={isAuthenticated ? <Teams /> : <Navigate to="/" replace />} />
                  <Route path="/mobile-assets" element={isAuthenticated ? <MobileAssets /> : <Navigate to="/" replace />} />
                  <Route path="/add-mobile-assets" element={isAuthenticated ? <AddMobileAssets /> : <Navigate to="/" replace />} />
                  <Route path="/notification" element={<Notification />} />
                  <Route path="/add-teams" element={<AddTeams />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/add-facilities" element={<AddFacilities />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/cluster-management" element={<ClusterManagement />} />
                  <Route path="/incidents-dashboard" element={<IncidentsDashboard />} />
                  <Route path="/data-dashboard" element={<DataDashboard />} />
                  
                </Routes>
              </Chat>
            ) : (
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/recordings/:callId" element={<RecordingsPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-opcen" element={<RegisterOpcen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </main>
        </SocketProvider>
        </LoadScript>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;