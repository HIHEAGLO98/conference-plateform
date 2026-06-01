import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Layers, Plus, Users, FileText } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InscriptionStatus, ConferenceStatus } from "@/generated/prisma/client";
import { ConferenceToolbar } from "@/components/organizer/ConferenceToolbar";
import { ConferenceOrganizerGrid } from "@/components/organizer/ConferenceOrganizerGrid";
import { CreateConferenceModal } from "@/components/modals/CreateConferenceModal";

// ─── Types exportés (consommés par les composants enfants) ──────────────────

export interface ConferenceRow {
  id: string;
  slug: string;
  shortName: string | null;
  titre: string;
  theme: string;
  lieu: string;
  ville: string;
  pays: string;
  format: string;
  organisation: string | null;
  dateDebut: Date;
  dateFin: Date;
  capaciteMax: number | null;
  seulAlerte: number | null;
  statut: ConferenceStatus;
  visibility: string;
  publishedAt: Date | null;
  sessionCount: number;
  inscriptionCount: number;
  articleCount: number;
  pendingArticleCount: number;
  fillPercent: number;
}

export interface PageKpis {
  total: number;
  published: number;
  draft: number;
  totalSessions: number;
  totalParticipants: number;
  totalArticles: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Dérive les initiales d'une conférence depuis son shortName ou son titre. */
export function conferenceInitials(shortName: string | null, titre: string): string {
  const src = shortName ?? titre;
  const words = src.split(/[\s\-_]+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return src.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Couleur de l'avatar selon le statut (classes Tailwind). */
export function avatarClasses(statut: ConferenceStatus): string {
  switch (statut) {
    case ConferenceStatus.PUBLISHED: return "bg-teal-100 text-teal-700";
    case ConferenceStatus.DRAFT:     return "bg-slate-100 text-slate-500";
    case ConferenceStatus.ARCHIVED:  return "bg-purple-100 text-purple-700";
    case ConferenceStatus.CANCELLED: return "bg-rose-100 text-rose-700";
    default:                         return "bg-slate-100 text-slate-400";
  }
}

// ─── Fetchers Prisma ─────────────────────────────────────────────────────────

type StatusFilter = ConferenceStatus | "ALL";

async function fetchConferences(
  organizerId: string,
  statusFilter: StatusFilter,
  query: string
): Promise<ConferenceRow[]> {
  const where = {
    organisateurId: organizerId,
    ...(statusFilter !== "ALL" ? { statut: statusFilter } : {}),
    ...(query.trim()
      ? {
          OR: [
            { titre: { contains: query, mode: "insensitive" as const } },
            { shortName: { contains: query, mode: "insensitive" as const } },
            { ville: { contains: query, mode: "insensitive" as const } },
            { theme: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const conferences = await prisma.conference.findMany({
    where,
    orderBy: [{ statut: "asc" }, { dateDebut: "desc" }],
    select: {
      id: true,
      slug: true,
      shortName: true,
      titre: true,
      theme: true,
      lieu: true,
      ville: true,
      pays: true,
      format: true,
      organisation: true,
      dateDebut: true,
      dateFin: true,
      capaciteMax: true,
      seulAlerte: true,
      statut: true,
      visibility: true,
      publishedAt: true,
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
    },
  });

  // Articles : agrégat séparé pour éviter un nested count trop profond
  const confIds = conferences.map((c) => c.id);
  const articleCounts = await prisma.articleSession.groupBy({
    by: ["sessionId"],
    where: {
      session: { conferenceId: { in: confIds } },
    },
    _count: { articleId: true },
  });

  // Map sessionId → conférenceId via une seule requête sessions
  const sessions = await prisma.session.findMany({
    where: { conferenceId: { in: confIds } },
    select: { id: true, conferenceId: true },
  });
  const sessionToConf = new Map(sessions.map((s) => [s.id, s.conferenceId]));

  const confArticleMap = new Map<string, number>();
  for (const ac of articleCounts) {
    const confId = sessionToConf.get(ac.sessionId);
    if (confId) {
      confArticleMap.set(confId, (confArticleMap.get(confId) ?? 0) + ac._count.articleId);
    }
  }

  // Articles en attente (PENDING/REVIEWING)
  const pendingCounts = await prisma.articleSession.groupBy({
    by: ["sessionId"],
    where: {
      session: { conferenceId: { in: confIds } },
      article: { statut: { in: ["PENDING", "REVIEWING"] } },
    },
    _count: { articleId: true },
  });
  const confPendingMap = new Map<string, number>();
  for (const pc of pendingCounts) {
    const confId = sessionToConf.get(pc.sessionId);
    if (confId) {
      confPendingMap.set(confId, (confPendingMap.get(confId) ?? 0) + pc._count.articleId);
    }
  }

  return conferences.map((c) => {
    const inscriptions = c._count.inscriptions;
    const fillPercent = c.capaciteMax && c.capaciteMax > 0
      ? Math.min(100, Math.round((inscriptions / c.capaciteMax) * 100))
      : 0;

    return {
      id: c.id,
      slug: c.slug,
      shortName: c.shortName,
      titre: c.titre,
      theme: c.theme,
      lieu: c.lieu,
      ville: c.ville,
      pays: c.pays,
      format: c.format,
      organisation: c.organisation,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin,
      capaciteMax: c.capaciteMax,
      seulAlerte: c.seulAlerte,
      statut: c.statut,
      visibility: c.visibility,
      publishedAt: c.publishedAt,
      sessionCount: c._count.sessions,
      inscriptionCount: inscriptions,
      articleCount: confArticleMap.get(c.id) ?? 0,
      pendingArticleCount: confPendingMap.get(c.id) ?? 0,
      fillPercent,
    };
  });
}

async function fetchKpis(organizerId: string): Promise<PageKpis> {
  const confIds = await prisma.conference
    .findMany({
      where: { organisateurId: organizerId },
      select: { id: true, statut: true },
    });

  const ids = confIds.map((c) => c.id);
  const published = confIds.filter((c) => c.statut === ConferenceStatus.PUBLISHED).length;
  const draft = confIds.filter((c) => c.statut === ConferenceStatus.DRAFT).length;

  const [sessionCount, participantCount, articleCount] = await Promise.all([
    prisma.session.count({ where: { conferenceId: { in: ids } } }),
    prisma.inscription.count({
      where: {
        conferenceId: { in: ids },
        statut: { in: [InscriptionStatus.CONFIRMED, InscriptionStatus.ATTENDED] },
      },
    }),
    prisma.articleSession.count({
      where: { session: { conferenceId: { in: ids } } },
    }),
  ]);

  return {
    total: confIds.length,
    published,
    draft,
    totalSessions: sessionCount,
    totalParticipants: participantCount,
    totalArticles: articleCount,
  };
}

// ─── Composants async (Suspense boundaries) ──────────────────────────────────

async function KpiStripSection({ organizerId }: { organizerId: string }) {
  const kpis = await fetchKpis(organizerId);

  const cards = [
    {
      icon: <Calendar className="h-4 w-4 text-teal-600" />,
      bg: "bg-teal-50",
      value: kpis.total,
      label: "Conférences",
      sub: `${kpis.published} publiées · ${kpis.draft} brouillons`,
    },
    {
      icon: <Layers className="h-4 w-4 text-blue-600" />,
      bg: "bg-blue-50",
      value: kpis.totalSessions,
      label: "Sessions totales",
    },
    {
      icon: <Users className="h-4 w-4 text-indigo-600" />,
      bg: "bg-indigo-50",
      value: kpis.totalParticipants,
      label: "Participants",
    },
    {
      icon: <FileText className="h-4 w-4 text-purple-600" />,
      bg: "bg-purple-50",
      value: kpis.totalArticles,
      label: "Articles reçus",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,.04)]"
        >
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
            {card.icon}
          </span>
          <div className="min-w-0">
            <p className="font-heading text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
            {"sub" in card && card.sub && (
              <p className="mt-0.5 text-[11px] text-slate-400">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-9 w-9 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-10 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function GridSection({
  organizerId,
  statusFilter,
  query,
}: {
  organizerId: string;
  statusFilter: StatusFilter;
  query: string;
}) {
  const conferences = await fetchConferences(organizerId, statusFilter, query);
  return (
    <ConferenceOrganizerGrid
      conferences={conferences}
      statusFilter={statusFilter}
    />
  );
}

function GridSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,.05)]">
      <div className="space-y-px p-0">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
            <div className="h-8 w-8 rounded-lg bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-100" />
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="h-5 w-10 rounded bg-slate-100" />
            <div className="h-4 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ statut?: string; q?: string; modal?: string }>;
}

export default async function MesConferencesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/conferences");
  if (session.user.role !== "ORGANISATEUR") redirect("/");

  const organizerId = session.user.id;
  const sp = await searchParams;

  // Résolution du filtre statut
  const rawStatut = sp.statut?.toUpperCase();
  const statusFilter: StatusFilter = (
    rawStatut === "PUBLISHED" ||
    rawStatut === "DRAFT" ||
    rawStatut === "ARCHIVED" ||
    rawStatut === "CANCELLED"
  )
    ? (rawStatut as StatusFilter)
    : "ALL";

  const query = (sp.q ?? "").trim();
  const activeModal = sp.modal;

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 lg:py-7">
        {/* KPI Strip */}
        <section className="mb-6">
          <Suspense fallback={<KpiStripSkeleton />}>
            <KpiStripSection organizerId={organizerId} />
          </Suspense>
        </section>

        {/* Toolbar */}
        <ConferenceToolbar
          statusFilter={statusFilter}
          defaultQuery={query}
        />

        {/* Table */}
        <section className="mt-4">
          <Suspense key={`${statusFilter}-${query}`} fallback={<GridSkeleton />}>
            <GridSection
              organizerId={organizerId}
              statusFilter={statusFilter}
              query={query}
            />
          </Suspense>
        </section>

        <p className="mt-3 text-center text-xs text-slate-400">
          Cliquez sur une ligne pour afficher le détail de la conférence →
        </p>
      </div>

      {/* Modal création */}
      {activeModal === "create-conf" && <CreateConferenceModal />}
    </>
  );
}