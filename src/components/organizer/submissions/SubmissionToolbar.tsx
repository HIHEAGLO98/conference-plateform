"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import type { ArticleStatus } from "@/generated/prisma/client";

type StatusFilter = ArticleStatus | "ALL";

interface SubmissionToolbarProps {
  statusFilter: StatusFilter;
  defaultQuery: string;
  selectedConfId: string;
  conferences: Array<{ id: string; titre: string; shortName: string | null }>;
}

const STATUS_CHIPS: { label: string; value: StatusFilter; dot: string }[] = [
  { label: "Toutes", value: "ALL", dot: "bg-slate-400" },
  { label: "En attente", value: "PENDING", dot: "bg-amber-400" },
  { label: "En évaluation", value: "REVIEWING", dot: "bg-indigo-400" },
  { label: "Acceptés", value: "ACCEPTED", dot: "bg-emerald-500" },
  { label: "Refusés", value: "REJECTED", dot: "bg-rose-500" },
];

export function SubmissionToolbar({
  statusFilter,
  defaultQuery,
  selectedConfId,
  conferences,
}: SubmissionToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateQueries = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === "ALL" || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Recherche par mot-clé */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            defaultValue={defaultQuery}
            placeholder="Titre, auteur, résumé..."
            onChange={(e) => updateQueries({ q: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white"
          />
        </div>

        {/* Filtrage par conférence */}
        <select
          value={selectedConfId}
          onChange={(e) => updateQueries({ confId: e.target.value })}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none transition-all focus:border-teal-400 focus:bg-white"
        >
          <option value="">Toutes les conférences</option>
          {conferences.map((conf) => (
            <option key={conf.id} value={conf.id}>
              {conf.shortName ?? conf.titre}
            </option>
          ))}
        </select>

        {/* Catégories de filtres rapides */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {STATUS_CHIPS.map((chip) => {
            const active = statusFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => updateQueries({ statut: chip.value })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", chip.dot)} />
                {chip.label}
              </button>
            );
          })}
          {isPending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => window.alert("Génération du rapport complet de soumission...")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Exporter le listing
        </button>
      </div>
    </div>
  );
}