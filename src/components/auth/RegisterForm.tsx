"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { registerUser } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { RoleSelector } from "./RoleSelector";
import { PasswordStrength } from "./PasswordStrength";

const COUNTRIES = [
  "France",
  "Belgique",
  "Suisse",
  "Canada",
  "Maroc",
  "Tunisie",
  "Algérie",
  "Sénégal",
  "Côte d'Ivoire",
  "Togo",
  "Bénin",
  "Cameroun",
  "Mali",
  "Burkina Faso",
  "Autre",
];

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      password: "",
      role: "PARTICIPANT",
      pays: "",
      affiliation: "",
      acceptTerms: false , // init visuel ; Zod validera `true` strict
    },
  });

  const password = watch("password");
  const role = watch("role");

  /** Valide uniquement les champs de l'étape 1 avant de passer à la 2 */
  const goToStep2 = async () => {
    const valid = await trigger([
      "prenom",
      "nom",
      "email",
      "password",
      "role",
      "pays",
    ]);
    if (valid) setStep(2);
  };

  const onSubmit = (data: RegisterInput) => {
    setGlobalError(null);
    startTransition(async () => {
      const result = await registerUser(data);
      if (!result.success) {
        setGlobalError(result.error);
        // Retour en étape 1 si l'erreur concerne un champ de cette étape
        if (result.fieldErrors?.email) setStep(1);
        return;
      }
      setSuccess(true);
      // Redirection vers la page de vérification OTP (à implémenter)
      setTimeout(() => {
        router.push(
          `/verify-email?email=${encodeURIComponent(data.email)}`
        );
      }, 1200);
    });
  };

  const loading = isPending || isSubmitting;

  //  Écran de succès 
  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
          <CheckCircle2
            className="h-10 w-10 animate-check-pop text-emerald-600"
            strokeWidth={2}
          />
        </div>
        <h2 className="mb-2 font-heading text-2xl font-bold text-slate-900">
          Compte créé avec succès !
        </h2>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-500">
          Un email de vérification vous a été envoyé. Redirection en cours…
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header avec indicateur d'étape */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-0.5 font-heading text-2xl font-bold text-slate-900">
            Créer votre compte
          </h1>
          <p className="text-sm text-slate-500">
            Étape {step} sur 2 -{" "}
            {step === 1
              ? "Informations personnelles"
              : "Informations académiques"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              step === 1 ? "w-6 bg-blue-600" : "w-2 bg-emerald-500"
            )}
          />
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              step === 2 ? "w-6 bg-blue-600" : "bg-slate-200"
            )}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/*  STEP 1  */}
        {step === 1 && (
          <div className="space-y-4">
            <RoleSelector
              value={role}
              onChange={(v) => setValue("role", v, { shouldValidate: true })}
              error={errors.role?.message}
            />

            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="prenom"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  id="prenom"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jean"
                  aria-invalid={!!errors.prenom}
                  {...register("prenom")}
                  className={cn(
                    "input-field",
                    errors.prenom && "input-field-error"
                  )}
                />
                {errors.prenom && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.prenom.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="nom"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="nom"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Dupont"
                  aria-invalid={!!errors.nom}
                  {...register("nom")}
                  className={cn(
                    "input-field",
                    errors.nom && "input-field-error"
                  )}
                />
                {errors.nom && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.nom.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Email académique <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nom@universite.fr"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={cn(
                  "input-field",
                  errors.email && "input-field-error"
                )}
              />
              {errors.email && (
                <p
                  role="alert"
                  className="mt-1 flex items-center gap-1 text-xs text-red-600"
                >
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Pays */}
            <div>
              <label
                htmlFor="pays"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Pays d&apos;origine <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="pays"
                  aria-invalid={!!errors.pays}
                  {...register("pays")}
                  className={cn(
                    "input-field appearance-none pr-9",
                    errors.pays && "input-field-error"
                  )}
                >
                  <option value="">Sélectionner votre pays</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.pays && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.pays.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
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

            <button
              type="button"
              onClick={goToStep2}
              className="btn-primary mt-2"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="pt-1 text-center text-sm text-slate-500">
              Déjà inscrit ?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/*  STEP 2 */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div>
              <label
                htmlFor="affiliation"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Institution / Université{" "}
                <span className="font-normal text-slate-400">(optionnel)</span>
              </label>
              <input
                id="affiliation"
                type="text"
                autoComplete="organization"
                placeholder="ex: Université de Paris, MIT…"
                {...register("affiliation")}
                className="input-field"
              />
              {errors.affiliation && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.affiliation.message}
                </p>
              )}
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  {...register("acceptTerms")}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-blue-700"
                />
                <span className="text-xs leading-relaxed text-slate-600">
                  J&apos;accepte les{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Conditions d&apos;utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Politique de confidentialité
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            {/* Alert globale d'erreur */}
            {globalError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{globalError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création du compte…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Créer mon compte
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="btn-secondary"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          </div>
        )}
      </form>
    </div>
  );
}