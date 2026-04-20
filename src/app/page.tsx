import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, X } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ConferenceFilterSidebar } from "@/components/home/ConferenceFilterSidebar";
import { ConferenceCard } from "@/components/home/ConferenceCard";
import {
  CONFERENCES_PAGE_SIZE,
  listPublishedConferences,
} from "@/lib/queries/conferences";
import {
  DOMAIN_DEFINITIONS,
  countActiveFilters,
  parseConferenceFiltersFromRecord,
  serializeConferenceFilters,
  type ConferenceFilters,
} from "@/lib/queries/conference-filters";
import { prismaConferenceToHome } from "@/lib/adapters/conference";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

/**
 * Page d'accueil publique - Server Component.
 * Filtres et pagination passent par le query-string.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const sp = await searchParams;

  const page = parsePage(firstOf(sp.page));
  const filters = parseConferenceFiltersFromRecord(sp);

  const { items, page: currentPage, totalPages, total } =
    await listPublishedConferences({
      page,
      pageSize: CONFERENCES_PAGE_SIZE,
      filters,
    });

  const conferences = items.map((row) => prismaConferenceToHome(row));
  const hasActiveFilters = countActiveFilters(filters) > 0;

  return (
    <>
      <Navbar />

      <main>
        <HeroSection
          stats={{
            scientists: "1 240+",
            countries: 38,
            papers: "892",
            activeConferences: total,
            activeCountries: 38,
          }}
        />

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
            <ConferenceFilterSidebar />

            <div className="min-w-0 flex-1">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-heading text-base font-semibold text-slate-800">
                    {hasActiveFilters ? "Résultats filtrés" : "Conférences disponibles"}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {total} {total > 1 ? "résultats" : "résultat"} · page{" "}
                    <span className="font-medium text-blue-600">{currentPage}</span> / {totalPages}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    aria-label="Trier par"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    defaultValue="recent"
                  >
                    <option value="recent">Les plus récentes</option>
                    <option value="start">Date de début</option>
                    <option value="deadline">Date limite proche</option>
                    <option value="alpha">Alphabétique</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && <ActiveFilterChips filters={filters} />}

              {conferences.length > 0 ? (
                <div className="grid gap-4">
                  {conferences.map((conf) => (
                    <ConferenceCard key={conf.id} conference={conf} />
                  ))}
                </div>
              ) : (
                <EmptyState page={currentPage} hasActiveFilters={hasActiveFilters} />
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  filters={filters}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/*  Chips de filtres actifs (affichés au-dessus des cartes)  */

function ActiveFilterChips({ filters }: { filters: ConferenceFilters }) {
  const chips = buildChips(filters);
  if (chips.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.id}
          href={chip.removeHref}
          aria-label={`Retirer le filtre ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          <span>{chip.label}</span>
          <X className="h-3 w-3" aria-hidden />
        </Link>
      ))}
      <Link href="/" className="ml-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline">
        Tout effacer
      </Link>
    </div>
  );
}

function EmptyState({
  page,
  hasActiveFilters,
}: {
  page: number;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
        <Inbox className="h-6 w-6 text-blue-600" aria-hidden />
      </div>
      <h3 className="font-heading text-base font-semibold text-slate-800">
        {hasActiveFilters
          ? "Aucune conférence ne correspond à ces filtres"
          : "Aucune conférence à afficher"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasActiveFilters
          ? "Essayez d'élargir vos critères ou de réinitialiser les filtres."
          : page > 1
            ? "Cette page est vide. Revenez à la première page pour voir les conférences disponibles."
            : "Aucune conférence n'est publiée pour le moment. Revenez bientôt !"}
      </p>
      {(hasActiveFilters || page > 1) && (
        <Link
          href="/"
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700"
        >
          {hasActiveFilters ? "Réinitialiser les filtres" : "Retour à la page 1"}
        </Link>
      )}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  filters,
}: {
  currentPage: number;
  totalPages: number;
  filters: ConferenceFilters;
}) {
  const baseParams = serializeConferenceFilters(filters);
  const pageNumbers = buildPageList(currentPage, totalPages);
  const hrefFor = (p: number) => buildPageHref(baseParams, p);

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <PageArrow href={hrefFor(currentPage - 1)} disabled={currentPage <= 1} direction="prev" />
      {pageNumbers.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`e-${idx}`} aria-hidden className="px-1 text-sm text-slate-400">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === currentPage ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={
              p === currentPage
                ? "flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-200"
                : "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            }
          >
            {p}
          </Link>
        )
      )}
      <PageArrow href={hrefFor(currentPage + 1)} disabled={currentPage >= totalPages} direction="next" />
    </nav>
  );
}

function PageArrow({
  href, disabled, direction,
}: { href: string; disabled: boolean; direction: "prev" | "next" }) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Page précédente" : "Page suivante";
  if (disabled) {
    return (
      <span
        aria-label={label}
        aria-disabled
        className="cursor-not-allowed rounded-lg border border-slate-200 p-2 text-slate-300 opacity-50"
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

/*  Helpers  */

function firstOf(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function buildPageHref(baseParams: URLSearchParams, page: number): string {
  const next = new URLSearchParams(baseParams);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const qs = next.toString();
  return qs ? `/?${qs}` : "/";
}

function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "ellipsis"> = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);
  if (windowStart > 2) pages.push("ellipsis");
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
  if (windowEnd < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

/*  Chips  */

interface Chip { id: string; label: string; removeHref: string; }

function buildChips(filters: ConferenceFilters): Chip[] {
  const chips: Chip[] = [];

  const removeHref = (mut: (f: ConferenceFilters) => ConferenceFilters): string => {
    const next = mut(cloneFilters(filters));
    const qs = serializeConferenceFilters(next).toString();
    return qs ? `/?${qs}` : "/";
  };

  if (filters.q.trim()) {
    chips.push({
      id: "q",
      label: `« ${filters.q.trim()} »`,
      removeHref: removeHref((f) => ({ ...f, q: "" })),
    });
  }

  if (filters.format !== "") {
    const label =
      filters.format === "in_person" ? "Présentiel"
      : filters.format === "online"  ? "En ligne"
      :                                 "Hybride";
    chips.push({
      id: `format-${filters.format}`,
      label,
      removeHref: removeHref((f) => ({ ...f, format: "" })),
    });
  }

  for (const s of filters.statuses) {
    const label =
      s === "open"         ? "Ouvertes"
      : s === "coming_soon" ? "Bientôt ouvertes"
      :                       "Fermées";
    chips.push({
      id: `status-${s}`,
      label,
      removeHref: removeHref((f) => {
        const next = new Set(f.statuses);
        next.delete(s);
        return { ...f, statuses: next };
      }),
    });
  }

  for (const id of filters.domains) {
    const def = DOMAIN_DEFINITIONS.find((d) => d.id === id);
    if (!def) continue;
    chips.push({
      id: `domain-${id}`,
      label: def.label,
      removeHref: removeHref((f) => {
        const next = new Set(f.domains);
        next.delete(id);
        return { ...f, domains: next };
      }),
    });
  }

  if (filters.fromDate) {
    chips.push({
      id: "from",
      label: `Du ${filters.fromDate}`,
      removeHref: removeHref((f) => ({ ...f, fromDate: "" })),
    });
  }
  if (filters.toDate) {
    chips.push({
      id: "to",
      label: `Au ${filters.toDate}`,
      removeHref: removeHref((f) => ({ ...f, toDate: "" })),
    });
  }

  if (filters.location.trim()) {
    chips.push({
      id: "loc",
      label: `Lieu : ${filters.location.trim()}`,
      removeHref: removeHref((f) => ({ ...f, location: "" })),
    });
  }

  return chips;
}

function cloneFilters(f: ConferenceFilters): ConferenceFilters {
  return {
    q: f.q,
    format: f.format,
    statuses: new Set(f.statuses),
    domains: new Set(f.domains),
    fromDate: f.fromDate,
    toDate: f.toDate,
    location: f.location,
  };
}