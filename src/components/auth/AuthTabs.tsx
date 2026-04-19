"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Tabs client pour naviguer entre /login et /register.
 * Respecte la maquette : pill active = bleue avec ombre, pill inactive = texte slate.
 */
export function AuthTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/login", label: "Connexion" },
    { href: "/register", label: "Créer un compte" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Connexion ou inscription"
      className="mb-7 flex gap-1 rounded-xl bg-slate-100 p-1"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            prefetch
            className={cn(
              "flex-1 rounded-lg px-5 py-2 text-center text-sm font-semibold transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              isActive
                ? "bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]"
                : "bg-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}