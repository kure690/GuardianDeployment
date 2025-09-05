import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppBar, Typography, Button, Box, Container, Paper, TextField, List, ListItem, ListItemText, Snackbar, Alert, CircularProgress, Divider
} from '@mui/material';
import Grid from "@mui/material/Grid";
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple } from 'leaflet';
import config from '../config';

// --- Leaflet Icon Fix (to prevent default icon errors) ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// --- Configuration ---
const mapContainerStyle = { height: '350px', width: '100%', borderRadius: '8px', marginBottom: '16px', backgroundColor: '#e0e0e0' };
const mapCenter: LatLngTuple = [10.3157, 123.8854]; // Default center: Cebu City

// --- TypeScript Interfaces ---
interface Boundary {
  _id: string;
  name: string;
  cluster: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface Cluster {
  _id: string;
  name: string;
  description?: string;
}

// --- Main Component ---
const ClusterBoundaryManager: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [newClusterName, setNewClusterName] = useState("");
  const [newClusterDescription, setNewClusterDescription] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(true);

  const fetchClusters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<Cluster[]>(`${config.GUARDIAN_SERVER_URL}/clusters`);
      setClusters(response.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch clusters. Is the server running?', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const handleCreateCluster = async () => {
    if (!newClusterName.trim()) {
      setSnackbar({ open: true, message: 'Cluster Name is required.', severity: 'error' });
      return;
    }
    try {
      const payload = { name: newClusterName, description: newClusterDescription || undefined };
      await axios.post<Cluster>(`${config.GUARDIAN_SERVER_URL}/clusters`, payload);
      setSnackbar({ open: true, message: 'Cluster created successfully!', severity: 'success' });
      setNewClusterName("");
      setNewClusterDescription("");
      fetchClusters();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Error creating cluster', severity: 'error' });
    }
  };

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  // --- THIS IS THE FIX ---
  // These functions are now wrapped in `useCallback` to give them a stable identity.
  // This prevents them from being recreated on every render of this component,
  // which stops the child `ClusterItem` components from re-fetching their data unnecessarily.
  const handleBoundaryAdded = useCallback(() => {
    setSnackbar({ open: true, message: 'Boundary created successfully!', severity: 'success' });
  }, []);

  const handleError = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fa' }}>
      <AppBar position="static" style={{ backgroundColor: '#1B4965', padding: '0 24px' }}>
        <Typography variant="h6" component="div" sx={{ height: '80px', display: 'flex', alignItems: 'center' }}>
          Manage Clusters & Boundaries 📍
        </Typography>
      </AppBar>

      <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item md={4} xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Create New Cluster</Typography>
              <TextField label="Cluster Name" fullWidth size="small" sx={{ mb: 2 }} value={newClusterName} onChange={e => setNewClusterName(e.target.value)} />
              <TextField label="Description (Optional)" fullWidth size="small" sx={{ mb: 2 }} value={newClusterDescription} onChange={e => setNewClusterDescription(e.target.value)} />
              <Button variant="contained" fullWidth sx={{ bgcolor: '#43a047', '&:hover': { bgcolor: '#388e3c' }, height: 48, borderRadius: 2 }} onClick={handleCreateCluster}>
                Save Cluster
              </Button>
            </Paper>
          </Grid>

          <Grid item md={8} xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3, minHeight: '500px' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Existing Clusters</Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
              ) : (
                clusters.length > 0 ? clusters.map((cluster) => (
                  <ClusterItem
                    key={cluster._id}
                    cluster={cluster}
                    onBoundaryAdded={handleBoundaryAdded}
                    onError={handleError}
                  />
                )) : <Typography>No clusters found. Create one to get started!</Typography>
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


// --- Child Component for Drawing on the Map ---
interface DrawingCanvasProps {
  polygonPath: LatLngTuple[] | null;
  setPolygonPath: (path: LatLngTuple[] | null) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ polygonPath, setPolygonPath }) => {
    useMapEvents({
        click(e) {
            const newPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
            const newPath = polygonPath ? [...polygonPath, newPoint] : [newPoint];
            setPolygonPath(newPath);
        },
    });

    return polygonPath ? <Polygon positions={polygonPath} color="#1e4976" /> : null;
};


// --- Child Component for a single Cluster and its Boundaries ---
interface ClusterItemProps {
  cluster: Cluster;
  onBoundaryAdded: () => void;
  onError: (message: string) => void;
}

const ClusterItem: React.FC<ClusterItemProps> = ({ cluster, onBoundaryAdded, onError }) => {
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);
  const [newBoundaryName, setNewBoundaryName] = useState("");
  const [polygonPath, setPolygonPath] = useState<LatLngTuple[] | null>(null);
  const [loadingBoundaries, setLoadingBoundaries] = useState(true);

  const fetchBoundaries = useCallback(async () => {
    try {
      setLoadingBoundaries(true);
      const response = await axios.get<Boundary[]>(`${config.GUARDIAN_SERVER_URL}/boundaries/cluster/${cluster._id}`);
      setBoundaries(response.data);
    } catch (err) {
      onError(`Could not fetch boundaries for ${cluster.name}`);
    } finally {
      setLoadingBoundaries(false);
    }
  }, [cluster._id, cluster.name, onError]);

  useEffect(() => {
    fetchBoundaries();
  }, [fetchBoundaries]);

  const handleCreateBoundary = async () => {
    if (!newBoundaryName.trim()) {
      onError("Boundary Name is required.");
      return;
    }
    if (!polygonPath || polygonPath.length < 3) {
      onError("A valid polygon (at least 3 points) must be drawn on the map.");
      return;
    }
    
    const closedPath = [...polygonPath, polygonPath[0]];
    const coordinates = [closedPath.map(p => [p[1], p[0]])]; // Convert [lat, lng] to [lng, lat] for GeoJSON

    const payload = {
      name: newBoundaryName,
      clusterId: cluster._id,
      geometry: {
        type: "Polygon",
        coordinates: coordinates,
      }
    };

    try {
      await axios.post(`${config.GUARDIAN_SERVER_URL}/boundaries`, payload);
      onBoundaryAdded();
      setNewBoundaryName("");
      setPolygonPath(null);
      fetchBoundaries();
    } catch (err: any) {
      onError(err.response?.data?.message || "Error creating boundary");
    }
  };

  return (
    <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2 }}>
      <Typography variant="h6">{cluster.name}</Typography>
      {cluster.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{cluster.description}</Typography>}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Existing Boundaries</Typography>
      {loadingBoundaries ? <CircularProgress size={20} /> : (
        boundaries.length > 0 ? (
          <List dense>
            {boundaries.map((boundary) => (
              <ListItem key={boundary._id} disablePadding>
                <ListItemText primary={boundary.name} />
              </ListItem>
            ))}
          </List>
        ) : <Typography variant="body2" color="text.secondary">No boundaries created yet.</Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" sx={{ mb: 2 }}>Create New Boundary (Click on map to draw)</Typography>
      <Box style={mapContainerStyle}>
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <DrawingCanvas polygonPath={polygonPath} setPolygonPath={setPolygonPath} />
          </MapContainer>
      </Box>
      <TextField label="Boundary Name" value={newBoundaryName} onChange={e => setNewBoundaryName(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleCreateBoundary} disabled={!polygonPath}>
          Save Boundary
        </Button>
        <Button variant="outlined" onClick={() => setPolygonPath(null)} disabled={!polygonPath}>
          Clear Drawing
        </Button>
      </Box>
    </Paper>
  );
};

export default ClusterBoundaryManager;

