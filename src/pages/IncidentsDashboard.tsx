import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle,
  MapPin,
  Clock,
  TrendingUp,
  Flame,
  Activity
} from 'lucide-react';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/material';

import config from '../config';

interface Incident {
  _id: string;
  incidentType: string;
  isVerified: boolean;
  isResolved: boolean;
  isFinished: boolean;
  isAccepted: boolean;
  createdAt: string;
  acceptedAt?: string;
  resolvedAt?: string;
  onSceneAt?: string;
  responderStatus?: string;
  location?: {
    address?: string;
  };
}

export default function IncidentsOverview() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }
      
      if (!config.GUARDIAN_SERVER_URL) {
        setError("API server URL is not configured.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${config.GUARDIAN_SERVER_URL}/incidents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const data: Incident[] = await response.json();
        setIncidents(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError(err instanceof Error ? err.message : "Failed to load incident data.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    // Poll for new data every 30 seconds
    const intervalId = setInterval(fetchIncidents, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const stats = useMemo(() => {
    const activeIncidents = incidents.filter(inc => 
      inc.isAccepted && !inc.isFinished
    ).slice(0, 5);

    return {
      activeIncidents
    };
  }, [incidents]);

  const getTimeSince = (dateString: string) => {
    const mins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr`;
    return `${Math.floor(hours / 24)} day`;
  };

  const getStatusColor = (incident: Incident) => {
    if (incident.isFinished) return 'bg-green-500/20 text-green-400';
    if (incident.isResolved) return 'bg-blue-500/20 text-blue-400';
    if (incident.onSceneAt) return 'bg-cyan-500/20 text-cyan-400';
    if (incident.isAccepted) return 'bg-purple-500/20 text-purple-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const getStatusText = (incident: Incident) => {
    if (incident.isFinished) return 'Finished';
    if (incident.isResolved) return 'Resolved';
    if (incident.onSceneAt) return 'On Scene';
    if (incident.isAccepted) return 'En Route';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left Column - 8 cols */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Incident Map */}
          <Box className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 flex flex-col" sx={{ flex: 1, minHeight: 0 }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Incident Overview Map
              </h3>
              <div className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-700/50 flex-1">
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                  {/* Mock map background */}
                  <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  
                  {/* Map pins */}
                  <div className="absolute inset-0 p-8">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const colors = ['#ef4444', '#f97316', '#06b6d4', '#3b82f6'];
                      const left = 15 + (Math.random() * 70);
                      const top = 15 + (Math.random() * 70);
                      return (
                        <div
                          key={i}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                          style={{ left: `${left}%`, top: `${top}%` }}
                        >
                          <MapPin 
                            className="w-8 h-8 drop-shadow-lg animate-pulse"
                            style={{ color: colors[i % colors.length] }}
                            fill={colors[i % colors.length]}
                          />
                          <div className="absolute hidden group-hover:block bg-slate-950 text-xs px-3 py-2 rounded-lg shadow-xl border border-cyan-500/30 z-10 -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <div className="font-semibold text-cyan-400">Medical</div>
                            <div className="text-gray-400">Status: Active</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-300">Critical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-gray-300">High Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span className="text-gray-300">Medium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-300">Low</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats overlay */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-400">Active:</span>
                        <span className="text-cyan-400 font-bold">{stats.activeIncidents.length}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-400">Total Today:</span>
                        <span className="text-white font-bold">
                          {incidents.filter(inc => {
                            const today = new Date().toDateString();
                            return new Date(inc.createdAt).toDateString() === today;
                          }).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                  Type
                </button>
                <button className="px-4 py-2 bg-slate-800/50 text-gray-300 rounded-lg text-sm font-medium border border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                  Status
                </button>
                <button className="px-4 py-2 bg-slate-800/50 text-gray-300 rounded-lg text-sm font-medium border border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                  Filters
                </button>
              </div>
          </Box>

          {/* Incident Heatmap */}
          <Box className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 flex flex-col" sx={{ flex: 1, minHeight: 0 }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Incident Heatmap
              </h3>
              <div className="space-y-2 overflow-auto">
                {/* Time labels */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-12 text-xs text-gray-500 flex-shrink-0"></div>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-gray-500 min-w-[20px]">
                      {i % 3 === 0 ? `${i}h` : ''}
                    </div>
                  ))}
                </div>
                
                {/* Days of week */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => {
                  const dayIncidents = incidents.filter(inc => {
                    const date = new Date(inc.createdAt);
                    return date.getDay() === dayIndex;
                  });
                  
                  const hourCounts = Array.from({ length: 24 }, (_, hour) => {
                    return dayIncidents.filter(inc => {
                      const date = new Date(inc.createdAt);
                      return date.getHours() === hour;
                    }).length;
                  });
                  
                  const maxCount = Math.max(...hourCounts, 1);
                  
                  return (
                    <div key={day} className="flex items-center gap-1">
                      <div className="w-12 text-xs text-gray-400 font-medium flex-shrink-0">{day}</div>
                      {hourCounts.map((count, hour) => {
                        const intensity = count / maxCount;
                        const bgColor = count === 0 
                          ? 'rgba(30, 41, 59, 0.3)' 
                          : `rgba(6, 182, 212, ${0.2 + intensity * 0.8})`;
                        
                        return (
                          <div
                            key={hour}
                            className="flex-1 aspect-square rounded-sm border border-slate-800/50 min-w-[20px] group relative cursor-pointer hover:border-cyan-500/50 transition-colors"
                            style={{ backgroundColor: bgColor }}
                            title={`${day} ${hour}:00 - ${count} incidents`}
                          >
                            <div className="absolute hidden group-hover:block bg-slate-950 text-xs px-3 py-2 rounded-lg shadow-xl border border-cyan-500/30 z-10 -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                              <div className="font-semibold text-cyan-400">{count} incidents</div>
                              <div className="text-gray-400">{day} {hour}:00</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-3 pt-4 text-xs text-gray-400">
                  <span>Less</span>
                  {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm border border-slate-800/50"
                      style={{ 
                        backgroundColor: intensity === 0 
                          ? 'rgba(30, 41, 59, 0.3)' 
                          : `rgba(6, 182, 212, ${0.2 + intensity * 0.8})`
                      }}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
          </Box>
        </Grid>

        {/* Right Column - 4 cols */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', minHeight: 0 }}>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 flex-1 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Active Incidents
            </h3>
            <div className="space-y-3 overflow-auto">
              {stats.activeIncidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active incidents</p>
                </div>
              ) : (
                stats.activeIncidents.map((incident) => (
                  <div
                    key={incident._id}
                    className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {incident.incidentType}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {incident._id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {incident.location?.address && (
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">{incident.location.address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(incident)}`}>
                        {getStatusText(incident)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeSince(incident.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
}