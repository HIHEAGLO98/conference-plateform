import { z } from "zod";

/**
 * Schéma de validation des variables d'environnement côté serveur.
 * On fail-fast au démarrage si une var critique est manquante.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET doit faire ≥ 32 caractères"),
  RESEND_API_KEY: z.string().startsWith("re_").optional(), // optionnel en dev
  EMAIL_FROM: z
    .string()
    .default("ConferenceHub <onboarding@resend.dev>"),
  EMAIL_REPLY_TO: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});