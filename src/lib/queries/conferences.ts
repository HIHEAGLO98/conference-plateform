import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ConferenceStatus,
  ConferenceVisibility,
  InscriptionStatus,
  Prisma,
} from "@/generated/prisma/client";

export const CONFERENCES_PAGE_SIZE = 8;

export interface ListPublishedOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Sélection Prisma canonique pour la carte de conférence publique.
 * On n'inclut que ce dont la carte a besoin.
 */
export const homeConferenceSelect = {
  id: true,
  slug: true,
  shortName: true,
  titre: true,
  theme: true,
  format: true,
  lieu: true,
  ville: true,
  pays: true,
  organisation: true,
  dateDebut: true,
  dateFin: true,
  capaciteMax: true,
  seulAlerte: true,
  statut: true,
  publishedAt: true,
  organisateur: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      affiliation: true,
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
    },
  },
} satisfies Prisma.ConferenceSelect;

export type HomeConferenceRow = Prisma.ConferenceGetPayload<{
  select: typeof homeConferenceSelect;
}>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Liste paginée des conférences publiées et publiques pour la landing.
 * Ordre : `publishedAt DESC`.
 */
export async function listPublishedConferences(
  options: ListPublishedOptions = {}
): Promise<Paginated<HomeConferenceRow>> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const rawSize = options.pageSize ?? CONFERENCES_PAGE_SIZE;
  const pageSize = Math.min(50, Math.max(1, Math.floor(rawSize)));

  const where: Prisma.ConferenceWhereInput = {
    statut: ConferenceStatus.PUBLISHED,
    visibility: ConferenceVisibility.PUBLIC,
    publishedAt: { not: null, lte: new Date() },
  };

  const [items, total] = await prisma.$transaction([
    prisma.conference.findMany({
      where ,
      orderBy: { publishedAt: "desc",  },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: homeConferenceSelect,
    }),
    prisma.conference.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}