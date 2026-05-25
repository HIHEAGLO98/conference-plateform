"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Crown,
  Download,
  Gift,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Shield,
  Ticket,
  User,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { registerToConference, type TierId } from "@/actions/conferenceRegister";

//  Types & constantes 

type Step = "recap" | "confirm" | "done";

const TIER_META: Record<
  TierId,
  { label: string; price: number; icon: React.ReactNode; color: string }
> = {
  FREE:     { label: "Gratuit",   price: 0,   icon: <Gift className="h-4 w-4" />,            color: "text-emerald-600" },
  STUDENT:  { label: "Étudiant",  price: 49,  icon: <GraduationCap className="h-4 w-4" />,   color: "text-blue-600" },
  STANDARD: { label: "Standard",  price: 149, icon: <Ticket className="h-4 w-4" />,           color: "text-blue-600" },
  PREMIUM:  { label: "Premium",   price: 249, icon: <Crown className="h-4 w-4" />,            color: "text-blue-700" },
};

//  Props 

export interface ConferenceRegisterData {
  id: string;
  slug: string;
  titre: string;
  shortName: string | null;
  description: string;
  lieu: string;
  ville: string;
  pays: string;
  dateDebut: Date;
  dateFin: Date;
  capaciteMax: number | null;
  organisateur: { nom: string; prenom: string; affiliation: string | null };
}

export interface ParticipantData {
  nom: string;
  prenom: string;
  email: string;
}

interface RegisterFlowProps {
  conference: ConferenceRegisterData;
  participant: ParticipantData;
  // isAuthenticated passé depuis le Server Component parent
}

//  Composant principal 

export function RegisterFlow({ conference, participant }: RegisterFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const tierId = (searchParams.get("tier") as TierId | null) ?? "FREE";
  const tier = TIER_META[tierId] ?? TIER_META.FREE;

  const [step, setStep] = useState<Step>("recap");
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const locationStr = [conference.lieu, conference.ville, conference.pays]
    .filter(Boolean)
    .join(" · ");

  const handleConfirm = () => {
    if (!agreed) return;
    startTransition(async () => {
      setError(null);
      const res = await registerToConference(conference.id, tierId);
      if (!res.success) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      setResult({ reference: res.ticketNumber ?? "" });
      setStep("done");
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Retour */}
      <Link
        href={`/conferences/${conference.slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la conférence
      </Link>

      {/* Indicateur d'étapes */}
      <StepBar current={step} />

      {/*  ÉTAPE 1 : Récapitulatif  */}
      {step === "recap" && (
        <div className="space-y-6">
          <SectionCard title="Votre inscription">
            {/* Conférence */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Conférence
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-slate-900">
                {conference.shortName ?? conference.titre}
              </p>
              {conference.shortName && (
                <p className="text-xs text-slate-500">{conference.titre}</p>
              )}
              <div className="mt-3 flex flex-col gap-1.5">
                <InfoRow icon={<CalendarDays className="h-4 w-4" />}>
                  {formatDateRange(conference.dateDebut, conference.dateFin)}
                </InfoRow>
                <InfoRow icon={<MapPin className="h-4 w-4" />}>
                  {locationStr}
                </InfoRow>
              </div>
            </div>

            {/* Formule choisie */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm", tier.color)}>
                    {tier.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Formule {tier.label}</p>
                    <p className="text-xs text-slate-500">
                      {tier.price === 0 ? "Accès gratuit" : `${tier.price} € TTC`}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/conferences/${conference.slug}#register`}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Modifier
                </Link>
              </div>
            </div>

            {/* Participant */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Participant
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                  {participant.prenom[0]}{participant.nom[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {participant.prenom} {participant.nom}
                  </p>
                  <p className="text-xs text-slate-500">{participant.email}</p>
                </div>
              </div>
            </div>

            {/* Ce que vous recevrez */}
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Ce que vous recevrez
              </p>
              <ul className="space-y-2">
                {[
                  { icon: <Mail className="h-4 w-4 text-blue-500" />, label: "E-mail de confirmation avec votre billet en PDF" },
                  { icon: <Ticket className="h-4 w-4 text-teal-500" />, label: "Billet officiel avec code QR et code-barres pour l'accueil" },
                  { icon: <Shield className="h-4 w-4 text-slate-400" />, label: "Accès sécurisé à votre tableau de bord participant" },
                ].map(({ icon, label }, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    {icon}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>

          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Continuer vers la confirmation →
          </button>
        </div>
      )}

      {/*  ÉTAPE 2 : Confirmation  */}
      {step === "confirm" && (
        <div className="space-y-6">
          <SectionCard title="Confirmer votre inscription">
            {/* Récap compact */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {conference.shortName ?? conference.titre}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateRange(conference.dateDebut, conference.dateFin)} · Formule {tier.label}
                </p>
              </div>
              <span className={cn("font-heading text-xl font-bold", tier.color)}>
                {tier.price === 0 ? "Gratuit" : `${tier.price} €`}
              </span>
            </div>

            {/* Case à cocher CGV */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
              <span
                onClick={() => setAgreed((v) => !v)}
                className={cn(
                  "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
                  agreed ? "border-blue-600 bg-blue-600" : "border-slate-300"
                )}
              >
                {agreed && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="text-sm text-slate-700">
                J'accepte les{" "}
                <span className="font-semibold text-blue-600 underline cursor-pointer">
                  conditions générales d'inscription
                </span>{" "}
                et je confirme que les informations renseignées sont exactes.
                Je recevrai mon billet par e-mail après validation.
              </span>
            </label>

            {/* Paiement (tarifs payants) */}
            {tier.price > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <Shield className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  Le paiement de <strong>{tier.price} €</strong> sera traité via notre prestataire sécurisé (Mobile Money / Carte bancaire) - fonctionnalité à venir.
                </p>
              </div>
            )}

            {/* Erreur serveur */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </SectionCard>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("recap")}
              className="flex-1 rounded-xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!agreed || isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Inscription en cours…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" />Confirmer l'inscription</>
              )}
            </button>
          </div>
        </div>
      )}

      {/*  ÉTAPE 3 : Succès */}
      {step === "done" && result && (
        <div className="space-y-6 text-center">
          {/* Icône succès */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900">
              Inscription confirmée !
            </h2>
            <p className="mt-2 text-slate-500">
              Bienvenue, {participant.prenom}. Votre place est réservée.
            </p>
          </div>

          {/* Référence */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Votre référence de billet
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-slate-900">
              {result.reference}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Conservez cette référence - elle figure sur votre billet PDF.
            </p>
          </div>

          {/* Infos */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-left">
            <p className="mb-3 text-sm font-semibold text-slate-800">Prochaines étapes</p>
            <ul className="space-y-2.5">
              {[
                {
                  icon: <Mail className="h-4 w-4 text-blue-500" />,
                  text: `Un e-mail de confirmation avec votre billet PDF a été envoyé à ${participant.email}`,
                },
                {
                  icon: <Ticket className="h-4 w-4 text-teal-500" />,
                  text: "Présentez votre billet (papier ou écran) à l'accueil de la conférence",
                },
                {
                  icon: <User className="h-4 w-4 text-slate-400" />,
                  text: "Retrouvez vos inscriptions dans votre espace participant",
                },
              ].map(({ icon, text }, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  {icon} {text}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/inscriptions"
              className="flex-1 rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Mes inscriptions
            </Link>
            <Link
              href={`/conferences/${conference.slug}`}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Retour à la conférence
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

//  Sub-components 

function StepBar({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "recap",   label: "Récapitulatif" },
    { id: "confirm", label: "Confirmation" },
    { id: "done",    label: "Inscription finalisée" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === current);

  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                active && "bg-blue-600 text-white shadow-md shadow-blue-200",
                done  && "bg-emerald-500 text-white",
                !active && !done && "bg-slate-100 text-slate-400"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn(
              "text-[11px] font-medium",
              active ? "text-blue-700" : done ? "text-emerald-600" : "text-slate-400"
            )}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className="absolute" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-heading text-base font-bold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="text-slate-400">{icon}</span>
      {children}
    </div>
  );
}

//  Utils 

function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) return fmt.format(start);
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}