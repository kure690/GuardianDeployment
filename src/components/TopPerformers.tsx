import * as React from 'react';
import { useState, useEffect } from 'react';
import { Award, ShieldCheck, Building, User } from 'lucide-react';
import Grid from '@mui/material/Grid2';
import { Skeleton } from '@mui/material';

import config from '../config';

// --- Define Types ---
interface TopResponder {
  _id: string;
  firstName: string;
  lastName: string;
  incidentsHandled: number;
  profileImage?: string; 
}

interface TopOpCen {
  _id: string;
  firstName: string; 
  lastName: string;
  incidentsHandled: number;
  profileImage?: string; 
}

interface TopVolunteer {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  incidentsReported: number;
  profileImage?: string; 
}

// --- Helper: Construct Image URL ---
const getImageUrl = (path: string | undefined | null) => {
  if (!path) return undefined;
  // If it's already a full URL (e.g., from Google Auth or Cloudinary), return it
  if (path.startsWith('http') || path.startsWith('https')) {
    return path;
  }
  // Otherwise, prepend the server URL. 
  // Ensure we handle leading slashes gracefully to avoid double slashes.
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${config.GUARDIAN_SERVER_URL}/${cleanPath}`;
};

// --- Reusable List Item Component ---
const TopListItem = ({
  rank,
  icon: Icon,
  name,
  statistic,
  imageUrl,
}: {
  rank: number;
  icon: React.ElementType;
  name: string;
  statistic: string;
  imageUrl?: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-lg font-semibold text-gray-500 w-4">{rank}</div>
    {imageUrl ? (
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-9 h-9 rounded-full object-cover border border-slate-600"
        onError={(e) => {
          // Fallback to icon if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }} 
      />
    ) : null}
    
    {/* We render this div if:
      1. No imageUrl is provided
      2. The image fails to load (via the onError handler above hiding the img)
     */}
    <div className={`${imageUrl ? 'hidden' : 'flex'} w-9 h-9 rounded-full bg-slate-700/50 items-center justify-center`}>
      <Icon className="w-5 h-5 text-cyan-400" />
    </div>

    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-white truncate">{name}</div>
      <div className="text-xs text-gray-400">{statistic}</div>
    </div>
  </div>
);

// --- Loading Skeleton Component ---
const LoadingSkeleton = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex items-center gap-3">
    <Skeleton variant="text" width={20} sx={{ bgcolor: 'grey.800' }} />
    <Skeleton variant="circular" width={36} height={36} sx={{ bgcolor: 'grey.800' }} />
    <div className="flex-1 min-w-0">
      <Skeleton variant="text" width="80%" sx={{ bgcolor: 'grey.800' }} />
      <Skeleton variant="text" width="50%" sx={{ bgcolor: 'grey.800' }} />
    </div>
  </div>
);

// --- Main Component ---
export default function TopPerformers() {
  const [topResponders, setTopResponders] = useState<TopResponder[]>([]);
  const [topOpcens, setTopOpcens] = useState<TopOpCen[]>([]);
  const [topVolunteers, setTopVolunteers] = useState<TopVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      // Removed the URL check strictness for local dev, but keep token check
      if (!token) {
        setError("Missing auth token");
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [resResponders, resOpcens, resVolunteers] = await Promise.all([
          fetch(`${config.GUARDIAN_SERVER_URL}/stats/top-responders`, { headers }),
          fetch(`${config.GUARDIAN_SERVER_URL}/stats/top-opcens`, { headers }),
          fetch(`${config.GUARDIAN_SERVER_URL}/stats/top-volunteers`, { headers }),
        ]);

        if (!resResponders.ok || !resOpcens.ok || !resVolunteers.ok) {
          throw new Error('Failed to fetch top performer data');
        }

        const dataResponders = await resResponders.json();
        const dataOpcens = await resOpcens.json();
        const dataVolunteers = await resVolunteers.json();

        setTopResponders(dataResponders);
        setTopOpcens(dataOpcens);
        setTopVolunteers(dataVolunteers);

        setLoading(false);

      } catch (err) {
        console.error("Error fetching top performers:", err);
        setError(err instanceof Error ? err.message : "Failed to load data.");
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  return (
    <Grid container spacing={4} sx={{ flex: 1, minHeight: 0 }}>
      
      {/* Top Responders */}
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 w-full flex flex-col">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Top Responders
          </h3>
          <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <LoadingSkeleton key={i} icon={User} />)
            ) : (
              topResponders.map((r, i) => (
                <TopListItem
                  key={r._id}
                  rank={i + 1}
                  icon={User}
                  name={`${r.firstName} ${r.lastName}`}
                  statistic={`${r.incidentsHandled} Incidents`}
                  // Pass the processed image URL
                  imageUrl={getImageUrl(r.profileImage)}
                />
              ))
            )}
          </div>
        </div>
      </Grid>

      {/* Top Operation Centers */}
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 w-full flex flex-col">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
            <Building className="w-4 h-4 text-cyan-400" />
            Top Operation Centers
          </h3>
          <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <LoadingSkeleton key={i} icon={Building} />)
            ) : (
              topOpcens.map((o, i) => (
                <TopListItem
                  key={o._id}
                  rank={i + 1}
                  icon={Building}
                  name={`${o.firstName} ${o.lastName}`}
                  statistic={`${o.incidentsHandled} Incidents`}
                  // Pass the processed image URL
                  imageUrl={getImageUrl(o.profileImage)}
                />
              ))
            )}
          </div>
        </div>
      </Grid>

      {/* Top Volunteers */}
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 w-full flex flex-col">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
            <Award className="w-4 h-4 text-cyan-400" />
            Top Volunteers
          </h3>
          <div className="space-y-4 flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <LoadingSkeleton key={i} icon={Award} />)
            ) : (
              topVolunteers.map((v, i) => (
                <TopListItem
                  key={v._id}
                  rank={i + 1}
                  icon={Award}
                  name={`${v.firstName} ${v.lastName}`}
                  statistic={`Rank: ${v.rank.charAt(0).toUpperCase() + v.rank.slice(1)}`}
                  // Pass the processed image URL
                  imageUrl={getImageUrl(v.profileImage)}
                />
              ))
            )}
          </div>
        </div>
      </Grid>

    </Grid>
  );
}