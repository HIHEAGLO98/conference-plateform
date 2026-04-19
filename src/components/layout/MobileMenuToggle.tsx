"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLink { label: string; href: string; }

interface MobileMenuToggleProps { links: NavLink[]; }

export function MobileMenuToggle({ links }: MobileMenuToggleProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Ouvrir le menu"
        className="ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
          className={cn(
            "absolute inset-0 bg-slate-900/50 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
        />

        <nav
          className={cn(
            "absolute right-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-2xl transition-transform duration-200",
            open ? "translate-x-0" : "translate-x-full"
          )}
          aria-label="Menu principal mobile"
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <span className="font-heading text-base font-bold text-slate-800">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="px-3 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}