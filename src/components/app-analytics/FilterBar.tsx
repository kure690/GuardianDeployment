// src/components/app-analytics/FilterBar.tsx
// Demographic filters for the App Analytics page. Values match
// GuardianAPI/utils/analyticsFilters.js (query params are "|"-separated).
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Filter, Search, X } from "lucide-react";

export interface Filters {
  gender: string[];
  age: string[];
  city: string[];
  barangay: string[];
  volunteer: string[];
}

export const EMPTY_FILTERS: Filters = { gender: [], age: [], city: [], barangay: [], volunteer: [] };

export const filtersActive = (f: Filters) =>
  f.gender.length + f.age.length + f.city.length + f.barangay.length + f.volunteer.length > 0;

/** "gender=male&city=Cebu|Mandaue" (empty string when no filters). */
export const filtersToQuery = (f: Filters) =>
  (Object.keys(f) as (keyof Filters)[])
    .filter((k) => f[k].length)
    .map((k) => `${k}=${encodeURIComponent(f[k].join("|"))}`)
    .join("&");

interface Option {
  value: string;
  label: string;
  count?: number;
  city?: string | null;
}
export interface FilterOptions {
  genders: Option[];
  ages: Option[];
  cities: Option[];
  barangays: Option[];
  volunteers: Option[];
}

const FIELDS: { key: keyof Filters; label: string; optionsKey: keyof FilterOptions; search?: boolean }[] = [
  { key: "gender", label: "Gender", optionsKey: "genders" },
  { key: "age", label: "Age", optionsKey: "ages" },
  { key: "city", label: "City", optionsKey: "cities", search: true },
  { key: "barangay", label: "Barangay", optionsKey: "barangays", search: true },
  { key: "volunteer", label: "Volunteers", optionsKey: "volunteers", search: true },
];

function Dropdown({
  label,
  options,
  selected,
  onChange,
  searchable,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          selected.length
            ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
            : "bg-slate-900/60 text-gray-300 border-slate-800/60 hover:text-white"
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="text-xs bg-cyan-500/30 text-cyan-100 rounded-full px-1.5">{selected.length}</span>
        )}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2">
          {searchable && (
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1 bg-slate-800/60 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="bg-transparent text-sm text-white outline-none flex-1 min-w-0"
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {visible.length === 0 && <div className="text-xs text-gray-500 px-2 py-2">No matches</div>}
            {visible.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-200 hover:bg-slate-800/70 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="accent-cyan-500"
                />
                <span className="flex-1 truncate" title={o.label}>
                  {o.label}
                  {o.city && label === "Volunteers" && (
                    <span className="text-xs text-gray-500"> · {o.city}</span>
                  )}
                </span>
                {o.count !== undefined && <span className="text-xs text-gray-500">{o.count}</span>}
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full mt-1 text-xs text-gray-400 hover:text-white py-1.5"
            >
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({
  options,
  value,
  onChange,
}: {
  options: FilterOptions | null;
  value: Filters;
  onChange: (f: Filters) => void;
}) {
  // Barangay list follows the selected cities, if any.
  const scopedOptions = useMemo(() => {
    if (!options) return null;
    if (!value.city.length) return options;
    return {
      ...options,
      barangays: options.barangays.filter((b) => !b.city || value.city.includes(b.city)),
    };
  }, [options, value.city]);

  const labelFor = (key: keyof Filters, v: string) => {
    const field = FIELDS.find((f) => f.key === key)!;
    return options?.[field.optionsKey].find((o) => o.value === v)?.label ?? v;
  };

  const chips = (Object.keys(value) as (keyof Filters)[]).flatMap((k) =>
    value[k].map((v) => ({ key: k, value: v }))
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter by
        </span>
        {FIELDS.map((f) => (
          <Dropdown
            key={f.key}
            label={f.label}
            options={scopedOptions?.[f.optionsKey] ?? []}
            selected={value[f.key]}
            searchable={f.search}
            onChange={(vals) => onChange({ ...value, [f.key]: vals })}
          />
        ))}
        {chips.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs text-gray-400 hover:text-white px-2 py-1.5"
          >
            Clear all
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={`${c.key}:${c.value}`}
              className="inline-flex items-center gap-1 text-xs bg-slate-800/80 border border-slate-700 text-gray-200 rounded-full pl-2.5 pr-1 py-0.5"
            >
              <span className="text-gray-500">{FIELDS.find((f) => f.key === c.key)!.label}:</span>
              {labelFor(c.key, c.value)}
              <button
                type="button"
                aria-label={`Remove ${labelFor(c.key, c.value)}`}
                onClick={() => onChange({ ...value, [c.key]: value[c.key].filter((v) => v !== c.value) })}
                className="p-0.5 rounded-full hover:bg-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
