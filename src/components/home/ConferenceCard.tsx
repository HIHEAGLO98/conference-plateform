"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle, Bell, Calendar, CheckCircle2, Clock, Heart, MapPin, Monitor,
} from "lucide-react";

import type {
  AccentColor, ConferenceFormat, DomainBadge, HomeConference, RegistrationStatus,
} from "@/types/conference";
import { cn } from "@/lib/utils";

interface ConferenceCardProps { conference: HomeConference; }

export function ConferenceCard({ conference }: ConferenceCardProps) {
  const [favorited, setFavorited] = useState(false);

  const {
    accent, domain, format, status, title, organizer, partner,
    dateRange, location, platform, submissionDeadline, submissionUrgent,
    daysBeforeOpen, capacity, href,
  } = conference;

  const dim = status === "FULL" || status === "CLOSED";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10",
        dim && "opacity-80"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        <div className={cn("h-1.5 flex-shrink-0 sm:h-auto sm:w-1.5", accentBg(accent))} aria-hidden />

        <div className="flex-1 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap gap-2">
                <DomainPill badge={domain} />
                <StatusPill status={status} daysBeforeOpen={daysBeforeOpen} />
                <FormatPill format={format} />
              </div>

              <h3 className={cn(
                "mb-1.5 font-heading text-lg font-bold leading-snug",
                dim ? "text-slate-600" : "text-slate-800"
              )}>
                <Link href={href} className="outline-none transition-colors hover:text-blue-700 focus-visible:underline">
                  {title}
                </Link>
              </h3>
              <p className={cn("mb-3 text-sm", dim ? "text-slate-400" : "text-slate-500")}>
                {organizer}
                {partner && (
                  <>
                    {" · "}
                    <span className="font-medium text-slate-600">{partner}</span>
                  </>
                )}
              </p>

              <div className={cn(
                "flex flex-wrap gap-x-4 gap-y-1.5 text-sm",
                dim ? "text-slate-400" : "text-slate-500"
              )}>
                <span className="flex items-center gap-1.5">
                  <Calendar className={cn("h-4 w-4", dim ? "text-slate-300" : "text-slate-400")} aria-hidden />
                  {dateRange}
                </span>

                <span className="flex items-center gap-1.5">
                  {format === "ONLINE" ? (
                    <Monitor className={cn("h-4 w-4", dim ? "text-slate-300" : "text-slate-400")} aria-hidden />
                  ) : (
                    <MapPin className={cn("h-4 w-4", dim ? "text-slate-300" : "text-slate-400")} aria-hidden />
                  )}
                  {platform ?? location}
                </span>

                {submissionDeadline && (
                  <span className={cn(
                    "flex items-center gap-1.5",
                    submissionUrgent ? "font-semibold text-amber-600" : "text-slate-500"
                  )}>
                    <Clock className={cn(
                      "h-4 w-4",
                      submissionUrgent ? "text-amber-500" : dim ? "text-slate-300" : "text-slate-400"
                    )} aria-hidden />
                    Soumission : <span className="ml-0.5">{submissionDeadline}</span>
                  </span>
                )}
              </div>

              {status === "COMING_SOON" ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <Bell className="h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden />
                  <span className="text-xs font-medium text-amber-700">
                    Alertez-moi à l&apos;ouverture des inscriptions
                  </span>
                  <button
                    type="button"
                    className="ml-auto rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-amber-600"
                  >
                    M&apos;alerter
                  </button>
                </div>
              ) : (
                <CapacityBar capacity={capacity} status={status} dim={dim} />
              )}
            </div>

            <div className="flex flex-shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
              <PrimaryCta status={status} href={href} />
              {status !== "COMING_SOON" && (
                <button
                  type="button"
                  onClick={() => setFavorited((v) => !v)}
                  aria-pressed={favorited}
                  aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className={cn(
                    "rounded-lg p-1.5 transition-colors",
                    favorited
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  )}
                >
                  <Heart className={cn("h-5 w-5", favorited && "fill-current")} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/*  Sous-composants  */

function DomainPill({ badge }: { badge: DomainBadge }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
      domainTone(badge.tone)
    )}>
      {badge.emoji && <span aria-hidden>{badge.emoji}</span>}
      {badge.label}
    </span>
  );
}

function StatusPill({
  status, daysBeforeOpen,
}: { status: RegistrationStatus; daysBeforeOpen?: number }) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Inscriptions ouvertes
      </span>
    );
  }
  if (status === "COMING_SOON") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
        {typeof daysBeforeOpen === "number"
          ? `Ouverture dans ${daysBeforeOpen} jours`
          : "Bientôt ouvertes"}
      </span>
    );
  }
  if (status === "FULL") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Complet
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      Inscriptions fermées
    </span>
  );
}

function FormatPill({ format }: { format: ConferenceFormat }) {
  const config: Record<ConferenceFormat, { label: string; className: string }> = {
    IN_PERSON: { label: "Présentiel", className: "border-blue-200 bg-blue-50 text-blue-700" },
    ONLINE:    { label: "En ligne",   className: "border-sky-200 bg-sky-50 text-sky-700" },
    HYBRID:    { label: "Hybride",    className: "border-blue-200 bg-blue-50 text-blue-700" },
  };
  const { label, className } = config[format];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
      className
    )}>
      {label}
    </span>
  );
}

function CapacityBar({
  capacity, status, dim,
}: { capacity: { registered: number; total: number }; status: RegistrationStatus; dim: boolean }) {
  const percent = Math.min(100, Math.round((capacity.registered / Math.max(1, capacity.total)) * 100));
  const remaining = Math.max(0, capacity.total - capacity.registered);

  const barColor =
    status === "FULL" ? "bg-red-400"
    : percent >= 75   ? "bg-amber-500"
    : percent >= 50   ? "bg-blue-500"
    :                   "bg-emerald-500";

  return (
    <div className="mt-3">
      <div className={cn("mb-1 flex justify-between text-xs", dim ? "text-slate-400" : "text-slate-500")}>
        <span>Capacité</span>
        <span className={cn("font-semibold", dim ? "text-slate-400" : "text-slate-700")}>
          {capacity.registered} / {capacity.total} places
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${percent}%` }} />
      </div>

      {status === "FULL" ? (
        <p className="mt-1 text-xs font-medium text-slate-500">
          Conférence complète · Inscription sur liste d&apos;attente possible
        </p>
      ) : percent >= 75 ? (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
          <AlertTriangle className="h-3 w-3" aria-hidden />
          Plus que {remaining} places disponibles
        </p>
      ) : (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Beaucoup de places disponibles
        </p>
      )}
    </div>
  );
}

function PrimaryCta({ status, href }: { status: RegistrationStatus; href: string }) {
  if (status === "OPEN") {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300"
      >
        Voir &amp; s&apos;inscrire
      </Link>
    );
  }
  if (status === "COMING_SOON") {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100"
      >
        Voir le programme
      </Link>
    );
  }
  if (status === "FULL") {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        className="cursor-not-allowed whitespace-nowrap rounded-xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-500"
      >
        Liste d&apos;attente
      </button>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
    >
      Voir le bilan
    </Link>
  );
}

/*  Helpers de style — table de correspondance  */

function accentBg(accent: AccentColor): string {
  switch (accent) {
    case "blue":    return "bg-blue-600";
    case "sky":     return "bg-sky-500";
    case "amber":   return "bg-amber-500";
    case "emerald": return "bg-emerald-500";
    case "slate":
    default:        return "bg-slate-400";
  }
}

function domainTone(tone: DomainBadge["tone"]): string {
  switch (tone) {
    case "blue":        return "border-blue-200 bg-blue-50 text-blue-700";
    case "sky":         return "border-sky-200 bg-sky-50 text-sky-700";
    case "amber":       return "border-amber-200 bg-amber-50 text-amber-700";
    case "emerald":     return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "violet-blue": return "border-sky-200 bg-sky-50 text-sky-700";
    case "slate":
    default:            return "border-slate-200 bg-slate-100 text-slate-600";
  }
}