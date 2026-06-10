"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@generated/prisma/client";

import { prisma } from "@/lib/prisma";
import {auth, signIn, signOut } from "@/auth";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validators/auth";


// Types de retour unifiés 

export type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string ; role?: string}
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// REGISTER

/**
 * Inscription d'un nouvel utilisateur.
 * - Valide strictement avec Zod
 * - Vérifie l'unicité de l'email
 * - Hache le mot de passe avec bcrypt (cost 12)
 * - Journalise la création dans AuditLog
 */
export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ userId: string }>> {
  // 1. Validation côté serveur — NE JAMAIS faire confiance au client
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Veuillez corriger les erreurs dans le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { nom, prenom, email, password, role, pays, affiliation } = parsed.data;

  try {
    // 2. Vérification d'unicité de l'email
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return {
        success: false,
        error: "Un compte existe déjà avec cette adresse email.",
        fieldErrors: { email: ["Cet email est déjà utilisé"] },
      };
    }

    // 3. Hachage du mot de passe )
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Création de l'utilisateur + journalisation audit (transaction)
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          nom,
          prenom,
          email,
          motDePasse: hashedPassword,
          role,
          pays,
          affiliation: affiliation || null,
        },
        select: { id: true, email: true, role: true },
      });

      await tx.auditLog.create({
        data: {
          userId: created.id,
          action: "REGISTER",
          entityType: "User",
          entityId: created.id,
          metadata: { email: created.email, role: created.role },
        },
      });

      return created;
    });

    // 5. envoyer email de vérification via Resend ici
    const { generateAndSendOTP } = await import("./otp");
    const otpResult = await generateAndSendOTP(user.email);
    if (!otpResult.ok) {
      console.warn(
        "[registerUser] compte créé mais OTP non envoyé:",
        otpResult.error
      );
    }

    return {
      success: true,
      data: { userId: user.id },
      message: "Compte créé avec succès ! Vérifiez votre email.",
    };
  } catch (error) {
    // Prisma P2002 = violation d'unicité (fallback si race condition sur l'email)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Un compte existe déjà avec cette adresse email.",
      };
    }
    console.error("[registerUser] unexpected error:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
    };
  }
}

// LOGIN

/**
 * Connexion via Credentials (wrapping de `signIn` pour gérer les erreurs proprement).
 */
export async function loginUser(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Veuillez corriger les erreurs dans le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true },
    });

    return { success: true, 
      role: user?.role, 
      message: "Connexion réussie" 
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Email ou mot de passe incorrect. Veuillez réessayer.",
          };
        case "CallbackRouteError":
          // Message personnalisé remonté depuis `authorize()` (compte bloqué, etc.)
          return {
            success: false,
            error: error.cause?.err?.message ?? "Impossible de se connecter.",
          };
        default:
          return { success: false, error: "Erreur d'authentification." };
      }
    }
    // NEXT_REDIRECT n'est pas une erreur → on la laisse remonter
    throw error;
  }
}

// LOGOUT

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}