"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronDown,
  Layers,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  OrganizerConference,
  OrganizerSession,
} from "@/lib/queries/organizer-dashboard";

/* 
 * ConferenceHierarchy - Client Component.
 *
 * Liste des conférences de l'organisateur avec accordéon dépliable sur chaque
 * conf pour afficher les sessions rattachées. Chaque carte conférence expose :
 *   - Header cliquable (toggle)
 *   - Barre de capacité globale
 *   - Bouton "+ Session" rapide (ouvre le modal avec la conf pré-sélectionnée)
 *   - Liste de sessions avec pastille + badge état + mini-barre de remplissage
 *
 * La palette de couleurs (teal/blue/slate) est dérivée du statut de la conf.
 *
 * État accordéon :
 *   - `open` = Set<string> d'IDs conf ouverts
 *   - La première conférence de la liste est ouverte par défaut (UX sensible)
 *  */

interface ConferenceHierarchyProps {
  conferences: OrganizerConference[];
  /** Limite de sessions affichées par conf (avant "Voir les X sessions →"). */
  sessionPreviewLimit?: number;
}

export function ConferenceHierarchy({
  conferences,
  sessionPreviewLimit = 4,
}: ConferenceHierarchyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const first = conferences[0]?.id;
    return new Set(first ? [first] : []);
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Ouvre le modal de création de session avec la conf pré-sélectionnée. */
  const openCreateSession = (conferenceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", "create-session");
    params.set("conf", conferenceId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openCreateConf = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", "create-conf");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h3 className="font-heading text-base font-semibold text-slate-900">
            Conférences &amp; Sessions
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Les sessions sont rattachées à une conférence parente
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateConf}
            className="inline-flex items-center gap-1 rounded-[10px] border-[1.5px] border-teal-600 bg-white px-3 py-1.5 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-50"
          >
            <Plus className="h-3 w-3" />
            Conférence
          </button>
          <button
            type="button"
            onClick={() => openCreateSession("")}
            className="inline-flex items-center gap-1 rounded-[10px] bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Plus className="h-3 w-3" />
            Session
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4 p-4">
        {conferences.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">
              Aucune conférence créée
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Commencez par créer votre première conférence.
            </p>
          </div>
        ) : (
          conferences.map((conf) => (
            <ConferenceCard
              key={conf.id}
              conference={conf}
              open={openIds.has(conf.id)}
              onToggle={() => toggle(conf.id)}
              onAddSession={() => openCreateSession(conf.id)}
              sessionPreviewLimit={sessionPreviewLimit}
            />
          ))
        )}

        {/* Create new conference CTA (dashed) */}
        <button
          type="button"
          onClick={openCreateConf}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-200 py-4 text-sm font-semibold text-teal-600 transition-all hover:border-teal-400 hover:bg-teal-50"
        >
          <Plus className="h-4 w-4" />
          Créer une nouvelle conférence
        </button>
      </div>
    </section>
  );
}

/* 
 * Carte conférence + sessions dépliables
 *  */

interface ConferenceCardProps {
  conference: OrganizerConference;
  open: boolean;
  onToggle: () => void;
  onAddSession: () => void;
  sessionPreviewLimit: number;
}

function ConferenceCard({
  conference,
  open,
  onToggle,
  onAddSession,
  sessionPreviewLimit,
}: ConferenceCardProps) {
  const palette = useMemo(() => derivePalette(conference), [conference]);
  const status = deriveConfStatusBadge(conference);
  const inscriptions = conference._count.inscriptions;
  const capacity = conference.capaciteMax ?? 0;
  const fillPercent =
    capacity > 0 ? Math.min(100, Math.round((inscriptions / capacity) * 100)) : 0;

  const dateLabel = formatDateRange(conference.dateDebut, conference.dateFin);
  const cityLabel = [conference.ville, conference.pays].filter(Boolean).join(", ");
  const initials = computeInitials(conference.shortName ?? conference.titre);

  const previewSessions = conference.sessions.slice(0, sessionPreviewLimit);
  const hasMoreSessions = conference.sessions.length > sessionPreviewLimit;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl transition-colors",
        palette.container
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white",
              palette.badge
            )}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={cn(
                  "truncate font-heading text-sm font-bold",
                  palette.title
                )}
              >
                {conference.shortName ?? conference.titre}
              </p>
              <StatusBadge kind={status.kind} label={status.label} />
            </div>
            <p className="text-xs text-slate-500">
              {cityLabel} · {dateLabel} ·{" "}
              <strong
                className={
                  conference._count.sessions === 0 ? "text-amber-600" : undefined
                }
              >
                {conference._count.sessions} session
                {conference._count.sessions > 1 ? "s" : ""}
              </strong>
              {inscriptions > 0 && ` · ${inscriptions} participants`}
              {conference._count.sessions === 0 && " · Pas encore publié"}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onAddSession();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onAddSession();
              }
            }}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-lg border bg-white px-2 py-1 text-xs font-semibold transition-colors",
              palette.addBtn
            )}
          >
            + Session
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>
      </button>

      {/* Capacity bar (toujours visible, même collapsed) */}
      {capacity > 0 && (
        <div className="px-4 pb-2">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Capacité globale</span>
            <span className="font-semibold">
              {inscriptions} / {capacity}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-slate-200">
            <div
              className={cn("h-1.5 rounded transition-all", palette.fillBar)}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Sessions list — accordion body */}
      {open && (
        <div
          className={cn(
            "border-t bg-white",
            palette.separator
          )}
        >
          {conference.sessions.length === 0 ? (
            <div className="bg-slate-50 py-7 text-center">
              <Layers className="mx-auto mb-2 h-10 w-10 text-slate-300" />
              <p className="mb-1 text-sm font-semibold text-slate-500">
                Aucune session pour l&apos;instant
              </p>
              <p className="mb-3 text-xs text-slate-400">
                Commencez par créer la première session de cette conférence.
              </p>
              <button
                type="button"
                onClick={onAddSession}
                className="mx-auto inline-flex items-center gap-1.5 rounded-[10px] bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Créer la première session
              </button>
            </div>
          ) : (
            <>
              <div className="px-4 pb-1 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sessions rattachées
                </p>
              </div>
              {previewSessions.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
              <div className="flex items-center justify-between border-t border-slate-50 px-4 py-2.5">
                {hasMoreSessions ? (
                  <button
                    type="button"
                    className={cn(
                      "text-xs font-semibold hover:underline",
                      palette.linkText
                    )}
                  >
                    Voir les {conference.sessions.length} sessions →
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={onAddSession}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                    palette.inlineAddBtn
                  )}
                >
                  <Plus className="h-3 w-3" />
                  Ajouter une session
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* 
 * Session row - une ligne session dans l'accordéon
 *  */

interface SessionRowProps {
  session: OrganizerSession;
}

function SessionRow({ session }: SessionRowProps) {
  // On ne connaît pas encore les inscrits par session — approximation : on
  // affiche juste la capacité + un badge "Normal" par défaut. Quand on aura un
  // modèle `SessionRegistration`, on dérivera le state proprement.
  const fillLevel = deriveSessionFillLevel(session);
  const dateLabel = formatSessionSlot(session.horaireDebut, session.horaireFin);
  const sessionLabel = formatSessionType(session.type);

  return (
    <div
      className={cn(
        "mx-3 mb-1 flex items-center justify-between gap-3 rounded-[10px] px-4 py-3 transition-colors hover:bg-slate-50",
        fillLevel === "full" && "border-l-[3px] border-rose-500 bg-rose-50 pl-[13px]",
        fillLevel === "almost" &&
          "border-l-[3px] border-amber-500 bg-amber-50/60 pl-[13px]"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 flex-shrink-0 rounded-full",
            fillLevel === "full"
              ? "bg-rose-500"
              : fillLevel === "almost"
                ? "bg-amber-400"
                : "bg-teal-400"
          )}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {sessionLabel ? `${sessionLabel} : ` : ""}
            {session.titre}
          </p>
          <p className="text-xs text-slate-500">
            {session.salle ? `${session.salle} · ` : ""}
            {dateLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p
            className={cn(
              "text-xs font-semibold",
              fillLevel === "full"
                ? "text-rose-700"
                : fillLevel === "almost"
                  ? "text-amber-700"
                  : "text-slate-600"
            )}
          >
            –/{session.capacite}
          </p>
          <div className="mt-0.5 h-1.5 w-16 overflow-hidden rounded bg-slate-200">
            <div
              className={cn(
                "h-1.5 rounded",
                fillLevel === "full"
                  ? "bg-rose-500 w-full"
                  : fillLevel === "almost"
                    ? "bg-amber-400 w-[80%]"
                    : "bg-teal-500 w-[10%]"
              )}
            />
          </div>
        </div>
        <FillBadge level={fillLevel} />
      </div>
    </div>
  );
}

/* 
 * Badges + palettes (purement présentationnels)
 *  */

function StatusBadge({
  kind,
  label,
}: {
  kind: "draft" | "published" | "archived" | "cancelled";
  label: string;
}) {
  const tones: Record<typeof kind, string> = {
    draft: "bg-amber-100 text-amber-800",
    published: "bg-emerald-100 text-emerald-700",
    archived: "bg-slate-100 text-slate-600",
    cancelled: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        tones[kind]
      )}
    >
      {kind === "published" && <span className="text-emerald-600">●</span>}
      {kind === "draft" && <span>⚠</span>}
      {label}
    </span>
  );
}

function FillBadge({ level }: { level: FillLevel }) {
  const map: Record<FillLevel, { label: string; classes: string }> = {
    full: { label: "Complet", classes: "bg-rose-100 text-rose-800" },
    almost: { label: "Presque plein", classes: "bg-amber-100 text-amber-800" },
    ok: { label: "Normal", classes: "bg-emerald-100 text-emerald-800" },
  };
  const cfg = map[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        cfg.classes
      )}
    >
      {cfg.label}
    </span>
  );
}

/* 
 * Utils — palettes, parsing, dates
 *  */

type Palette = {
  container: string;
  title: string;
  badge: string;
  addBtn: string;
  inlineAddBtn: string;
  linkText: string;
  separator: string;
  fillBar: string;
};

function derivePalette(conf: OrganizerConference): Palette {
  // Conf sans session = empty-state (dashed slate)
  if (conf._count.sessions === 0) {
    return {
      container: "border-2 border-dashed border-slate-200",
      title: "text-slate-500",
      badge: "bg-slate-200 text-slate-400",
      addBtn: "border-slate-200 text-slate-600 hover:bg-slate-50",
      inlineAddBtn:
        "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      linkText: "text-slate-500",
      separator: "border-dashed border-slate-200",
      fillBar: "bg-slate-400",
    };
  }
  // Publiée = bleu, brouillon = teal (identité organisateur)
  if (conf.statut === "PUBLISHED") {
    return {
      container: "border border-blue-200 bg-blue-50/30",
      title: "text-slate-900",
      badge: "bg-blue-600",
      addBtn: "border-blue-300 text-blue-700 hover:bg-blue-50",
      inlineAddBtn: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
      linkText: "text-blue-700",
      separator: "border-blue-100",
      fillBar: "bg-blue-500",
    };
  }
  return {
    container: "border border-teal-200 bg-teal-50/40",
    title: "text-slate-900",
    badge: "bg-teal-600",
    addBtn: "border-teal-300 text-teal-700 hover:bg-teal-50",
    inlineAddBtn: "border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100",
    linkText: "text-teal-700",
    separator: "border-teal-100",
    fillBar: "bg-teal-500",
  };
}

function deriveConfStatusBadge(conf: OrganizerConference): {
  kind: "draft" | "published" | "archived" | "cancelled";
  label: string;
} {
  switch (conf.statut) {
    case "PUBLISHED":
      return { kind: "published", label: "Publié" };
    case "DRAFT":
      return { kind: "draft", label: "Brouillon" };
    case "ARCHIVED":
      return { kind: "archived", label: "Archivé" };
    case "CANCELLED":
      return { kind: "cancelled", label: "Annulé" };
    default:
      return { kind: "draft", label: "Brouillon" };
  }
}

type FillLevel = "full" | "almost" | "ok";

function deriveSessionFillLevel(_session: OrganizerSession): FillLevel {
  // Placeholder — on n'a pas encore les inscrits par session.
  // Quand on aura `SessionRegistration`, on calculera : registered/capacite.
  return "ok";
}

function computeInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatSessionType(type: OrganizerSession["type"]): string {
  switch (type) {
    case "KEYNOTE":
      return "Keynote";
    case "WORKSHOP":
      return "Workshop";
    case "PANEL":
      return "Panel";
    case "POSTER":
      return "Poster";
    case "BREAK":
      return "Pause";
    case "TALK":
    default:
      return "";
  }
}

function formatDateRange(start: Date, end: Date): string {
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  const yearFmt = new Intl.DateTimeFormat("fr-FR", { year: "numeric" });

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${monthFmt.format(start)} ${yearFmt.format(start)}`;
  }
  const dFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return `${dFmt.format(start)} – ${dFmt.format(end)} ${yearFmt.format(end)}`;
}

function formatSessionSlot(start: Date, end: Date): string {
  const dateFmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateFmt.format(start)} ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}