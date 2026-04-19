import "server-only";

import { randomInt } from "node:crypto";

/**
 * Génère un OTP à N chiffres cryptographiquement.
 */
export function generateOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(randomInt(min, max));
}

/** Durée de validité par défaut d'un OTP d'inscription (10 minutes). */
export const OTP_EXPIRY_MINUTES = 10;

export function getOtpExpiryDate(minutes = OTP_EXPIRY_MINUTES): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}