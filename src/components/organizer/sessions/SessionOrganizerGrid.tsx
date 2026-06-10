"use client";

import { useMemo, useState, useCallback } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Layers,
  MapPin,
  MoreHorizontal,
  X,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { SessionType } from "@generated/prisma/client";
import type { SessionRow } from "@/app/(organizer)/organizer/sessions/page";

type TypeFilter = SessionType | "ALL";

interface SessionGridProps {
  sessions: SessionRow[];
  typeFilter: TypeFilter;
}

// Utilitaires de badgeage sémantique
function sessionTypeBadge(type: string) {
  let styles = "bg-slate-100 text-slate-700";
  let label = type;

  switch (type) {
    case "KEYNOTE":
      styles = "bg-purple-100 text-purple-700 border-purple-200";
      label = "🗝️ Keynote";
      break;
    case "WORKSHOP":
      styles = "bg-orange-100 text-orange-700 border-orange-200";
      label = "🛠️ Workshop";
      break;
    case "PANEL":
      styles = "bg-blue-100 text-blue-700 border-blue-200";
      label = "👥 Panel";
      break;
    case "TALK":
      styles = "bg-teal-100 text-teal-700 border-teal-200";
      label = "🗣️ Talk";
      break;
    case "POSTER":
      styles = "bg-rose-100 text-rose-700 border-rose-200";
      label = "🖼️ Poster";
      break;
    case "BREAK":
      styles = "bg-amber-100 text-amber-700 border-amber-200";
      label = "☕ Pause";
      break;
  }

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase", styles)}>
      {label}
    </span>
  );
}

function formatSessionDate(debut: Date, fin: Date): string {
  const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${dateFmt.format(debut)} · ${timeFmt.format(debut)} - ${timeFmt.format(fin)}`;
}

// --- SOUS COMPOSANT : SLIDE-IN PANEL ---
function SessionDetailPanel({ session, onClose }: { session: SessionRow | null; onClose: () => void }) {
  const isOpen = session !== null;

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      <div
        role="dialog"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen w-full max-w-[550px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {session && (
          <div className="flex h-full flex-col justify-between">
            {/* Header */}
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  {sessionTypeBadge(session.type)}
                  <h2 className="font-heading text-xl font-bold text-slate-900">{session.titre}</h2>
                  <p className="text-xs font-semibold text-teal-600">
                    Rattaché à : {session.conference.shortName ?? session.conference.titre}
                  </p>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {session.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                  <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl">{session.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Logistique & Planning</h4>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{formatSessionDate(session.horaireDebut, session.horaireFin)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>Salle / Emplacement : <strong className="text-slate-900">{session.salle ?? "Non spécifiée"}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>Capacité maximale : <span className="font-semibold">{session.capacite} places</span></span>
                </div>
              </div>

              {session.intervenants.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Intervenants & Présentateurs</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {session.intervenants.map((speaker, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-sm text-slate-700">
                        <User className="h-3.5 w-3.5 text-teal-500" />
                        <span>{speaker}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <Link
                href={`?modal=edit-session&id=${session.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4" /> Modifier la session
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// --- CONFIG TABLEAU TANSTACK ---
const columnHelper = createColumnHelper<SessionRow>();

export function SessionOrganizerGrid({ sessions, typeFilter }: SessionGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);

  const columns = useMemo<ColumnDef<SessionRow, any>[]>(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="accent-teal-600 cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="accent-teal-600 cursor-pointer"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      }),
      columnHelper.accessor("titre", {
        id: "session",
        header: "Session",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate max-w-xs">{row.original.titre}</p>
            <div className="mt-1">{sessionTypeBadge(row.original.type)}</div>
          </div>
        ),
      }),
      columnHelper.accessor("conference.titre", {
        header: "Conférence",
        cell: ({ row }) => (
          <span className="font-medium text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-md px-2 py-1">
            {row.original.conference.shortName ?? row.original.conference.titre}
          </span>
        ),
      }),
      columnHelper.accessor("horaireDebut", {
        header: "Horaires",
        cell: ({ row }) => (
          <span className="text-slate-700 text-xs font-medium">
            {formatSessionDate(row.original.horaireDebut, row.original.horaireFin)}
          </span>
        ),
      }),
      columnHelper.accessor("salle", {
        header: "Salle / Lieu",
        cell: ({ getValue }) => (
          <span className="text-slate-600 text-sm font-medium">{getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("capacite", {
        header: "Capacité",
        cell: ({ getValue }) => (
          <span className="text-slate-900 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            {getValue()} places
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`?modal=edit-session&id=${row.original.id}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700"
            >
              <Edit className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => toast.info("Options contextuelles - à connecter")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-slate-500 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        size: 80,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: sessions,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <Layers className="h-6 w-6" />
        </span>
        <p className="font-heading text-base font-bold text-slate-700">Aucune session trouvée</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          {typeFilter !== "ALL" ? "Aucun événement ne correspond à ce filtre." : "Commencez par ajouter des créneaux dans votre planning."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="bg-slate-50 border-b border-slate-200">
                  {group.headers.map((hdr) => (
                    <th
                      key={hdr.id}
                      onClick={hdr.column.getToggleSortingHandler()}
                      className={cn(
                        "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none",
                        hdr.column.getCanSort() && "cursor-pointer hover:text-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(hdr.column.columnDef.header, hdr.getContext())}
                        {hdr.column.getCanSort() && <ArrowUpDown className="h-3 w-3 text-slate-300" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedSession(row.original)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-teal-50/20 last:border-0 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50">
          <span className="text-xs text-slate-400">Total : {sessions.length} sessions</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 border rounded-lg bg-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 border rounded-lg bg-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <SessionDetailPanel session={selectedSession} onClose={() => setSelectedSession(null)} />
    </>
  );
}