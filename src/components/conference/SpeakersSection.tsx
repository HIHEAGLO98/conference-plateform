import Image from "next/image";
import { ChevronRight, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConferenceSessionItem } from "@/lib/queries/conference-detail";

/* 
 * Section "Intervenants" - Server Component, pas d'interactivité.
 *
 * Le schema Prisma n'a pas de modèle `Speaker` dédié : on DÉRIVE la liste des
 * intervenants à partir de `Session.presenter` (l'utilisateur qui anime la
 * session). La fonction `extractSpeakers` dédup par user, comptabilise les
 * sessions, et attribue au speaker son rôle "le plus prestigieux" (KEYNOTE >
 * PANEL > WORKSHOP > TALK > POSTER).
 *
 * Plus tard, si on veut un "speaker invité" qui ne présente pas de session
 * (ex: patron sponsor), on ajoutera un modèle `ConferenceSpeaker` en DB.
 *  */

/*  Types publics  */

export interface Speaker {
  id: string;
  nom: string;
  prenom: string;
  affiliation: string | null;
  avatarUrl: string | null;
  /** Rôle dérivé du type de session le plus prestigieux qu'il anime. */
  role: string;
  /** Nombre de sessions animées. */
  sessionCount: number;
}

/*  Extraction (utilisable depuis page.tsx ou un autre server component)  */

type Priority = { score: number; role: string };

const PRIORITY_BY_TYPE: Record<string, Priority> = {
  KEYNOTE: { score: 5, role: "Keynote Speaker" },
  PANEL: { score: 4, role: "Panéliste" },
  WORKSHOP: { score: 3, role: "Animateur d'atelier" },
  TALK: { score: 2, role: "Conférencier" },
  POSTER: { score: 1, role: "Présentation poster" },
  BREAK: { score: 0, role: "" },
};

/**
 * Dédup les présentateurs d'une liste de sessions + attribue un rôle et un
 * compteur. Retourne les speakers triés par priorité de rôle décroissante.
 */
export function extractSpeakers(
  sessions: ConferenceSessionItem[]
): Speaker[] {
  const map = new Map<string, { speaker: Speaker; topScore: number }>();

  for (const s of sessions) {
    if (!s.presenter) continue;

    const priority = PRIORITY_BY_TYPE[s.type] ?? PRIORITY_BY_TYPE.TALK;
    if (priority.score === 0) continue; // on ignore les BREAK

    const existing = map.get(s.presenter.id);
    if (!existing) {
      map.set(s.presenter.id, {
        speaker: {
          id: s.presenter.id,
          nom: s.presenter.nom,
          prenom: s.presenter.prenom,
          affiliation: s.presenter.affiliation,
          avatarUrl: s.presenter.avatarUrl,
          role: priority.role,
          sessionCount: 1,
        },
        topScore: priority.score,
      });
    } else {
      existing.speaker.sessionCount += 1;
      if (priority.score > existing.topScore) {
        existing.speaker.role = priority.role;
        existing.topScore = priority.score;
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.topScore - a.topScore)
    .map((e) => e.speaker);
}

/* ── Composant ─────────────────────────────────────────────────────────── */

interface SpeakersSectionProps {
  speakers: Speaker[];
  /** Au-delà, un bouton "Voir tous" est affiché. Default: 4. */
  limit?: number;
}

export function SpeakersSection({
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

/* ── Sub-component : carte intervenant ─────────────────────────────────── */

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
    h |= 0;
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