"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  MapPin,
  Monitor,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ModalShell, useCloseModal } from "./ModalShell";

/* 
 * CreateConferenceModal — wizard 3 étapes.
 *
 * Stratégie :
 *   - `useState` pour le step courant (1..3) + payload form
 *   - L'indicateur de progression (`StepIndicator`) est un sous-composant pur
 *   - Validation minimale par étape avant de laisser passer au suivant
 *     (titre+thème+description obligatoires sur step 1, dates sur step 2)
 *   - Submit final → placeholder (TODO: brancher server action Prisma)
 *
 * Couleur d'accent : teal (identité organisateur).
 *  */

type Step = 1 | 2 | 3;

const STEP_LABELS = [
  "Informations générales",
  "Dates & Lieu",
  "Paramètres & Publication",
] as const;

const STEP_HINTS = ["Infos générales", "Dates & Lieu", "Paramètres"] as const;

const THEMES = [
  "IA & Machine Learning",
  "Sciences médicales & Santé",
  "Ingénierie & Systèmes embarqués",
  "Sciences sociales & Humanités",
  "Physique & Chimie",
  "Environnement & Développement durable",
  "Économie & Management",
  "Droit & Sciences politiques",
  "Mathématiques & Statistiques",
  "Autre",
] as const;

const LANGUAGES = [
  { id: "en", label: "Anglais", flag: "🇬🇧" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "ar", label: "Arabe", flag: "🇦🇪" },
  { id: "es", label: "Espagnol", flag: "🇪🇸" },
] as const;

type FormatValue = "PRESENTIAL" | "VIRTUAL" | "HYBRID";
type VisibilityValue = "PUBLIC" | "PRIVATE";
type PublishValue = "DRAFT" | "NOW";

interface FormState {
  titre: string;
  shortName: string;
  theme: string;
  description: string;
  organisation: string;
  dateDebut: string;
  dateFin: string;
  format: FormatValue;
  villePays: string;
  lieu: string;
  submissionDeadline: string;
  notificationDate: string;
  capaciteMax: number;
  seuilAlerte: number;
  langues: string[];
  visibility: VisibilityValue;
  publish: PublishValue;
}

const initialForm: FormState = {
  titre: "",
  shortName: "",
  theme: "",
  description: "",
  organisation: "",
  dateDebut: "",
  dateFin: "",
  format: "HYBRID",
  villePays: "",
  lieu: "",
  submissionDeadline: "",
  notificationDate: "",
  capaciteMax: 300,
  seuilAlerte: 80,
  langues: ["en", "fr"],
  visibility: "PUBLIC",
  publish: "DRAFT",
};

export function CreateConferenceModal() {
  const close = useCloseModal();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep = (s: Step): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (s === 1) {
      if (!form.titre.trim()) next.titre = "Le titre est requis";
      if (!form.theme) next.theme = "Choisissez une thématique";
      if (!form.description.trim())
        next.description = "Ajoutez une description";
    } else if (s === 2) {
      if (!form.dateDebut) next.dateDebut = "Requis";
      if (!form.dateFin) next.dateFin = "Requis";
      if (
        form.dateDebut &&
        form.dateFin &&
        new Date(form.dateFin) < new Date(form.dateDebut)
      ) {
        next.dateFin = "La fin doit être après le début";
      }
      if (!form.villePays.trim()) next.villePays = "Ville et pays requis";
    } else {
      if (form.langues.length === 0)
        next.langues = "Sélectionnez au moins une langue";
      if (!form.capaciteMax || form.capaciteMax < 1)
        next.capaciteMax = "Capacité invalide";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((step + 1) as Step);
  };

  const goPrev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    startTransition(async () => {
      // TODO: brancher une server action `createConference(form)` qui :
      //   1. génère le slug unique
      //   2. insère la conference (Prisma)
      //   3. log l'audit CREATE_CONFERENCE
      //   4. revalidate `/dashboard`
      // Placeholder pour l'instant : simulation d'un délai puis fermeture.
      await new Promise((r) => setTimeout(r, 1400));
      close();
    });
  };

  return (
    <ModalShell
      title="Créer une conférence"
      subtitle={`Étape ${step} sur 3 - ${STEP_LABELS[step - 1]}`}
      size="lg"
      topBar={<StepIndicator step={step} />}
      footer={
        <>
          <button
            type="button"
            onClick={goPrev}
            className={cn(
              "inline-flex items-center gap-1 rounded-[10px] border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50",
              step === 1 && "invisible"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-[10px] border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Annuler
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1 rounded-[10px] bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Continuer
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-[10px] bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création en cours…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Créer la conférence
                  </>
                )}
              </button>
            )}
          </div>
        </>
      }
    >
      {step === 1 && <Step1 form={form} errors={errors} update={update} />}
      {step === 2 && <Step2 form={form} errors={errors} update={update} />}
      {step === 3 && <Step3 form={form} errors={errors} update={update} />}
    </ModalShell>
  );
}

/* 
 * Step indicator
 *  */

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = [1, 2, 3];
  return (
    <div className="flex items-center gap-2">
      {steps.map((n, i) => {
        const isDone = n < step;
        const isActive = n === step;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                isActive && "bg-teal-600 text-white",
                isDone && "bg-emerald-100 text-emerald-700",
                !isActive && !isDone && "bg-slate-100 text-slate-400"
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "h-0.5 w-12 rounded sm:w-24",
                  n < step ? "bg-teal-400" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
      <span className="ml-2 hidden whitespace-nowrap text-xs text-slate-400 sm:inline">
        {STEP_HINTS[step - 1]}
      </span>
    </div>
  );
}

/* 
 * Step 1 — Informations générales
 *  */

interface StepProps {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

function Step1({ form, errors, update }: StepProps) {
  return (
    <div className="space-y-4">
      <Field
        label="Titre de la conférence"
        required
        error={errors.titre}
      >
        <input
          type="text"
          value={form.titre}
          onChange={(e) => update("titre", e.target.value)}
          placeholder="Ex: International Conference on AI and Society 2026"
          className="form-input-org"
        />
      </Field>

      <Field
        label="Acronyme / Sigle"
        hint="Utilisé comme identifiant court dans l'interface."
      >
        <input
          type="text"
          value={form.shortName}
          onChange={(e) => update("shortName", e.target.value)}
          placeholder="Ex: ICAIS 2026"
          className="form-input-org max-w-[240px]"
        />
      </Field>

      <Field
        label="Thématique principale"
        required
        error={errors.theme}
      >
        <select
          value={form.theme}
          onChange={(e) => update("theme", e.target.value)}
          className="form-input-org"
        >
          <option value="">— Choisir une thématique —</option>
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Description courte"
        required
        error={errors.description}
      >
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="Décrivez brièvement la conférence (objectif, public cible, domaines couverts…)"
          className="form-input-org resize-y"
        />
      </Field>

      <Field label="Organisme co-organisateur">
        <input
          type="text"
          value={form.organisation}
          onChange={(e) => update("organisation", e.target.value)}
          placeholder="Ex: Université Paris-Saclay · IEEE"
          className="form-input-org"
        />
      </Field>

      <FormInputStyles />
    </div>
  );
}

/* 
 * Step 2 — Dates & Lieu
 *  */

function Step2({ form, errors, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date de début" required error={errors.dateDebut}>
          <input
            type="date"
            value={form.dateDebut}
            onChange={(e) => update("dateDebut", e.target.value)}
            className="form-input-org"
          />
        </Field>
        <Field label="Date de fin" required error={errors.dateFin}>
          <input
            type="date"
            value={form.dateFin}
            onChange={(e) => update("dateFin", e.target.value)}
            className="form-input-org"
          />
        </Field>
      </div>

      <Field label="Format" required>
        <div className="grid grid-cols-3 gap-2">
          <FormatCard
            value="PRESENTIAL"
            current={form.format}
            icon={<MapPin className="h-6 w-6" />}
            label="Présentiel"
            onClick={() => update("format", "PRESENTIAL")}
          />
          <FormatCard
            value="VIRTUAL"
            current={form.format}
            icon={<Monitor className="h-6 w-6" />}
            label="En ligne"
            onClick={() => update("format", "VIRTUAL")}
          />
          <FormatCard
            value="HYBRID"
            current={form.format}
            icon={<Globe className="h-6 w-6" />}
            label="Hybride"
            onClick={() => update("format", "HYBRID")}
          />
        </div>
      </Field>

      <Field label="Ville & Pays" required error={errors.villePays}>
        <input
          type="text"
          value={form.villePays}
          onChange={(e) => update("villePays", e.target.value)}
          placeholder="Ex: Paris, France"
          className="form-input-org"
        />
      </Field>

      <Field label="Lieu précis (salle, bâtiment…)">
        <input
          type="text"
          value={form.lieu}
          onChange={(e) => update("lieu", e.target.value)}
          placeholder="Ex: Cité des Sciences, Grande Salle"
          className="form-input-org"
        />
      </Field>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
        <p className="mb-2 text-xs font-semibold text-amber-700">
          Dates importantes de soumission
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-600">
              Limite de soumission
            </label>
            <input
              type="date"
              value={form.submissionDeadline}
              onChange={(e) => update("submissionDeadline", e.target.value)}
              className="form-input-org !py-2 !text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">
              Notification d&apos;acceptation
            </label>
            <input
              type="date"
              value={form.notificationDate}
              onChange={(e) => update("notificationDate", e.target.value)}
              className="form-input-org !py-2 !text-xs"
            />
          </div>
        </div>
      </div>

      <FormInputStyles />
    </div>
  );
}

function FormatCard({
  value,
  current,
  icon,
  label,
  onClick,
}: {
  value: FormatValue;
  current: FormatValue;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
        active
          ? "border-teal-500 bg-teal-50 text-teal-700"
          : "border-slate-200 text-slate-700 hover:border-teal-400"
      )}
    >
      <span className={active ? "text-teal-500" : "text-slate-400"}>
        {icon}
      </span>
      <span className="text-xs font-semibold">
        {label} {active && "✓"}
      </span>
    </button>
  );
}

/* 
 * Step 3 — Paramètres & Publication
 *  */

function Step3({ form, errors, update }: StepProps) {
  const toggleLang = (id: string) => {
    const set = new Set(form.langues);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update("langues", Array.from(set));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Capacité totale"
          required
          hint="Nombre max. de participants"
          error={errors.capaciteMax}
        >
          <input
            type="number"
            value={form.capaciteMax}
            onChange={(e) =>
              update("capaciteMax", parseInt(e.target.value, 10) || 0)
            }
            min={1}
            className="form-input-org"
          />
        </Field>
        <Field label="Seuil d'alerte (%)" hint="Notification à ce % de remplissage">
          <input
            type="number"
            value={form.seuilAlerte}
            onChange={(e) =>
              update("seuilAlerte", parseInt(e.target.value, 10) || 0)
            }
            min={0}
            max={100}
            className="form-input-org"
          />
        </Field>
      </div>

      <Field label="Langues acceptées" required error={errors.langues}>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const active = form.langues.includes(lang.id);
            return (
              <button
                type="button"
                key={lang.id}
                onClick={() => toggleLang(lang.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  active
                    ? "border-teal-500 bg-teal-50 text-slate-800"
                    : "border-slate-200 text-slate-700 hover:border-teal-300"
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Visibilité">
        <div className="grid grid-cols-2 gap-3">
          <VisibilityCard
            value="PUBLIC"
            current={form.visibility}
            title="Public"
            subtitle="Visible par tous les visiteurs"
            icon={<Users className="h-4 w-4" />}
            onClick={() => update("visibility", "PUBLIC")}
          />
          <VisibilityCard
            value="PRIVATE"
            current={form.visibility}
            title="Sur invitation"
            subtitle="Accès restreint par lien"
            icon={<Building2 className="h-4 w-4" />}
            onClick={() => update("visibility", "PRIVATE")}
          />
        </div>
      </Field>

      <Field label="Publication initiale">
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="publish"
              checked={form.publish === "DRAFT"}
              onChange={() => update("publish", "DRAFT")}
              className="accent-teal-600"
            />
            <span className="text-sm text-slate-700">
              Enregistrer en brouillon
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="publish"
              checked={form.publish === "NOW"}
              onChange={() => update("publish", "NOW")}
              className="accent-teal-600"
            />
            <span className="text-sm text-slate-700">
              Publier immédiatement
            </span>
          </label>
        </div>
      </Field>

      <FormInputStyles />
    </div>
  );
}

function VisibilityCard({
  value,
  current,
  title,
  subtitle,
  icon,
  onClick,
}: {
  value: VisibilityValue;
  current: VisibilityValue;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all",
        active
          ? "border-teal-500 bg-teal-50"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2",
          active ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300"
        )}
      >
        {active && <Check className="h-2.5 w-2.5" />}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className={active ? "text-teal-700" : "text-slate-500"}>
            {icon}
          </span>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}

/* 
 * Champs utilitaires (label + hint + erreur) + styles globaux inputs
 *  */

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/**
 * Inline <style> pour la classe `.form-input-org` — évite de polluer le
 * globals.css avec des styles propres au dashboard organisateur.
 * Dupliqué par step pour que le style s'applique même si un step est
 * rendu seul. React gère le dedup naturellement.
 */
function FormInputStyles() {
  return (
    <style jsx global>{`
      .form-input-org {
        width: 100%;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 14px;
        color: #1e293b;
        outline: none;
        transition: border-color 0.2s;
        background: #fff;
      }
      .form-input-org:focus {
        border-color: #0d9488;
        box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
      }
    `}</style>
  );
}