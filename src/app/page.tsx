import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ConferenceFilterSidebar } from "@/components/home/ConferenceFilterSidebar";
import { ConferenceCard } from "@/components/home/ConferenceCard";
import {
  CONFERENCES_PAGE_SIZE,
  listPublishedConferences,
} from "@/lib/queries/conferences";
import { prismaConferenceToHome } from "@/lib/adapters/conference";

/**
 * Page d'accueil publique — Server Component.
 * Pagination via `?page=N` (SEO-friendly, no-JS).
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const {
    items, page: currentPage, totalPages, total,
  } = await listPublishedConferences({ page, pageSize: CONFERENCES_PAGE_SIZE });

  const conferences = items.map((row) => prismaConferenceToHome(row));

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
                    Conférences disponibles
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

              {conferences.length > 0 ? (
                <div className="grid gap-4">
                  {conferences.map((conf) => (
                    <ConferenceCard key={conf.id} conference={conf} />
                  ))}
                </div>
              ) : (
                <EmptyState page={currentPage} />
              )}

              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} />
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* Sous-composants serveurs  */

function EmptyState({ page }: { page: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
        <Inbox className="h-6 w-6 text-blue-600" aria-hidden />
      </div>
      <h3 className="font-heading text-base font-semibold text-slate-800">
        Aucune conférence à afficher
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {page > 1
          ? "Cette page est vide. Revenez à la première page pour voir les conférences disponibles."
          : "Aucune conférence n'est publiée pour le moment. Revenez bientôt !"}
      </p>
      {page > 1 && (
        <Link
          href="/"
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700"
        >
          Retour à la page 1
        </Link>
      )}
    </div>
  );
}

function Pagination({
  currentPage, totalPages,
}: { currentPage: number; totalPages: number }) {
  const pageNumbers = buildPageList(currentPage, totalPages);
  const prevHref = pageHref(currentPage - 1);
  const nextHref = pageHref(currentPage + 1);

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <PageArrow href={prevHref} disabled={currentPage <= 1} direction="prev" />

      {pageNumbers.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`e-${idx}`} aria-hidden className="px-1 text-sm text-slate-400">…</span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
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

      <PageArrow href={nextHref} disabled={currentPage >= totalPages} direction="next" />
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

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function pageHref(page: number): string {
  return page <= 1 ? "/" : `/?page=${page}`;
}

function buildPageList(
  current: number,
  total: number
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  if (windowStart > 2) pages.push("ellipsis");
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);
  if (windowEnd < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
}