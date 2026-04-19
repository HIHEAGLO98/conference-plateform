"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";

import { logoutUser } from "@/actions/auth";
import { cn, roleLabel } from "@/lib/utils";

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

/** Menu dropdown utilisateur — fermeture au clic extérieur + Escape. */
export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser();
    });
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
          {initials || <UserIcon className="h-4 w-4" />}
        </div>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in"
        >
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {roleLabel(user.role)}
            </span>
          </div>

          {/* Items */}
          <div className="py-1">
            <MenuLink
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Tableau de bord"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/profile"
              icon={<UserIcon className="h-4 w-4" />}
              label="Mon profil"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/settings"
              icon={<Settings className="h-4 w-4" />}
              label="Paramètres"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isPending}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {isPending ? "Déconnexion…" : "Déconnexion"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
    >
      <span className="text-slate-500">{icon}</span>
      {label}
    </Link>
  );
}