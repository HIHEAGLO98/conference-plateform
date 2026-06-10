"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// 🚨 Import partiel strict sous forme de type : ZÉRO fuite de module !
import type { SessionType } from "@/generated/prisma/client";

type TypeFilter = SessionType | "ALL";

interface SessionToolbarProps {
  typeFilter: TypeFilter;
  defaultQuery: string;
  selectedConfId: string;
  conferences: Array<{ id: string; titre: string; shortName: string | null }>;
}

const TYPE_CHIPS: { label: string; value: TypeFilter; dot: string }[] = [
  { label: "Tous", value: "ALL", dot: "bg-slate-400" },
  { label: "Keynotes", value: "KEYNOTE", dot: "bg-purple-500" },
  { label: "Workshops", value: "WORKSHOP", dot: "bg-orange-500" },
  { label: "Panels", value: "PANEL", dot: "bg-blue-500" },
  { label: "Talks", value: "TALK", dot: "bg-teal-500" },
  { label: "Posters", value: "POSTER", dot: "bg-rose-500" },
  { label: "Pauses", value: "BREAK", dot: "bg-amber-500" },
];

export function SessionToolbar({
  typeFilter,
  defaultQuery,
  selectedConfId,
  conferences,
}: SessionToolbarProps) {
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
      {/* Gauche : Recherche + Filtres par type */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Input recherche */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            defaultValue={defaultQuery}
            placeholder="Rechercher une session..."
            onChange={(e) => updateQueries({ q: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white"
          />
        </div>

        {/* Sélecteur de Conférence */}
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

        {/* Chips de SessionType */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {TYPE_CHIPS.map((chip) => {
            const active = typeFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => updateQueries({ type: chip.value })}
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

      {/* Droite : Création */}
      <div className="flex items-center justify-end">
        <Link
          href="?modal=create-session"
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Session
        </Link>
      </div>
    </div>
  );
}