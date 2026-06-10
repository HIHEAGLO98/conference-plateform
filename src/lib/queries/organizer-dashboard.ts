import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ArticleStatus,
  ConferenceStatus,
  InscriptionStatus,
  Prisma,
} from "@generated/prisma/client";

/* 
 * Queries pour le dashboard Organisateur.
 *
 * Scope : TOUTES les queries sont filtrées par `organisateurId` — on ne
 * remonte jamais les données d'un autre organisateur. L'id est passé en
 * paramètre et doit provenir de `auth()` côté page.tsx.
 *
 * Les queries sont intentionnellement découpées en 4 fonctions pour permettre
 * au page.tsx d'utiliser <Suspense> par bloc :
 *   - getOrganizerKpis()                → KpiGrid
 *   - getOrganizerConferences()         → ConferenceHierarchy
 *   - getOrganizerRecentInscriptions()  → QuickActionsSidebar
 *   - getOrganizerProfile()             → layout.tsx (sidebar)
 *  */

/* 
 * 1. KPIs - agrégats rapides (grid top du dashboard)
 *  */

export interface OrganizerKpis {
  conferences: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  sessions: {
    total: number;
    almostFull: number;
  };
  participants: {
    total: number;
    todayNew: number;
  };
  articles: {
    total: number;
    pending: number;
    thisWeekNew: number;
  };
}

export async function getOrganizerKpis(
  organizerId: string
): Promise<OrganizerKpis> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Une seule query pour le breakdown des conférences par statut
  const conferenceCounts = await prisma.conference.groupBy({
    by: ["statut"],
    where: { organisateurId: organizerId },
    _count: { _all: true },
  });

  const confByStatus = Object.fromEntries(
    conferenceCounts.map((c) => [c.statut, c._count._all])
  ) as Partial<Record<ConferenceStatus, number>>;

  // IDs conférences de l'organisateur pour scoper les queries suivantes
  const myConferences = await prisma.conference.findMany({
    where: { organisateurId: organizerId },
    select: { id: true, capaciteMax: true, seulAlerte: true },
  });
  const myConferenceIds = myConferences.map((c) => c.id);

  const [
    sessionsTotal,
    sessionsAlmostFull,
    participantsTotal,
    participantsToday,
    articlesTotal,
    articlesPending,
    articlesThisWeek,
  ] = await Promise.all([
    // Sessions total
    prisma.session.count({
      where: { conferenceId: { in: myConferenceIds } },
    }),
    // Sessions « presque pleines » — on récupère les sessions avec leur compteur
    // d'inscrits. Prisma n'a pas de window function, donc on passe par un raw
    // count puis on filtre côté JS.
    (async () => {
      if (myConferenceIds.length === 0) return 0;
      const sessions = await prisma.session.findMany({
        where: { conferenceId: { in: myConferenceIds } },
        select: {
          id: true,
          capacite: true,
          seulAlerte: true,
          conferenceId: true,
        },
      });
      // Approximation : pour l'instant on compte les inscriptions confirmées
      // sur la conférence parente (pas par session — pas de table Inscription
      // ↔ Session en M-N). On marque comme « almost full » si conf ≥ 80%.
      // Quand on aura un modèle SessionRegistration, on raffinera.
      const threshold = 0.8;
      let count = 0;
      const confCapMap = new Map(
        myConferences.map((c) => [c.id, c.capaciteMax ?? null])
      );
      const inscriptionsPerConf = await prisma.inscription.groupBy({
        by: ["conferenceId"],
        where: {
          conferenceId: { in: myConferenceIds },
          statut: {
            in: [InscriptionStatus.CONFIRMED, InscriptionStatus.ATTENDED],
          },
        },
        _count: { _all: true },
      });
      const regMap = new Map(
        inscriptionsPerConf.map((r) => [r.conferenceId, r._count._all])
      );
      for (const s of sessions) {
        const cap = confCapMap.get(s.conferenceId);
        if (!cap) continue;
        const regs = regMap.get(s.conferenceId) ?? 0;
        if (regs / cap >= threshold) count++;
      }
      return count;
    })(),
    // Participants total (inscriptions confirmées sur mes confs)
    prisma.inscription.count({
      where: {
        conferenceId: { in: myConferenceIds },
        statut: {
          in: [InscriptionStatus.CONFIRMED, InscriptionStatus.ATTENDED],
        },
      },
    }),
    // Nouvelles inscriptions aujourd'hui
    prisma.inscription.count({
      where: {
        conferenceId: { in: myConferenceIds },
        createdAt: { gte: startOfToday },
      },
    }),
    // Articles — via les sessions des confs organisées (M-N ArticleSession)
    prisma.article.count({
      where: {
        sessions: {
          some: {
            session: { conferenceId: { in: myConferenceIds } },
          },
        },
      },
    }),
    prisma.article.count({
      where: {
        sessions: {
          some: {
            session: { conferenceId: { in: myConferenceIds } },
          },
        },
        statut: {
          in: [ArticleStatus.PENDING, ArticleStatus.REVIEWING],
        },
      },
    }),
    prisma.article.count({
      where: {
        sessions: {
          some: {
            session: { conferenceId: { in: myConferenceIds } },
          },
        },
        createdAt: { gte: oneWeekAgo },
      },
    }),
  ]);

  return {
    conferences: {
      total: myConferenceIds.length,
      published: confByStatus[ConferenceStatus.PUBLISHED] ?? 0,
      draft: confByStatus[ConferenceStatus.DRAFT] ?? 0,
      archived: confByStatus[ConferenceStatus.ARCHIVED] ?? 0,
    },
    sessions: { total: sessionsTotal, almostFull: sessionsAlmostFull },
    participants: { total: participantsTotal, todayNew: participantsToday },
    articles: {
      total: articlesTotal,
      pending: articlesPending,
      thisWeekNew: articlesThisWeek,
    },
  };
}

/* 
 * 2. Conférences + Sessions (accordéon hierarchy)
 *  */

export const organizerConferenceSelect = {
  id: true,
  slug: true,
  shortName: true,
  titre: true,
  ville: true,
  pays: true,
  lieu: true,
  dateDebut: true,
  dateFin: true,
  capaciteMax: true,
  seulAlerte: true,
  statut: true,
  format: true,
  publishedAt: true,
  sessions: {
    orderBy: { horaireDebut: "asc" as const },
    select: {
      id: true,
      titre: true,
      type: true,
      salle: true,
      horaireDebut: true,
      horaireFin: true,
      capacite: true,
      seulAlerte: true,
      intervenants: true,
    },
  },
  _count: {
    select: {
      sessions: true,
      inscriptions: {
        where: {
          statut: {
            in: [InscriptionStatus.CONFIRMED, InscriptionStatus.ATTENDED],
          },
        },
      },
    },
  },
} satisfies Prisma.ConferenceSelect;

export type OrganizerConference = Prisma.ConferenceGetPayload<{
  select: typeof organizerConferenceSelect;
}>;

export type OrganizerSession = OrganizerConference["sessions"][number];

export async function getOrganizerConferences(
  organizerId: string
): Promise<OrganizerConference[]> {
  return prisma.conference.findMany({
    where: { organisateurId: organizerId },
    orderBy: [
      { statut: "asc" }, // DRAFT puis PUBLISHED — à ajuster si besoin
      { dateDebut: "desc" },
    ],
    select: organizerConferenceSelect,
  });
}

/**
 * Version légère (id + titre + dates) pour les selects de modal (CreateSession).
 */
export async function getOrganizerConferencesLite(
  organizerId: string
): Promise<
  Array<{
    id: string;
    shortName: string | null;
    titre: string;
    ville: string;
    dateDebut: Date;
    dateFin: Date;
  }>
> {
  return prisma.conference.findMany({
    where: { organisateurId: organizerId },
    orderBy: { dateDebut: "desc" },
    select: {
      id: true,
      shortName: true,
      titre: true,
      ville: true,
      dateDebut: true,
      dateFin: true,
    },
  });
}

/* 
 * 3. Flux « live » — dernières inscriptions reçues sur mes conférences
 *  */

export interface RecentInscription {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    nom: string;
    prenom: string;
    avatarUrl: string | null;
  };
  conference: {
    id: string;
    slug: string;
    shortName: string | null;
    titre: string;
  };
}

export async function getOrganizerRecentInscriptions(
  organizerId: string,
  limit = 6
): Promise<RecentInscription[]> {
  const rows = await prisma.inscription.findMany({
    where: {
      conference: { organisateurId: organizerId },
      statut: {
        in: [
          InscriptionStatus.PENDING,
          InscriptionStatus.CONFIRMED,
          InscriptionStatus.ATTENDED,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      user: {
        select: { id: true, nom: true, prenom: true, avatarUrl: true },
      },
      conference: {
        select: { id: true, slug: true, shortName: true, titre: true },
      },
    },
  });
  return rows;
}

/* 
 * 4. Profil organisateur pour le layout (sidebar + avatar header)
 *  */

export async function getOrganizerProfile(organizerId: string) {
  return prisma.user.findUnique({
    where: { id: organizerId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      avatarUrl: true,
      affiliation: true,
      role: true,
    },
  });
}