"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  X,
} from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validators/auth";
import { requestPasswordReset } from "@/actions/password-reset";
import { cn } from "@/lib/utils";

interface ForgotPasswordDialogProps {
  /** Ouvre/ferme le modal. */
  open: boolean;
  /** Appelé pour demander la fermeture (croix / backdrop / Escape). */
  onClose: () => void;
  /** Email pré-rempli (si on le connaît depuis le form login). */
  defaultEmail?: string;
}

type ViewState =
  | { kind: "form" }
  | { kind: "success"; email: string };

/**
 * Modal « Mot de passe oublié » — conforme à la maquette.
 * - Icône clé dans carré jaune
 * - Formulaire email + boutons primaire/secondaire
 * - Fermeture : croix, backdrop, Escape
 * - Bloque le scroll du body quand ouvert
 */
export function ForgotPasswordDialog({
  open,
  onClose,
  defaultEmail = "",
}: ForgotPasswordDialogProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: "form" });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: defaultEmail },
  });

  const { ref: emailRegisterRef, ...emailRegisterRest } = register("email");

  // ── Reset state à chaque ouverture / fermeture ──────────────────────────
  useEffect(() => {
    if (open) {
      setView({ kind: "form" });
      setGlobalError(null);
      reset({ email: defaultEmail });
      // Focus de l'input au prochain tick (après montage)
      const id = requestAnimationFrame(() => {
        emailInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [open, defaultEmail, reset]);

  // ── Escape pour fermer + lock du scroll body ────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = (data: ForgotPasswordInput) => {
    setGlobalError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(data.email);
      if (!result.ok) {
        setGlobalError(result.error);
        return;
      }
      setView({ kind: "success", email: data.email });
    });
  };

  const goToReset = (email: string) => {
    onClose();
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-pwd-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer la boîte de dialogue"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ─────────────── VIEW FORM ─────────────── */}
        {view.kind === "form" && (
          <>
            {/* Header */}
            <div className="mb-5 flex items-start gap-4">
              <div
                aria-hidden
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100"
              >
                <KeyRound
                  className="h-6 w-6 text-amber-600"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h2
                  id="forgot-pwd-title"
                  className="font-heading text-lg font-bold text-slate-900"
                >
                  Mot de passe oublié
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Réinitialisez en quelques secondes
                </p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-slate-600">
              Entrez l&apos;adresse email associée à votre compte. Nous vous
              enverrons un{" "}
              <strong className="text-slate-800">
                code à 6 chiffres
              </strong>{" "}
              pour choisir un nouveau mot de passe.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="forgot-email"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="jean.dupont@utbm.fr"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "forgot-email-error" : undefined
                  }
                  {...emailRegisterRest}
                  ref={(el) => {
                    emailRegisterRef(el);
                    emailInputRef.current = el;
                  }}
                  className={cn(
                    "input-field",
                    errors.email && "input-field-error"
                  )}
                />
                {errors.email && (
                  <p
                    id="forgot-email-error"
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-xs text-red-600"
                  >
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Erreur globale */}
              {globalError && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* Bouton primaire */}
              <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="btn-primary"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Envoyer le code
                  </>
                )}
              </button>

              {/* Bouton secondaire */}
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn-secondary mt-2"
              >
                Annuler
              </button>
            </form>
          </>
        )}

        {/* ─────────────── VIEW SUCCESS ─────────────── */}
        {view.kind === "success" && (
          <div className="animate-fade-in text-center">
            <div
              aria-hidden
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100"
            >
              <CheckCircle2
                className="animate-check-pop h-8 w-8 text-emerald-600"
                strokeWidth={2}
              />
            </div>

            <h2 className="font-heading text-lg font-bold text-slate-900">
              Vérifiez votre boîte mail
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              Si un compte existe à l&apos;adresse{" "}
              <strong className="text-slate-800">{view.email}</strong>, un code
              à 6 chiffres vient d&apos;être envoyé. Il est valable 10 minutes.
            </p>

            <button
              type="button"
              onClick={() => goToReset(view.email)}
              className="btn-primary mx-auto mt-6 max-w-xs"
            >
              Saisir le code maintenant
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}