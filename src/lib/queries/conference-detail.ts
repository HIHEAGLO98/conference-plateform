import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ConferenceStatus,
  ConferenceVisibility,
  InscriptionStatus,
  Prisma,
} from "@/generated/prisma/client";

/**
 * Sélection Prisma canonique pour la page de détail publique d'une conférence.
 *
 * Contrairement à `homeConferenceSelect` (liste/card), on inclut :
 *   - `description` - la section "À propos"
 *   - `sessions`    - le programme (ordre chronologique)
 *   - `faqs`        - l'accordéon
 *   - `organisateur.avatarUrl` - pour la carte "Organisé par"
 */
export const conferenceDetailSelect = {
  id: true,
  slug: true,
  shortName: true,
  titre: true,
  description: true,
  theme: true,
  lieu: true,
  organisation: true,
  bannerUrl: true,
  websiteUrl: true,
  dateDebut: true,
  dateFin: true,
  capaciteMax: true,
  statut: true,
  publishedAt: true,
  createdAt: true,
  organisateur: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      affiliation: true,
      avatarUrl: true,
    },
  },
  sessions: {
    orderBy: { horaireDebut: "asc" as const },
    select: {
      id: true,
      titre: true,
      description: true,
      type: true,
      salle: true,
      horaireDebut: true,
      horaireFin: true,
      capacite: true,
      presenter: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          affiliation: true,
          avatarUrl: true,
        },
      },
    },
  },
  faqs: {
    orderBy: { ordre: "asc" as const },
    select: {
      id: true,
      question: true,
      answer: true,
    },
  },
  _count: {
    select: {
      inscriptions: {
        where: {
          statut: {
            in: [
              InscriptionStatus.PENDING,
              InscriptionStatus.CONFIRMED,
              InscriptionStatus.ATTENDED,
            ],
          },
        },
      },
      sessions: true,
    },
  },
} satisfies Prisma.ConferenceSelect;

/** Type Prisma exact du résultat — à importer en `import type` côté client. */
export type ConferenceDetail = Prisma.ConferenceGetPayload<{
  select: typeof conferenceDetailSelect;
}>;

/** Type pratique pour une session de la page détail. */
export type ConferenceSessionItem = ConferenceDetail["sessions"][number];

/** Type pratique pour une FAQ. */
export type ConferenceFaqItem = ConferenceDetail["faqs"][number];

/**
 * Récupère une conférence **publiée + publique** par son slug, avec toutes ses
 * relations d'affichage. Retourne `null` si non trouvée ou non publique 
 *
 * @example
 *   const conf = await getConferenceBySlug(params.slug);
 *   if (!conf) notFound();
 */
export async function getConferenceBySlug(
  slug: string
): Promise<ConferenceDetail | null> {
  if (!slug) return null;

  return prisma.conference.findFirst({
    where: {
      slug,
      statut: ConferenceStatus.PUBLISHED,
      visibility: ConferenceVisibility.PUBLIC,
      publishedAt: { not: null, lte: new Date() },
    },
    select: conferenceDetailSelect,
  });
}

/**
 * Pré-génère les paramètres statiques (generateStaticParams) - uniquement les
 * conférences publiées et publiques. Optionnel mais utile pour l'ISR.
 */
export async function listPublishedSlugs(): Promise<Array<{ slug: string }>> {
  const rows = await prisma.conference.findMany({
    where: {
      statut: ConferenceStatus.PUBLISHED,
      visibility: ConferenceVisibility.PUBLIC,
      publishedAt: { not: null, lte: new Date() },
    },
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return rows;
}