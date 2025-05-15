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
import LGUStatus from "./pages/LGUStatus";
import LGUMain from "./pages/LGUMain";
import MapView from "./pages/MapView";
import ResponderMap from "./pages/ResponderMap";
import LGUConsole from "./pages/LGUConsole";
import OperationCenter from "./pages/OperationCenter";
import ManageUsers from "./pages/ManageUsers";
import Teams from "./pages/Teams"
import MobileAssets from "./pages/MobileAssets";
import AddMobileAssets from "./pages/AddMobileAssets";

// Create global theme with Verdana as default font
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
          // Clear stored data if connection fails
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
    return null; 
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main>
        {client ? (
          <Chat client={client}>
            <Routes>
              <Route 
                path="/" 
                element={
                  isAuthenticated 
                    ? (userRole === 'LGU' 
                        ? <Navigate to="/lgu-main" replace /> 
                        : <Navigate to="/status" replace />)
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
            </Routes>
          </Chat>
        ) : (
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </ThemeProvider>
  );
}

export default App;