// src/components/app-analytics/AppAnalytics.tsx
// Volunteer mobile app analytics (Google Analytics / Firebase), served by
// GuardianAPI /analytics/mobile/*.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  Eye,
  Heart,
  Layers,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Share2,
  Smartphone,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import config from "../../config";
import FilterBar, {
  EMPTY_FILTERS,
  filtersActive,
  filtersToQuery,
  type FilterOptions,
  type Filters,
} from "./FilterBar";

// ---------------------------------------------------------------- types
interface Overview {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  avgSessionDurationSec: number;
  totalEngagementSec: number;
  avgEngagementPerUserSec: number;
  screenViews: number;
  eventCount: number;
}
interface TrendPoint {
  date: string;
  activeUsers: number;
  sessions: number;
  engagementSec: number;
}
interface ScreenRow {
  screen: string;
  views: number;
  users: number;
  engagementSec: number;
  avgTimePerViewSec: number;
}
interface EventRow {
  name: string;
  count: number;
  users?: number;
  custom: boolean;
}
interface Summary {
  range: { days: number; startDate: string; endDate: string };
  generatedAt: string;
  overview: Overview;
  trend: TrendPoint[];
  screens: ScreenRow[];
  events: EventRow[];
  platforms: { platform: string; users: number }[];
  locations: { city: string; region: string; country: string; users: number; events: number }[];
}
interface AudienceRow {
  label: string;
  people: number;
  interactions: number;
}
interface AudienceGroup {
  people: number;
  interactions: number;
  gender: AudienceRow[];
  age: AudienceRow[];
  city: AudienceRow[];
  barangay: AudienceRow[];
}
interface Audience {
  range: { days: number; since: string };
  generatedAt: string;
  engaged: AudienceGroup;
  all: AudienceGroup;
}
type ReactionType = "likes" | "loves" | "hahas" | "wows" | "sads" | "angrys";
interface ReactionStats {
  range: { days: number; since: string };
  generatedAt: string;
  total: number;
  byType: { type: ReactionType; count: number }[];
  byPostType: { mainType: string; count: number }[];
  topPosts: {
    id: string;
    title: string;
    mainType: string;
    createdAt: string;
    total: number;
    byType: Record<ReactionType, number>;
  }[];
}
interface Realtime {
  generatedAt: string;
  windowMinutes: number;
  /** false when filters are on: Google's Realtime API can't filter events by user properties. */
  eventsAvailable?: boolean;
  activeUsers: number;
  screens: { screen: string; users: number }[];
  events: EventRow[];
}
interface ApiError {
  message: string;
  hint?: string;
  setupRequired?: boolean;
  /** Google can't filter by demographics yet (custom dimensions not registered). */
  gaFilterSetup?: boolean;
}

// ---------------------------------------------------------------- labels
// Route names logged by the app (expo-router segments) → readable labels.
const SCREEN_LABELS: Record<string, string> = {
  index: "App start",
  "(auth)": "Login",
  "(auth)/register": "Register",
  landing: "Alerts feed",
  "landing/messages": "Messages",
  "landing/id": "Volunteer ID",
  "landing/settings": "Settings",
  "landing/profile": "Profile",
  "landing/change-password": "Change password",
  "landing/(room)": "Report emergency",
  "landing/(room)/room-verification": "Incident status",
  "landing/(room)/map-view": "Incident map",
  "landing/(room)/loading-call": "Connecting call",
  "landing/(room)/video-call": "Video call",
  "landing/(room)/[id]": "Incident room",
};
const screenLabel = (s: string) => SCREEN_LABELS[s] ?? s;

const EVENT_LABELS: Record<string, string> = {
  post_react: "Reacted to a post",
  post_unreact: "Removed a reaction",
  reaction_picker_open: "Opened reaction picker",
  comments_open: "Opened comments",
  comment_post: "Posted a comment",
  comment_delete: "Deleted a comment",
  post_share: "Shared a post",
  post_share_cancel: "Cancelled a share",
  post_see_more: "Expanded a post",
  post_image_open: "Opened a post image",
  screen_view: "Screen view",
  session_start: "Session start",
  user_engagement: "Engagement ping",
  first_open: "First open (new install)",
  app_remove: "App removed",
  app_update: "App updated",
  os_update: "OS updated",
  notification_receive: "Notification received",
  notification_open: "Notification opened",
};
const eventLabel = (e: string) => EVENT_LABELS[e] ?? e;

const REACTION_META: Record<ReactionType, { emoji: string; label: string; color: string }> = {
  likes: { emoji: "👍", label: "Like", color: "#3b82f6" },
  loves: { emoji: "❤️", label: "Love", color: "#ec4899" },
  hahas: { emoji: "😂", label: "Haha", color: "#f59e0b" },
  wows: { emoji: "😮", label: "Wow", color: "#eab308" },
  sads: { emoji: "😢", label: "Sad", color: "#06b6d4" },
  angrys: { emoji: "😡", label: "Angry", color: "#f97316" },
};

// ---------------------------------------------------------------- format
const fmtNum = (n: number) => Math.round(n).toLocaleString();
const fmtDuration = (sec: number) => {
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};
const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// ---------------------------------------------------------------- data
async function apiGet<T>(path: string): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${config.GUARDIAN_SERVER_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = {
      message: body.message || `Request failed (${res.status})`,
      hint: body.hint,
      setupRequired: body.setupRequired,
    };
    throw err;
  }
  return body as T;
}

// ---------------------------------------------------------------- UI bits
const card =
  "bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-300";

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`${card} !p-4`}>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color = "#06b6d4" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

type TrendMetric = "activeUsers" | "sessions" | "engagementSec";
const TREND_METRICS: { id: TrendMetric; label: string }[] = [
  { id: "activeUsers", label: "Active users" },
  { id: "sessions", label: "Sessions" },
  { id: "engagementSec", label: "Time in app" },
];

function TrendChart({ data, metric }: { data: TrendPoint[]; metric: TrendMetric }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 200;
  const PAD = { l: 8, r: 8, t: 12, b: 24 };
  const values = data.map((d) => d[metric]);
  const max = Math.max(1, ...values);
  const x = (i: number) =>
    PAD.l + (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[metric])}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - PAD.b} L${x(0)},${H - PAD.b} Z`;
  const fmt = (v: number) => (metric === "engagementSec" ? fmtDuration(v) : fmtNum(v));
  const labelEvery = Math.ceil(data.length / 7);

  if (!data.length) return null;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-52"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const rel = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((rel - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
          setHover(Math.min(data.length - 1, Math.max(0, i)));
        }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.l}
            x2={W - PAD.r}
            y1={PAD.t + f * (H - PAD.t - PAD.b)}
            y2={PAD.t + f * (H - PAD.t - PAD.b)}
            stroke="rgba(148,163,184,0.12)"
          />
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#06b6d4" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="rgba(148,163,184,0.4)"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-500 -mt-5 px-1">
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <span key={d.date}>{fmtDay(d.date)}</span>
          ) : null
        )}
      </div>
      {hover !== null && (
        <div
          className="absolute top-0 pointer-events-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: `translateX(${hover > data.length / 2 ? "-105%" : "5%"})`,
          }}
        >
          <div className="text-gray-400">{fmtDay(data[hover].date)}</div>
          <div className="font-semibold text-white">{fmt(data[hover][metric])}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- page
export default function AppAnalytics() {
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [reactions, setReactions] = useState<ReactionStats | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [audienceView, setAudienceView] = useState<"engaged" | "all">("engaged");
  const [error, setError] = useState<ApiError | null>(null);
  const [gaFilterError, setGaFilterError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState<TrendMetric>("activeUsers");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  const isFiltered = filtersActive(filters);
  // "&gender=male&city=Cebu" appended to every request ("" when unfiltered).
  const fq = useMemo(() => {
    const q = filtersToQuery(filters);
    return q ? `&${q}` : "";
  }, [filters]);

  // Google sections: a "filters not registered in GA yet" error hides them
  // (rather than showing unfiltered numbers next to filtered ones).
  const handleGaError = (e: unknown) => {
    const err = e as ApiError;
    if (err.gaFilterSetup) {
      setGaFilterError(err);
      return true;
    }
    return false;
  };

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await apiGet<Summary>(`/analytics/mobile/summary?days=${days}${fq}`));
      setError(null);
      setGaFilterError(null);
    } catch (e) {
      if (handleGaError(e)) setSummary(null);
      else setError(e as ApiError);
    }
  }, [days, fq]);

  // Reactions come from the Guardian database (no Google processing delay).
  const loadReactions = useCallback(async () => {
    try {
      setReactions(await apiGet<ReactionStats>(`/analytics/mobile/reactions?days=${days}${fq}`));
    } catch {
      setReactions(null);
    }
  }, [days, fq]);

  // Demographics from volunteer profiles (gender, age, city, barangay).
  const loadAudience = useCallback(async () => {
    try {
      setAudience(await apiGet<Audience>(`/analytics/mobile/audience?days=${days}${fq}`));
    } catch {
      setAudience(null);
    }
  }, [days, fq]);

  const loadRealtime = useCallback(async () => {
    try {
      setRealtime(await apiGet<Realtime>(`/analytics/mobile/realtime?${fq.slice(1)}`));
    } catch (e) {
      if (handleGaError(e)) setRealtime(null);
      else setError((prev) => prev ?? (e as ApiError));
    }
  }, [fq]);

  // Dropdown options (cities, barangays, volunteers…) — once.
  useEffect(() => {
    apiGet<FilterOptions>("/analytics/mobile/filter-options")
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, []);

  // Initial load shows a spinner; later range/filter changes refresh in place.
  useEffect(() => {
    setRefreshing(true);
    Promise.all([loadSummary(), loadRealtime(), loadReactions(), loadAudience()]).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [loadSummary, loadRealtime, loadReactions, loadAudience]);

  // Realtime every 30s, summary every 5 min (server caches for the same periods).
  useEffect(() => {
    const rt = setInterval(loadRealtime, 30_000);
    const rx = setInterval(() => {
      loadReactions();
      loadAudience();
    }, 60_000);
    const sm = setInterval(loadSummary, 5 * 60_000);
    return () => {
      clearInterval(rt);
      clearInterval(rx);
      clearInterval(sm);
    };
  }, [loadRealtime, loadReactions, loadAudience, loadSummary]);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSummary(), loadRealtime(), loadReactions(), loadAudience()]);
    setRefreshing(false);
  };

  const feed = useMemo(() => {
    const count = (name: string) => summary?.events.find((e) => e.name === name)?.count ?? 0;
    return [
      { label: "Reactions", value: count("post_react"), icon: Heart },
      { label: "Comments posted", value: count("comment_post"), icon: MessageCircle },
      { label: "Shares", value: count("post_share"), icon: Share2 },
      { label: "Comments opened", value: count("comments_open"), icon: MessageCircle },
      { label: "Posts expanded", value: count("post_see_more"), icon: Eye },
      { label: "Images opened", value: count("post_image_open"), icon: Layers },
    ];
  }, [summary]);

  if (loading && !summary && !error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (error && !summary && !isFiltered) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className={`${card} max-w-xl text-center`}>
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
          <div className="text-lg font-semibold mb-2">
            {error.setupRequired ? "Analytics setup needed" : "Couldn't load analytics"}
          </div>
          <p className="text-sm text-gray-300 mb-2">{error.message}</p>
          {error.hint && <p className="text-sm text-cyan-300">{error.hint}</p>}
          <button
            onClick={refresh}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Try again
          </button>
        </div>
      </div>
    );
  }

  const o = summary?.overview;
  const maxScreenViews = Math.max(1, ...(summary?.screens.map((s) => s.views) ?? [0]));
  const visibleEvents = (summary?.events ?? []).filter((e) => showAllEvents || e.custom);
  const maxEvent = Math.max(1, ...visibleEvents.map((e) => e.count));
  const totalPlatformUsers = (summary?.platforms ?? []).reduce((s, p) => s + p.users, 0);
  const group = audience?.[audienceView];
  const maxLocationUsers = Math.max(1, ...(summary?.locations ?? []).map((l) => l.users));
  const maxPostTypeReactions = Math.max(1, ...(reactions?.byPostType.map((p) => p.count) ?? [0]));
  const noDataYet = o && o.activeUsers === 0;
  const showGa = !gaFilterError;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
          {([7, 28, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                days === d ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-gray-300 bg-slate-900/60 border border-slate-800/60 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
        <span className="text-xs text-gray-500 ml-auto">
          Daily reports can lag up to 24–48h · Live panel shows the last 30 minutes
        </span>
      </div>

      <FilterBar options={filterOptions} value={filters} onChange={setFilters} />

      {error && (
        <div className="text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
          {error.message} {error.hint}
        </div>
      )}

      {isFiltered && gaFilterError && (
        <div className="text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          <div className="font-semibold mb-0.5">
            Google Analytics sections are hidden while filters are on
          </div>
          <div className="text-yellow-200/80">
            {gaFilterError.message} {gaFilterError.hint} Reactions and Audience below are filtered.
          </div>
        </div>
      )}

      {isFiltered && showGa && (
        <div className="text-xs text-cyan-200/80 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-2">
          Filtered. Google Analytics sections only include volunteers using the app version that
          records demographics, from their next login onward. Reactions and Audience come from the
          database and include all history.
        </div>
      )}

      {showGa && (<>
      {/* Live + KPIs */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className={`${card} xl:col-span-1 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 !border-cyan-500/30`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            <h3 className="font-semibold">Live now</h3>
            <span className="text-xs text-gray-400">last 30 min</span>
          </div>
          <div className="text-5xl font-bold bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {fmtNum(realtime?.activeUsers ?? 0)}
          </div>
          <div className="text-xs text-gray-400 mb-4">active users</div>

          <div className="text-xs font-semibold text-gray-400 mb-2">On screen</div>
          <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
            {(realtime?.screens ?? []).length === 0 && (
              <div className="text-xs text-gray-500 italic">No one right now</div>
            )}
            {realtime?.screens.map((s) => (
              <div key={s.screen} className="flex justify-between text-sm">
                <span className="text-gray-300 truncate">{screenLabel(s.screen)}</span>
                <span className="font-semibold">{s.users}</span>
              </div>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-400 mb-2">Recent actions</div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {realtime && realtime.eventsAvailable === false ? (
              <div className="text-xs text-gray-500 italic">
                Not available with filters on (Google's live reports can't filter actions by
                demographics)
              </div>
            ) : (
              (realtime?.events ?? []).filter((e) => e.custom).length === 0 && (
                <div className="text-xs text-gray-500 italic">No feed actions yet</div>
              )
            )}
            {realtime?.events
              .filter((e) => e.custom)
              .map((e) => (
                <div key={e.name} className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate">{eventLabel(e.name)}</span>
                  <span className="font-semibold">{e.count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="xl:col-span-3 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Kpi icon={Users} label="Active users" value={fmtNum(o?.activeUsers ?? 0)} />
            <Kpi icon={UserPlus} label="New users" value={fmtNum(o?.newUsers ?? 0)} />
            <Kpi
              icon={Activity}
              label="Sessions"
              value={fmtNum(o?.sessions ?? 0)}
              sub={o ? `${fmtNum(o.engagedSessions)} engaged` : undefined}
            />
            <Kpi
              icon={Clock}
              label="Avg time in app / user"
              value={fmtDuration(o?.avgEngagementPerUserSec ?? 0)}
              sub={o ? `${fmtDuration(o.totalEngagementSec)} total` : undefined}
            />
            <Kpi icon={Zap} label="Avg session length" value={fmtDuration(o?.avgSessionDurationSec ?? 0)} />
            <Kpi
              icon={MousePointerClick}
              label="Screen views"
              value={fmtNum(o?.screenViews ?? 0)}
              sub={o ? `${fmtNum(o.eventCount)} events total` : undefined}
            />
          </div>

          <div className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Daily trend
              </h3>
              <div className="flex gap-1">
                {TREND_METRICS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetric(m.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg ${
                      metric === m.id ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {noDataYet ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-500 text-center px-6">
                No daily data yet. Google processes these reports with a 24–48h delay — check the
                Live panel for activity right now.
              </div>
            ) : (
              <TrendChart data={summary?.trend ?? []} metric={metric} />
            )}
          </div>
        </div>
      </div>

      {/* Screens + feed engagement */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className={card}>
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-cyan-400" /> Top screens
          </h3>
          {(summary?.screens ?? []).length === 0 ? (
            <div className="text-sm text-gray-500 italic">No screen data yet</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 text-xs text-gray-500">
                <span className="col-span-6">Screen</span>
                <span className="col-span-2 text-right">Views</span>
                <span className="col-span-2 text-right">Users</span>
                <span className="col-span-2 text-right">Avg time</span>
              </div>
              {summary?.screens.map((s) => (
                <div key={s.screen} className="space-y-1">
                  <div className="grid grid-cols-12 text-sm items-center">
                    <span className="col-span-6 text-gray-200 truncate" title={s.screen}>
                      {screenLabel(s.screen)}
                    </span>
                    <span className="col-span-2 text-right font-semibold">{fmtNum(s.views)}</span>
                    <span className="col-span-2 text-right text-gray-300">{fmtNum(s.users)}</span>
                    <span className="col-span-2 text-right text-gray-300">
                      {fmtDuration(s.avgTimePerViewSec)}
                    </span>
                  </div>
                  <Bar value={s.views} max={maxScreenViews} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-cyan-400" /> Feed engagement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {feed.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Icon className="w-3.5 h-3.5" /> {f.label}
                  </div>
                  <div className="text-xl font-bold">{fmtNum(f.value)}</div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-500">
            Counts of each action from Google Analytics. Reaction types are broken down below.
          </p>
        </div>
      </div>
      </>)}

      {/* Reactions (from the Guardian database) */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-cyan-400" /> Reactions
            <span className="text-xs font-normal text-gray-500">
              current reactions on posts, added in the last {days} days · live from the database
            </span>
          </h3>
          <div className="text-2xl font-bold">
            {fmtNum(reactions?.total ?? 0)} <span className="text-sm font-normal text-gray-400">total</span>
          </div>
        </div>

        {!reactions ? (
          <div className="text-sm text-gray-500 italic">Reaction data unavailable</div>
        ) : reactions.total === 0 ? (
          <div className="text-sm text-gray-500 italic">No reactions in this period</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* By reaction type */}
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-3">By reaction</div>
              <div className="space-y-3">
                {reactions.byType.map((r) => {
                  const meta = REACTION_META[r.type];
                  const pct = reactions.total ? Math.round((r.count / reactions.total) * 100) : 0;
                  return (
                    <div key={r.type} className="flex items-center gap-3">
                      <span className="w-7 text-xl text-center" aria-hidden>
                        {meta.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-200">{meta.label}</span>
                          <span className="font-semibold">
                            {fmtNum(r.count)}{" "}
                            <span className="text-xs font-normal text-gray-500">({pct}%)</span>
                          </span>
                        </div>
                        <Bar value={r.count} max={reactions.total} color={meta.color} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By post category */}
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-3">By post category</div>
              <div className="space-y-3">
                {reactions.byPostType.map((p) => (
                  <div key={p.mainType} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-200">{p.mainType}</span>
                      <span className="font-semibold">{fmtNum(p.count)}</span>
                    </div>
                    <Bar value={p.count} max={maxPostTypeReactions} color="#a855f7" />
                  </div>
                ))}
              </div>
            </div>

            {/* Most reacted posts */}
            <div>
              <div className="text-xs font-semibold text-gray-400 mb-3">Most reacted posts</div>
              <div className="space-y-2.5">
                {reactions.topPosts.map((p) => (
                  <div key={p.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
                    <div className="text-sm text-gray-200 line-clamp-2" title={p.title}>
                      {p.title}
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-500">
                        {p.mainType} · {fmtDay(p.createdAt.slice(0, 10))}
                      </span>
                      <span className="text-sm">
                        {(Object.keys(REACTION_META) as ReactionType[])
                          .filter((t) => p.byType[t] > 0)
                          .map((t) => (
                            <span key={t} className="ml-1.5">
                              {REACTION_META[t].emoji}
                              <span className="text-xs text-gray-300 ml-0.5">{p.byType[t]}</span>
                            </span>
                          ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audience demographics (volunteer profiles) */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Audience
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              From volunteer profiles (gender, date of birth, city and barangay entered at registration)
            </p>
          </div>
          <div className="flex bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
            {(
              [
                ["engaged", `Interacted (last ${days} days)`],
                ["all", "All registered volunteers"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAudienceView(id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  audienceView === id ? "bg-cyan-500/20 text-cyan-300" : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!group ? (
          <div className="text-sm text-gray-500 italic">Audience data unavailable</div>
        ) : group.people === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No volunteers reacted or commented in this period
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 mb-5 text-sm">
              <div>
                <span className="text-2xl font-bold">{fmtNum(group.people)}</span>{" "}
                <span className="text-gray-400">
                  {audienceView === "engaged" ? "volunteers interacted" : "registered volunteers"}
                </span>
              </div>
              {audienceView === "engaged" && (
                <div>
                  <span className="text-2xl font-bold">{fmtNum(group.interactions)}</span>{" "}
                  <span className="text-gray-400">reactions + comments</span>
                </div>
              )}
            </div>
            {audienceView === "engaged" && group.people < 5 && (
              <div className="text-xs text-yellow-300/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-4">
                Small group — with fewer than 5 people, these breakdowns may point to specific
                volunteers.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {(
                [
                  ["Gender", group.gender, "#3b82f6"],
                  ["Age", group.age, "#a855f7"],
                  ["City", group.city, "#06b6d4"],
                  ["Barangay", group.barangay, "#10b981"],
                ] as const
              ).map(([title, rows, color]) => (
                <div key={title}>
                  <div className="text-xs font-semibold text-gray-400 mb-3">{title}</div>
                  <div className="space-y-2.5">
                    {rows.map((r) => {
                      const pct = group.people ? Math.round((r.people / group.people) * 100) : 0;
                      return (
                        <div key={r.label} className="space-y-1">
                          <div className="flex justify-between gap-2 text-sm">
                            <span
                              className={`truncate ${r.label === "Unknown" ? "text-gray-500 italic" : "text-gray-200"}`}
                              title={r.label}
                            >
                              {r.label}
                            </span>
                            <span className="font-semibold whitespace-nowrap">
                              {fmtNum(r.people)}{" "}
                              <span className="text-xs font-normal text-gray-500">({pct}%)</span>
                            </span>
                          </div>
                          <Bar value={r.people} max={group.people} color={color} />
                          {audienceView === "engaged" && r.people > 0 && (
                            <div className="text-[11px] text-gray-500">
                              {fmtNum(r.interactions)} interactions
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* App usage by location (Google Analytics, IP-based) */}
        {showGa && (
        <div className="mt-6 pt-5 border-t border-slate-800/60">
          <div className="text-xs font-semibold text-gray-400 mb-1">Where the app is used</div>
          <p className="text-[11px] text-gray-500 mb-3">
            All app users in the last {days} days, approximate location from Google Analytics (based on
            the phone's internet connection, so it can be off by a city).
          </p>
          {(summary?.locations ?? []).length === 0 ? (
            <div className="text-sm text-gray-500 italic">No location data yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2.5">
              {summary?.locations.map((l) => (
                <div key={`${l.city}|${l.region}|${l.country}`} className="space-y-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-gray-200 truncate">
                      {l.city === "(not set)" ? "Unknown city" : l.city}
                      <span className="text-xs text-gray-500">
                        {" "}
                        · {l.region}, {l.country}
                      </span>
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {fmtNum(l.users)} <span className="text-xs font-normal text-gray-500">users</span>
                    </span>
                  </div>
                  <Bar value={l.users} max={maxLocationUsers} color="#06b6d4" />
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Events + platforms */}
      {showGa && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={`${card} xl:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-cyan-400" /> Actions (events)
            </h3>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllEvents}
                onChange={(e) => setShowAllEvents(e.target.checked)}
                className="accent-cyan-500"
              />
              Include automatic events
            </label>
          </div>
          {visibleEvents.length === 0 ? (
            <div className="text-sm text-gray-500 italic">No actions recorded in this period</div>
          ) : (
            <div className="space-y-3">
              {visibleEvents.map((e) => (
                <div key={e.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-200">
                      {eventLabel(e.name)}{" "}
                      <span className="text-xs text-gray-500 font-mono">{e.name}</span>
                    </span>
                    <span className="font-semibold">
                      {fmtNum(e.count)}
                      {e.users !== undefined && (
                        <span className="text-xs text-gray-500 font-normal"> · {fmtNum(e.users)} users</span>
                      )}
                    </span>
                  </div>
                  <Bar value={e.count} max={maxEvent} color={e.custom ? "#06b6d4" : "#64748b"} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-cyan-400" /> Platforms
          </h3>
          {totalPlatformUsers === 0 ? (
            <div className="text-sm text-gray-500 italic">No data yet</div>
          ) : (
            <div className="space-y-3">
              {summary?.platforms.map((p, i) => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-200">{p.platform}</span>
                    <span className="font-semibold">
                      {fmtNum(p.users)}{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        ({Math.round((p.users / totalPlatformUsers) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <Bar
                    value={p.users}
                    max={totalPlatformUsers}
                    color={["#06b6d4", "#3b82f6", "#a855f7"][i % 3]}
                  />
                </div>
              ))}
            </div>
          )}
          {summary && (
            <div className="text-xs text-gray-500 mt-6">
              {fmtDay(summary.range.startDate)} – {fmtDay(summary.range.endDate)} · updated{" "}
              {new Date(summary.generatedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
