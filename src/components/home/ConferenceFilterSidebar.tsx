"use client";

import { useState } from "react";
import { ChevronDown, MapPin, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainOption { id: string; label: string; count: number; }
const DEFAULT_DOMAINS: DomainOption[] = [
  { id: "ia", label: "Informatique & IA", count: 48 },
  { id: "med", label: "Sciences médicales", count: 34 },
  { id: "phy", label: "Physique & Chimie", count: 27 },
  { id: "hum", label: "Sciences humaines", count: 22 },
  { id: "eng", label: "Ingénierie", count: 31 },
  { id: "law", label: "Droit & Sciences politiques", count: 18 },
];

type FormatFilter = "all" | "in_person" | "online" | "hybrid";
const FORMAT_OPTIONS: { id: FormatFilter; label: string }[] = [
  { id: "all", label: "Tous les formats" },
  { id: "in_person", label: "Présentiel" },
  { id: "online", label: "En ligne" },
  { id: "hybrid", label: "Hybride" },
];

type StatusKey = "open" | "coming_soon" | "closed";
const STATUS_OPTIONS: { id: StatusKey; label: string; dotClass: string }[] = [
  { id: "open", label: "Ouvertes", dotClass: "bg-emerald-500" },
  { id: "coming_soon", label: "Bientôt ouvertes", dotClass: "bg-amber-500" },
  { id: "closed", label: "Fermées", dotClass: "bg-slate-400" },
];

export interface FiltersState {
  domains: Set<string>;
  format: FormatFilter;
  statuses: Set<StatusKey>;
  fromDate: string;
  toDate: string;
  location: string;
}

interface ConferenceFilterSidebarProps {
  domains?: DomainOption[];
  initialFilters?: Partial<FiltersState>;
  onApply?: (filters: FiltersState) => void;
}

export function ConferenceFilterSidebar({
  domains = DEFAULT_DOMAINS,
  initialFilters,
  onApply,
}: ConferenceFilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [filters, setFilters] = useState<FiltersState>(() => ({
    domains: new Set(initialFilters?.domains ?? ["ia"]),
    format: initialFilters?.format ?? "all",
    statuses: new Set(
      initialFilters?.statuses ?? (["open", "coming_soon"] as StatusKey[])
    ),
    fromDate: initialFilters?.fromDate ?? "",
    toDate: initialFilters?.toDate ?? "",
    location: initialFilters?.location ?? "",
  }));

  const toggleDomain = (id: string) =>
    setFilters((f) => {
      const next = new Set(f.domains);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, domains: next };
    });

  const toggleStatus = (id: StatusKey) =>
    setFilters((f) => {
      const next = new Set(f.statuses);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, statuses: next };
    });

  const reset = () =>
    setFilters({
      domains: new Set(),
      format: "all",
      statuses: new Set(),
      fromDate: "",
      toDate: "",
      location: "",
    });

  const activeCount =
    filters.domains.size +
    filters.statuses.size +
    (filters.format !== "all" ? 1 : 0) +
    (filters.fromDate ? 1 : 0) +
    (filters.toDate ? 1 : 0) +
    (filters.location.trim() ? 1 : 0);

  return (
    <aside className="w-full flex-shrink-0 lg:w-72">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="filters-panel"
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          Filtres
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", mobileOpen && "rotate-180")} />
      </button>

      <div
        id="filters-panel"
        className={cn(
          "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20 lg:block",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Filtres</h2>
          <button type="button" onClick={reset} className="text-xs font-medium text-blue-600 hover:underline">
            Réinitialiser
          </button>
        </div>

        <FilterGroup title="Domaine scientifique">
          <div className="space-y-2">
            {domains.map((d) => (
              <label key={d.id} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filters.domains.has(d.id)}
                  onChange={() => toggleDomain(d.id)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{d.label}</span>
                <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                  {d.count}
                </span>
              </label>
            ))}
          </div>
        </FilterGroup>

        <Divider />

        <FilterGroup title="Format">
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="format"
                  checked={filters.format === opt.id}
                  onChange={() => setFilters((f) => ({ ...f, format: opt.id }))}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterGroup>

        <Divider />

        <FilterGroup title="Statut des inscriptions">
          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filters.statuses.has(opt.id)}
                  onChange={() => toggleStatus(opt.id)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                  <span className={cn("h-2 w-2 rounded-full", opt.dotClass)} />
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FilterGroup>

        <Divider />

        <FilterGroup title="Période">
          <div className="space-y-2">
            <div>
              <label htmlFor="filter-from" className="mb-1 block text-xs text-slate-500">Du</label>
              <input
                id="filter-from"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label htmlFor="filter-to" className="mb-1 block text-xs text-slate-500">Au</label>
              <input
                id="filter-to"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </FilterGroup>

        <Divider />

        <FilterGroup title="Pays / Ville">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              placeholder="Ex: Paris, France"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </FilterGroup>

        <button
          type="button"
          onClick={() => { onApply?.(filters); setMobileOpen(false); }}
          className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300"
        >
          Appliquer les filtres
        </button>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-4 border-t border-slate-100" />;
}