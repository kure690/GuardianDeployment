import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  MapPin, 
  FileText, 
  Clock,
  CheckCircle,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import Grid from '@mui/material/Grid2';
import { Box } from '@mui/material';
import GuardianIcon from "../assets/images/icon-removebg-preview.png";

import config from '../config';
import IncidentsOverview from './IncidentsDashboard';
import TopPerformers from '../components/TopPerformers';

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
}

const DonutChart = ({
  values,
  colors,
  size = 160,
  thickness = 20,
  label,
  sublabel
}: {
  values: number[];
  colors: string[];
  size?: number;
  thickness?: number;
  label?: string | number;
  sublabel?: string;
}) => {
  const total = values.reduce((sum, v) => sum + v, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          stroke="rgba(255,255,255,0.1)"
          fill="none"
        />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {values.map((value, index) => {
            const length = total > 0 ? (value / total) * circumference : 0;
            const dashArray = `${length} ${circumference - length}`;
            const dashOffset = -cumulative;
            cumulative += length;
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={thickness}
                stroke={colors[index % colors.length]}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: 'stroke-dasharray 0.6s ease-out',
                  filter: 'drop-shadow(0 0 8px rgba(0, 194, 255, 0.4))'
                }}
              />
            );
          })}
        </g>
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {label !== undefined && (
            <div className="text-4xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {label}
            </div>
          )}
          {sublabel && (
            <div className="text-sm text-gray-400 mt-1">{sublabel}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function DataDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');

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
    if (incidents.length === 0) {
      return {
        total: 0,
        accepted: 0,
        verified: 0,
        resolved: 0,
        finished: 0,
        avgResponseMins: "0.0",
        typeCounts: {},
        recentIncidents: [],
        mostCommonType: 'N/A',
        perTypeAvgResponseMins: {},
        incidentsToday: 0
      };
    }

    const today = new Date().toDateString();
    const incidentsToday = incidents.filter(inc => new Date(inc.createdAt).toDateString() === today).length;
    const total = incidents.length;
    const accepted = incidents.filter(inc => inc.isAccepted).length;
    const verified = incidents.filter(inc => inc.isVerified).length;
    const resolved = incidents.filter(inc => inc.isResolved).length;
    const finished = incidents.filter(inc => inc.isFinished).length;

    const responseTimes = incidents
      .filter(inc => inc.acceptedAt && inc.onSceneAt)
      .map(inc => new Date(inc.onSceneAt!).getTime() - new Date(inc.acceptedAt!).getTime());

    const avgResponseTimeMs = responseTimes.length
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    const avgResponseMins = (avgResponseTimeMs / 1000 / 60);

    const perTypeAccumulator = incidents.reduce((acc, inc) => {
      const type = inc.incidentType || 'Unknown';
      if (inc.acceptedAt && inc.onSceneAt) {
        const delta = new Date(inc.onSceneAt).getTime() - new Date(inc.acceptedAt).getTime();
        if (!acc[type]) acc[type] = { sum: 0, count: 0 };
        acc[type].sum += delta;
        acc[type].count += 1;
      }
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    const allTypes = Array.from(new Set(incidents.map(inc => inc.incidentType || 'Unknown')));
    const perTypeAvgResponseMins = allTypes.reduce((out, type) => {
      const acc = perTypeAccumulator[type];
      if (acc && acc.count > 0) {
        const mins = (acc.sum / acc.count) / 1000 / 60;
        out[type] = mins.toFixed(1);
      } else {
        out[type] = 'N/A';
      }
      return out;
    }, {} as Record<string, string>);

    const typeCounts = incidents.reduce((acc, inc) => {
      const type = inc.incidentType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonType = Object.keys(typeCounts).length > 0
      ? Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0][0]
      : 'N/A';

    const recentIncidents = [...incidents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      total,
      accepted,
      verified,
      resolved,
      finished,
      avgResponseMins: avgResponseMins.toFixed(1),
      typeCounts,
      recentIncidents,
      mostCommonType,
      perTypeAvgResponseMins,
      incidentsToday
    };
  }, [incidents]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'responders', label: 'Responders', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className="h-full bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 p-6">
            {sidebarOpen ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Box
                      component="img"
                      src={GuardianIcon}
                      alt="Guardian Icon"
                      sx={{
                        width: 45,
                        height: 45,
                        borderColor: 'white',
                        borderWidth: 0.1,
                        borderStyle: 'solid',
                        borderRadius: '10%'
                      }}
                    />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      Guardian
                    </h1>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </>
            ) : (
              <div className="flex justify-center items-start">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800/50 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <Box sx={{ mb: 2, flexShrink: 0 }} className="px-6 pt-6">
            <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {activeView === 'incidents' ? 'Incidents Overview' : 'Dashboard Overview'}
            </h2>
            <p className="text-sm text-gray-400">
              {activeView === 'incidents' ? 'Live map and incident heatmap' : 'Real-time incident monitoring and analytics'}
            </p>
          </Box>

          <div className="flex-1 min-h-0 overflow-hidden px-6 pb-6">
            {activeView === 'incidents' ? (
              <IncidentsOverview />
            ) : (
              
              <Grid container spacing={4} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Grid size={{ xs: 12, lg: 9 }} sx={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0, overflow: 'hidden' }}>
              
              {/* ... inside the main Grid size={{ xs: 12, lg: 9 }} ... */}

<Grid container spacing={4} sx={{ flexShrink: 0 }}>
  
  {/* Total Incidents Card */}
  <Grid size={{ xs: 12, md: 6 }}>
    {/* CHANGED: Set fixed height to h-80 (20rem/320px) to match Top Performers height */}
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 hover:border-cyan-500/30 transition-all duration-300 h-80 flex flex-col">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
        <Activity className="w-4 h-4 text-cyan-400" />
        Total Incidents
      </h3>
      <div className="flex items-center gap-4 flex-1 min-h-0">
        {/* Donut Chart */}
        <div className="flex-shrink-0">
          <DonutChart
            values={Object.entries(stats.typeCounts).sort(([,a], [,b]) => b - a).slice(0, 4).map(([, count]) => count)}
            colors={["#06b6d4", "#3b82f6", "#a855f7", "#f59e0b"]}
            size={120}
            thickness={16}
            label={stats.total.toLocaleString()}
            sublabel="Total"
          />
        </div>
        
        {/* Combined Stats */}
        <div className="flex-1 space-y-2 min-w-0 overflow-y-auto custom-scrollbar pr-1">
          {/* Status Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-slate-800/50 rounded-lg p-1.5 border border-slate-700/50 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Verified</div>
              <div className="text-lg font-bold text-green-400">{stats.verified}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-1.5 border border-slate-700/50 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Resolved</div>
              <div className="text-lg font-bold text-blue-400">{stats.resolved}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-1.5 border border-slate-700/50 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Today</div>
              <div className="text-lg font-bold text-cyan-400">{stats.incidentsToday}</div>
            </div>
          </div>

          {/* Incident Types List */}
          <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/30">
            <div className="text-xs font-semibold text-gray-400 mb-1.5">Breakdown by Type</div>
            <div className="space-y-1.5">
              {Object.entries(stats.typeCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count], index) => { // Removed .slice(0,4) so you can scroll if many types
                  const colors = ["#06b6d4", "#3b82f6", "#a855f7", "#f59e0b"];
                  const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></div>
                      <span className="text-xs text-gray-300 flex-1 truncate">{type}</span>
                      <span className="text-xs font-semibold text-white">{percentage}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Grid>

  {/* Average Response Time Card */}
  <Grid size={{ xs: 12, md: 6 }}>
    {/* CHANGED: Set fixed height to h-80 (20rem/320px) to match Top Performers height */}
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-3 hover:border-cyan-500/30 transition-all duration-300 h-80 flex flex-col">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2 flex-shrink-0">
        <Clock className="w-4 h-4 text-cyan-400" />
        Average Response Time
      </h3>
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-3 mb-3 border border-cyan-500/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">Overall Average</div>
            <div className="text-xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {stats.avgResponseMins} mins
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable list for incident types */}
      <div className="space-y-2.5 flex-1 overflow-auto custom-scrollbar pr-1">
        {Object.entries(stats.perTypeAvgResponseMins)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([type, mins], index) => {
            const colors = ["#06b6d4", "#3b82f6", "#a855f7", "#f59e0b", "#10b981", "#ef4444"];
            const numericVal = parseFloat(mins);
            const maxTime = Math.max(...Object.values(stats.perTypeAvgResponseMins).map(v => parseFloat(v)).filter(v => !isNaN(v))) || 1;
            const barWidth = isNaN(numericVal) || numericVal <= 0 ? 0 : (numericVal / maxTime) * 100;
            const displayVal = isNaN(numericVal) || numericVal <= 0 ? 'N/A' : `${mins} mins`;

            return (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }}></div>
                    <span className="text-sm text-gray-300">{type}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{displayVal}</span>
                </div>
                <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: colors[index % colors.length],
                      boxShadow: `0 0 10px ${colors[index % colors.length]}40`
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  </Grid>
</Grid>
              <TopPerformers />
              </Grid>
              <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
                
                {/* Recent Alerts Card */}
                {/* ADDED: h-80 to fix the height, flex/flex-col to manage layout */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 h-105 flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-cyan-400" />
                    Recent Alerts
                  </h3>
                  
                  {/* ADDED: flex-1 and overflow-auto so the list fills the space but scrolls if needed */}
                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {stats.recentIncidents.slice(0, 3).map((incident: Incident) => (
                      <div key={incident._id} className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
                        <div className="text-sm font-semibold text-cyan-400 mb-1">{incident.incidentType}</div>
                        <div className="text-xs text-gray-400">{new Date(incident.createdAt).toLocaleTimeString()}</div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            incident.isFinished ? 'bg-green-500/20 text-green-400' :
                            incident.isResolved ? 'bg-blue-500/20 text-blue-400' :
                            incident.isVerified ? 'bg-purple-500/20 text-purple-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {incident.isFinished ? 'Finished' : incident.isResolved ? 'Resolved' : incident.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Optional: Placeholder if empty to show the box is still there */}
                    {stats.recentIncidents.length === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                        No recent alerts
                      </div>
                    )}
                  </div>
                </div>

                
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-lg font-semibold">System Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Active</span>
                      <span className="text-lg font-bold text-green-400">{stats.accepted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Pending</span>
                      <span className="text-lg font-bold text-yellow-400">{stats.total - stats.accepted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Response Avg</span>
                      <span className="text-lg font-bold text-cyan-400">{stats.avgResponseMins}m</span>
                    </div>
                  </div>
                </div>
              </Grid>
            </Grid>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}