import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppBar, Typography, Button, Box, Container, Paper, TextField, List, ListItem, ListItemText, Snackbar, Alert, CircularProgress, Divider, ToggleButtonGroup, ToggleButton, ListItemButton
} from '@mui/material';
import Grid from "@mui/material/Grid";
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple } from 'leaflet';
import config from '../config';

// --- Leaflet Icon Fix (No Changes) ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- Configuration (No Changes) ---
const mapCenter: LatLngTuple = [10.3157, 123.8854]; // Default center: Cebu City
const APP_BAR_HEIGHT = 80; // Define AppBar height for layout calculations

// --- TypeScript Interfaces (No Changes) ---
interface Boundary {
  _id: string;
  name: string;
  cluster: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
}
interface Cluster {
  _id: string;
  name: string;
  description?: string;
}

// --- Map Helper Components (No Changes) ---
const DrawingCanvas: React.FC<{ polygonPath: LatLngTuple[] | null, setPolygonPath: (path: LatLngTuple[] | null) => void }> = ({ polygonPath, setPolygonPath }) => {
    useMap().on('click', (e) => {
        const newPoint: LatLngTuple = [e.latlng.lat, e.latlng.lng];
        const newPath = polygonPath ? [...polygonPath, newPoint] : [newPoint];
        setPolygonPath(newPath);
    });
    return polygonPath ? <Polygon positions={polygonPath} color="#1e4976" /> : null;
};

const ChangeView = ({ center, zoom }: { center: LatLngTuple, zoom: number }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const MapViewController: React.FC<{ bounds: L.LatLngBoundsExpression | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      // Add some padding so the boundary isn't touching the map edges
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null; // This component doesn't render any HTML
};

// --- Main Refactored Component ---
const ClusterBoundaryManager: React.FC = () => {
  // --- STATE LIFTED TO PARENT ---
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);
  const [loading, setLoading] = useState({ clusters: true, boundaries: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [boundsToFit, setBoundsToFit] = useState<L.LatLngBoundsExpression | null>(null);

  // State for creating clusters
  const [newClusterName, setNewClusterName] = useState("");
  const [newClusterDescription, setNewClusterDescription] = useState("");
  
  // State for creating boundaries (now lives in the parent)
  const [newBoundaryName, setNewBoundaryName] = useState("");
  const [polygonPath, setPolygonPath] = useState<LatLngTuple[] | null>(null);
  const [creationMode, setCreationMode] = useState<'draw' | 'search'>('draw');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedGeometry, setSearchedGeometry] = useState<any | null>(null);
  
  // --- DATA FETCHING ---
  const fetchClusters = useCallback(async () => {
    setLoading(prev => ({ ...prev, clusters: true }));
    try {
      const response = await axios.get<Cluster[]>(`${config.GUARDIAN_SERVER_URL}/clusters`);
      setClusters(response.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch clusters.', severity: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, clusters: false }));
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  // REPLACE your old useEffect with this one
useEffect(() => {
  // If no cluster is selected, clear boundaries and do nothing else.
  if (!selectedCluster) {
    setBoundaries([]);
    return;
  }

  // This flag will track if the component is still "interested" in the result.
  let isActive = true;

  const fetchBoundaries = async () => {
    setLoading(prev => ({ ...prev, boundaries: true }));
    try {
      const response = await axios.get<Boundary[]>(`${config.GUARDIAN_SERVER_URL}/boundaries/cluster/${selectedCluster._id}`);
      
      // *** IMPORTANT ***
      // Only update the state if this effect is still active.
      if (isActive) {
        setBoundaries(response.data);
      }
    } catch (err) {
      if (isActive) {
        setSnackbar({ open: true, message: `Could not fetch boundaries for ${selectedCluster.name}`, severity: 'error' });
      }
    } finally {
      if (isActive) {
        setLoading(prev => ({ ...prev, boundaries: false }));
      }
    }
  };

  fetchBoundaries();

  // --- The Cleanup Function ---
  // This runs when the effect is re-run (i.e., when selectedCluster changes)
  // or when the component unmounts. It "cancels" the previous request's
  // ability to update the state.
  return () => {
    isActive = false;
  };
}, [selectedCluster]); // The effect depends directly on the selected cluster


  // --- HANDLERS (Now in Parent) ---
  const handleError = (message: string) => setSnackbar({ open: true, message, severity: 'error' });

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

  // REPLACE your old handleSelectCluster function with this one
const handleSelectCluster = (cluster: Cluster) => {
  // Always set the clicked cluster as the selected one.
  setSelectedCluster(cluster);

  // Clear any pending boundary creation state from a previous selection.
  setPolygonPath(null);
  setSearchedGeometry(null);
  setNewBoundaryName("");
};

const handleSearchAddress = async () => {
  if (!searchQuery.trim()) {
    handleError("Please enter a location to search.");
    return;
  }
  setIsSearching(true);
  setSearchedGeometry(null);
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&polygon_geojson=1`;
    const response = await axios.get(url);
    if (response.data && response.data.length > 0) {
      const firstResult = response.data[0];
      if (firstResult.geojson) {
        setSearchedGeometry(firstResult.geojson);
        setNewBoundaryName(firstResult.display_name?.split(',')[0] || "");

        // --- NEW CODE TO CENTER THE MAP ---
        const { boundingbox } = firstResult;
        // The API returns [south, north, west, east]
        // Leaflet's fitBounds needs [[south, west], [north, east]]
        const southWest: LatLngTuple = [parseFloat(boundingbox[0]), parseFloat(boundingbox[2])];
        const northEast: LatLngTuple = [parseFloat(boundingbox[1]), parseFloat(boundingbox[3])];
        setBoundsToFit([southWest, northEast]);
        // --- END OF NEW CODE ---

      } else {
        handleError("No boundary found for this location. Try a city/state/country.");
      }
    } else {
      handleError("Location not found.");
    }
  } catch (err) {
    handleError("Failed to fetch location data.");
  } finally {
    setIsSearching(false);
  }
};
  
  // REPLACE your old handleCreateBoundary function with this one
const handleCreateBoundary = async () => {
  if (!selectedCluster) {
    handleError("Please select a cluster first.");
    return;
  }
  if (!newBoundaryName.trim()) {
    handleError("Boundary Name is required.");
    return;
  }

  let geometryPayload: any = null;
  if (creationMode === 'draw' && polygonPath && polygonPath.length >= 3) {
    const closedPath = [...polygonPath, polygonPath[0]];
    geometryPayload = {
      type: "Polygon",
      coordinates: [closedPath.map(p => [p[1], p[0]])],
    };
  } else if (creationMode === 'search' && searchedGeometry) {
    geometryPayload = searchedGeometry;
  }

  if (!geometryPayload) {
    handleError("A valid boundary must be drawn or found via search.");
    return;
  }

  const payload = {
    name: newBoundaryName,
    clusterId: selectedCluster._id,
    geometry: geometryPayload,
  };

  try {
    // Expect the new boundary object back from the server
    const response = await axios.post<Boundary>(`${config.GUARDIAN_SERVER_URL}/boundaries`, payload);
    const newBoundary = response.data;

    // *** IMPORTANT ***
    // Add the new boundary to our state directly instead of re-fetching
    setBoundaries(currentBoundaries => [...currentBoundaries, newBoundary]);

    setSnackbar({ open: true, message: 'Boundary created successfully!', severity: 'success' });
    setNewBoundaryName("");
    setPolygonPath(null);
    setSearchedGeometry(null);
    setSearchQuery("");
  } catch (err: any) {
    handleError(err.response?.data?.message || "Error creating boundary");
  }
};

  // Helper to combine drawn/searched boundaries with existing ones for map display
  const allBoundariesToDisplay = useMemo(() => {
    // Map over existing boundaries and mark them as not new
    const geoJsonFeatures: any[] = boundaries.map(b => ({ 
      type: "Feature", 
      geometry: b.geometry, 
      properties: { name: b.name, isNew: false } 
    }));
  
    // If there's a searched boundary, add it and mark it as new
    if (searchedGeometry) {
      geoJsonFeatures.push({ 
        type: "Feature", 
        geometry: searchedGeometry, 
        properties: { name: "New Boundary Preview", isNew: true } 
      });
    }
    
    return { type: "FeatureCollection", features: geoJsonFeatures } as any;
  }, [boundaries, searchedGeometry]);

  // Add this function before your component's return statement
  const geoJsonStyle = (feature?: any) => {
    if (feature?.properties?.isNew) {
      // Style for the new, searched boundary (orange and thicker)
      return {
          color: '#ff7800', 
          weight: 5,
          opacity: 0.8,
      };
    }
    // Default style for existing, saved boundaries (blue)
    return {
        color: '#3388ff',
        weight: 3,
        opacity: 0.65,
    };
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f7f9fa' }}>
      <AppBar position="static" style={{ backgroundColor: '#1B4965', height: `${APP_BAR_HEIGHT}px`, flexShrink: 0 }}>
        <Container maxWidth={false} sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6">Manage Clusters & Boundaries 📍</Typography>
        </Container>
      </AppBar>

      {/* --- NEW TWO-PANE LAYOUT --- */}
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>

        {/* --- LEFT PANE (CONTROLS) --- */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', height: `calc(100vh - ${APP_BAR_HEIGHT}px)` }}>
          <Paper sx={{ m: 2, p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Create New Cluster</Typography>
              <TextField label="Cluster Name" fullWidth size="small" sx={{ mb: 2 }} value={newClusterName} onChange={e => setNewClusterName(e.target.value)} />
              <TextField label="Description (Optional)" fullWidth size="small" sx={{ mb: 2 }} value={newClusterDescription} onChange={e => setNewClusterDescription(e.target.value)} />
              <Button variant="contained" fullWidth sx={{ bgcolor: '#43a047', '&:hover': { bgcolor: '#388e3c' }, height: 48, borderRadius: 2 }} onClick={handleCreateCluster}>
                Save Cluster
              </Button>
          </Paper>

          <Paper sx={{ m: 2, mt: 0, p: 3, borderRadius: 3, flexGrow: 1, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Existing Clusters</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select a cluster to manage its boundaries.</Typography>
            
            {loading.clusters ? <CircularProgress /> : (
              <List>
                {clusters.map((cluster) => (
                  <ListItemButton
                    key={cluster._id}
                    selected={selectedCluster?._id === cluster._id}
                    onClick={() => handleSelectCluster(cluster)}
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemText primary={cluster.name} secondary={cluster.description} />
                  </ListItemButton>
                ))}
              </List>
            )}

            {/* Boundary management section - only shows when a cluster is selected */}
            {selectedCluster && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Manage Boundaries for: {selectedCluster.name}</Typography>
                
                {/* List of existing boundaries */}
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Existing Boundaries</Typography>
                {loading.boundaries ? <CircularProgress size={20} /> : boundaries.length > 0 ? (
                  <List dense>
                    {boundaries.map(b => <ListItem key={b._id}><ListItemText primary={b.name} /></ListItem>)}
                  </List>
                ) : <Typography variant="body2" color="text.secondary">No boundaries created yet.</Typography>}

                <Divider sx={{ my: 2 }} />

                {/* Boundary creation form */}
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Create New Boundary</Typography>
                <ToggleButtonGroup
                    color="primary" value={creationMode} exclusive
                    onChange={(e, newMode) => { if (newMode) setCreationMode(newMode); }} sx={{ mb: 2 }}
                >
                    <ToggleButton value="draw">Draw Manually</ToggleButton>
                    <ToggleButton value="search">Search</ToggleButton>
                </ToggleButtonGroup>

                {creationMode === 'search' && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField label="Search Location" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} fullWidth size="small" />
                        <Button variant="contained" onClick={handleSearchAddress} disabled={isSearching}>{isSearching ? <CircularProgress size={24} /> : 'Search'}</Button>
                    </Box>
                )}
                <TextField label="Boundary Name" value={newBoundaryName} onChange={e => setNewBoundaryName(e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={handleCreateBoundary}>Save Boundary</Button>
                    <Button variant="outlined" onClick={() => { setPolygonPath(null); setSearchedGeometry(null); }}>Clear Drawing</Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* --- RIGHT PANE (MAP) --- */}
        <Grid item xs={12} md={8} sx={{ height: `calc(100vh - ${APP_BAR_HEIGHT}px)` }}>
   <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />

    {/* Add this new component here */}
    <MapViewController bounds={boundsToFit} />

    {/* Display all boundaries for the selected cluster */}
    // AFTER
    <GeoJSON 
  key={`${selectedCluster?._id || 'no-selection'}-${boundaries.length}-${!!searchedGeometry}`} 
  data={allBoundariesToDisplay} 
  style={geoJsonStyle}
/>
    
    {/* Drawing canvas is only active when in draw mode */}
    {selectedCluster && creationMode === 'draw' && (
      <DrawingCanvas polygonPath={polygonPath} setPolygonPath={setPolygonPath} />
    )}
  </MapContainer>
</Grid>

      </Grid>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ClusterBoundaryManager;

