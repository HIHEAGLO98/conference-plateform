"use client";

import { useMemo, useState } from "react";
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
  ExternalLink,
  MoreHorizontal,
  X,
  Calendar,
  Check,
  User,
  FileDown,
  Tag,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { ArticleStatus, ArticleType } from "@/generated/prisma/client";
import type { SubmissionRow } from "@/app/(organizer)/organizer/submissions/page";

interface SubmissionGridProps {
  submissions: SubmissionRow[];
  statusFilter: ArticleStatus | "ALL";
}

// Badge du statut d'évaluation scientifique
function articleStatusBadge(statut: string) {
  let config = { styles: "bg-slate-100 text-slate-700 border-slate-200", label: statut };
  switch (statut) {
    case "ACCEPTED":
      config = { styles: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "✓ Accepté" };
      break;
    case "PENDING":
      config = { styles: "bg-amber-100 text-amber-700 border-amber-200", label: "⏳ Reçu / En attente" };
      break;
    case "REVIEWING":
      config = { styles: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "🔍 En révision" };
      break;
    case "REJECTED":
      config = { styles: "bg-rose-100 text-rose-700 border-rose-200", label: "✗ Refusé" };
      break;
    case "DRAFT":
      config = { styles: "bg-slate-100 text-slate-500 border-slate-200", label: "Brouillon" };
      break;
    case "WITHDRAWN":
      config = { styles: "bg-gray-100 text-gray-400 border-gray-200 line-through", label: "Retiré" };
      break;
  }
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", config.styles)}>
      {config.label}
    </span>
  );
}

// Format de présentation (Oral vs Poster)
function articleTypeBadge(type: string) {
  let label = type;
  let color = "text-slate-600 border-slate-200 bg-slate-50";
  if (type === "ORAL") { color = "text-blue-700 border-blue-200 bg-blue-50"; label = "🎤 Présentation Orale"; }
  if (type === "POSTER") { color = "text-rose-700 border-rose-200 bg-rose-50"; label = "🖼️ Session Poster"; }
  return <span className={cn("border px-2 py-0.5 rounded text-[10px] font-semibold", color)}>{label}</span>;
}

// --- SOUS-COMPOSANT : SLIDE-IN PANEL (DÉTAILS + DÉCISION ÉDITORIALE) ---
function SubmissionDetailPanel({
  submission,
  onClose,
}: {
  submission: SubmissionRow | null;
  onClose: () => void;
}) {
  const isOpen = submission !== null;
  const [comment, setComment] = useState(submission?.commentaire ?? "");

  const handleDecision = (status: "ACCEPTED" | "REJECTED") => {
    // TODO: Connecter à une Server Action réelle (ex: updateArticleStatus)
    toast.success(`Le statut de l'article a été mis à jour : ${status}`);
    onClose();
  };

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
          "fixed right-0 top-0 z-50 flex h-screen w-full max-w-[580px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {submission && (
          <div className="flex h-full flex-col justify-between">
            {/* Header */}
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    {articleStatusBadge(submission.statut)}
                    {articleTypeBadge(submission.type)}
                  </div>
                  <h2 className="font-heading text-lg font-bold text-slate-900 leading-snug">{submission.titre}</h2>
                  <p className="text-xs text-teal-600 font-semibold">
                    Conférence : {submission.conference.shortName ?? submission.conference.titre}
                  </p>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Infos Auteur */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Soumis par : <strong className="text-slate-900">{submission.user.prenom} {submission.user.nom}</strong></span>
                </div>
                <p className="text-xs text-slate-500 pl-6">{submission.user.affiliation} · {submission.user.email}</p>
                {submission.coAuthors.length > 0 && (
                  <p className="text-xs text-slate-400 pl-6">Co-auteurs : {submission.coAuthors.join(", ")}</p>
                )}
              </div>

              {/* Résumé de l'article */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Abstract / Résumé</h4>
                <p className="text-sm leading-relaxed text-slate-600 text-justify">{submission.resume}</p>
              </div>

              {/* Mots-clés */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Mots-clés
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {submission.motsCles.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Document PDF */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Manuscrit complet</h4>
                {submission.fileUrl ? (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      <span>Télécharger le document d'évaluation (PDF)</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-rose-500 font-medium">Aucun fichier PDF rattaché à cette soumission.</p>
                )}
              </div>

              {/* Formulaire d'évaluation pour l'organisateur */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Avis & Commentaires du Comité
                </h4>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Inscrivez ici les retours des relecteurs ou vos remarques éditoriales destinées à l'auteur..."
                  rows={3}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 outline-none focus:border-teal-400 resize-none"
                />
              </div>
            </div>

            {/* Décisions éditoriales de l'Organisateur */}
            <div className="border-t border-slate-100 p-4 flex gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => handleDecision("REJECTED")}
                className="flex-1 rounded-xl border border-rose-200 bg-white py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Refuser l'article
              </button>
              <button
                type="button"
                onClick={() => handleDecision("ACCEPTED")}
                className="flex-1 inline-flex justify-center items-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 shadow-sm transition-colors"
              >
                <Check className="h-4 w-4" /> Accepter & Assigner
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// --- CONFIGURATION PRINCIPALE DE LA TABLE ---
const columnHelper = createColumnHelper<SubmissionRow>();

export function SubmissionOrganizerGrid({ submissions, statusFilter }: SubmissionGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedArt, setSelectedArt] = useState<SubmissionRow | null>(null);

  const columns = useMemo<ColumnDef<SubmissionRow, any>[]>(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          // 🛡️ Garde de sécurité pour empêcher l'évaluation prématurée avant initialisation de TanStack
          if (!table) return null;

          return (
            <input
              type="checkbox"
              className="accent-teal-600 cursor-pointer"
              checked={table.getIsAllPageRowsSelected()}
              ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          );
        },
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
        id: "submission",
        header: "Article scientifique",
        cell: ({ row }) => (
          <div className="min-w-0 max-w-sm lg:max-w-md">
            <p className="font-semibold text-slate-900 text-sm leading-snug truncate" title={row.original.titre}>
              {row.original.titre}
            </p>
            <p className="text-xs text-slate-400 mt-1 truncate">
              Auteur : {row.original.user.prenom} {row.original.user.nom} ({row.original.user.affiliation})
            </p>
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
      columnHelper.accessor("submittedAt", {
        header: "Soumis le",
        cell: ({ getValue }) => {
          const val = getValue();
          return (
            <span className="text-slate-600 text-xs font-medium">
              {val ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(val)) : "—"}
            </span>
          );
        },
      }),
      columnHelper.accessor("statut", {
        header: "Statut d'évaluation",
        cell: ({ getValue }) => articleStatusBadge(getValue()),
        size: 130,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
            {row.original.fileUrl && (
              <a
                href={row.original.fileUrl}
                target="_blank"
                rel="noreferrer"
                title="Ouvrir le PDF"
                className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700"
              >
                <FileDown className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => toast.info("Menu contextuel d'évaluation — à connecter")}
              className="flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-slate-500 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        size: 70,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: submissions,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <Calendar className="h-6 w-6" />
        </span>
        <p className="font-heading text-base font-bold text-slate-700">Aucun manuscrit trouvé</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          {statusFilter !== "ALL" ? "Aucune soumission sous cet état d'avancement." : "Les chercheurs n'ont pas encore soumis d'articles pour vos appels à communications."}
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
                        {/* 🎯 CORRECTION : Utilisation de la propriété header de la colonne courante */}
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
                  onClick={() => setSelectedArt(row.original)}
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

        {/* Contrôles de pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 bg-slate-50">
          <span className="text-xs text-slate-400">Total : {submissions.length} articles soumis</span>
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

      <SubmissionDetailPanel submission={selectedArt} onClose={() => setSelectedArt(null)} />
    </>
  );
}