import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion - ConferenceHub",
  description:
    "Connectez-vous à votre espace ConferenceHub pour gérer vos conférences et inscriptions.",
};

export default function LoginPage() {
  
  return <LoginForm />;
}