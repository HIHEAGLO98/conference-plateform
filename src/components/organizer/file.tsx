"use client";

import { useMemo, useState, useCallback } from "react";
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
  ArrowUpDown, ArrowUp, ArrowDown, Calendar, ChevronLeft, ChevronRight,
  Edit, MoreHorizontal, Plus, Trash2, Users, X, FileText, TrendingUp,
  AlertTriangle, Eye, Send, Layers, MapPin
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { ConferenceStatus } from "@generated/prisma/client";
import type { ConferenceRow } from "@/app/(organizer)/organizer/conferences/page";

// Types locaux
type StatusFilter = ConferenceStatus | "ALL";

interface ConferenceOrganizerGridProps {
  conferences: ConferenceRow[];
  statusFilter: StatusFilter;
}

// --- Helpers Visuels ---
function avatarClasses(statut: ConferenceStatus): string {
  switch (statut) {
    case "PUBLISHED": return "bg-teal-100 text-teal-700";
    case "DRAFT":     return "bg-slate-100 text-slate-500";
    case "ARCHIVED":  return "bg-purple-100 text-purple-700";
    case "CANCELLED": return "bg-rose-100 text-rose-700";
    default:          return "bg-slate-100 text-slate-400";
  }
}

function conferenceInitials(shortName: string | null, titre: string): string {
  const src = shortName ?? titre;
  const words = src.split(/[\s\-_]+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return src.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function statusBadge(statut: ConferenceStatus) {
  switch (statut) {
    case "PUBLISHED": return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Publié</span>;
    case "DRAFT": return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"><span className="text-amber-500">⚠</span>Brouillon</span>;
    case "ARCHIVED": return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">Archivé</span>;
    case "CANCELLED": return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Annulé</span>;
  }
}

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
  return `${fmt.format(start)} – ${fmt.format(end)} ${start.getFullYear()}`;
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

// --- DetailPanel & Grid ---
function DetailPanel({ conference, onClose }: { conference: ConferenceRow | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "participants" | "articles">("overview");
  if (!conference) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative h-screen w-full max-w-[680px] bg-white shadow-2xl flex flex-col">
        {/* ... (votre logique existante de tabs et détails) ... */}
        <div className="p-6 flex items-center justify-between border-b">
          <h2 className="text-lg font-bold">{conference.titre}</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
           <p className="text-sm">Thème : {conference.theme}</p>
           {/* ... suite du code ... */}
        </div>
      </div>
    </div>
  );
}

const columnHelper = createColumnHelper<ConferenceRow>();

export function ConferenceOrganizerGrid({ conferences, statusFilter }: ConferenceOrganizerGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedConf, setSelectedConf] = useState<ConferenceRow | null>(null);
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo<ColumnDef<ConferenceRow, any>[]>(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
            if (!table) return null;
            return <input type="checkbox" className="accent-teal-600" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />;
        },
        cell: ({ row }) => <input type="checkbox" className="accent-teal-600" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} onClick={(e) => e.stopPropagation()} />,
        size: 40,
      }) as ColumnDef<ConferenceRow, any>,

      columnHelper.accessor((row) => row.titre, {
        id: "conference",
        header: "Conférence",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-heading text-xs font-bold", avatarClasses(row.original.statut))}>
              {conferenceInitials(row.original.shortName, row.original.titre)}
            </span>
            <div>
              <p className="font-semibold text-sm">{row.original.shortName ?? row.original.titre}</p>
              <p className="text-xs text-slate-400">{row.original.theme}</p>
            </div>
          </div>
        ),
      }) as ColumnDef<ConferenceRow, any>,

      columnHelper.accessor((row) => row.statut, {
        id: "statut",
        header: "Statut",
        cell: ({ getValue }) => statusBadge(getValue() as ConferenceStatus),
      }) as ColumnDef<ConferenceRow, any>,

      columnHelper.accessor((row) => row.fillPercent, {
        id: "fill",
        header: "Remplissage",
        cell: ({ getValue }) => {
            const pct = getValue() as number;
            return <div className="text-xs font-bold" style={{ color: fillTextColor(pct) }}>{pct}%</div>;
        }
      }) as ColumnDef<ConferenceRow, any>
    ],
    []
  );

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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="bg-slate-50">
              {group.headers.map((hdr) => (
                <th key={hdr.id} className="px-4 py-3 text-left text-xs uppercase font-bold text-slate-500">
                  {flexRender(hdr.column.columnDef.header, hdr.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedConf(row.original)}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <DetailPanel conference={selectedConf} onClose={() => setSelectedConf(null)} />
    </div>
  );
}