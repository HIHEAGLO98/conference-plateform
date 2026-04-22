"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
 * ModalShell — wrapper réutilisable pour les modals de l'organisateur.
 *
 * Comportement :
 *   - Ferme sur clic sur l'overlay
 *   - Ferme sur touche Escape
 *   - Bloque le scroll body tant que le modal est ouvert
 *   - Supprime les query params associés au modal (`modal` + `conf`)
 *
 * Modal piloté par l'URL (`?modal=...`) — la fermeture passe par
 * `router.replace` pour ne pas polluer l'historique.
 *  */

interface ModalShellProps {
  title: string;
  subtitle?: string;
  size?: "md" | "lg";
  children: React.ReactNode;
  footer: React.ReactNode;
  /** Content au-dessus du body scrollable (ex: step indicator). */
  topBar?: React.ReactNode;
}

export function ModalShell({
  title,
  subtitle,
  size = "md",
  children,
  footer,
  topBar,
}: ModalShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    params.delete("conf");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  // Escape close + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/65 p-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal
      aria-labelledby="modal-title"
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col rounded-[20px] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.2)]",
          size === "lg" ? "max-w-[680px]" : "max-w-[560px]"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-100 px-7 pb-5 pt-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2
                id="modal-title"
                className="font-heading text-xl font-bold text-slate-900"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {topBar}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-7 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

/** Helper pour fermer un modal depuis un enfant sans dupliquer la logique. */
export function useCloseModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  return () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modal");
    params.delete("conf");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };
}