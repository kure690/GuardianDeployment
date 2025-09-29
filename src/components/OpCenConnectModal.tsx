import React, { useState, useEffect, useRef } from 'react';
import { Modal, Paper, Box, Typography, Avatar, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import config from '../config';
import { loadGoogleMaps } from '../utils/maps';

interface OpCenUser {
  _id: string;
  firstName: string;
  lastName: string;
  dispatcherType: string;
  location?: {
    type?: 'Point';
    coordinates?: [number, number]; // [lon, lat]
  };
  team?: string;
}

interface OpCenConnectModalProps {
  open: boolean;
  onClose: () => void;
  icon: string;
  incidentType: string | null;
  address: string;
  incidentCoordinates?: { lat: number; lon: number } | null;
  modalIncident: string;
  setModalIncident: (val: string) => void;
  customIncidentType: string;
  setCustomIncidentType: (val: string) => void;
  modalIncidentDescription: string;
  setModalIncidentDescription: (val: string) => void;
  handleConnect: (user: any) => void;
  onlineUsers: Set<string>;
  dispatcherTeamId?: string | null;
}

const OpCenConnectModal: React.FC<OpCenConnectModalProps> = ({
  open,
  onClose,
  icon,
  incidentType,
  address,
  incidentCoordinates,
  modalIncident,
  setModalIncident,
  customIncidentType,
  setCustomIncidentType,
  modalIncidentDescription,
  setModalIncidentDescription,
  handleConnect,
  onlineUsers,
  dispatcherTeamId,
}) => {
  const [opCenUsers, setOpCenUsers] = useState<OpCenUser[]>([]);
  const token = localStorage.getItem('token');
  const [routeInfoByUserId, setRouteInfoByUserId] = useState<Record<string, { distanceKm: number; durationMin: number }>>({});
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const lastRouteKeyRef = useRef<string | null>(null);

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const haversineDistanceKm = (
    lon1: number,
    lat1: number,
    lon2: number,
    lat2: number
  ) => {
    const R = 6371; // km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateTravelMinutes = (distanceKm: number, speedKmh = 30) => {
    if (!isFinite(distanceKm) || distanceKm <= 0 || !isFinite(speedKmh) || speedKmh <= 0) return 0;
    return Math.round((distanceKm / speedKmh) * 60);
  };

  const computeStraightLineForAll = () => {
    if (!incidentCoordinates) return;
    const accumulated: Record<string, { distanceKm: number; durationMin: number }> = {};
    opCenUsers.forEach((u) => {
      const [uLon, uLat] = u.location?.coordinates || ([] as any);
      if (typeof uLon === 'number' && typeof uLat === 'number') {
        const dKm = haversineDistanceKm(incidentCoordinates.lon, incidentCoordinates.lat, uLon, uLat);
        accumulated[u._id] = {
          distanceKm: dKm,
          durationMin: estimateTravelMinutes(dKm),
        };
      }
    });
    setRouteInfoByUserId(accumulated);
  };

  useEffect(() => {
    const fetchDrivingEstimates = async (routeKey: string) => {
      try {
        if (!incidentCoordinates) return;
        const usersWithCoords = opCenUsers.filter(u => Array.isArray(u.location?.coordinates) && typeof u.location!.coordinates![0] === 'number' && typeof u.location!.coordinates![1] === 'number');
        if (usersWithCoords.length === 0) return;

        if (!config.GOOGLE_MAPS_API_KEY) {
          computeStraightLineForAll();
          return;
        }
        // Only show loading spinner if we don't already have data for current inputs
        if (Object.keys(routeInfoByUserId).length === 0) setIsRouteLoading(true);
        const google = await loadGoogleMaps(config.GOOGLE_MAPS_API_KEY as unknown as string);
        const service = new google.maps.DistanceMatrixService();
        const accumulated: Record<string, { distanceKm: number; durationMin: number }> = {};

        const maxChunk = 25;
        for (let i = 0; i < usersWithCoords.length; i += maxChunk) {
          const chunk = usersWithCoords.slice(i, i + maxChunk);
          await new Promise<void>((resolve) => {
            service.getDistanceMatrix(
              {
                origins: chunk.map(u => ({ lat: u.location!.coordinates![1], lng: u.location!.coordinates![0] })),
                destinations: [{ lat: incidentCoordinates.lat, lng: incidentCoordinates.lon }],
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (response: any, status: any) => {
                if (status !== 'OK' || !response?.rows) {
                  resolve();
                  return;
                }
                response.rows.forEach((row: any, idx: number) => {
                  const element = row?.elements?.[0];
                  const user = chunk[idx];
                  if (!user || !element || element.status !== 'OK') return;
                  const distanceMeters = element.distance?.value;
                  const durationSeconds = element.duration?.value;
                  if (typeof distanceMeters === 'number' && typeof durationSeconds === 'number') {
                    accumulated[user._id] = {
                      distanceKm: distanceMeters / 1000,
                      durationMin: Math.round(durationSeconds / 60)
                    };
                  }
                });
                resolve();
              }
            );
          });
        }

        setRouteInfoByUserId(accumulated);
        lastRouteKeyRef.current = routeKey;
        console.info(`[OpCenConnectModal] Loaded driving estimates for ${Object.keys(accumulated).length}/${usersWithCoords.length} origins.`);
      } catch (e) {
        console.warn('[OpCenConnectModal] Distance Matrix (JS SDK) failed; falling back to straight-line.', e);
        computeStraightLineForAll();
      } finally {
        setIsRouteLoading(false);
      }
    };
    if (open) {
      // Build a stable key from incident coords + user coords
      const incKey = incidentCoordinates ? `${incidentCoordinates.lat.toFixed(5)},${incidentCoordinates.lon.toFixed(5)}` : 'none';
      const usersKey = opCenUsers
        .map(u => {
          const c = u.location?.coordinates;
          return c && typeof c[0] === 'number' && typeof c[1] === 'number'
            ? `${u._id}:${c[1].toFixed(5)},${c[0].toFixed(5)}`
            : `${u._id}:none`;
        })
        .join('|');
      const routeKey = `${incKey}__${usersKey}`;

      if (routeKey && routeKey !== lastRouteKeyRef.current) {
        // Clear previous only when inputs changed
        setRouteInfoByUserId({});
        setIsRouteLoading(false);
        fetchDrivingEstimates(routeKey);
      }
    }
  }, [open, opCenUsers, incidentCoordinates]);

  useEffect(() => {
    const fetchOpCenUsers = async () => {
      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/dispatchers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          let filtered = [];
          if (dispatcherTeamId) {
            filtered = (data || []).filter((user: OpCenUser) => 
              user.dispatcherType === 'LGU' && user.team === dispatcherTeamId
            );
          }
          setOpCenUsers(filtered);
        } else {
          setOpCenUsers([]);
        }
      } catch (error) {
        setOpCenUsers([]);
      }
    };
    if (open) fetchOpCenUsers();
  }, [open, token, dispatcherTeamId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="incident-modal"
      aria-describedby="incident-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '-80px',
      }}
    >
      <Paper 
        elevation={3}
        sx={{
        boxShadow: 24,
        p: 0,
        borderRadius: 2,
        width: '60%',
        background: '#1e4976',
      }}>
      <Box
        sx={{
          background: '#ef5350',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', 
          padding: '10px',
          marginTop: '15px' 
        }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', margin: '0 auto' }}>
          CONNECT TO OPERATION CENTER
        </Typography>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: 'white',
            padding: '2px',
            border: '2px solid white', 
            borderRadius: '50%',
            '& .MuiSvgIcon-root': { 
              fontSize: '18px', 
            }
          }}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          background: '#1e4976',
          p: '5px 0 5px 0',
          display: 'flex',
          height: '100%',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <Box 
          sx={{ 
          width: '50%',
          borderRight: '1px solid white',
          padding: 3,
          boxSizing: 'border-box'
        }}
        >
        <div style={{display: 'flex',gap: '9px'}}>
          <div>
            <Avatar src={icon} sx={{ width: 80, height: 80 }} alt={icon} />
          </div>
          <div style={{padding: '4px',display: 'flex',justifyContent: 'center',alignItems: 'start',flexDirection: 'column'}}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              {incidentType ? `${incidentType.toUpperCase()} CALL` : ""}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold',display: '-webkit-box',WebkitLineClamp: 2,WebkitBoxOrient: 'vertical',overflow: 'hidden',textOverflow: 'ellipsis'}} title={address || "Loading address..."}>
              {address || "Loading address..."}
            </Typography>
          </div>
        </div>
        <div style={{padding: '15px',display: 'flex',justifyContent: 'center',alignItems: 'center'}}>
          <Typography variant="h6" sx={{ color: '#ef5350', fontWeight: 'bold' }}>
            {incidentType?.toLowerCase() === 'medical' ? 'NEED AMBULANCE' :
            incidentType?.toLowerCase() === 'fire' ? 'NEED FIRETRUCK' :
            incidentType?.toLowerCase() === 'police' ? 'NEED POLICE CAR' :
            'NEED ASSISTANCE'}
          </Typography>
        </div>
        <div>
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            Type
          </Typography>
          {modalIncident === 'Other' ? (
            <TextField
              fullWidth
              placeholder="Enter custom incident type"
              value={customIncidentType}
              onChange={(e) => setCustomIncidentType(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 1, backgroundColor: 'white', borderRadius: 1 }}
            />
          ) : (
            <TextField
              select
              fullWidth
              value={modalIncident}
              onChange={(e) => setModalIncident(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 1, backgroundColor: 'white', borderRadius: 1 }}
              SelectProps={{ native: true }}
            >
              {incidentType?.toLowerCase() === 'medical' ? (
                <>
                  <option value="Vehicular crash">Vehicular crash</option>
                  <option value="Workplace injury">Workplace injury</option>
                  <option value="Fall/slip">Fall/slip</option>
                  <option value="Allergic reaction">Allergic reaction</option>
                  <option value="Sudden illness">Sudden illness</option>
                  <option value="Other">Other (specify)</option>
                </>
              ) : incidentType?.toLowerCase() === 'fire' ? (
                <>
                  <option value="Structure fire">Structure fire</option>
                  <option value="Wildland fire">Wildland fire</option>
                  <option value="Hazardous materials release">Hazardous materials release</option>
                  <option value="Gas leak">Gas leak</option>
                  <option value="Electrical malfunction">Electrical malfunction</option>
                  <option value="Other">Other (specify)</option>
                </>
              ) : incidentType?.toLowerCase() === 'police' ? (
                <>
                  <option value="Suspected robbery">Suspected robbery</option>
                  <option value="Domestic disturbance">Domestic disturbance</option>
                  <option value="Trespassing">Trespassing</option>
                  <option value="Traffic violation">Traffic violation</option>
                  <option value="Suspicious activity">Suspicious activity</option>
                  <option value="Other">Other (specify)</option>
                </>
              ) : (
                <>
                  <option value="Utility outage">Utility outage</option>
                  <option value="Flooding">Flooding</option>
                  <option value="Downed trees/power lines">Downed trees/power lines</option>
                  <option value="Public disturbance">Public disturbance</option>
                  <option value="Lost person">Lost person</option>
                  <option value="Other">Other (specify)</option>
                </>
              )}
            </TextField>
          )}
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            Message
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            value={modalIncidentDescription}
            onChange={(e) => setModalIncidentDescription(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ backgroundColor: 'white', borderRadius: 1 }}
          />
        </div>
        </Box>
        <Box 
          sx={{ flex: 1, borderLeft: '1px solid white', p: 2 }}
        >
          <div style={{background: '#f5f5f5', padding: '10px', borderRadius: '6px'}}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Available Operation Center</Typography>
            <div style={{display: 'flex', marginBottom: '10px'}}>
              <input type="text" placeholder="Search" style={{flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc'}} />
              <button style={{marginLeft: '8px', padding: '6px 10px', background: '#1e5a71', color: 'white', border: 'none', borderRadius: '4px'}}>Search</button>
            </div>
            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
              {isRouteLoading && Object.keys(routeInfoByUserId).length === 0 ? (
                <div style={{textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px',backgroundColor: '#f8f9fa',borderRadius: '4px',margin: '10px'}}>Calculating routes...</div>
              ) : opCenUsers.length > 0 ? (
                opCenUsers.map((user) => {
                  const isOnline = onlineUsers.has(user._id);
                  const [userLon, userLat] = user?.location?.coordinates || [] as any;
                  const hasCoords =
                    typeof userLon === 'number' &&
                    typeof userLat === 'number' &&
                    !!incidentCoordinates &&
                    typeof incidentCoordinates?.lon === 'number' &&
                    typeof incidentCoordinates?.lat === 'number';
                  const driving = routeInfoByUserId[user._id];
                  const distanceKm = driving?.distanceKm;
                  const etaMin = driving?.durationMin;
                  const distanceLabel = typeof distanceKm === 'number' ? `${distanceKm.toFixed(1)} KM` : '—';
                  const timeLabel = typeof etaMin === 'number' ? `${etaMin} Min` : '—';
                  return (
                    <div key={user._id} style={{display: 'flex', alignItems: 'center', padding: '6px', borderBottom: '1px solid #eee', marginBottom: '3px'}}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: isOnline ? 'success.main' : 'error.main',
                          }}
                        />
                        <div style={{fontSize: '14px'}}>{user.firstName} {user.lastName}</div>
                      </Box>
                      <div style={{marginRight: '10px', textAlign: 'right'}}>
                        <div style={{fontSize: '12px'}}>{timeLabel}</div>
                        <div style={{fontSize: '12px'}}>{distanceLabel}</div>
                      </div>
                      <button 
                        onClick={() => handleConnect(user)}
                        disabled={!isOnline}
                        style={{
                          padding: '4px 8px', 
                          background: isOnline ? '#1e5a71' : '#9E9E9E',
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          cursor: isOnline ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isOnline ? 'Connect' : 'Offline'}
                      </button>
                    </div>
                  )
                })
              ) : (
                <div style={{textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px',backgroundColor: '#f8f9fa',borderRadius: '4px',margin: '10px'}}>
                  No Operation Centers are currently available
                </div>
              )}
            </div>
            <div style={{textAlign: 'center', marginTop: '6px'}}>
              <button style={{background: 'none', border: 'none', color: '#1e5a71', fontSize: '14px'}}>More</button>
            </div>
          </div>
        </Box>
      </Box>
      </Paper>
    </Modal>
  );
};

export default OpCenConnectModal;
