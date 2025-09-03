import React, { useState, useEffect, FormEvent } from 'react';
import {
  AppBar,
  Typography,
  Button,
  Box,
  Container,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import Grid from "@mui/material/Grid2";
import axios from 'axios';
import config from '../config';
// Import Leaflet components and types
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Configuration ---
const API_BASE_URL = `${config.GUARDIAN_SERVER_URL}/clusters`; // 👈 Update if your backend port is different

// --- TypeScript Interfaces ---
interface GeoJSON {
  type: "Polygon" | "MultiPolygon";
  coordinates: any[];
}

interface City {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverageRadiusKm?: number | null;
  coverageArea?: GeoJSON | null;
}

interface Cluster {
  _id: string;
  name: string;
  description?: string | null;
  cities: City[];
  createdAt: string;
  updatedAt: string;
}

// --- Main ClusterManager Component ---
const ClusterManager: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [newClusterName, setNewClusterName] = useState("");
  const [newClusterDescription, setNewClusterDescription] = useState("");
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Cluster[]>(API_BASE_URL);
        setClusters(response.data);
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to fetch clusters. Is the server running?', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchClusters();
  }, []);
  
  const handleCreateCluster = async () => {
    if (!newClusterName.trim()) {
      setSnackbar({ open: true, message: 'Cluster Name is required.', severity: 'error' });
      return;
    }
    try {
      const payload = { name: newClusterName, description: newClusterDescription || null };
      const response = await axios.post<Cluster>(API_BASE_URL, payload);
      setClusters([response.data, ...clusters]);
      setSnackbar({ open: true, message: 'Cluster created successfully!', severity: 'success' });
      setNewClusterName("");
      setNewClusterDescription("");
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error creating cluster', severity: 'error' });
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fa' }}>
      <AppBar position="static" style={{ backgroundColor: 'transparent', padding: 0, boxShadow: 'none' }}>
        <Container disableGutters={true} maxWidth={false}>
          <Grid container sx={{ backgroundColor: '#1B4965', height: '80px', alignItems: 'center', px: 3 }}>
            <Typography variant="h6" component="div">
              Manage Clusters 📍
            </Typography>
          </Grid>
        </Container>
      </AppBar>

      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ md: 4, xs: 12 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Create New Cluster</Typography>
              <TextField 
                label="Cluster Name" 
                fullWidth 
                size="small" 
                sx={{ mb: 2 }} 
                value={newClusterName}
                onChange={e => setNewClusterName(e.target.value)}
              />
              <TextField 
                label="Description" 
                fullWidth 
                size="small" 
                sx={{ mb: 2 }} 
                value={newClusterDescription}
                onChange={e => setNewClusterDescription(e.target.value)}
              />
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ bgcolor: '#43a047', color: 'white', height: 48, borderRadius: 2 }}
                onClick={handleCreateCluster}
              >
                Save Cluster
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ md: 8, xs: 12 }}>
            <Paper sx={{ p: 3, borderRadius: 3, minHeight: '500px' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Existing Clusters</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
              ) : (
                <List>
                  {clusters.map((cluster) => (
                    <ClusterItem
                      key={cluster._id}
                      cluster={cluster}
                      onCityAdded={(updatedCluster) => {
                        setClusters(clusters.map(c => c._id === updatedCluster._id ? updatedCluster : c));
                        setSnackbar({ open: true, message: 'City added successfully!', severity: 'success' });
                      }}
                      onError={(message) => {
                        setSnackbar({ open: true, message, severity: 'error' });
                      }}
                    />
                  ))}
                  {clusters.length === 0 && (
                     <ListItem><ListItemText primary="No clusters found. Create one to get started!" /></ListItem>
                  )}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

// --- Child Component for a single Cluster (with Map) ---
interface ClusterItemProps {
  cluster: Cluster;
  onCityAdded: (updatedCluster: Cluster) => void;
  onError: (message: string) => void;
}

function MapClickHandler({ setPosition, setCityName, onError }: any) {
  const [clickedPosition, setClickedPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setClickedPosition(e.latlng);
      setPosition({ lat, lng });

      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const address = response.data.address;
        const name = address.city || address.town || address.village || 'Unknown Location';
        setCityName(name);
      } catch (err) {
        onError("Could not fetch city name from coordinates.");
        setCityName("Could not fetch name");
      }
    },
  });

  return clickedPosition === null ? null : <Marker position={clickedPosition}></Marker>;
}

const ClusterItem: React.FC<ClusterItemProps> = ({ cluster, onCityAdded, onError }) => {
  const [cityName, setCityName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: 10.3157, lng: 123.8854 });

  useEffect(() => {
    if (position) {
      setLat(position.lat.toFixed(6));
      setLng(position.lng.toFixed(6));
    }
  }, [position]);

  const handleAddCity = async (e: FormEvent) => {
    e.preventDefault();
    if (!cityName.trim() || !lat.trim() || !lng.trim()) {
      onError("City Name, Latitude, and Longitude are required.");
      return;
    }
    const newCityPayload = { name: cityName, coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) } };
    try {
      const response = await axios.post<Cluster>(`${API_BASE_URL}/${cluster._id}/cities`, newCityPayload);
      onCityAdded(response.data);
      setCityName("");
      setLat("");
      setLng("");
    } catch (err: any) {
      onError(`Error adding city: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
      <Typography variant="h6">{cluster.name}</Typography>
      {cluster.description && <Typography variant="body2" color="text.secondary">{cluster.description}</Typography>}

      {cluster.cities.length > 0 && (
        <List dense sx={{ my: 1 }}>
          {cluster.cities.map((city) => (
            <ListItem key={city.name} disablePadding>
              <ListItemText primary={city.name} secondary={`Lat: ${city.coordinates.lat}, Lng: ${city.coordinates.lng}`} />
            </ListItem>
          ))}
        </List>
      )}

      <Box component="form" onSubmit={handleAddCity} sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Add a new city (Click map to select)</Typography>
        
        <Box sx={{ height: '250px', width: '100%', mb: 2, borderRadius: 1, overflow: 'hidden' }}>
          
          <MapContainer center={[position.lat, position.lng]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler setPosition={setPosition} setCityName={setCityName} onError={onError} />
          </MapContainer>
        </Box>

        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField label="City Name" value={cityName} onChange={e => setCityName(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={6}>
            <TextField type="number" label="Latitude" value={lat} onChange={e => setLat(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid size={6}>
            <TextField type="number" label="Longitude" value={lng} onChange={e => setLng(e.target.value)} fullWidth size="small" />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" size="small" sx={{ mt: 2 }}>Add City</Button>
      </Box>
    </Paper>
  );
};

export default ClusterManager;