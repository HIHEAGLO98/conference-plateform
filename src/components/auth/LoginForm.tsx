"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
} from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { loginUser } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { getDashboardUrlByRole } from "@/utils/roles";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  // Toast succès après reset password ( /login?reset=ok )
  const [resetBanner, setResetBanner] = useState(
    searchParams.get("reset") === "ok"
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", remember: true },
  });

  const currentEmail = watch("email");

  // Auto-ouverture du modal si l'URL contient ?modal=forgot
  // (cas du deep-link /forgot-password → redirect vers /login?modal=forgot)
  useEffect(() => {
    if (searchParams.get("modal") === "forgot") {
      setForgotOpen(true);
    }
  }, [searchParams]);

  const onSubmit = (data: LoginInput) => {
    setGlobalError(null);
    startTransition(async () => {
      const result = await loginUser(data);
      if (!result.success) {
        setGlobalError(result.error);
        return;
      }
      const finalUrl = getDashboardUrlByRole(result.role) 
      router.push(finalUrl);
      router.refresh();
    });
  };

  const loading = isPending || isSubmitting;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="mb-1 font-heading text-2xl font-bold text-slate-900">
          Bienvenue !
        </h1>
        <p className="text-sm text-slate-500">
          Connectez-vous à votre espace personnel
        </p>
      </div>

      {/* Banner de succès (post reset password) */}
      {resetBanner && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Mot de passe réinitialisé
            </p>
            <p className="text-xs text-emerald-700">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetBanner(false)}
            aria-label="Fermer"
            className="text-emerald-600 hover:text-emerald-800"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Adresse email <span className="text-red-500">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
            className={cn(
              "input-field",
              errors.email && "input-field-error"
            )}
          />
          {errors.email && (
            <p
              id="login-email-error"
              role="alert"
              className="mt-1 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-pwd"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="login-pwd"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "login-pwd-error" : undefined
              }
              {...register("password")}
              className={cn(
                "input-field pr-10",
                errors.password && "input-field-error"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="login-pwd-error"
              role="alert"
              className="mt-1 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me + forgot */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              {...register("remember")}
              className="h-4 w-4 accent-blue-700"
            />
            <span className="text-sm text-slate-600">Se souvenir de moi</span>
          </label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion en cours…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Se connecter
            </>
          )}
        </button>
      </form>

      {/* Alert global */}
      {globalError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{globalError}</p>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:underline"
        >
          S&apos;inscrire gratuitement
        </Link>
      </p>

      {/* Modal de demande de réinitialisation */}
      <ForgotPasswordDialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        defaultEmail={currentEmail ?? ""}
      />
    </div>
  );
}