import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Vérification de l'email - ConferenceHub",
  description:
    "Saisissez le code reçu par e-mail pour activer votre compte ConferenceHub.",
};

interface VerifyEmailPageProps {
  // Next.js 15+ : searchParams est une Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Page de vérification d'email.
 * Récupère l'email depuis `?email=...` (passé par /register après succès).
 * Si l'email est manquant ou invalide, redirige vers /register.
 */
export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  const parsed = z.email().safeParse(rawEmail);
  if (!parsed.success) {
    redirect("/register");
  }

  return <VerifyEmailForm email={parsed.data} />;
}