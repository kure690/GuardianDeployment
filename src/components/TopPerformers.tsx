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
  profileImage?: string; // Optional
}

interface TopOpCen {
  _id: string;
  firstName: string; // Your schema uses firstName/lastName for OpCen
  lastName: string;
  incidentsHandled: number;
  profileImage?: string; // Optional
}

interface TopVolunteer {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  incidentsReported: number;
  profileImage?: string; // Optional
}

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
      <img src={imageUrl} alt={name} className="w-9 h-9 rounded-full object-cover" />
    ) : (
      <div className="w-9 h-9 rounded-full bg-slate-700/50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
    )}
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
      if (!token || !config.GUARDIAN_SERVER_URL) {
        setError("Missing token or server URL");
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        /* NOTE: These endpoints don't exist yet. You will need to create them.
          See the explanation below on how to build the backend logic.
          For now, I will use mock data to demonstrate the UI.
        */

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

        // --- MOCK DATA (Remove this when endpoints are live) ---
        // setTimeout(() => {
        //   setTopResponders([
        //     { _id: 'r1', firstName: 'John', lastName: 'Doe', incidentsHandled: 128 },
        //     { _id: 'r2', firstName: 'Maria', lastName: 'Cruz', incidentsHandled: 112 },
        //     { _id: 'r3', firstName: 'Alex', lastName: 'Smith', incidentsHandled: 98 },
        //   ]);
        //   setTopOpcens([
        //     { _id: 'o1', firstName: 'Cebu City', lastName: 'OpCen', incidentsHandled: 430 },
        //     { _id: 'o2', firstName: 'Mandaue City', lastName: 'DRRMO', incidentsHandled: 375 },
        //     { _id: 'o3', firstName: 'Lapu-Lapu', lastName: 'Rescue', incidentsHandled: 310 },
        //   ]);
        //   setTopVolunteers([
        //     { _id: 'v1', firstName: 'Jane', lastName: 'Smith', rank: 'angel', incidentsReported: 95 },
        //     { _id: 'v2', firstName: 'Peter', lastName: 'Jones', rank: 'angel', incidentsReported: 81 },
        //     { _id: 'v3', firstName: 'Emily', lastName: 'Tan', rank: 'sentinel', incidentsReported: 102 },
        //   ]);
        //   setLoading(false);
        // }, 1500);
        // --- End of Mock Data ---

      } catch (err) {
        console.error("Error fetching top performers:", err);
        setError(err instanceof Error ? err.message : "Failed to load data.");
        setLoading(false);
      }
    };

    fetchTopPerformers();
    setLoading(false);
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
          <div className="space-y-4 flex-1 overflow-auto">
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
          <div className="space-y-4 flex-1 overflow-auto">
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
          <div className="space-y-4 flex-1 overflow-auto">
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
                />
              ))
            )}
          </div>
        </div>
      </Grid>

    </Grid>
  );
}