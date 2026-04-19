"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, LayoutDashboard, Mail, User as UserIcon } from "lucide-react";

import {
  generateAndSendOTP,
  verifyOTP,
  type VerifyOtpSuccess,
} from "@/actions/otp";
import { roleLabel } from "@/lib/utils";
import { OtpInput } from "./OtpInput";

interface VerifyEmailFormProps {
  /** Email destinataire — passé en query string depuis /register. */
  email: string;
  /** Durée initiale de validité (secondes). Default: 10 min = 600s. */
  initialExpirySeconds?: number;
  /** Cooldown du bouton "Renvoyer" (secondes). Default: 60s. */
  resendCooldownSeconds?: number;
}

type ViewState =
  | { kind: "form" }
  | { kind: "success"; user: VerifyOtpSuccess };

/**
 * Formulaire de saisie OTP — (view-verify).
 * - Timer de validité en mm:ss
 * - Resend avec cooldown
 * - Auto-submit quand les 6 cases sont remplies
 * - Écran de succès avec récap du profil + CTA dashboard
 */
export function VerifyEmailForm({
  email,
  initialExpirySeconds = 600,
  resendCooldownSeconds = 60,
}: VerifyEmailFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ kind: "form" });
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();

  const [expirySeconds, setExpirySeconds] = useState(initialExpirySeconds);
  const [resendCooldown, setResendCooldown] = useState(0);

  //  Timer de validité OTP 
  useEffect(() => {
    if (view.kind === "success") return;
    if (expirySeconds <= 0) return;
    const id = setInterval(() => {
      setExpirySeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [expirySeconds, view.kind]);

  //  Cooldown du bouton "Renvoyer" 
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const expired = expirySeconds === 0;

  //  Handlers 
  const handleVerify = (submittedCode: string) => {
    if (submittedCode.length !== 6 || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await verifyOTP(email, submittedCode);
      if (!result.ok) {
        setError(result.error);
        setCode("");
        return;
      }
      setView({ kind: "success", user: result.data });
    });
  };

  const handleResend = () => {
    if (resendCooldown > 0 || isResending) return;
    setError(null);
    startResendTransition(async () => {
      const result = await generateAndSendOTP(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCode("");
      setExpirySeconds(initialExpirySeconds);
      setResendCooldown(resendCooldownSeconds);
    });
  };

  //  Écran de succès 
  if (view.kind === "success") {
    return <SuccessView user={view.user} />;
  }

  //  Écran de vérification
  return (
    <div className="animate-fade-in text-center">
      {/* Icône */}
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
        <Mail className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
      </div>

      {/* Titre */}
      <h2 className="font-heading text-2xl font-bold text-slate-900">
        Vérifiez votre email
      </h2>
      <p className="mx-auto mt-2 mb-6 max-w-xs text-sm leading-relaxed text-slate-500">
        Un code de vérification a été envoyé à
        <br />
        <span className="font-semibold text-slate-800">{email}</span>
      </p>

      {/* OTP Input */}
      <div className="mb-4">
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={handleVerify}
          disabled={isPending || expired}
          error={Boolean(error)}
          aria-label="Code de vérification à 6 chiffres"
        />
      </div>

      {/* Timer / Expiration */}
      <p
        className="mb-5 text-sm text-slate-400"
        aria-live="polite"
        role="timer"
      >
        {expired ? (
          <span className="font-semibold text-red-600">
            Code expiré - demandez un nouveau code
          </span>
        ) : (
          <>
            Code valide pendant{" "}
            <span className="font-semibold text-slate-700">
              {formatTime(expirySeconds)}
            </span>
          </>
        )}
      </p>

      {/* Erreur globale */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* CTA principal */}
      <button
        type="button"
        onClick={() => handleVerify(code)}
        disabled={isPending || code.length !== 6 || expired}
        className="btn-primary mx-auto max-w-xs"
      >
        {isPending ? (
          <>
            <span className="spinner h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
            Vérification…
          </>
        ) : (
          "Vérifier mon compte"
        )}
      </button>

      {/* Resend + retour */}
      <div className="mt-4 space-y-2">
        <p className="text-sm text-slate-500">
          Vous n'avez pas reçu de code ?{" "}
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
        <p className="text-sm text-slate-500">
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

/* 
 * Écran de succès — récap profil + CTA dashboard
 *  */

function SuccessView({ user }: { user: VerifyOtpSuccess }) {
  const fullName = [user.prenom, user.nom].filter(Boolean).join(" ");

  return (
    <div className="animate-fade-in text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
        <CheckCircle2
          className="animate-check-pop h-10 w-10 text-emerald-600"
          strokeWidth={2}
        />
      </div>

      <h2 className="font-heading text-2xl font-bold text-slate-900">
        Compte créé avec succès !
      </h2>
      <p className="mx-auto mt-2 mb-6 max-w-xs text-sm leading-relaxed text-slate-500">
        Bienvenue sur ConferenceHub, <strong>{user.prenom}</strong> ! Vous
        pouvez maintenant accéder à votre espace personnel.
      </p>

      {/* Carte récap profil */}
      <div className="mx-auto mb-6 max-w-xs rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
          Votre profil
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <UserIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
            <span className="text-sm text-slate-700">
              {fullName} —{" "}
              <span className="font-semibold text-blue-600">
                {/* role est un string ici (Role enum côté Prisma → string côté TS) */}
                {roleLabel(user.role as never)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
            <span className="break-all text-sm text-slate-600">
              {user.email}
            </span>
          </div>
        </div>
      </div>

      <Link href="/dashboard" className="btn-primary mx-auto max-w-xs">
        <LayoutDashboard className="h-4 w-4" />
        Accéder à mon tableau de bord
      </Link>
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