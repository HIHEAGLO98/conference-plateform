"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Gift,
  GraduationCap,
  Loader2,
  Lock,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

/*  Types  */

export type TierId = "FREE" | "STUDENT" | "STANDARD" | "PREMIUM";

export interface Tier {
  id: TierId;
  label: string;
  priceEuros: number;
  recommended?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  features: Array<{ label: string; included: boolean }>;
}

interface RegistrationSidebarProps {
  conferenceId: string;
  slug: string;
  inscriptionsCount: number;
  capaciteMax: number | null;
  dateFin: Date;
  lowCapacityThreshold?: number;
  tiers?: Tier[];
}

/*  Tarifs  */

export const DEFAULT_TIERS: Tier[] = [
  {
    id: "FREE",
    label: "Gratuit",
    priceEuros: 0,
    icon: <Gift className="h-4 w-4" />,
    badge: "Accès libre",
    features: [
      { label: "Sessions plénières uniquement", included: true },
      { label: "Actes numériques en accès libre", included: true },
      { label: "Pauses café incluses", included: false },
      { label: "Cocktail du soir", included: false },
    ],
  },
  {
    id: "STUDENT",
    label: "Étudiant",
    priceEuros: 49,
    icon: <GraduationCap className="h-4 w-4" />,
    badge: "Tarif réduit",
    features: [
      { label: "Toutes les sessions & conférences", included: true },
      { label: "Pauses café incluses", included: true },
      { label: "Actes numériques", included: true },
      { label: "Cocktail du soir", included: false },
    ],
  },
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
    icon: <Crown className="h-4 w-4" />,
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
    () => tiers.find((t) => t.recommended)?.id ?? tiers[0]?.id ?? "FREE"
  );

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
            <div className="mb-1 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  isPast
                    ? "bg-white/20 text-white/70"
                    : isFull
                      ? "bg-rose-500 text-white"
                      : "bg-emerald-400/30 text-emerald-100"
                )}
              >
                {!isPast && !isFull && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                )}
                {statusText}
              </span>
            </div>
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
        {/* Radio-group tarifs */}
        <div role="radiogroup" aria-label="Choisir une formule d'inscription" className="space-y-2.5">
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
        {remaining !== null && remaining > 0 && remaining <= lowCapacityThreshold && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs font-medium text-amber-700">
              Plus que <strong>{remaining} places</strong> disponibles
            </p>
          </div>
        )}

        {isPast && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Lock className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">
              Les inscriptions sont closes — événement terminé.
            </p>
          </div>
        )}

        {!isPast && isFull && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-500" />
            <p className="text-xs font-medium text-rose-700">
              Capacité atteinte — vous pouvez rejoindre la liste d&apos;attente.
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
            <><Loader2 className="h-4 w-4 animate-spin" />Redirection…</>
          ) : isPast ? (
            "Événement terminé"
          ) : isFull ? (
            "Rejoindre la liste d'attente"
          ) : activeTier ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {activeTier.priceEuros === 0
                ? "S'inscrire gratuitement"
                : `S'inscrire - ${activeTier.priceEuros} €`}
            </>
          ) : (
            "S'inscrire"
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          {activeTier?.priceEuros === 0
            ? "Inscription gratuite · Un ticket PDF vous sera envoyé par e-mail"
            : "Paiement sécurisé · Remboursement possible jusqu'à 15 jours avant l'événement"}
        </p>
      </div>
    </div>
  );
}

/* TierCard  */

interface TierCardProps {
  tier: Tier;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function TierCard({ tier, selected, onSelect, disabled }: TierCardProps) {
  const isFree = tier.priceEuros === 0;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border-2 p-3.5 text-left transition-all",
        selected
          ? isFree
            ? "border-emerald-500 bg-emerald-50"
            : "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:border-blue-300",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Gauche : radio + label */}
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2",
              selected
                ? isFree
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-blue-600 bg-blue-600"
                : "border-slate-300"
            )}
            aria-hidden
          >
            {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">{tier.label}</span>

              {tier.recommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Star className="h-2.5 w-2.5" />
                  Recommandé
                </span>
              )}

              {tier.badge && !tier.recommended && (
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  isFree
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                )}>
                  {tier.badge}
                </span>
              )}
            </div>

            {/* Features condensées */}
            <ul className="mt-1.5 space-y-0.5">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {f.included ? (
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <X className="h-3 w-3 flex-shrink-0 text-slate-300" />
                  )}
                  <span className={cn(
                    "text-xs",
                    f.included ? "text-slate-600" : "text-slate-400"
                  )}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Droite : prix */}
        <div className="flex-shrink-0 text-right">
          <span className={cn(
            "font-heading text-xl font-bold",
            selected
              ? isFree ? "text-emerald-600" : "text-blue-700"
              : "text-slate-900"
          )}>
            {isFree ? "Gratuit" : `${tier.priceEuros} €`}
          </span>
        </div>
      </div>
    </button>
  );
}