"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, Users, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Session } from "@/generated/prisma/client";
import type { Speaker } from "@/lib/utils/speakers";


/* 
 * Section "Intervenants" - Server Component.
 *
 * La liste des intervenants est dérivée du champ `intervenants` (String[])
 * du modèle `Session` de Prisma.
 * La fonction `extractSpeakers` dédup par nom, comptabilise les
 * sessions, et attribue au speaker son rôle "le plus prestigieux" (KEYNOTE >
 * PANEL > WORKSHOP > TALK > POSTER).
 */

/*  Extraction logic  */

type Priority = { score: number; role: string };

const PRIORITY_BY_TYPE: Record<string, Priority> = {
  KEYNOTE: { score: 5, role: "Keynote Speaker" },
  PANEL: { score: 4, role: "Panéliste" },
  WORKSHOP: { score: 3, role: "Animateur d'atelier" },
  TALK: { score: 2, role: "Conférencier" },
  POSTER: { score: 1, role: "Présentation poster" },
  BREAK: { score: 0, role: "" },
};

/*  Composant Principal  */

interface SpeakersSectionProps {
  speakers: Speaker[];
  /** Au-delà, un bouton "Voir tous" est affiché. Default: 4. */
  limit?: number;
}

export function SpeakersSections({
  speakers,
  limit = 4,
}: SpeakersSectionProps) {
  const featured = speakers.slice(0, limit);
  const hasMore = speakers.length > limit;

  return (
    <section
      id="sec-speakers"
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
    >
      <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
          <Users className="h-4 w-4 text-purple-700" />
        </span>
        Intervenants
        {speakers.length > 0 && (
          <span className="ml-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
            {speakers.length}
          </span>
        )}
      </h2>

      {speakers.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          Les intervenants seront annoncés prochainement.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured.map((s) => (
              <SpeakerCard key={s.id} speaker={s} />
            ))}
          </div>

          {hasMore && (
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
            >
              Voir tous les intervenants ({speakers.length})
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </section>
  );
}
export function SpeakersSection({
  speakers,
  limit = 4,
}: SpeakersSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const featured = speakers.slice(0, limit);
  const hasMore = speakers.length > limit;

  // Bloque le scroll du body quand le modal est ouvert (Bonne pratique UX)
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  return (
    <>
      <section
        id="sec-speakers"
        className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
      >
        <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <Users className="h-4 w-4 text-purple-700" />
          </span>
          Intervenants
          {speakers.length > 0 && (
            <span className="ml-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
              {speakers.length}
            </span>
          )}
        </h2>

        {speakers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            Les intervenants seront annoncés prochainement.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {featured.map((s) => (
                <SpeakerCard key={s.id} speaker={s} />
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Voir tous les intervenants ({speakers.length})
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </section>

      {/*  MODAL TOUS LES INTERVENANTS ─ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header du modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
                <Users className="h-5 w-5 text-purple-600" />
                Tous les intervenants
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  {speakers.length}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corps du modal (Scrollable) */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {speakers.map((s) => (
                  <SpeakerCard key={s.id} speaker={s} />
                ))}
              </div>
            </div>
          </div>

          {/* Calque pour fermer au clic en dehors (optionnel mais pratique) */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
}

/*  Sub-component : carte intervenant  */

/** Palette de dégradés pour les avatars fallback — chaîne stable sur `id`. */
const AVATAR_GRADIENTS = [
  "from-blue-400 to-blue-700",
  "from-purple-400 to-purple-700",
  "from-emerald-400 to-emerald-700",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-rose-700",
  "from-teal-400 to-teal-700",
  "from-indigo-400 to-indigo-700",
] as const;

/** Palette de teintes pour le label de rôle. */
const ROLE_TONES: Record<string, string> = {
  "Keynote Speaker": "text-blue-600",
  Panéliste: "text-purple-600",
  "Animateur d'atelier": "text-emerald-600",
  Conférencier: "text-indigo-600",
  "Présentation poster": "text-amber-600",
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0; // Convert to 32bit integer
  }
  return Math.abs(h);
}

function SpeakerCard({ speaker }: { speaker: Speaker }) {
  const initials =
    (speaker.prenom?.[0] ?? "").toUpperCase() +
    (speaker.nom?.[0] ?? "").toUpperCase();
    
  const gradient =
    AVATAR_GRADIENTS[hashString(speaker.id) % AVATAR_GRADIENTS.length];
  const roleTone = ROLE_TONES[speaker.role] ?? "text-slate-600";

  return (
    <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm">
      {speaker.avatarUrl ? (
        <Image
          src={speaker.avatarUrl}
          alt={`${speaker.prenom} ${speaker.nom}`}
          width={56}
          height={56}
          className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white",
            gradient
          )}
          aria-hidden
        >
          {initials || "?"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {speaker.prenom} {speaker.nom}
        </p>
        {speaker.affiliation && (
          <p className="truncate text-xs text-slate-500">
            {speaker.affiliation}
          </p>
        )}
        {speaker.role && (
          <p className={cn("mt-1 truncate text-xs font-medium", roleTone)}>
            {speaker.role}
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-400">
          {speaker.sessionCount} session{speaker.sessionCount > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}