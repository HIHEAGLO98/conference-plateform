import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Inscription - ConferenceHub",
  description:
    "Créez votre compte ConferenceHub pour accéder à la plateforme académique internationale.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}