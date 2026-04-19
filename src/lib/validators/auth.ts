import { z } from "zod";

// Schémas Zod — validation côté client ET serveur 


/**
 * Mot de passe fort :
 * - 8+ caractères
 * - majuscule + minuscule
 * - chiffre
 * - caractère spécial
 */
const strongPassword = z
  .string()
  .min(8, "Minimum 8 caractères")
  .regex(/[A-Z]/, "Au moins une lettre majuscule")
  .regex(/[a-z]/, "Au moins une lettre minuscule")
  .regex(/\d/, "Au moins un chiffre")
  .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial (!@#$…)");

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez saisir une adresse email valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  remember: z.boolean().optional(),
});

/** Saisie de l'email sur le modal « Mot de passe oublié ». */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez saisir une adresse email valide")
    .max(255)
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;


/** Saisie du code OTP + nouveau mot de passe sur `/reset-password`. */
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Email invalide")
      .toLowerCase()
      .trim(),
    code: z
      .string()
      .length(6, "Le code doit contenir 6 chiffres")
      .regex(/^\d{6}$/, "Le code ne doit contenir que des chiffres"),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
 
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type LoginInput = z.infer<typeof loginSchema>;


export const registerSchema = z
  .object({
    prenom: z
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(100, "100 caractères max")
      .trim(),
    nom: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "100 caractères max")
      .trim(),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Veuillez saisir une adresse email valide (ex: nom@universite.fr)")
      .max(255)
      .toLowerCase()
      .trim(),
    password: strongPassword,
    role: z.enum(["PARTICIPANT", "CONFERENCIER", "ORGANISATEUR"], {
        message: "Veuillez sélectionner un rôle valide",
      }),
    pays: z
      .string()
      .min(2, "Veuillez sélectionner votre pays")
      .max(100),
    affiliation: z
      .string()
      .max(255, "255 caractères max")
      .optional()
      .or(z.literal("")),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "Vous devez accepter les conditions d'utilisation",
    }),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;