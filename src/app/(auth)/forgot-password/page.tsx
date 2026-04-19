import { redirect } from "next/navigation";

/**
 * Route « deep-link » pour /forgot-password.
 * Le formulaire est en réalité un modal ouvert depuis /login.
 * On redirige vers /login?modal=forgot — LoginForm détecte ce paramètre
 * et ouvre automatiquement le modal au montage.
 */
export default function ForgotPasswordPage() {
  redirect("/login?modal=forgot");
}