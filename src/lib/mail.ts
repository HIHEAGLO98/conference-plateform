import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

import { env } from "@/lib/env";

/*
 * Client Resend (singleton)
 * Si RESEND_API_KEY est absent en dev, on crée un client stub qui log en console
 * plutôt que de crasher. En prod, l'env est validé par Zod (voir env.ts).
 *
 */

const globalForResend = globalThis as unknown as {
  resend: Resend | null | undefined;
};

export const resend =
  globalForResend.resend ??
  (env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null);

if (env.NODE_ENV !== "production") globalForResend.resend = resend;

/** Pièce jointe — format Resend v6 (camelCase, max 40 MB par email). */
export interface MailAttachment {
  /** Nom du fichier affiché dans le client mail. */
  filename: string;
  /**
   * Contenu du fichier en Buffer ou en base64.
   * Préférer Buffer côté serveur pour éviter les problèmes d'encodage.
   */
  content: Buffer | string;
  /** MIME type (ex: "application/pdf", "image/png"). */
  contentType?: string;
  /**
   * Content-ID pour les pièces jointes inline (référencées en HTML via cid:).
   * Laisser vide pour une pièce jointe standard.
   */
  contentId?: string;
}

/*
 * Types
 *
 * */

export interface SendMailOptions {
  /** Destinataire(s). */
  to: string | string[];
  /** Sujet de l'e-mail. */
  subject: string;
  /** Composant React Email à rendre. */
  react: ReactElement;
  /** Override de l'expéditeur (sinon env.EMAIL_FROM). */
  from?: string;
  /** Reply-to éventuel. */
  replyTo?: string;
  /** Tags pour filtrer dans le dashboard Resend. */
  tags?: { name: string; value: string }[];
   /** Pièces jointes (PDF billet, attestation…). */
  attachments?: MailAttachment[];
}

export type SendMailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/*
 * sendMail — fonction d'envoi des mails
 *
 *  */

/**
 * Envoie un e-mail via Resend en utilisant un template React Email.
 *
 * @example
 * await sendMail({
 *   to: "user@example.com",
 *   subject: "Bienvenue",
 *   react: <WelcomeEmail name="nom d'utilisateur" />,
 * });
 */
export async function sendMail({
  to,
  subject,
  react,
  from,
  replyTo,
  tags,
  attachments
}: SendMailOptions): Promise<SendMailResult> {
  // Mode dev sans clé API — on log et on retourne OK pour ne pas bloquer le flow
  if (!resend) {
    const html = await render(react);
    console.warn("[mail] RESEND_API_KEY absent — email simulé en console");
    console.info("[mail] To:", to);
    console.info("[mail] Subject:", subject);
    console.info("[mail] HTML preview (100 chars):", html.slice(0, 100));
    return { ok: true, id: "dev-simulated" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from ?? env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo: replyTo ?? env.EMAIL_REPLY_TO,
      tags,
       // Pièces jointes — transmises uniquement si présentes
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    });

    if (error) {
      console.error("[mail] Resend API error:", error);
      return { ok: false, error: error.message ?? "Erreur Resend inconnue" };
    }

    if (!data?.id) {
      return { ok: false, error: "Resend n'a pas retourné d'ID" };
    }

    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[mail] sendMail failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
