import Link from "next/link";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Layers,
  BarChart3,
  Building2,
} from "lucide-react";

import { signOut } from "@/auth";
import { cn } from "@/lib/utils";

/* 
 * Sidebar - Server Component.
 *
 * On n'active pas les liens dynamiquement côté server (pas de usePathname) :
 * le path actif est passé en prop par le layout qui lui-même lit `headers()`
 * (voir OrganizerLayout). Alternative simple : on marque statiquement les items
 * et on laissera Next.js highlight via aria-current.
 *
 * Couleur d'accent : teal (identité organisateur - directive critique).
 *  */

interface OrganizerSidebarProps {
  currentPath: string;
  user: {
    nom: string;
    prenom: string;
    avatarUrl: string | null;
  };
  /** Compteur de conférences affiché à côté du lien "Mes Conférences". */
  conferenceCount?: number;
}

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefix?: string;
  countKey?: "conferenceCount";
}> = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    matchPrefix: "/dashboard",
  },
  {
    href: "/dashboard/conferences",
    label: "Mes Conférences",
    icon: Calendar,
    matchPrefix: "/dashboard/conferences",
    countKey: "conferenceCount",
  },
  {
    href: "/dashboard/sessions",
    label: "Sessions",
    icon: Layers,
    matchPrefix: "/dashboard/sessions",
  },
  {
    href: "/dashboard/participants",
    label: "Participants",
    icon: Users,
    matchPrefix: "/dashboard/participants",
  },
  {
    href: "/dashboard/submissions",
    label: "Soumissions",
    icon: FileText,
    matchPrefix: "/dashboard/submissions",
  },
  {
    href: "/dashboard/stats",
    label: "Statistiques",
    icon: BarChart3,
    matchPrefix: "/dashboard/stats",
  },
  {
    href: "/dashboard/settings",
    label: "Paramètres",
    icon: Settings,
    matchPrefix: "/dashboard/settings",
  },
];

export function OrganizerSidebar({
  currentPath,
  user,
  conferenceCount = 0,
}: OrganizerSidebarProps) {
  const initials =
    (user.prenom[0] ?? "").toUpperCase() + (user.nom[0] ?? "").toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-900">
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
            <Building2 className="h-4 w-4 text-white" />
          </span>
          <span className="font-heading text-sm font-bold text-white">
            ConferenceHub
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white">
            {initials || "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.prenom} {user.nom}
            </p>
            <span className="mt-0.5 inline-block rounded-full bg-teal-900 px-2 py-0.5 text-xs font-medium text-teal-300">
              Organisateur
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        aria-label="Navigation principale"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-3"
      >
        <p className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Gestion
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.matchPrefix === "/dashboard"
              ? currentPath === "/dashboard"
              : currentPath.startsWith(item.matchPrefix ?? item.href);
          const Icon = item.icon;
          const count =
            item.countKey === "conferenceCount" ? conferenceCount : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-900/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-teal-700 text-white"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout — server action via <form> */}
      <div className="border-t border-white/10 p-3">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}