"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/* 
 * Header sticky - Client Component.
 *
 * Les deux CTA du header (Nouvelle conférence / Nouvelle session) ouvrent
 * les modals via l'URL : on push `?modal=create-conf` (ou `create-session`)
 * dans la query-string. C'est la page.tsx qui lit la query et rend le modal
 * correspondant.
 *
 * Pourquoi l'URL plutôt que du state local ?
 *   - Deep-linkable (on peut partager /dashboard?modal=create-conf)
 *   - Back button ferme le modal automatiquement
 *   - Pas besoin d'un React Context global
 *  */

export type ModalKey = "create-conf" | "create-session";

interface OrganizerHeaderProps {
  breadcrumb: { label: string; href?: string }[];
  user: {
    nom: string;
    prenom: string;
    avatarUrl: string | null;
  };
  /** Badge "notifications non lues" (passé par le layout Server). */
  unreadNotifications?: number;
}

export function OrganizerHeader({
  breadcrumb,
  user,
  unreadNotifications = 0,
}: OrganizerHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openModal = (key: ModalKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", key);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const initials =
    (user.prenom[0] ?? "").toUpperCase() + (user.nom[0] ?? "").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-slate-200 bg-white px-7 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm">
        {breadcrumb.map((b, i) => {
          const isLast = i === breadcrumb.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {b.href && !isLast ? (
                <Link
                  href={b.href}
                  className="text-slate-500 hover:text-teal-700"
                >
                  {b.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast ? "font-semibold text-slate-800" : "text-slate-500"
                  )}
                >
                  {b.label}
                </span>
              )}
              {!isLast && (
                <span className="text-slate-300" aria-hidden>
                  ›
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5">
        {/* Primary CTAs */}
        <button
          type="button"
          onClick={() => openModal("create-conf")}
          className="inline-flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-teal-600 bg-white px-4 py-2 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle conférence
        </button>
        <button
          type="button"
          onClick={() => openModal("create-session")}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter une session
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label={`${unreadNotifications} notifications non lues`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Avatar */}
        <span
          aria-label={`${user.prenom} ${user.nom}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-bold text-white"
        >
          {initials || "?"}
        </span>
      </div>
    </header>
  );
}