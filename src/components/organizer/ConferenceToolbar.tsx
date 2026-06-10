"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ConferenceStatus } from "@/generated/prisma/client";

//  Types 

type StatusFilter = ConferenceStatus | "ALL";

interface ConferenceToolbarProps {
  statusFilter: StatusFilter;
  defaultQuery: string;
}

//  Chips config 

const FILTER_CHIPS: { label: string; value: StatusFilter; dot?: string }[] = [
  { label: "Toutes",     value: "ALL" },
  { label: "Publiées",   value: "PUBLISHED", dot: "bg-emerald-500" },
  { label: "Brouillons", value: "DRAFT",     dot: "bg-amber-400" },
  { label: "Archivées",  value: "ARCHIVED",  dot: "bg-slate-400" },
  { label: "Annulées",   value: "CANCELLED", dot: "bg-rose-400" },
];

//  Composant 

export function ConferenceToolbar({
  statusFilter,
  defaultQuery,
}: ConferenceToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /** Construit une nouvelle URL en fusionnant les paramètres existants. */
  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(overrides)) {
        if (val === undefined || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      // Réinitialise la pagination quand le filtre change
      if ("statut" in overrides || "q" in overrides) {
        params.delete("page");
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  /** Change le filtre de statut via l'URL (remplace sans ajouter à l'historique). */
  const handleStatusChange = (value: StatusFilter) => {
    startTransition(() => {
      router.replace(
        buildUrl({ statut: value === "ALL" ? undefined : value }),
        { scroll: false }
      );
    });
  };

  /** Déclenche la recherche textuelle avec debounce implicite via le Server Component. */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    startTransition(() => {
      router.replace(buildUrl({ q: q || undefined }), { scroll: false });
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Gauche : search + chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Barre de recherche */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-[10px] border-[1.5px] bg-white px-3 py-2 transition-colors",
            "border-slate-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20",
            isPending && "opacity-70"
          )}
        >
          <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une conférence…"
            defaultValue={defaultQuery}
            onChange={handleSearch}
            className="w-48 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            aria-label="Rechercher une conférence"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par statut">
          {FILTER_CHIPS.map((chip) => {
            const isActive = statusFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleStatusChange(chip.value)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold transition-all",
                  isActive
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700"
                )}
              >
                {chip.dot && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", chip.dot)} />
                )}
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Indicateur de chargement */}
        {isPending && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        )}
      </div>

      {/* Droite : actions globales */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-[9px] border-[1.5px] border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300"
          onClick={() => {
            // TODO: export CSV côté serveur
            window.alert("Export CSV — à connecter à une route API");
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Exporter
        </button>

        <Link
          href="?modal=create-conf"
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-[9px] bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle conférence
        </Link>
      </div>
    </div>
  );
}