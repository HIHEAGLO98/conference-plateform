"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AuditAction, ConferenceStatus, FormaType } from "@generated/prisma/client";
import {
  createConferenceSchema,
  createSessionSchema,
  type CreateConferenceInput,
  type CreateSessionInput,
} from "@/lib/validators/conference";

//  Types de retour 

export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

//  Utilitaires internes 

/**
 * Génère un slug URL-safe à partir d'un titre.
 * Normalise les accents, met en minuscules, remplace les espaces/ponctuations.
 */
function toSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * Garantit l'unicité du slug en suffixant avec un incrément si nécessaire.
 * Effectue au maximum 10 tentatives avant d'ajouter un suffixe aléatoire.
 */
async function generateUniqueSlug(baseText: string): Promise<string> {
  const base = toSlug(baseText);
  let slug = base;

  for (let i = 1; i <= 10; i++) {
    const exists = await prisma.conference.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }

  // Fallback : ajoute un suffixe aléatoire court
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Parse "Paris, France" → { ville: "Paris", pays: "France" }.
 * Découpe sur la dernière virgule pour gérer "New York, NY, USA".
 */
function parseVillePays(villePays: string): { ville: string; pays: string } {
  const idx = villePays.lastIndexOf(",");
  if (idx === -1) return { ville: villePays.trim(), pays: villePays.trim() };
  return {
    ville: villePays.slice(0, idx).trim(),
    pays: villePays.slice(idx + 1).trim(),
  };
}

/**
 * Récupère l'IP de la requête courante pour l'audit log.
 * Fonctionne derrière un reverse-proxy (Vercel, nginx) via X-Forwarded-For.
 */
async function getClientIp(): Promise<string | null> {
  try {
    const hdrs = await headers();
    return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

//   Action : créer une conférence 

export async function createConference(
  input: CreateConferenceInput
): Promise<ActionResult<{ id: string; slug: string }>> {

  // 1. Authentification — la session doit venir du serveur, pas du client
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié. Veuillez vous reconnecter." };
  }
  if (session.user.role !== "ORGANISATEUR") {
    return { success: false, error: "Action réservée aux organisateurs." };
  }
  const organizerId = session.user.id;

  // 2. Validation Zod côté serveur (ne jamais faire confiance au client)
  const parsed = createConferenceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides. Veuillez corriger les erreurs.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    titre,
    shortName,
    theme,
    description,
    organisation,
    villePays,
    lieu,
    format,
    dateDebut,
    dateFin,
    capaciteMax,
    seuilAlerte,
    visibility,
    publish,
  } = parsed.data;

  // 3. Parsing villePays → ville + pays
  const { ville, pays } = parseVillePays(villePays);

  // 4. Génération du slug unique
  const slug = await generateUniqueSlug(
    shortName?.trim() ? `${shortName} ${titre}` : titre
  );

  // 5. Statut et date de publication
  const statut: ConferenceStatus =
    publish === "NOW" ? ConferenceStatus.PUBLISHED : ConferenceStatus.DRAFT;
  const publishedAt = publish === "NOW" ? new Date() : null;

  // 6. Persistance en DB
  try {
    const conference = await prisma.conference.create({
      data: {
        slug,
        shortName: shortName || null,
        titre,
        theme,
        description,
        organisation: organisation || null,
        format: format as FormaType,
        lieu: lieu || ville, // salle/bâtiment — fallback sur ville
        ville,
        pays,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        capaciteMax: capaciteMax ?? null,
        seulAlerte: seuilAlerte ?? null,   // Note: typo intentionnelle dans le schema Prisma (seulAlerte ≠ seuilAlerte)
        statut,
        visibility: visibility as "PUBLIC" | "PRIVATE",
        publishedAt,
        organisateurId: organizerId,
      },
      select: { id: true, slug: true },
    });

    // 7. Audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE_CONFERENCE,
        entityType: "Conference",
        entityId: conference.id,
        metadata: { titre, slug, statut },
        ipAddress: await getClientIp(),
        userId: organizerId,
      },
    });

    // 8. Revalidation du dashboard
    revalidatePath("/organizer/dashboard");
    revalidatePath("/organizer/conferences");

    return {
      success: true,
      data: { id: conference.id, slug: conference.slug },
      message:
        publish === "NOW"
          ? "Conférence publiée avec succès !"
          : "Conférence enregistrée en brouillon.",
    };
  } catch (err) {
    console.error("[createConference]", err);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création. Réessayez.",
    };
  }
}

//  Action : créer une session 

export async function createSession(
  input: CreateSessionInput
): Promise<ActionResult<{ id: string }>> {

  // 1. Authentification
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié." };
  }
  if (session.user.role !== "ORGANISATEUR") {
    return { success: false, error: "Action réservée aux organisateurs." };
  }
  const organizerId = session.user.id;

  // 2. Validation Zod
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    conferenceId,
    titre,
    type,
    salle,
    horaireDebut,
    horaireFin,
    capacite: capaciteRaw,
    seuilAlerte: seuilAlerteRaw,
    intervenants: intervenantsRaw,
    description,
  } = parsed.data;

  // 3. Vérification d'ownership - l'organisateur ne peut créer une session
  //    que sur SES propres conférences (prévention IDOR)
  const conference = await prisma.conference.findUnique({
    where: { id: conferenceId },
    select: { id: true, organisateurId: true, capaciteMax: true },
  });

  if (!conference) {
    return { success: false, error: "Conférence introuvable." };
  }
  if (conference.organisateurId !== organizerId) {
    return {
      success: false,
      error: "Vous n'êtes pas autorisé à créer une session pour cette conférence.",
    };
  }

  // 4. Résolution de la capacité
  //    La session a capacite INT (non-nullable en DB).
  //    Si vide → on hérite de la conf. Si la conf n'a pas de capaciteMax → 0.
  let capacite: number;
  if (!capaciteRaw || capaciteRaw === "") {
    capacite = conference.capaciteMax ?? 0;
  } else {
    capacite = parseInt(capaciteRaw, 10);
  }

  const seulAlerteVal =
    seuilAlerteRaw && seuilAlerteRaw !== ""
      ? parseInt(seuilAlerteRaw, 10)
      : null;

  // 5. Parse des intervenants (string → tableau)
  const intervenants = intervenantsRaw
    ? intervenantsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // 6. Persistance
  try {
    const newSession = await prisma.session.create({
      data: {
        titre,
        type: type as import("@generated/prisma/client").SessionType,
        salle: salle || null,
        horaireDebut: new Date(horaireDebut),
        horaireFin: new Date(horaireFin),
        capacite,
        seulAlerte: seulAlerteVal,
        intervenants,
        description: description || null,
        conferenceId,
      },
      select: { id: true },
    });

    // 7. Audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.CREATE_SESSION,
        entityType: "Session",
        entityId: newSession.id,
        metadata: { titre, type, conferenceId },
        ipAddress: await getClientIp(),
        userId: organizerId,
      },
    });

    // 8. Revalidation
    revalidatePath("/organizer/dashboard");

    return {
      success: true,
      data: { id: newSession.id },
      message: "Session créée avec succès !",
    };
  } catch (err) {
    console.error("[createSession]", err);
    return {
      success: false,
      error: "Une erreur est survenue lors de la création. Réessayez.",
    };
  }
}