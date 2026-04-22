"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Download, Plus, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RecentInscription } from "@/lib/queries/organizer-dashboard";

/* 
 * QuickActionsSidebar — colonne de droite du dashboard (client).
 *
 * Contient :
 *   - Card "Actions rapides" — 3 boutons vers modals/actions
 *   - Card "Dernières inscriptions" — flux "Live" (pulse vert) avec les N
 *     dernières inscriptions sur les conférences de l'organisateur.
 *
 * Les actions de modals passent par l'URL (?modal=create-conf) comme le header.
 *  */

interface QuickActionsSidebarProps {
  recentInscriptions: RecentInscription[];
}

export function QuickActionsSidebar({
  recentInscriptions,
}: QuickActionsSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openModal = (key: "create-conf" | "create-session") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("modal", key);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {/* Quick Actions */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <header className="border-b border-slate-100 p-5">
          <h3 className="font-heading text-sm font-semibold text-slate-900">
            Actions rapides
          </h3>
        </header>
        <div className="space-y-2 p-4">
          <QuickActionButton
            onClick={() => openModal("create-conf")}
            icon={<Calendar className="h-4 w-4 text-teal-600" />}
            iconBg="bg-teal-50"
            hoverBg="hover:bg-teal-50 hover:border-teal-100"
            title="Créer une conférence"
            subtitle="Définir dates, lieu et thématiques"
          />
          <QuickActionButton
            onClick={() => openModal("create-session")}
            icon={<Plus className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-50"
            hoverBg="hover:bg-blue-50 hover:border-blue-100"
            title="Ajouter une session"
            subtitle="Rattachée à une conférence existante"
          />
          <QuickActionButton
            icon={<Download className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-50"
            hoverBg="hover:bg-amber-50 hover:border-amber-100"
            title="Exporter les inscrits"
            subtitle="CSV ou Excel"
          />
        </div>
      </section>

      {/* Last registrations — Live feed */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <header className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="font-heading text-sm font-semibold text-slate-900">
            Dernières inscriptions
          </h3>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"
              aria-hidden
            />
            <span className="text-xs font-medium text-emerald-700">Live</span>
          </div>
        </header>

        {recentInscriptions.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs text-slate-400">
              Aucune inscription pour le moment
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentInscriptions.map((ins) => (
              <li key={ins.id} className="flex items-center gap-3 px-5 py-3">
                <InscriptionAvatar user={ins.user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {ins.user.prenom} {ins.user.nom}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {ins.conference.shortName ?? ins.conference.titre} ·{" "}
                    {formatRelativeTime(ins.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="p-4">
          <Link
            href="/dashboard/participants"
            className="block w-full text-center text-xs font-semibold text-teal-700 hover:underline"
          >
            Voir tous les inscrits →
          </Link>
        </div>
      </section>
    </div>
  );
}

/* 
 * Sub-components
 *  */

interface QuickActionButtonProps {
  icon: React.ReactNode;
  iconBg: string;
  hoverBg: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

function QuickActionButton({
  icon,
  iconBg,
  hoverBg,
  title,
  subtitle,
  onClick,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-all",
        hoverBg
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}

const AVATAR_BG_POOL = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
] as const;

function InscriptionAvatar({
  user,
}: {
  user: RecentInscription["user"];
}) {
  const initials =
    (user.prenom[0] ?? "").toUpperCase() + (user.nom[0] ?? "").toUpperCase();
  const tone = AVATAR_BG_POOL[hashString(user.id) % AVATAR_BG_POOL.length];

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={`${user.prenom} ${user.nom}`}
        width={32}
        height={32}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
        tone.bg,
        tone.text
      )}
      aria-hidden
    >
      {initials || "?"}
    </span>
  );
}

/* Utils  */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}