"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Check,
  Info,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";

import { ModalShell, useCloseModal } from "./ModalShell";

/* 
 * CreateSessionModal — modal création d'une session rattachée à une conférence.
 *
 * Particularités :
 *   - La conférence parente est OBLIGATOIRE. Si un `?conf=<id>` est présent
 *     dans l'URL, on la pré-sélectionne (ex: l'organisateur clique sur
 *     "+ Session" depuis une carte conférence de la hiérarchie).
 *   - Les horaires sont des `datetime-local` → on laisse le navigateur gérer
 *     le format.
 *   - Intervenants = string libre (parsée par virgule côté submit).
 *   - Capacité optionnelle (hérite de la conférence parente si laissée vide).
 *
 * Couleur d'accent : teal (identité organisateur).
 *  */

const SESSION_TYPES = [
  { id: "KEYNOTE", label: "Keynote", desc: "Conférence invitée" },
  { id: "WORKSHOP", label: "Workshop", desc: "Atelier pratique" },
  { id: "PLENARY", label: "Plénière", desc: "Session principale" },
  { id: "PANEL", label: "Panel / Table ronde", desc: "Discussion" },
  { id: "ARTICLES", label: "Articles", desc: "Présentations scientifiques" },
  { id: "POSTER", label: "Session poster", desc: "Présentation affiches" },
  { id: "ROUND_TABLE", label: "Table ronde", desc: "Discussion ouverte" },
  { id: "BREAK", label: "Pause / Networking", desc: "Break café ou déjeuner" },
] as const;

type SessionTypeValue = (typeof SESSION_TYPES)[number]["id"];

export interface CreateSessionConferenceOption {
  id: string;
  shortName: string | null;
  titre: string;
  ville: string;
  dateDebut: Date;
  dateFin: Date;
}

interface CreateSessionModalProps {
  /** Liste des conférences de l'organisateur (pour le select parent). */
  conferences: CreateSessionConferenceOption[];
}

interface FormState {
  conferenceId: string;
  titre: string;
  type: SessionTypeValue;
  salle: string;
  horaireDebut: string;
  horaireFin: string;
  capacite: string; // string pour permettre "" ; parsé au submit
  seuilAlerte: string;
  intervenants: string;
  description: string;
}

const initialForm: FormState = {
  conferenceId: "",
  titre: "",
  type: "ARTICLES",
  salle: "",
  horaireDebut: "",
  horaireFin: "",
  capacite: "",
  seuilAlerte: "80",
  intervenants: "",
  description: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;



export function CreateSessionModal({ conferences }: CreateSessionModalProps) {
  const searchParams = useSearchParams();
  const close = useCloseModal();
  const [isPending, startTransition] = useTransition();

  const preselectConfId = searchParams.get("conf");

  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    conferenceId:
      preselectConfId && conferences.some((c) => c.id === preselectConfId)
        ? preselectConfId
        : conferences[0]?.id ?? "",
  }));
  const [errors, setErrors] = useState<FieldErrors>({});

  // Si l'URL change et qu'un nouveau `conf` est pré-sélectionné, on resynchronise
  useEffect(() => {
    if (!preselectConfId) return;
    if (!conferences.some((c) => c.id === preselectConfId)) return;
    setForm((f) =>
      f.conferenceId === preselectConfId ? f : { ...f, conferenceId: preselectConfId }
    );
  }, [preselectConfId, conferences]);

  const selectedConf = useMemo(
    () => conferences.find((c) => c.id === form.conferenceId) ?? null,
    [conferences, form.conferenceId]
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.conferenceId) next.conferenceId = "Sélectionnez une conférence.";
    if (!form.titre.trim()) next.titre = "Le titre est obligatoire.";
    if (!form.horaireDebut) next.horaireDebut = "Date de début requise.";
    if (!form.horaireFin) next.horaireFin = "Date de fin requise.";
    if (
      form.horaireDebut &&
      form.horaireFin &&
      new Date(form.horaireFin) <= new Date(form.horaireDebut)
    ) {
      next.horaireFin = "La fin doit être postérieure au début.";
    }
    if (form.capacite && Number.isNaN(Number(form.capacite))) {
      next.capacite = "La capacité doit être un nombre.";
    }
    if (
      form.seuilAlerte &&
      (Number.isNaN(Number(form.seuilAlerte)) ||
        Number(form.seuilAlerte) < 0 ||
        Number(form.seuilAlerte) > 100)
    ) {
      next.seuilAlerte = "Seuil entre 0 et 100.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    startTransition(async () => {
      // TODO: brancher le server action Prisma — création de la Session,
      // rattachement à la Conference, audit log.
      // Les intervenants sont parsés : split(",") → trim() → filter(Boolean)
      await new Promise((r) => setTimeout(r, 1200));
      close();
    });
  };

  const emptyConfList = conferences.length === 0;

  /*  Render  */

  return (
    <ModalShell
      title="Ajouter une session"
      subtitle="Rattachée à une conférence existante"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={close}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || emptyConfList}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Créer la session
              </>
            )}
          </button>
        </>
      }
    >
      <FormInputStyles />

      {/* Empty-state : pas de conf dispo pour rattacher la session */}
      {emptyConfList ? (
        <EmptyNoConference />
      ) : (
        <div className="space-y-6">
          {/*  Conférence parente (obligatoire)  */}
          <section className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Conférence parente
              </h3>
              <span className="ml-auto rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Obligatoire
              </span>
            </div>

            <Field
              label="Sélectionner la conférence"
              required
              error={errors.conferenceId}
            >
              <select
                value={form.conferenceId}
                onChange={(e) => update("conferenceId", e.target.value)}
                className="form-input-org"
              >
                {conferences.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName ? `${c.shortName} — ${c.titre}` : c.titre}
                  </option>
                ))}
              </select>
            </Field>

            {selectedConf && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  {formatDateRange(selectedConf.dateDebut, selectedConf.dateFin)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  {selectedConf.ville}
                </span>
              </div>
            )}
          </section>

          {/*  Informations de la session  */}
          <section className="space-y-4">
            <SectionTitle>Informations de la session</SectionTitle>

            <Field label="Titre de la session" required error={errors.titre}>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => update("titre", e.target.value)}
                placeholder="ex. Deep Learning pour la vision médicale"
                className="form-input-org"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type de session">
                <select
                  value={form.type}
                  onChange={(e) =>
                    update("type", e.target.value as SessionTypeValue)
                  }
                  className="form-input-org"
                >
                  {SESSION_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Salle">
                <input
                  type="text"
                  value={form.salle}
                  onChange={(e) => update("salle", e.target.value)}
                  placeholder="ex. Amphi Saint-Exupéry"
                  className="form-input-org"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Début de la session"
                required
                error={errors.horaireDebut}
              >
                <input
                  type="datetime-local"
                  value={form.horaireDebut}
                  onChange={(e) => update("horaireDebut", e.target.value)}
                  className="form-input-org"
                />
              </Field>
              <Field
                label="Fin de la session"
                required
                error={errors.horaireFin}
              >
                <input
                  type="datetime-local"
                  value={form.horaireFin}
                  onChange={(e) => update("horaireFin", e.target.value)}
                  className="form-input-org"
                />
              </Field>
            </div>
          </section>

          {/*  Capacité  */}
          <section className="space-y-4">
            <SectionTitle>Capacité & Alerte</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Capacité max."
                hint="Laisser vide pour hériter de la conférence"
                error={errors.capacite}
              >
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    value={form.capacite}
                    onChange={(e) => update("capacite", e.target.value)}
                    placeholder={
                      selectedConf ? "— hérite de la conf" : "ex. 150"
                    }
                    className="form-input-org pl-9"
                  />
                </div>
              </Field>

              <Field
                label="Seuil d'alerte (%)"
                hint="Remplissage à partir duquel on alerte"
                error={errors.seuilAlerte}
              >
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.seuilAlerte}
                  onChange={(e) => update("seuilAlerte", e.target.value)}
                  className="form-input-org"
                />
              </Field>
            </div>
          </section>

          {/*  Intervenants  */}
          <section className="space-y-4">
            <SectionTitle>Intervenants</SectionTitle>
            <Field
              label="Intervenants"
              hint="Séparez plusieurs noms par une virgule — ex. : Jean Dupont, Marie Curie"
            >
              <input
                type="text"
                value={form.intervenants}
                onChange={(e) => update("intervenants", e.target.value)}
                placeholder="Pr. Martin Leroy, Dr. Sophie Laurent"
                className="form-input-org"
              />
            </Field>
          </section>

          {/*  Description  */}
          <section className="space-y-4">
            <SectionTitle>Description</SectionTitle>
            <Field
              label="Description (facultatif)"
              hint="Courte présentation visible sur la page publique de la conférence"
            >
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Objectifs, résultats attendus, public visé…"
                className="form-input-org resize-y"
              />
            </Field>
          </section>

          {/*  Confirmation visuelle  */}
          {selectedConf && (
            <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
              <div className="text-xs text-slate-700">
                Cette session sera rattachée à{" "}
                <span className="font-semibold text-teal-800">
                  {selectedConf.shortName ?? selectedConf.titre}
                </span>{" "}
                ({formatDateRange(selectedConf.dateDebut, selectedConf.dateFin)}{" "}
                · {selectedConf.ville}).
              </div>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

/* 
 * Sub-components
 *  */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-sm font-bold text-slate-900">
      {children}
    </h3>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}

function EmptyNoConference() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400">
        <Calendar className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Aucune conférence disponible
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Créez d'abord une conférence avant de pouvoir y rattacher une session.
        </p>
      </div>
    </div>
  );
}

/* 
 * Utils
 * ────────────────────────────────────────────────────────────────────────── */

function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(start)} ${start.getFullYear()}`;
  }
  return `${fmt.format(start)} → ${fmt.format(end)}`;
}

/* 
 * Styles scopés pour tous les inputs du modal (même look & feel que le wizard
 * de création de conférence). On garde un teal-500 sur le focus.
 *  */

function FormInputStyles() {
  return (
    <style jsx global>{`
      .form-input-org {
        width: 100%;
        border-radius: 12px;
        border: 1px solid rgb(226 232 240);
        background-color: #fff;
        padding: 0.625rem 0.875rem;
        font-size: 0.875rem;
        color: rgb(15 23 42);
        transition:
          border-color 150ms ease,
          box-shadow 150ms ease;
      }
      .form-input-org::placeholder {
        color: rgb(148 163 184);
      }
      .form-input-org:focus {
        outline: none;
        border-color: rgb(20 184 166); /* teal-500 */
        box-shadow: 0 0 0 3px rgb(153 246 228 / 0.45); /* teal-200 */
      }
      .form-input-org:disabled {
        background-color: rgb(248 250 252);
        color: rgb(148 163 184);
      }
      select.form-input-org {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.625rem center;
        background-size: 1.1rem;
        padding-right: 2.25rem;
      }
    `}</style>
  );
}