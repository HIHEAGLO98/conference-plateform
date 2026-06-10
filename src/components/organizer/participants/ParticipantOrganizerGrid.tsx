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
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  MoreHorizontal,
  X,
  Calendar,
  CheckCircle,
  Building,
  CreditCard,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { InscriptionStatus, InscriptionType } from "@/generated/prisma/client";
import type { ParticipantRow } from "@/app/(organizer)/organizer/participants/page";

type StatusFilter = InscriptionStatus | "ALL";

interface ParticipantGridProps {
  participants: ParticipantRow[];
  statusFilter: StatusFilter;
}

// Badge de flux d'inscription
function participantStatusBadge(statut: string) {
  let config = { styles: "bg-slate-100 text-slate-700", label: statut };
  switch (statut) {
    case "CONFIRMED":
      config = { styles: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "✓ Confirmé" };
      break;
    case "PENDING":
      config = { styles: "bg-amber-100 text-amber-700 border-amber-200", label: "⏳ En attente" };
      break;
    case "ATTENDED":
      config = { styles: "bg-blue-100 text-blue-700 border-blue-200", label: "🎯 Présent (Scanné)" };
      break;
    case "CANCELLED":
      config = { styles: "bg-rose-100 text-rose-700 border-rose-200", label: "✗ Annulé" };
      break;
  }
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", config.styles)}>
      {config.label}
    </span>
  );
}

// Badge de catégorie tarifaire (InscriptionType)
function pricingTypeBadge(type: string) {
  let styles = "bg-slate-100 text-slate-600";
  switch (type) {
    case "STANDARD": styles = "bg-slate-100 text-slate-800 border-slate-200"; break;
    case "STUDENT":  styles = "bg-cyan-50 text-cyan-700 border-cyan-200"; break;
    case "VIP":      styles = "bg-purple-50 text-purple-700 border-purple-200"; break;
    case "SPEAKER":  styles = "bg-indigo-50 text-indigo-700 border-indigo-200"; break;
    case "ORGANIZER":styles = "bg-teal-50 text-teal-700 border-teal-200"; break;
  }
  return (
    <span className={cn("inline-flex items-center border rounded px-1.5 py-0.5 text-[10px] font-medium", styles)}>
      {type}
    </span>
  );
}

// --- SOUS COMPOSANT : SLIDE-IN PANEL DE DÉTAIL ---
function ParticipantDetailPanel({
  inscription,
  onClose,
}: {
  inscription: ParticipantRow | null;
  onClose: () => void;
}) {
  const isOpen = inscription !== null;

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
          "fixed right-0 top-0 z-50 flex h-screen w-full max-w-[520px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {inscription && (
          <div className="flex h-full flex-col justify-between">
            {/* Header */}
            <div className="border-b border-slate-100 p-6 bg-slate-50/50">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-center">
                  <div className="h-12 w-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-heading font-bold text-base">
                    {(inscription.user.prenom[0] ?? "").toUpperCase() + (inscription.user.nom[0] ?? "").toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-slate-900">
                      {inscription.user.prenom} {inscription.user.nom}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" /> {inscription.user.email}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Corps */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Statut de l'inscription */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">État de l'inscription</p>
                  <div className="pt-1">{participantStatusBadge(inscription.statut)}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Frais appliqués</p>
                  <div className="pt-1">{pricingTypeBadge(inscription.type)}</div>
                </div>
              </div>

              {/* Émargement de présence */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suivi des présences</h4>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                  <QrCode className="h-5 w-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">Point de contrôle d'accès</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inscription.checkedInAt
                        ? `Scanné le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(inscription.checkedInAt))}`
                        : "Badge non scanné pour le moment."}
                    </p>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full", inscription.checkedInAt ? "bg-emerald-500" : "bg-slate-300")} />
                </div>
              </div>

              {/* Profil Institutionnel */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Détails de l'affiliation</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Building className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Établissement / Organisme</p>
                      <p className="font-medium text-slate-800">{inscription.user.affiliation ?? "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Provenance géographique</p>
                      <p className="font-medium text-slate-800">{inscription.user.pays ?? "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Date d'enregistrement</p>
                      <p className="font-medium text-slate-800">
                        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(inscription.dateInscription))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions de bas de page */}
            <div className="border-t border-slate-100 p-4 flex gap-2 bg-slate-50">
              <button
                onClick={() => toast.success("Email d'attestation ou de relance envoyé")}
                className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                <CheckCircle className="h-4 w-4" /> Envoyer un rappel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// --- CONFIGURATION TANSTACK TABLE ---
const columnHelper = createColumnHelper<ParticipantRow>();

export function ParticipantOrganizerGrid({ participants, statusFilter }: ParticipantGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRow, setSelectedRow] = useState<ParticipantRow | null>(null);

  const columns = useMemo<ColumnDef<ParticipantRow, any>[]>(
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
      columnHelper.accessor("user.nom", {
        id: "participant",
        header: "Participant",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {row.original.user.prenom} {row.original.user.nom}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{row.original.user.email}</p>
          </div>
        ),
      }),
      columnHelper.accessor("conference.titre", {
        header: "Conférence affectée",
        cell: ({ row }) => (
          <span className="font-medium text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-md px-2 py-1">
            {row.original.conference.shortName ?? row.original.conference.titre}
          </span>
        ),
      }),
      columnHelper.accessor("user.affiliation", {
        header: "Affiliation / Établissement",
        cell: ({ getValue, row }) => (
          <div className="max-w-[200px] truncate">
            <p className="text-slate-700 text-sm font-medium">{getValue() ?? "—"}</p>
            {row.original.user.pays && (
              <p className="text-slate-400 text-xs mt-0.5">{row.original.user.pays}</p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Tarif",
        cell: ({ getValue }) => pricingTypeBadge(getValue()),
        size: 100,
      }),
      columnHelper.accessor("statut", {
        header: "Statut",
        cell: ({ getValue }) => participantStatusBadge(getValue()),
        size: 120,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: () => (
          <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toast.info("Options de gestion d'inscription actives")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-slate-500 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        size: 60,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: participants,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <CreditCard className="h-6 w-6" />
        </span>
        <p className="font-heading text-base font-bold text-slate-700">Aucun participant trouvé</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          {statusFilter !== "ALL" ? "Aucune inscription sous ce statut." : "Aucun participant ne s'est inscrit à vos conférences pour l'instant."}
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
                  onClick={() => setSelectedRow(row.original)}
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50">
          <span className="text-xs text-slate-400">Total : {participants.length} inscriptions</span>
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

      <ParticipantDetailPanel inscription={selectedRow} onClose={() => setSelectedRow(null)} />
    </>
  );
}