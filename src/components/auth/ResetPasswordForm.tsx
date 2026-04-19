"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/auth";
import {
  requestPasswordReset,
  resetPasswordWithOtp,
} from "@/actions/password-reset";
import { cn } from "@/lib/utils";
import { OtpInput } from "./OtpInput";
import { PasswordStrength } from "./PasswordStrength";

interface ResetPasswordFormProps {
  /** Email destinataire — passé en query string depuis /forgot-password. */
  email: string;
  /** Durée initiale de validité (secondes). Default: 10 min = 600s. */
  initialExpirySeconds?: number;
  /** Cooldown du bouton "Renvoyer" (secondes). Default: 60s. */
  resendCooldownSeconds?: number;
}

/**
 * Formulaire de réinitialisation — saisie OTP + nouveau mot de passe.
 * Même pattern que VerifyEmailForm (timer, resend cooldown, success view).
 */
export function ResetPasswordForm({
  email,
  initialExpirySeconds = 600,
  resendCooldownSeconds = 60,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();

  const [expirySeconds, setExpirySeconds] = useState(initialExpirySeconds);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email,
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const code = watch("code");
  const password = watch("password");

  // Timer de validité OTP 
  useEffect(() => {
    if (success || expirySeconds <= 0) return;
    const id = setInterval(() => {
      setExpirySeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [expirySeconds, success]);

  //  Cooldown du bouton "Renvoyer" 
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const expired = expirySeconds === 0;

  //  Submit final 
  const onSubmit = (data: ResetPasswordInput) => {
    setGlobalError(null);
    startTransition(async () => {
      const result = await resetPasswordWithOtp(data);
      if (!result.ok) {
        setGlobalError(result.error);
        // Si le code est en cause, on reset le champ OTP
        if (result.field === "code" || /code/i.test(result.error)) {
          setValue("code", "");
        }
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=ok");
      }, 1500);
    });
  };

  //  Resend code 
  const handleResend = () => {
    if (resendCooldown > 0 || isResending) return;
    setGlobalError(null);
    startResendTransition(async () => {
      const result = await requestPasswordReset(email);
      if (!result.ok) {
        setGlobalError(result.error);
        return;
      }
      setValue("code", "");
      setExpirySeconds(initialExpirySeconds);
      setResendCooldown(resendCooldownSeconds);
    });
  };

  const loading = isPending || isSubmitting;

  //  Écran de succès 
  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
          <CheckCircle2
            className="animate-check-pop h-10 w-10 text-emerald-600"
            strokeWidth={2}
          />
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">
          Mot de passe réinitialisé
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          Redirection vers la connexion…
        </p>
      </div>
    );
  }

  //  Formulaire 
  const maskedEmail = maskEmail(email);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
          <ShieldCheck
            className="h-8 w-8 text-blue-600"
            strokeWidth={1.75}
          />
        </div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Nouveau mot de passe
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          Code envoyé à{" "}
          <span className="font-semibold text-slate-800">{maskedEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Hidden email pour le payload */}
        <input type="hidden" {...register("email")} />

        {/* OTP */}
        <div>
          <label className="mb-2 block text-center text-sm font-semibold text-slate-700">
            Code à 6 chiffres <span className="text-red-500">*</span>
          </label>
          <OtpInput
            value={code ?? ""}
            onChange={(v) => setValue("code", v, { shouldValidate: false })}
            disabled={loading || expired}
            error={Boolean(errors.code) || /code/i.test(globalError ?? "")}
            aria-label="Code de réinitialisation à 6 chiffres"
          />
          <p
            className="mt-3 text-center text-xs text-slate-400"
            aria-live="polite"
            role="timer"
          >
            {expired ? (
              <span className="font-semibold text-red-600">
                Code expiré - demandez un nouveau code
              </span>
            ) : (
              <>
                Valide pendant{" "}
                <span className="font-semibold text-slate-700">
                  {formatTime(expirySeconds)}
                </span>
              </>
            )}
          </p>
          {errors.code && (
            <p role="alert" className="mt-2 text-center text-xs text-red-600">
              {errors.code.message}
            </p>
          )}
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label
            htmlFor="new-pwd"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Nouveau mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="new-pwd"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimum 8 caractères"
              aria-invalid={!!errors.password}
              {...register("password")}
              className={cn(
                "input-field pr-10",
                errors.password && "input-field-error"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={
                showPwd
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrength password={password ?? ""} />
          {errors.password && (
            <p
              role="alert"
              className="mt-1 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmation */}
        <div>
          <label
            htmlFor="confirm-pwd"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Confirmer le mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm-pwd"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Retapez votre nouveau mot de passe"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
              className={cn(
                "input-field pr-10",
                errors.confirmPassword && "input-field-error"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={
                showConfirm
                  ? "Masquer la confirmation"
                  : "Afficher la confirmation"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              role="alert"
              className="mt-1 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Erreur globale */}
        {globalError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        {/* CTA */}
        <button
          type="submit"
          disabled={loading || expired}
          aria-busy={loading}
          className="btn-primary"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Réinitialisation…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Réinitialiser le mot de passe
            </>
          )}
        </button>
      </form>

      {/* Resend + retour */}
      <div className="mt-5 space-y-2 text-center">
        <p className="text-sm text-slate-500">
          Vous n&apos;avez pas reçu de code ?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {isResending
              ? "Envoi…"
              : resendCooldown > 0
                ? `Renvoyer dans ${resendCooldown}s`
                : "Renvoyer"}
          </button>
        </p>
        <p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

/* 
 * Helpers
 *  */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Masque partiellement un email : `jean.dupont@utbm.fr` → `j***@utbm.fr`. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}