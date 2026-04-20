"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* 
 * Sidebar d'inscription.
 *
 * L'état local gère UNIQUEMENT la sélection de tarif (radio-group custom).
 * Le clic "S'inscrire" délègue à /conferences/[slug]/register?tier=XXX — où
 * la vraie logique (paiement, création de Inscription Prisma) sera implémentée.
*/

/*  Types  */

export type TierId = "STANDARD" | "STUDENT" | "PREMIUM";

export interface Tier {
  id: TierId;
  label: string;
  priceEuros: number;
  recommended?: boolean;
  features: Array<{ label: string; included: boolean }>;
}

interface RegistrationSidebarProps {
  conferenceId: string;
  slug: string;
  inscriptionsCount: number;
  capaciteMax: number | null;
  dateFin: Date;
  /** Seuil d'affichage de l'alerte "Plus que X places". Default: 100. */
  lowCapacityThreshold?: number;
  /** Tarifs — défauts alignés sur la maquette. */
  tiers?: Tier[];
}

/*  Tarifs par défaut (à remonter en DB plus tard via `InscriptionType`).  */

const DEFAULT_TIERS: Tier[] = [
  {
    id: "STANDARD",
    label: "Standard",
    priceEuros: 149,
    features: [
      { label: "Toutes les sessions & conférences", included: true },
      { label: "Pauses café incluses", included: true },
      { label: "Accès aux actes numériques", included: true },
      { label: "Cocktail du soir", included: false },
    ],
  },
  {
    id: "PREMIUM",
    label: "Premium",
    priceEuros: 249,
    recommended: true,
    features: [
      { label: "Tout le Standard +", included: true },
      { label: "Cocktail & dîner de gala", included: true },
      { label: "Accès prioritaire aux workshops", included: true },
      { label: "Actes imprimés + clé USB", included: true },
    ],
  },
];

/*  Composant  */

export function RegistrationSidebar({
  slug,
  inscriptionsCount,
  capaciteMax,
  dateFin,
  lowCapacityThreshold = 100,
  tiers = DEFAULT_TIERS,
}: RegistrationSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedId, setSelectedId] = useState<TierId>(
    () => tiers.find((t) => t.recommended)?.id ?? tiers[0]?.id ?? "STANDARD"
  );

  // Status calculé
  const { remaining, isFull, isPast } = useMemo(() => {
    const now = new Date();
    const rem =
      capaciteMax != null ? Math.max(0, capaciteMax - inscriptionsCount) : null;
    return {
      remaining: rem,
      isFull: rem !== null && rem === 0,
      isPast: dateFin < now,
    };
  }, [capaciteMax, inscriptionsCount, dateFin]);

  const activeTier = tiers.find((t) => t.id === selectedId) ?? tiers[0];
  const disabled = isPast || isFull || isPending || !activeTier;

  const statusText = isPast
    ? "Événement passé"
    : isFull
      ? "Complet"
      : "Inscriptions ouvertes";

  const handleRegister = () => {
    if (disabled || !activeTier) return;
    startTransition(() => {
      router.push(`/conferences/${slug}/register?tier=${activeTier.id}`);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-lg shadow-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-white/80">
              {statusText}
            </p>
            <p className="font-heading text-xl font-bold text-white">
              S&apos;inscrire à la conférence
            </p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Radio-group de tarifs */}
        <div
          role="radiogroup"
          aria-label="Choisir une formule d'inscription"
          className="space-y-3"
        >
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              selected={tier.id === selectedId}
              onSelect={() => setSelectedId(tier.id)}
              disabled={isPast || isFull}
            />
          ))}
        </div>

        {/* Alerte capacité faible */}
        {remaining !== null &&
          remaining > 0 &&
          remaining <= lowCapacityThreshold && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
              <p className="text-xs font-medium text-amber-700">
                Plus que <strong>{remaining} places</strong> disponibles
              </p>
            </div>
          )}

        {/* Alerte événement passé */}
        {isPast && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Lock className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">
              Les inscriptions sont closes - événement terminé.
            </p>
          </div>
        )}

        {/* Alerte complet */}
        {!isPast && isFull && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-500" />
            <p className="text-xs font-medium text-rose-700">
              Capacité atteinte - vous pouvez rejoindre la liste d&apos;attente.
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={disabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirection…
            </>
          ) : isPast ? (
            "Événement terminé"
          ) : isFull ? (
            "Rejoindre la liste d'attente"
          ) : activeTier ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              S&apos;inscrire maintenant - {activeTier.priceEuros}€
            </>
          ) : (
            "S'inscrire"
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Paiement sécurisé · Remboursement possible jusqu&apos;à 15 jours avant
          l&apos;événement
        </p>
      </div>
    </div>
  );
}

/* 
 * Sub-component : carte de tarif (bouton radio customisé)
 *  */

interface TierCardProps {
  tier: Tier;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function TierCard({ tier, selected, onSelect, disabled }: TierCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border-2 p-4 text-left transition-all",
        selected
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:border-blue-300",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2",
              selected ? "border-blue-600 bg-blue-600" : "border-slate-300"
            )}
            aria-hidden
          >
            {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {tier.label}
          </span>
          {tier.recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Crown className="h-2.5 w-2.5" />
              Recommandé
            </span>
          )}
        </div>
        <div className="text-right">
          <span
            className={cn(
              "font-heading text-xl font-bold",
              selected ? "text-blue-700" : "text-slate-900"
            )}
          >
            {tier.priceEuros}€
          </span>
        </div>
      </div>

      <ul className="space-y-1 text-xs text-slate-600">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {f.included ? (
              <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-500" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0 text-slate-300" />
            )}
            <span className={cn(!f.included && "text-slate-400")}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>
    </button>
  );
}