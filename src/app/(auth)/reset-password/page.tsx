import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialisation du mot de passe — ConferenceHub",
  description:
    "Saisissez le code reçu par e-mail et définissez un nouveau mot de passe pour votre compte ConferenceHub.",
};

interface ResetPasswordPageProps {
  // Next.js 15+ : searchParams est une Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Page de réinitialisation de mot de passe.
 * Reçoit ?email=... depuis le modal ForgotPasswordDialog.
 * Si l'email est manquant ou invalide, on renvoie l'utilisateur sur /login
 * (avec le modal forgot auto-ouvert).
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  const parsed = z.email().safeParse(rawEmail);
  if (!parsed.success) {
    redirect("/login?modal=forgot");
  }

  return <ResetPasswordForm email={parsed.data} />;
}