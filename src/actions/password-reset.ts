"use server";

import bcrypt from "bcryptjs";
import { UserStatus } from "../generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateOtp, getOtpExpiryDate, OTP_EXPIRY_MINUTES } from "@/lib/otp";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";

/*
 * Types de retour (discriminated union) — aligné sur actions/otp.ts
 *  */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

/* 
 * requestPasswordReset — génère un OTP de reset + envoie l'email
 *
 * Anti-énumération : on retourne toujours `ok:true` quelle que soit la réalité
 * (compte inconnu, bloqué, erreur mail…). Le but est de ne jamais révéler
 * l'existence d'un compte via cette API.
 *  */

export async function requestPasswordReset(
  email: string
): Promise<ActionResult<{ expiresAt: Date }>> {
  // 1. Validation
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Email invalide",
      field: "email",
    };
  }

  const normalizedEmail = parsed.data.email;
  // Réponse neutre (anti-énumération), pré-calculée pour la cohérence des retours
  const neutralExpiry = getOtpExpiryDate();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        prenom: true,
        nom: true,
        status: true,
      },
    });

    // Compte inconnu ou bloqué → réponse succès neutre, rien d'envoyé.
    if (!user || user.status === UserStatus.BLOCKED) {
      return { ok: true, data: { expiresAt: neutralExpiry } };
    }

    // 2. Génère le code + date d'expiration
    const code = generateOtp(6);
    const expiresAt = getOtpExpiryDate();

    // 3. Transaction atomique : purge ancien tokens + crée nouveau + audit
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: {
          userId: user.id,
          type: "PASSWORD_RESET",
          usedAt: null,
        },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: code,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          entityType: "User",
          entityId: user.id,
        },
      }),
    ]);

    // 4. Envoi de l'email (échec non bloquant — le code est en DB, l'utilisateur
    //    peut redemander un code si besoin)
    const userName =
      [user.prenom, user.nom].filter(Boolean).join(" ") || "utilisateur";

    const result = await sendMail({
      to: normalizedEmail,
      subject: "Réinitialisation de votre mot de passe ConferenceHub",
      react: PasswordResetEmail({
        userName,
        otp: code,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
      }),
      tags: [{ name: "type", value: "password-reset" }],
    });

    if (!result.ok) {
      console.error("[password-reset] Échec envoi e-mail:", result.error);
    }

    return { ok: true, data: { expiresAt } };
  } catch (err) {
    console.error("[password-reset] requestPasswordReset crash:", err);
    // On masque l'erreur à l'utilisateur pour rester cohérent avec l'anti-énumération
    return { ok: true, data: { expiresAt: neutralExpiry } };
  }
}

/* 
 * resetPasswordWithOtp — vérifie le code + remplace le mot de passe
 *  */

export interface ResetPasswordSuccess {
  email: string;
}

export async function resetPasswordWithOtp(input: {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult<ResetPasswordSuccess>> {
  // 1. Validation (schéma = email + code + password fort + confirmation)
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "Données invalides",
      field: first?.path.join(".") ?? undefined,
    };
  }

  const { email, code, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    // Message générique → anti-énumération (ne pas dire "email inconnu")
    if (!user || user.status === UserStatus.BLOCKED) {
      return { ok: false, error: "Code invalide ou expiré" };
    }

    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        type: "PASSWORD_RESET",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!token) {
      return { ok: false, error: "Code invalide ou expiré" };
    }

    // 2. Hash du nouveau mot de passe (cost 12 = cohérent avec register)
    const hashed = await bcrypt.hash(password, 12);

    // 3. Transaction atomique : token used + motDePasse update + audit log
    //    Bonus : si le compte était PENDING_VERIFICATION, on l'active
    //    (le reset vaut preuve de possession de l'email).
    const shouldActivate = user.status === UserStatus.PENDING_VERIFICATION;

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          motDePasse: hashed,
          ...(shouldActivate && {
            status: UserStatus.ACTIVE,
            emailVerified: new Date(),
          }),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: user.id,
          metadata: shouldActivate
            ? { activatedOnReset: true }
            : undefined,
        },
      }),
    ]);

    return { ok: true, data: { email: user.email } };
  } catch (err) {
    console.error("[password-reset] resetPasswordWithOtp crash:", err);
    return {
      ok: false,
      error: "Impossible de réinitialiser le mot de passe. Réessayez.",
    };
  }
}