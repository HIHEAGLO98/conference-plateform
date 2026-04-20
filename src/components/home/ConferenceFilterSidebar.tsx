"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, MapPin, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DOMAIN_DEFINITIONS,
  countActiveFilters,
  emptyFilters,
  parseConferenceFiltersFromParams,
  serializeConferenceFilters,
  type ConferenceFilters,
  type FormatFilter,
  type StatusKey,
} from "@/lib/queries/conference-filters";

const FORMAT_OPTIONS: { id: FormatFilter | ""; label: string }[] = [
  { id: "", label: "Tous les formats" },
  { id: "in_person", label: "Présentiel" },
  { id: "online", label: "En ligne" },
  { id: "hybrid", label: "Hybride" },
];

const STATUS_OPTIONS: { id: StatusKey; label: string; dotClass: string }[] = [
  { id: "open", label: "Ouvertes", dotClass: "bg-emerald-500" },
  { id: "coming_soon", label: "Bientôt ouvertes", dotClass: "bg-amber-500" },
  { id: "closed", label: "Fermées", dotClass: "bg-slate-400" },
];

interface ConferenceFilterSidebarProps {
  /** Compteurs optionnels par ID de domaine. */
  domainCounts?: Record<string, number>;
}

/**
 * Barre latérale de filtres - client component lié à l'URL.
 *
 * Flux :
 *   URL - parseConferenceFiltersFromParams - state local
 *   state local - serializeConferenceFilters - router.push(?…)
 *   Le Server Component `page.tsx` re-fetch avec les nouveaux filtres.
 */
export function ConferenceFilterSidebar({
  domainCounts,
}: ConferenceFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<ConferenceFilters>(() =>
    parseConferenceFiltersFromParams(searchParams)
  );

  // Resync state si l'URL change (back/forward, click "Tendances", chip…).
  const searchKey = searchParams.toString();
  useEffect(() => {
    setFilters(parseConferenceFiltersFromParams(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

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

  const navigateWith = (next: ConferenceFilters) => {
    const params = serializeConferenceFilters(next);
    params.delete("page"); // reset pagination à chaque changement de filtre
    const qs = params.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => router.push(href, { scroll: false }));
    setMobileOpen(false);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigateWith(filters);
  };

  const handleReset = () => {
    const blank = emptyFilters();
    setFilters(blank);
    navigateWith(blank);
  };

  const activeCount = countActiveFilters(filters);

  return (
    <aside className="w-full flex-shrink-0 lg:w-72">
      {/* Mobile toggle */}
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

      <form
        id="filters-panel"
        onSubmit={handleSubmit}
        className={cn(
          "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20 lg:block",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Filtres
            {activeCount > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {activeCount}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleReset}
            disabled={activeCount === 0 || isPending}
            className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            Réinitialiser
          </button>
        </div>

        {/* Domaine */}
        <FilterGroup title="Domaine scientifique">
          <div className="space-y-2">
            {DOMAIN_DEFINITIONS.map((d) => (
              <label key={d.id} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filters.domains.has(d.id)}
                  onChange={() => toggleDomain(d.id)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{d.label}</span>
                {typeof domainCounts?.[d.id] === "number" && (
                  <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                    {domainCounts[d.id]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </FilterGroup>

        <Divider />

        {/* Format */}
        <FilterGroup title="Format">
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((opt) => (
              <label key={opt.id || "all"} className="flex cursor-pointer items-center gap-2.5">
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

        {/* Statut */}
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

        {/* Période */}
        <FilterGroup title="Période">
          <div className="space-y-2">
            <div>
              <label htmlFor="filter-from" className="mb-1 block text-xs text-slate-500">Du</label>
              <input
                id="filter-from"
                type="date"
                value={filters.fromDate}
                max={filters.toDate || undefined}
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
                min={filters.fromDate || undefined}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </FilterGroup>

        <Divider />

        {/* Pays / Ville */}
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
          type="submit"
          disabled={isPending}
          className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Application…" : "Appliquer les filtres"}
        </button>
      </form>
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