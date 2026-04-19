"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateOtp, getOtpExpiryDate } from "@/lib/otp";
import { VerificationEmail } from "@/emails/VerificationEmail";

import { UserStatus, AuditAction  } from "../generated/prisma/client";

/* 
 * Types de retour 
 *  */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };


  export interface VerifyOtpSuccess {
  userId: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
}
/* 
 * Schémas
 * */

const emailSchema = z.object({
  email: z.email("Adresse e-mail invalide"),
});

const verifyOtpSchema = z.object({
  email: z.email(),
  code: z
    .string()
    .length(6, "Le code doit faire 6 chiffres")
    .regex(/^\d{6}$/, "Le code ne doit contenir que des chiffres"),
});

/* 
 * generateAndSendOTP — génère + stocke + envoie
 * 
 */

/**
 * Génère un code OTP pour un utilisateur, l'enregistre en base (en
 * invalidant tout ancien code de type EMAIL_VERIFICATION) et l'envoie
 * par e-mail via Resend.
 *
 *  Anti-énumération : même si l'email n'existe pas, on retourne `ok:true`
 * sans rien envoyer - pour ne pas révéler l'existence d'un compte.
 */
export async function generateAndSendOTP(
  email: string
): Promise<ActionResult<{ expiresAt: Date }>> {
  // 1. Validation
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Email invalide",
      field: "email",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  try {
    // 2. Récupère l'utilisateur (sans exposer son existence en cas d'échec)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, prenom: true, nom: true, emailVerifie: true },
    });

    if (!user) {
      // Réponse identique au succès → anti-énumération
      return {
        ok: true,
        data: { expiresAt: getOtpExpiryDate() },
      };
    }

    // 3. Génère le code + date d'expiration
    const code = generateOtp(6);
    const expiresAt = getOtpExpiryDate();

    // 4. Invalide les anciens tokens EMAIL_VERIFICATION non utilisés
    //    puis crée le nouveau, de façon atomique.
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: {
          userId: user.id,
          type: "EMAIL_VERIFICATION",
          usedAt: null,
        },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: code,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      }),
    ]);

    // 5. Envoie l'e-mail
    const userName =
      [user.prenom, user.nom].filter(Boolean).join(" ") || "utilisateur";

    const result = await sendMail({
      to: normalizedEmail,
      subject: "Votre code de vérification ConferenceHub",
      react: VerificationEmail({ userName, otp: code }),
      tags: [{ name: "type", value: "otp-verification" }],
    });

    if (!result.ok) {
      console.error("[otp] Échec envoi e-mail:", result.error);
      // On retourne quand même OK pour ne pas bloquer l'UX :
      // l'utilisateur peut re-demander un code. Le token est en base.
    }

    return { ok: true, data: { expiresAt } };
  } catch (err) {
    console.error("[otp] generateAndSendOTP crash:", err);
    return {
      ok: false,
      error: "Impossible d'envoyer le code pour le moment. Réessayez.",
    };
  }
}

/* 
 * verifyOTP - vérifie un code + marque l'email comme vérifié
 *  */

export async function verifyOTP(
  email: string,
  code: string
): Promise<ActionResult<VerifyOtpSuccess>> {
  const parsed = verifyOtpSchema.safeParse({ email, code });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
      field: parsed.error.issues[0]?.path.join(".") ?? undefined,
    };
  }
 
  const normalizedEmail = parsed.data.email.toLowerCase();
 
  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
      },
    });
 
    if (!user) {
      // Même message en cas d'email inexistant → anti-énumération
      return { ok: false, error: "Code invalide ou expiré" };
    }
 
    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        token: parsed.data.code,
        type: "EMAIL_VERIFICATION",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
 
    if (!token) {
      return { ok: false, error: "Code invalide ou expiré" };
    }
 
    // Marque le token comme utilisé + valide l'email + active le compte
    // (passage de PENDING_VERIFICATION → ACTIVE).
    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifie: true,
          status: UserStatus.ACTIVE,
          emailVerified: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.EMAIL_VERIFIED,
          entityType: "User",
          entityId: user.id,
        },
      }),
    ]);
 
    return {
      ok: true,
      data: {
        userId: user.id,
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    };
  } catch (err) {
    console.error("[otp] verifyOTP crash:", err);
    return {
      ok: false,
      error: "Impossible de vérifier le code. Réessayez.",
    };
  }
}