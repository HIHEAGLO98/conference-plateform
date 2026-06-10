"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

interface StatsToolbarProps {
  selectedConfId: string;
  conferences: Array<{ id: string; titre: string; shortName: string | null }>;
}

export function StatsToolbar({ selectedConfId, conferences }: StatsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (confId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (confId) params.set("confId", confId);
    else params.delete("confId");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h1 className="font-heading text-xl font-bold text-slate-900">Analyses & Indicateurs</h1>
        <p className="text-sm text-slate-500">Aperçu en temps réel de vos performances.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
          <select
            value={selectedConfId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full sm:w-64 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          >
            <option value="">Toutes mes conférences</option>
            {conferences.map((conf) => (
              <option key={conf.id} value={conf.id}>
                {conf.shortName ?? conf.titre}
              </option>
            ))}
          </select>
        </div>
        {isPending && (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        )}
      </div>
    </div>
  );
}