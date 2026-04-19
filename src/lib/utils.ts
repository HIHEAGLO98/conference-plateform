import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne intelligemment les classes Tailwind (évite les conflits). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Traduit un rôle en libellé français lisible. */
export function roleLabel(role: string): string {
  switch (role) {
    case "PARTICIPANT":
      return "Participant";
    case "CONFERENCIER":
      return "Conférencier";
    case "ORGANISATEUR":
      return "Organisateur";
    case "ADMIN":
      return "Administrateur";
    default:
      return role;
  }
}

/** Score de robustesse mot de passe (0-4) aligné sur la maquette. */
export function passwordStrength(pwd: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  if (!pwd) return { score: 0, label: "Utilisez 8+ caractères, chiffres et symboles", color: "#94a3b8" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["Trop court", "Très faible", "Faible", "Moyen", "Fort - Excellent !"];
  const colors = ["#dc2626", "#ef4444", "#f97316", "#eab308", "#10b981"];
  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    label: labels[score],
    color: colors[score],
  };
}