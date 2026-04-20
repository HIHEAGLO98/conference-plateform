import {
  Building2,
  Calendar,
  Globe,
  Heart,
  MapPin,
  Share2,
  Users,
} from "lucide-react";

import type { ConferenceDetail } from "@/lib/queries/conference-detail";
import { cn } from "@/lib/utils";

/* 
 * Hero statique (Server Component) — tags, titre, infos, jauge.
 *
 * Les boutons "Sauvegarder" / "Partager" sont rendus ici mais sans handler —
 * à transformer en Client Component dédié (`HeroActions.tsx`) quand on câblera
 * la logique favoris (Prisma `Favorite`) + navigateur (`navigator.share`).
 *  */

interface ConferenceHeroProps {
  conference: ConferenceDetail;
}

/** Seuil en jours avant lequel une conférence passe de "coming_soon" à "open". */
const OPEN_THRESHOLD_DAYS = 60;

type DerivedStatus = {
  id: "open" | "coming_soon" | "closed";
  label: string;
  cls: string;
  dot: string;
};

function deriveStatus(now: Date, start: Date, end: Date): DerivedStatus {
  if (end < now) {
    return {
      id: "closed",
      label: "Terminée",
      cls: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      dot: "bg-slate-400",
    };
  }

  const daysUntilStart = (start.getTime() - now.getTime()) / 86_400_000;
  if (daysUntilStart > OPEN_THRESHOLD_DAYS) {
    return {
      id: "coming_soon",
      label: "Bientôt ouvertes",
      cls: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
    };
  }

  return {
    id: "open",
    label: "Inscriptions ouvertes",
    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  };
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", opts).format(d);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${fmt(start, { day: "numeric" })} – ${fmt(end, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  if (sameYear) {
    return `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(end, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  return `${fmt(start, { day: "numeric", month: "short", year: "numeric" })} - ${fmt(end, { day: "numeric", month: "long", year: "numeric" })}`;
}

export function ConferenceHero({ conference }: ConferenceHeroProps) {
  const now = new Date();
  const status = deriveStatus(now, conference.dateDebut, conference.dateFin);

  const participants = conference._count.inscriptions;
  const capaciteMax = conference.capaciteMax ?? 0;
  const hasCapacity = capaciteMax > 0;
  const fillPct = hasCapacity
    ? Math.min(100, Math.round((participants / capaciteMax) * 100))
    : 0;
  const remaining = hasCapacity ? Math.max(0, capaciteMax - participants) : 0;
  const capWarn = hasCapacity && fillPct >= 70;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1a2f5a 55%, #1e40af 100%)",
      }}
    >
      {/* Decorative gradients */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 50%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 40%)",
        }}
        aria-hidden
      />
      <div
        className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {/* Tags row */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {conference.theme && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-600/30 px-2.5 py-1 text-xs font-semibold text-indigo-200">
              {conference.theme}
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              status.cls
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status.dot,
                status.id === "open" && "animate-pulse"
              )}
            />
            {status.label}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
            <MapPin className="h-3 w-3" />
            Présentiel
          </span>

          {conference.organisation && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
              <Building2 className="h-3 w-3" />
              {conference.organisation}
            </span>
          )}
        </div>

        {/* Title + actions */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex-1">
            <h1 className="mb-3 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
              {conference.shortName ? (
                <>
                  {conference.shortName}{" "}
                  <span className="font-semibold text-slate-300">-</span>{" "}
                  <span className="block sm:inline">{conference.titre}</span>
                </>
              ) : (
                conference.titre
              )}
            </h1>

            {conference.organisation && (
              <p className="mb-5 text-sm text-slate-300">
                Organisée par{" "}
                <span className="font-medium text-white">
                  {conference.organisation}
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-white">
                  {formatDateRange(conference.dateDebut, conference.dateFin)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>{conference.lieu}</span>
              </div>

              {hasCapacity && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span>
                    {participants} / {capaciteMax} participants
                  </span>
                </div>
              )}

              {conference._count.sessions > 0 && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>{conference._count.sessions} sessions</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick action buttons (placeholders — handlers à ajouter) */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
            >
              <Heart className="h-4 w-4" />
              Sauvegarder
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </button>
          </div>
        </div>

        {/* Capacity bar */}
        {hasCapacity && (
          <div className="mt-7 max-w-lg">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Remplissage de la salle
              </span>
              <span className="text-xs font-semibold text-white">
                {participants} / {capaciteMax} places
                {capWarn && (
                  <span className="ml-1 text-amber-400">
                    ⚠ {remaining} restantes
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-500 transition-all"
                style={{ width: `${fillPct}%` }}
                role="progressbar"
                aria-valuenow={fillPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}