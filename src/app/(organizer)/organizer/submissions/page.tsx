import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArticleStatus, ArticleType } from "@/generated/prisma/client";
import { SubmissionToolbar } from "@/components/organizer/submissions/SubmissionToolbar";
import { SubmissionOrganizerGrid } from "@/components/organizer/submissions/SubmissionOrganizerGrid";

export const dynamic = "force-dynamic";

// Modèle de données aplati envoyé à la table TanStack
export interface SubmissionRow {
  id: string;
  titre: string;
  resume: string;
  motsCles: string[];
  coAuthors: string[];
  fileUrl: string | null;
  type: ArticleType;
  statut: ArticleStatus;
  commentaire: string | null;
  submittedAt: Date | null;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    affiliation: string | null;
  };
  conference: {
    id: string;
    titre: string;
    shortName: string | null;
  };
}

export interface SubmissionsKpis {
  total: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
}

type StatusFilter = ArticleStatus | "ALL";

async function fetchSubmissions(
  organizerId: string,
  statusFilter: StatusFilter,
  query: string,
  confId: string
): Promise<SubmissionRow[]> {
  // Construction du filtre de recherche
  const where = {
    sessions: {
      some: {
        session: {
          conference: {
            organisateurId: organizerId,
            ...(confId ? { id: confId } : {}),
          },
        },
      },
    },
    ...(statusFilter !== "ALL" ? { statut: statusFilter } : {}),
    ...(query.trim()
      ? {
          OR: [
            { titre: { contains: query, mode: "insensitive" as const } },
            { resume: { contains: query, mode: "insensitive" as const } },
            { user: { nom: { contains: query, mode: "insensitive" as const } } },
            { user: { prenom: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const articles = await prisma.article.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          affiliation: true,
        },
      },
      sessions: {
        take: 1,
        include: {
          session: {
            include: {
              conference: {
                select: {
                  id: true,
                  titre: true,
                  shortName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Transformation pour simplifier la structure consommée par TanStack Table
  return articles.map((art) => {
    const confRef = art.sessions[0]?.session?.conference;
    return {
      id: art.id,
      titre: art.titre,
      resume: art.resume,
      motsCles: art.motsCles,
      coAuthors: art.coAuthors,
      fileUrl: art.fileUrl,
      type: art.type,
      statut: art.statut,
      commentaire: art.commentaire,
      submittedAt: art.submittedAt,
      user: art.user,
      conference: {
        id: confRef?.id ?? "",
        titre: confRef?.titre ?? "Non assignée",
        shortName: confRef?.shortName ?? null,
      },
    };
  });
}

async function fetchLayoutData1(organizerId: string) {
  const [conferences, articles] = await Promise.all([
    prisma.conference.findMany({
      where: { ...prisma.conference.fields?.organisateurId ? { organisateurId: organizerId } : { organisatorId: organizerId } as any },
      select: { id: true, titre: true, shortName: true },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.article.findMany({
      where: { sessions: { some: { session: { conference: { ...prisma.conference.fields?.organisateurId ? { organizerId: organizerId } : { organisateurId: organizerId } as any } } } } },
      select: { statut: true },
    }),
  ]);

  const kpis: SubmissionsKpis = {
    total: articles.length,
    pendingReview: articles.filter((a) => a.statut === "PENDING" || a.statut === "REVIEWING").length,
    accepted: articles.filter((a) => a.statut === "ACCEPTED").length,
    rejected: articles.filter((a) => a.statut === "REJECTED").length,
  };

  return { conferences, kpis };
}
async function fetchLayoutData(organizerId: string) {
  const [conferences, articles] = await Promise.all([
    prisma.conference.findMany({
      where: { organisateurId: organizerId }, // Déjà correct ici
      select: { id: true, titre: true, shortName: true },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.article.findMany({
      // 🎯 CORRECTION ICI : Remplacement de organizerId par organisateurId
      where: { 
        sessions: { 
          some: { 
            session: { 
              conference: { 
                organisateurId: organizerId 
              } 
            } 
          } 
        } 
      },
      select: { statut: true },
    }),
  ]);

  const kpis: SubmissionsKpis = {
    total: articles.length,
    pendingReview: articles.filter((a) => a.statut === "PENDING" || a.statut === "REVIEWING").length,
    accepted: articles.filter((a) => a.statut === "ACCEPTED").length,
    rejected: articles.filter((a) => a.statut === "REJECTED").length,
  };

  return { conferences, kpis };
}

interface PageProps {
  searchParams: Promise<{ statut?: string; q?: string; confId?: string }>;
}

export default async function OrganizerSubmissionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/organizer/submissions");
  if (session.user.role !== "ORGANISATEUR") redirect("/");

  const organizerId = session.user.id;
  const sp = await searchParams;

  const rawStatut = sp.statut?.toUpperCase();
  const statusFilter: StatusFilter = [
    "DRAFT", "PENDING", "REVIEWING", "ACCEPTED", "REJECTED", "WITHDRAWN"
  ].includes(rawStatut ?? "")
    ? (rawStatut as StatusFilter)
    : "ALL";

  const query = (sp.q ?? "").trim();
  const selectedConfId = sp.confId ?? "";

  const { conferences, kpis } = await fetchLayoutData(organizerId);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 lg:py-7">
      {/* Grille de statistiques éditoriales */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Articles reçus", value: kpis.total, bg: "bg-teal-50" },
          { label: "En attente d'évaluation", value: kpis.pendingReview, bg: "bg-amber-50" },
          { label: "Acceptés", value: kpis.accepted, bg: "bg-emerald-50" },
          { label: "Refusés", value: kpis.rejected, bg: "bg-rose-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Barre d'outils de filtrage */}
      <SubmissionToolbar
        statusFilter={statusFilter}
        defaultQuery={query}
        conferences={conferences}
        selectedConfId={selectedConfId}
      />

      {/* Rendu asynchrone de la table */}
      <section className="mt-4">
        <Suspense
          key={`${statusFilter}-${query}-${selectedConfId}`}
          fallback={<SubmissionsGridSkeleton />}
        >
          <GridDataWrapper
            organizerId={organizerId}
            statusFilter={statusFilter}
            query={query}
            confId={selectedConfId}
          />
        </Suspense>
      </section>
    </div>
  );
}

async function GridDataWrapper({
  organizerId,
  statusFilter,
  query,
  confId,
}: {
  organizerId: string;
  statusFilter: StatusFilter;
  query: string;
  confId: string;
}) {
  const submissions = await fetchSubmissions(organizerId, statusFilter, query, confId);
  return <SubmissionOrganizerGrid submissions={submissions} statusFilter={statusFilter} />;
}

function SubmissionsGridSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-px p-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div className="h-4 w-4 rounded bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}