"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  Globe,
  Layers,
  MapPin,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
  Users,
  X,
  FileText,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ConferenceStatus } from "@/generated/prisma/client";
import type { ConferenceRow } from "@/app/(dashboard)/organizer/conferences/page";
import { conferenceInitials, avatarClasses } from "@/app/(dashboard)/organizer/conferences/page";

//  Types locaux 

type StatusFilter = ConferenceStatus | "ALL";

interface ConferenceOrganizerGridProps {
  conferences: ConferenceRow[];
  statusFilter: StatusFilter;
}

//  Helpers visuels ──────────────────────────────────────────────────────────

function statusBadge(statut: ConferenceStatus) {
  switch (statut) {
    case ConferenceStatus.PUBLISHED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Publié
        </span>
      );
    case ConferenceStatus.DRAFT:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          <span className="text-amber-500">⚠</span>
          Brouillon
        </span>
      );
    case ConferenceStatus.ARCHIVED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
          Archivé
        </span>
      );
    case ConferenceStatus.CANCELLED:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
          Annulé
        </span>
      );
  }
}

/** Couleur de la barre de remplissage selon le pourcentage. */
function fillBarColor(pct: number): string {
  if (pct >= 90) return "bg-rose-500";
  if (pct >= 75) return "bg-amber-400";
  if (pct >= 50) return "bg-teal-500";
  return "bg-emerald-400";
}
function fillTextColor(pct: number): string {
  if (pct >= 90) return "text-rose-600";
  if (pct >= 75) return "text-amber-600";
  if (pct >= 50) return "text-teal-600";
  return "text-emerald-600";
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
  const yearFmt = new Intl.DateTimeFormat("fr-FR", { year: "numeric" });
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} ${new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(start)} ${yearFmt.format(start)}`;
  }
  return `${fmt.format(start)} – ${fmt.format(end)} ${yearFmt.format(end)}`;
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

//   Sous-composant : panneau de détail (slide-in) ────────────────────────────

interface DetailPanelProps {
  conference: ConferenceRow | null;
  onClose: () => void;
}

function DetailPanel({ conference, onClose }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "participants" | "articles">("overview");

  const isOpen = conference !== null;

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/35 transition-opacity duration-250",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal
        aria-label={conference?.titre ?? ""}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen w-full max-w-[680px] flex-col bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {conference && (
          <>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-100 px-6 pb-0 pt-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-heading text-sm font-bold",
                      avatarClasses(conference.statut)
                    )}
                  >
                    {conferenceInitials(conference.shortName, conference.titre)}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-bold text-slate-900">
                        {conference.shortName ?? conference.titre}
                      </h2>
                      {statusBadge(conference.statut)}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {conference.ville}, {conference.pays} · {formatDateRange(conference.dateDebut, conference.dateFin)} · {conference.theme}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stat chips */}
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { icon: <Users className="h-3.5 w-3.5 text-teal-500" />, label: `${conference.inscriptionCount} participants` },
                  { icon: <Layers className="h-3.5 w-3.5 text-blue-500" />, label: `${conference.sessionCount} sessions` },
                  { icon: <FileText className="h-3.5 w-3.5 text-purple-500" />, label: `${conference.articleCount} articles` },
                  { icon: <TrendingUp className="h-3.5 w-3.5 text-amber-500" />, label: `${conference.fillPercent}% rempli` },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {icon}
                    {label}
                  </span>
                ))}
              </div>

              {/* Tabs */}
              <nav className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {(["overview", "sessions", "participants", "articles"] as const).map((tab) => {
                  const labels: Record<typeof tab, string> = {
                    overview: "Vue générale",
                    sessions: `Sessions (${conference.sessionCount})`,
                    participants: `Participants (${conference.inscriptionCount})`,
                    articles: `Articles (${conference.articleCount})`,
                  };
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                        activeTab === tab
                          ? "border-teal-500 text-teal-700"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "overview" && (
                <div className="space-y-5 p-5">
                  {/* Alerte brouillon */}
                  {conference.statut === ConferenceStatus.DRAFT && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">Programme non publié</p>
                        <p className="mt-0.5 text-xs text-amber-600">
                          Les participants ne peuvent pas encore voir cette conférence.
                        </p>
                      </div>
                      <Link
                        href={`?modal=edit-conf&id=${conference.id}`}
                        scroll={false}
                        className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Publier
                      </Link>
                    </div>
                  )}

                  {/* Infos générales */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Informations générales
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: "Titre complet", value: conference.titre },
                        { label: "Thématique", value: conference.theme },
                        { label: "Format", value: conference.format },
                        { label: "Organisme", value: conference.organisation ?? "—" },
                        { label: "Lieu", value: `${conference.lieu}, ${conference.ville}` },
                        { label: "Visibilité", value: conference.visibility === "PUBLIC" ? "🌐 Public" : "🔒 Privé" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="mb-0.5 text-xs text-slate-400">{label}</p>
                          <p className="font-medium text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates clés */}
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Dates clés
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          label: "Début",
                          value: new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(conference.dateDebut),
                          accent: false,
                        },
                        {
                          label: "Fin",
                          value: new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(conference.dateFin),
                          accent: false,
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-teal-500" />
                            <span className="text-sm font-medium text-slate-700">{label}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Jauge de remplissage */}
                  {conference.capaciteMax && conference.capaciteMax > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Remplissage</p>
                        <span className={cn("text-sm font-bold", fillTextColor(conference.fillPercent))}>
                          {conference.inscriptionCount} / {conference.capaciteMax}
                          <span className="ml-1 text-xs font-semibold">
                            ({conference.fillPercent}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-2.5 rounded-full transition-all", fillBarColor(conference.fillPercent))}
                          style={{ width: `${conference.fillPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "sessions" && (
                <div className="p-5">
                  <p className="mb-4 text-sm text-slate-500">
                    Les détails des sessions sont disponibles sur la page de gestion des sessions.
                  </p>
                  <Link
                    href={`/dashboard/sessions?conf=${conference.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <Layers className="h-4 w-4" />
                    Gérer les sessions
                  </Link>
                </div>
              )}

              {activeTab === "participants" && (
                <div className="p-5">
                  <p className="mb-4 text-sm text-slate-500">
                    Consultez et gérez les inscrits depuis l'espace dédié.
                  </p>
                  <Link
                    href={`/dashboard/participants?conf=${conference.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <Users className="h-4 w-4" />
                    Voir les participants
                  </Link>
                </div>
              )}

              {activeTab === "articles" && (
                <div className="p-5">
                  <p className="mb-4 text-sm text-slate-500">
                    {conference.pendingArticleCount > 0 && (
                      <span className="mr-2 font-semibold text-amber-600">
                        {conference.pendingArticleCount} en attente de révision.
                      </span>
                    )}
                    Gérez les soumissions depuis l'espace dédié.
                  </p>
                  <Link
                    href={`/dashboard/submissions?conf=${conference.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <FileText className="h-4 w-4" />
                    Voir les soumissions
                  </Link>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-slate-100 px-6 py-4">
              <Link
                href={`/conferences/${conference.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline"
              >
                <Eye className="h-4 w-4" />
                Page publique
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`?modal=edit-conf&id=${conference.id}`}
                  scroll={false}
                  className="inline-flex items-center gap-1.5 rounded-[9px] border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Link>
                {conference.statut === ConferenceStatus.DRAFT && (
                  <Link
                    href={`?modal=edit-conf&id=${conference.id}&publish=1`}
                    scroll={false}
                    className="inline-flex items-center gap-1.5 rounded-[9px] bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    <Send className="h-4 w-4" />
                    Publier
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Composant principal : table TanStack ─────────────────────────────────────

const columnHelper = createColumnHelper<ConferenceRow>();

export function ConferenceOrganizerGrid({
  conferences,
  statusFilter,
}: ConferenceOrganizerGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedConf, setSelectedConf] = useState<ConferenceRow | null>(null);
  const [pageSize, setPageSize] = useState(10);

  const handleRowClick = useCallback(
    (conf: ConferenceRow) => {
      setSelectedConf((prev) => (prev?.id === conf.id ? null : conf));
    },
    []
  );

  // ─── Définition des colonnes ──────────────────────────────────────────────

  const columns = useMemo<ColumnDef<ConferenceRow, unknown>[]>(
    () => [
      // Sélection
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="accent-teal-600"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomePageRowsSelected();
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Sélectionner tout"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="accent-teal-600"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Sélectionner ${row.original.titre}`}
          />
        ),
        size: 40,
        enableSorting: false,
      }),

      // Conférence (avatar + titre + thème)
      columnHelper.accessor("titre", {
        id: "conference",
        header: "Conférence",
        cell: ({ row }) => {
          const conf = row.original;
          const initials = conferenceInitials(conf.shortName, conf.titre);
          return (
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-heading text-xs font-bold",
                  avatarClasses(conf.statut)
                )}
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {conf.shortName ?? conf.titre}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {conf.theme}
                  {conf.organisation ? ` · ${conf.organisation}` : ""}
                </p>
              </div>
            </div>
          );
        },
        size: 220,
      }),

      // Statut
      columnHelper.accessor("statut", {
        header: "Statut",
        cell: ({ getValue }) => statusBadge(getValue()),
        size: 100,
      }),

      // Dates
      columnHelper.accessor("dateDebut", {
        header: "Dates",
        cell: ({ row }) => {
          const { dateDebut, dateFin } = row.original;
          const days = daysUntil(dateDebut);
          return (
            <div>
              <p className="text-sm font-medium text-slate-700">
                {formatDateRange(dateDebut, dateFin)}
              </p>
              {days > 0 && days <= 30 && (
                <p className="mt-0.5 text-xs font-medium text-amber-600">
                  Dans {days} jour{days > 1 ? "s" : ""}
                </p>
              )}
              {days <= 0 && (
                <p className="mt-0.5 text-xs text-slate-400">Terminée</p>
              )}
              {days > 30 && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Dans {Math.round(days / 30)} mois
                </p>
              )}
            </div>
          );
        },
        size: 160,
      }),

      // Lieu
      columnHelper.accessor("ville", {
        header: "Lieu",
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-slate-700">
              {row.original.ville}, {row.original.pays}
            </p>
            {row.original.lieu && row.original.lieu !== row.original.ville && (
              <p className="mt-0.5 truncate text-xs text-slate-400">{row.original.lieu}</p>
            )}
          </div>
        ),
        size: 140,
      }),

      // Sessions
      columnHelper.accessor("sessionCount", {
        header: "Sessions",
        cell: ({ getValue }) => (
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">{getValue()}</p>
          </div>
        ),
        size: 80,
      }),

      // Participants
      columnHelper.accessor("inscriptionCount", {
        header: "Inscrits",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-slate-900">{row.original.inscriptionCount}</p>
            {row.original.capaciteMax && (
              <p className="mt-0.5 text-xs text-slate-400">/ {row.original.capaciteMax} max</p>
            )}
          </div>
        ),
        size: 90,
      }),

      // Articles
      columnHelper.accessor("articleCount", {
        header: "Articles",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-slate-900">{row.original.articleCount}</p>
            {row.original.pendingArticleCount > 0 && (
              <p className="mt-0.5 text-xs text-amber-600">
                {row.original.pendingArticleCount} en attente
              </p>
            )}
          </div>
        ),
        size: 90,
      }),

      // Remplissage
      columnHelper.accessor("fillPercent", {
        header: "Remplissage",
        cell: ({ getValue }) => {
          const pct = getValue();
          return (
            <div className="w-20">
              <div className="mb-1 h-[5px] overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn("h-[5px] rounded-full transition-all", fillBarColor(pct))}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={cn("text-xs font-semibold", fillTextColor(pct))}>{pct}%</p>
            </div>
          );
        },
        size: 100,
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const conf = row.original;
          return (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href={`?modal=edit-conf&id=${conf.id}`}
                scroll={false}
                title="Modifier"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
              >
                <Edit className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                title="Plus d'options"
                onClick={() => {
                  // TODO: dropdown contextuel (publier, archiver, supprimer)
                  toast.info("Menu contextuel — à implémenter");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        },
        size: 90,
        enableSorting: false,
      }),
    ],
    []
  );

  // ─── Instance TanStack Table ──────────────────────────────────────────────

  const table = useReactTable({
    data: conferences,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize } },
  });

  // Met à jour la taille de page dans la table quand le state local change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    table.setPageSize(size);
  };

  // ─── Empty State ──────────────────────────────────────────────────────────

  if (conferences.length === 0) {
    const isFiltered = statusFilter !== "ALL";
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Calendar className="h-7 w-7 text-slate-400" />
        </span>
        <p className="font-heading text-base font-bold text-slate-600">
          {isFiltered
            ? "Aucune conférence dans ce statut"
            : "Vous n'avez encore créé aucune conférence"}
        </p>
        <p className="mt-1 max-w-xs text-sm text-slate-400">
          {isFiltered
            ? "Essayez un autre filtre ou créez une nouvelle conférence."
            : "Commencez par créer votre première conférence pour qu'elle apparaisse ici."}
        </p>
        <Link
          href="?modal=create-conf"
          scroll={false}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Créer une conférence
        </Link>
      </div>
    );
  }

  // ─── Selection bar ────────────────────────────────────────────────────────

  const selectedCount = Object.keys(rowSelection).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Barre de sélection flottante */}
      {selectedCount > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-teal-800">
            {selectedCount} conférence{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              onClick={() => {
                toast.info("Suppression en masse — à implémenter");
                setRowSelection({});
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              onClick={() => setRowSelection({})}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,.05)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Thead */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      style={{ width: header.getSize() }}
                      className={cn(
                        "whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500",
                        header.column.getCanSort() && "cursor-pointer select-none hover:text-slate-800",
                        header.id === "select" && "pl-5"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-slate-300">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-teal-600" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="h-3 w-3 text-teal-600" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Tbody */}
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const isSelected = row.getIsSelected();
                const isActive = selectedConf?.id === row.original.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => handleRowClick(row.original)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors last:border-0",
                      isActive
                        ? "bg-teal-50 shadow-[inset_3px_0_0_#0d9488]"
                        : isSelected
                          ? "bg-teal-50/60"
                          : "bg-white hover:bg-teal-50/40"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-3.5 align-middle text-sm text-slate-700",
                          cell.column.id === "select" && "pl-5"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            {conferences.length} conférence{conferences.length > 1 ? "s" : ""}
            {selectedCount > 0 && ` · ${selectedCount} sélectionnée${selectedCount > 1 ? "s" : ""}`}
          </p>

          <div className="flex items-center gap-4">
            {/* Lignes par page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Lignes :</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none focus:border-teal-400"
              >
                {[10, 25, 50].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">
                Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de détail */}
      <DetailPanel
        conference={selectedConf}
        onClose={() => setSelectedConf(null)}
      />
    </>
  );
}