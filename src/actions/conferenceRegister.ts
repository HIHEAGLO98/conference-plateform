"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import QRCode from "qrcode";
import React from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import {
  AuditAction,
  InscriptionStatus,
  InscriptionType,
} from "@generated/prisma/client";
import { ConferenceRegistrationEmail } from "@/emails/ConferenceRegistrationEmail";

//  Types 

export type TierId = "FREE" | "STUDENT" | "STANDARD" | "PREMIUM";

export interface RegisterResult {
  success: boolean;
  inscriptionId?: string;
  ticketNumber?: string;
  error?: string;
}

//  Helpers 

/** Convertit TierId → InscriptionType Prisma */
function tierToInscriptionType(tierId: TierId): InscriptionType {
  switch (tierId) {
    case "FREE":     return InscriptionType.STANDARD; // pas de type FREE en DB → STANDARD
    case "STUDENT":  return InscriptionType.STUDENT;
    case "PREMIUM":  return InscriptionType.VIP;
    case "STANDARD":
    default:         return InscriptionType.STANDARD;
  }
}

/** Libellé humain du tarif */
function tierLabel(tierId: TierId): string {
  switch (tierId) {
    case "FREE":     return "GRATUIT";
    case "STUDENT":  return "Étudiant — 49 €";
    case "PREMIUM":  return "Premium — 249 €";
    case "STANDARD": return "Standard — 149 €";
  }
}

/** Prix en euros (0 = gratuit) */
function tierPrice(tierId: TierId): number {
  switch (tierId) {
    case "FREE":     return 0;
    case "STUDENT":  return 49;
    case "PREMIUM":  return 249;
    case "STANDARD": return 149;
  }
}

/** Référence lisible : "SLUG-SHORTID" */
function buildReference(conferenceSlug: string, inscriptionId: string): string {
  const short = inscriptionId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const slugPart = conferenceSlug.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${slugPart}-${short}`;
}

/** Formatte une plage de dates en français */
function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${fmt.format(start)} a ${timeFmt.format(start)}`;
  }
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

async function getClientIp(): Promise<string | null> {
  try {
    const hdrs = await headers();
    return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch { return null; }
}

//  Sanitisation WinAnsi 

/**
 * Remplace les caractères hors WinAnsi (Latin-1) par leurs équivalents ASCII.
 * pdf-lib avec StandardFonts (Helvetica/Times) utilise WinAnsi et lève une
 * exception sur tout caractère > U+00FF non mappé (ex: -> U+2192, ' U+2019, - U+2014).
 * Les caracteres francais accentues (e a e u...) sont dans WinAnsi et sont gardes.
 */
function sanitizePdfText(text: string): string {
  return text
    .replace(/\u2192/g, "->")   // →
    .replace(/\u2190/g, "<-")   // ←
    .replace(/\u2191/g, "^")    // ↑
    .replace(/\u2193/g, "v")    // ↓
    .replace(/\u2014/g, "-")    // — em dash
    .replace(/\u2013/g, "-")    // – en dash
    .replace(/\u2018/g, "'")    // ' left single quote
    .replace(/\u2019/g, "'")    // ' right single quote
    .replace(/\u201C/g, '"')    // " left double quote
    .replace(/\u201D/g, '"')    // " right double quote
    .replace(/\u2026/g, "...")  // … ellipsis
    .replace(/\u00A0/g, " ")    // espace insecable
    .replace(/\u202F/g, " ")    // espace fine insecable
    .replace(/\u00D7/g, "x")    // ×
    .replace(/\u00F7/g, "/")    // ÷
    .replace(/[^\x00-\xFF]/g, "?"); // tout autre caractere hors Latin-1
}

//  Génération du PDF billet 

/**
 * Génère un PDF billet style weezevent à partir des données de l'inscription.
 * Utilise pdf-lib (pas de dépendance navigateur, tourne côté serveur).
 * Retourne un Buffer base64.
 */
async function generateTicketPdf(opts: {
  participantName: string;
  conferenceTitle: string;
  conferenceShortName: string | null;
  lieu: string;
  dateDebut: Date;
  dateFin: Date;
  reference: string;
  ticketNumber: number;
  tierLabel: string;
  price: number;
  inscriptionId: string;
}): Promise<Buffer> {
  // Sanitiser tous les inputs string -- StandardFonts n'accepte que WinAnsi
  const {
    dateDebut, dateFin, ticketNumber, price, inscriptionId,
  } = opts;
  const participantName     = sanitizePdfText(opts.participantName);
  const conferenceTitle     = sanitizePdfText(opts.conferenceTitle);
  const conferenceShortName = opts.conferenceShortName
    ? sanitizePdfText(opts.conferenceShortName)
    : null;
  const lieu      = sanitizePdfText(opts.lieu);
  const reference = sanitizePdfText(opts.reference);
  const tLabel    = sanitizePdfText(opts.tierLabel);

  //  QR Code 
  // Encode l'ID d'inscription — scanné lors du check-in
  const qrDataUrl = await QRCode.toDataURL(inscriptionId, {
    width: 160,
    margin: 1,
    color: { dark: "#1e293b", light: "#ffffff" },
  });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");

  //  Code-barres (simulé avec un pattern visuel en pdf-lib) 
  // pdf-lib ne génère pas de vrai code-barres — on encode la référence en
  // barres verticales régulières pour l'effet visuel.
  // Pour un vrai Code128, utilise jsbarcode + canvas-node ou un service externe.

  //  Document PDF 
  const pdfDoc = await PDFDocument.create();

  // Format A4 portrait
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg    = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const WHITE  = rgb(1, 1, 1);
  const DARK   = rgb(0.118, 0.141, 0.196);   // slate-900
  const BLUE   = rgb(0.118, 0.302, 0.788);   // blue-600
  const TEAL   = rgb(0.051, 0.576, 0.522);   // teal-600
  const GRAY   = rgb(0.6, 0.6, 0.6);
  const LGRAY  = rgb(0.96, 0.97, 0.98);      // slate-50

  //  Bande supérieure colorée 
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: BLUE });

  // Logo / titre app
  page.drawText("ConferenceHub", {
    x: 30, y: height - 30,
    size: 11, font: fontBold, color: WHITE, opacity: 0.9,
  });
  page.drawText("Votre billet d'accès officiel", {
    x: 30, y: height - 48,
    size: 8, font: fontReg, color: WHITE, opacity: 0.7,
  });

  // Référence en haut à droite
  page.drawText(reference, {
    x: width - 200, y: height - 30,
    size: 9, font: fontBold, color: WHITE, opacity: 0.8,
  });
  page.drawText("N° d'ordre", {
    x: width - 200, y: height - 46,
    size: 7, font: fontReg, color: WHITE, opacity: 0.6,
  });

  //  Titre de la conférence 
  const confDisplay = conferenceShortName
    ? `${conferenceShortName} - ${conferenceTitle}`
    : conferenceTitle;

  // Titre (multi-ligne si trop long)
  const titleLines = wrapText(confDisplay.toUpperCase(), 55);
  let titleY = height - 115;
  for (const line of titleLines) {
    page.drawText(line, { x: 30, y: titleY, size: 15, font: fontBold, color: DARK });
    titleY -= 20;
  }

  //  Bande infos (date, lieu) 
  const bandeY = height - 190;
  page.drawRectangle({ x: 0, y: bandeY, width, height: 52, color: LGRAY });
  page.drawRectangle({ x: 0, y: bandeY, width: 3, height: 52, color: TEAL });

  const dateStr = formatDateRange(dateDebut, dateFin);
  page.drawText("DATE", { x: 30, y: bandeY + 33, size: 7, font: fontBold, color: GRAY });
  page.drawText(dateStr, { x: 30, y: bandeY + 19, size: 10, font: fontBold, color: DARK });

  const lieuX = width / 2 + 10;
  page.drawText("LIEU", { x: lieuX, y: bandeY + 33, size: 7, font: fontBold, color: GRAY });
  page.drawText(lieu.toUpperCase(), { x: lieuX, y: bandeY + 19, size: 10, font: fontBold, color: DARK });

  //  Corps principal 
  const bodyY = bandeY - 20;

  // Nom du participant
  page.drawText("PARTICIPANT", { x: 30, y: bodyY - 10, size: 7, font: fontBold, color: GRAY });
  page.drawText(participantName.toUpperCase(), {
    x: 30, y: bodyY - 28, size: 16, font: fontBold, color: DARK,
  });

  // Tarif
  page.drawText("FORMULE", { x: 30, y: bodyY - 55, size: 7, font: fontBold, color: GRAY });
  page.drawText(tLabel, { x: 30, y: bodyY - 72, size: 11, font: fontBold, color: price === 0 ? TEAL : BLUE });

  //  Numéro de billet (encadré) 
  const numBoxX = width - 160;
  const numBoxY = bodyY - 80;
  page.drawRectangle({
    x: numBoxX, y: numBoxY, width: 130, height: 70,
    color: LGRAY,
    borderColor: BLUE, borderWidth: 2,
  });
  page.drawText("N°", { x: numBoxX + 10, y: numBoxY + 50, size: 9, font: fontBold, color: GRAY });
  page.drawText(String(ticketNumber).padStart(3, "0"), {
    x: numBoxX + 10, y: numBoxY + 28, size: 28, font: fontBold, color: BLUE,
  });
  page.drawText("N'imprimez pas deux fois", {
    x: numBoxX + 10, y: numBoxY + 10, size: 6, font: fontReg, color: GRAY,
  });

  //  QR Code  
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  const qrSize = 110;
  const qrX = 30;
  const qrY = bodyY - 220;
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // Légende QR
  page.drawText("Présentez ce QR code à l'accueil", {
    x: qrX, y: qrY - 14, size: 7, font: fontReg, color: GRAY,
  });

  //  Infos de commande 
  const infoX = qrX + qrSize + 20;
  const infoY = qrY + qrSize;

  const infoLines = [
    { label: "RÉFÉRENCE", value: reference },
    { label: "DATE D'INSCRIPTION", value: new Intl.DateTimeFormat("fr-FR").format(new Date()) },
    { label: "NOM", value: participantName.toUpperCase() },
    { label: "BILLET", value: `N°${String(ticketNumber).padStart(3, "0")}` },
    { label: "PRIX TTC", value: price === 0 ? "Gratuit" : `${price} € TTC frais inclus` },
  ];

  let lineY = infoY;
  for (const { label, value } of infoLines) {
    page.drawText(label + " : " + value, {
      x: infoX, y: lineY, size: 8, font: fontReg, color: DARK,
    });
    lineY -= 16;
  }

  //  Séparateur pointillés 
  const sepY = qrY - 40;
  for (let x = 0; x < width; x += 8) {
    page.drawLine({
      start: { x, y: sepY }, end: { x: x + 4, y: sepY },
      thickness: 0.5, color: GRAY, opacity: 0.4,
    });
  }

  //  CGV simplifiées 
  const cgvY = sepY - 20;
  const cgvText =
    "CONDITIONS GÉNÉRALES - Ce billet est personnel et non cessible. Sa présentation est obligatoire pour accéder à l'événement. " +
    "ConferenceHub se réserve le droit d'annuler tout billet en cas de fraude. En cas d'annulation de l'événement, " +
    "le remboursement sera effectue dans un delai de 30 jours ouvres.";

  const cgvLines = wrapText(cgvText, 95);
  let cgvLineY = cgvY;
  for (const line of cgvLines.slice(0, 4)) {
    page.drawText(line, { x: 30, y: cgvLineY, size: 6.5, font: fontReg, color: GRAY });
    cgvLineY -= 11;
  }

  //  Code-barres visuel bas de page 
  const barcodeY = 30;
  // Génère un pattern de barres verticales à partir du hash de la référence
  drawFakeBarcode(page, reference + inscriptionId, 30, barcodeY, width - 60, 40, DARK);

  page.drawText(reference, {
    x: width / 2 - 40, y: barcodeY - 12,
    size: 8, font: fontReg, color: GRAY,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Dessine un code-barres visuel (barres verticales pseudo-aléatoires à partir
 * d'une seed string). Ce n'est PAS un vrai code-barres scanneable —
 * le QR code est utilisé pour le vrai check-in.
 */
function drawFakeBarcode(
  page: import("pdf-lib").PDFPage,
  seed: string,
  x: number, y: number,
  totalWidth: number, barHeight: number,
  color: import("pdf-lib").Color
) {
  // Hash simple de la seed → séquence déterministe de largeurs
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  hash = Math.abs(hash);

  let curX = x;
  const minBarW = 1.2, maxBarW = 3.5;
  let isBar = true;

  while (curX < x + totalWidth - maxBarW) {
    const w = ((hash % 10) / 10) * (maxBarW - minBarW) + minBarW;
    hash = Math.abs((hash * 33) ^ Math.floor(curX));

    if (isBar) {
      page.drawRectangle({
        x: curX, y, width: w, height: barHeight,
        color, opacity: 0.85,
      });
    }
    curX += w;
    isBar = !isBar;
  }
}

/** Découpe un texte en lignes de `maxLen` caractères max (sur les espaces). */
function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxLen) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

//  Action principale : s'inscrire 

export async function registerToConference(
  conferenceId: string,
  tierId: TierId
): Promise<RegisterResult> {

  // 1. Authentification — obligatoire pour s'inscrire
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Vous devez être connecté pour vous inscrire." };
  }
  const userId = session.user.id;

  // 2. Vérification de la conférence
  const conference = await prisma.conference.findUnique({
    where: { id: conferenceId },
    select: {
      id: true, slug: true, titre: true, shortName: true,
      lieu: true, ville: true, pays: true,
      dateDebut: true, dateFin: true,
      capaciteMax: true, statut: true,
      _count: {
        select: {
          inscriptions: {
            where: { statut: { in: [InscriptionStatus.CONFIRMED, InscriptionStatus.PENDING] } },
          },
        },
      },
    },
  });

  if (!conference) {
    return { success: false, error: "Conférence introuvable." };
  }
  if (conference.statut !== "PUBLISHED") {
    return { success: false, error: "Cette conférence n'est pas ouverte aux inscriptions." };
  }
  if (new Date(conference.dateFin) < new Date()) {
    return { success: false, error: "Cette conférence est terminée." };
  }
  if (
    conference.capaciteMax &&
    conference._count.inscriptions >= conference.capaciteMax
  ) {
    return { success: false, error: "La capacité maximale est atteinte." };
  }

  // 3. Vérification doublon
  const existing = await prisma.inscription.findUnique({
    where: { userId_conferenceId: { userId, conferenceId } },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "Vous êtes déjà inscrit à cette conférence." };
  }

  // 4. Récupération des données participant
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nom: true, prenom: true, email: true },
  });
  if (!user) {
    return { success: false, error: "Compte introuvable." };
  }

  const participantName = `${user.prenom} ${user.nom}`;
  const price = tierPrice(tierId);

  // 5. Création de l'inscription en DB
  let inscription: { id: string };
  try {
    inscription = await prisma.inscription.create({
      data: {
        userId,
        conferenceId,
        type: tierToInscriptionType(tierId),
        statut: price === 0 ? InscriptionStatus.CONFIRMED : InscriptionStatus.PENDING,
      },
      select: { id: true },
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint")
    ) {
      return { success: false, error: "Vous êtes déjà inscrit à cette conférence." };
    }
    console.error("[register] DB error:", err);
    return { success: false, error: "Erreur serveur. Réessayez." };
  }

  // 6. Numéro de billet = rang de l'inscription dans la conférence
  const ticketNumber = conference._count.inscriptions + 1;
  const reference = buildReference(conference.slug, inscription.id);
  const locationStr = [conference.lieu, conference.ville, conference.pays]
    .filter(Boolean).join(" · ");

  // 7. Génération du PDF
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateTicketPdf({
      participantName,
      conferenceTitle: conference.titre,
      conferenceShortName: conference.shortName,
      lieu: locationStr,
      dateDebut: conference.dateDebut,
      dateFin: conference.dateFin,
      reference,
      ticketNumber,
      tierLabel: tierLabel(tierId),
      price,
      inscriptionId: inscription.id,
    });
  } catch (err) {
    console.error("[register] PDF generation failed:", err);
    // On continue sans PDF — l'inscription est valide
  }

  // 8. Envoi du mail de confirmation (avec PDF en pièce jointe si disponible)
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard/inscriptions`;
  const dateStr = formatDateRange(conference.dateDebut, conference.dateFin);

  const mailResult = await sendMail({
     to: `${process.env.EMAIL_REPLY_TO ?? "hiheaaugusto@gmail.com"}`, //to: user.email,
    subject: `Inscription confirmee : ${conference.shortName ?? conference.titre}`,
    react: React.createElement(ConferenceRegistrationEmail, {
      participantName,
      conferenceTitle: conference.titre,
      conferenceLocation: locationStr,
      conferenceDate: dateStr,
      dashboardUrl,
      registrationReference: reference,
    }),
    tags: [
      { name: "type", value: "inscription-confirmed" },
      { name: "conference", value: conference.slug },
    ],
    // Piece jointe PDF — on passe le Buffer directement (pas de toString("base64"))
    // sendMail accepte Buffer | string via MailAttachment.content
    ...(pdfBuffer
      ? {
          attachments: [
            {
              filename: `billet-${reference}.pdf`,
              content: pdfBuffer,          // Buffer natif, pas de base64
              contentType: "application/pdf",
            },
          ],
        }
      : {}),
  });
  if (!mailResult.ok) {
    console.warn("[register] Mail not sent:", mailResult.error);
    // On ne fait pas échouer l'inscription pour un mail raté
  }

  // 9. Audit log
  await prisma.auditLog.create({
    data: {
      action: AuditAction.INSCRIPTION_CREATED,
      entityType: "Inscription",
      entityId: inscription.id,
      metadata: { conferenceId, tierId, reference, ticketNumber },
      ipAddress: await getClientIp(),
      userId,
    },
  }).catch(console.warn);

  // 10. Revalidation
  revalidatePath(`/conferences/${conference.slug}`);

  return {
    success: true,
    inscriptionId: inscription.id,
    ticketNumber: reference,
  };
}