"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Download,
  MapPin,
  Users as UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConferenceSessionItem } from "@/lib/queries/conference-detail";
import { Speaker } from "@/lib/utils/speakers";

/* 
 * Programme - onglets "Jour 1 / Jour 2 / ..." + timeline verticale.
 *
 * Client Component : on gère localement l'onglet actif avec `useState`.
 * Les données arrivent pré-filtrées (ORDER BY horaireDebut ASC).
 *
 *  */

interface ProgramSectionProps {
  sessions: ConferenceSessionItem[];
  dateDebut: Date;
  dateFin: Date;
}

/** Chaînes typées correspondant à l'enum `SessionType` Prisma (sans l'importer). */
type SessionTypeStr =
  | "KEYNOTE"
  | "WORKSHOP"
  | "PANEL"
  | "TALK"
  | "POSTER"
  | "BREAK";

const TYPE_BADGE: Record<SessionTypeStr, { label: string; cls: string }> = {
  KEYNOTE: { label: "Keynote", cls: "bg-blue-100 text-blue-700" },
  WORKSHOP: { label: "Workshop", cls: "bg-emerald-100 text-emerald-700" },
  PANEL: { label: "Table ronde", cls: "bg-purple-100 text-purple-700" },
  TALK: { label: "Conférence", cls: "bg-indigo-100 text-indigo-700" },
  POSTER: { label: "Session posters", cls: "bg-amber-100 text-amber-700" },
  BREAK: { label: "Pause", cls: "bg-slate-100 text-slate-600" },
};

const HIGHLIGHT_TYPES: SessionTypeStr[] = ["KEYNOTE", "WORKSHOP"];

/*  Helpers  */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatDayShort(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function durationMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

/* Composant  */

export function ProgramSection({
  sessions,
  dateDebut,
  dateFin,
}: ProgramSectionProps) {
  // Grouper par jour en seedant chaque jour de la conférence (même vide).
  const days = useMemo(() => {
    const dayMap = new Map<string, ConferenceSessionItem[]>();

    const start = startOfDay(dateDebut);
    const end = startOfDay(dateFin);
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      dayMap.set(dayKey(d), []);
    }

    for (const s of sessions) {
      const key = dayKey(s.horaireDebut);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(s);
    }

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items], index) => ({
        key,
        date: new Date(key),
        label: `Jour ${index + 1}`,
        sub: formatDayShort(new Date(key)),
        items: items.sort(
          (a, b) => a.horaireDebut.getTime() - b.horaireDebut.getTime()
        ),
      }));
  }, [sessions, dateDebut, dateFin]);

  const [activeKey, setActiveKey] = useState<string>(
    () => days[0]?.key ?? ""
  );
  const current = days.find((d) => d.key === activeKey) ?? days[0];

  return (
    <section
      id="sec-program"
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
            <Calendar className="h-4 w-4 text-indigo-700" />
          </span>
          Programme
        </h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Download className="h-3 w-3" />
          Télécharger (PDF)
        </button>
      </div>

      {/* Day tabs */}
      {days.length > 1 && (
        <div
          className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1"
          role="tablist"
          aria-label="Sélection du jour"
        >
          {days.map((d) => {
            const isActive = d.key === activeKey;
            return (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`day-panel-${d.key}`}
                onClick={() => setActiveKey(d.key)}
                className={cn(
                  "flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {d.label} · {d.sub}
              </button>
            );
          })}
        </div>
      )}

      {/* Day content */}
      {!current || current.items.length === 0 ? (
        <div
          className="py-10 text-center text-sm text-slate-400"
          id={current ? `day-panel-${current.key}` : undefined}
          role="tabpanel"
        >
          <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          Programme à venir - Les sessions n'ont pas encore été publiées pour
          cette journée.
        </div>
      ) : (
        <ol
          className="space-y-1"
          id={`day-panel-${current.key}`}
          role="tabpanel"
        >
          {current.items.map((s, idx) => {
            const sessionType = s.type as SessionTypeStr;
            const badge = TYPE_BADGE[sessionType] ?? TYPE_BADGE.TALK;
            const isLast = idx === current.items.length - 1;
            const isHighlight = HIGHLIGHT_TYPES.includes(sessionType);
            const duration = durationMinutes(s.horaireDebut, s.horaireFin);

            return (
              <li
                key={s.id}
                className="group flex gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-slate-50"
              >
                {/* Heure */}
                <div className="w-16 flex-shrink-0 pt-1 text-right">
                  <span className="text-xs font-semibold text-slate-500">
                    {formatTime(s.horaireDebut)}
                  </span>
                </div>

                {/* Timeline */}
                <div className="flex flex-shrink-0 flex-col items-center">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full border-2 border-blue-600",
                      isHighlight ? "bg-blue-600" : "bg-white"
                    )}
                  />
                  {!isLast && (
                    <span className="mt-1 w-0.5 flex-1 bg-slate-200" />
                  )}
                </div>

                {/* Contenu session */}
                <div className="flex-1 pb-3">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        badge.cls
                      )}
                    >
                      {badge.label}
                    </span>
                    {s.salle && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {s.salle}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {s.titre}
                  </p>

                  {sessionType !== "BREAK" && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {duration} min
                      </span>
                      {s.capacite > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <UsersIcon className="h-3 w-3" />
                          {s.capacite} places
                        </span>
                      )}
                      {s.description && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Voir le résumé
                        </button>
                      )}
                    </div>
                  )}

                  {sessionType === "BREAK" && s.description && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}