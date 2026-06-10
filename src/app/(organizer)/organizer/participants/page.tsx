import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InscriptionStatus, InscriptionType } from "@generated/prisma/client";
import { ParticipantToolbar } from "@/components/organizer/participants/ParticipantToolbar";
import { ParticipantOrganizerGrid } from "@/components/organizer/participants/ParticipantOrganizerGrid";

export const dynamic = "force-dynamic";

// Structure de données aplatie et optimisée pour TanStack Table
export interface ParticipantRow {
  id: string; // ID de l'inscription
  dateInscription: Date;
  type: InscriptionType;
  statut: InscriptionStatus;
  checkedInAt: Date | null;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    affiliation: string | null;
    pays: string | null;
  };
  conference: {
    id: string;
    titre: string;
    shortName: string | null;
  };
}

export interface ParticipantsKpis {
  totalInscriptions: number;
  confirmed: number;
  checkedIn: number;
  pending: number;
}

type StatusFilter = InscriptionStatus | "ALL";

async function fetchParticipants(
  organizerId: string,
  statusFilter: StatusFilter,
  query: string,
  confId: string
): Promise<ParticipantRow[]> {
  const where = {
    conference: {
      organisateurId: organizerId,
      ...(confId ? { id: confId } : {}),
    },
    ...(statusFilter !== "ALL" ? { statut: statusFilter } : {}),
    ...(query.trim()
      ? {
          OR: [
            { user: { nom: { contains: query, mode: "insensitive" as const } } },
            { user: { prenom: { contains: query, mode: "insensitive" as const } } },
            { user: { email: { contains: query, mode: "insensitive" as const } } },
            { user: { affiliation: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  return await prisma.inscription.findMany({
    where,
    orderBy: { dateInscription: "desc" },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          affiliation: true,
          pays: true,
        },
      },
      conference: {
        select: {
          id: true,
          titre: true,
          shortName: true,
        },
      },
    },
  });
}

async function fetchLayoutData(organizerId: string) {
  const [conferences, inscriptions] = await Promise.all([
    prisma.conference.findMany({
      where: { organisateurId: organizerId },
      select: { id: true, titre: true, shortName: true },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.inscription.findMany({
      where: { conference: { organisateurId: organizerId } },
      select: { statut: true, checkedInAt: true },
    }),
  ]);

  const kpis: ParticipantsKpis = {
    totalInscriptions: inscriptions.length,
    confirmed: inscriptions.filter((i) => i.statut === "CONFIRMED").length,
    checkedIn: inscriptions.filter((i) => i.checkedInAt !== null).length,
    pending: inscriptions.filter((i) => i.statut === "PENDING").length,
  };

  return { conferences, kpis };
}

interface PageProps {
  searchParams: Promise<{ statut?: string; q?: string; confId?: string }>;
}

export default async function OrganizerParticipantsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/organizer/participants");
  if (session.user.role !== "ORGANISATEUR") redirect("/");

  const organizerId = session.user.id;
  const sp = await searchParams;

  const rawStatut = sp.statut?.toUpperCase();
  const statusFilter: StatusFilter = [
    "PENDING", "CONFIRMED", "CANCELLED", "ATTENDED"
  ].includes(rawStatut ?? "")
    ? (rawStatut as StatusFilter)
    : "ALL";

  const query = (sp.q ?? "").trim();
  const selectedConfId = sp.confId ?? "";

  const { conferences, kpis } = await fetchLayoutData(organizerId);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 lg:py-7">
      {/* Grille KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Inscriptions totales", value: kpis.totalInscriptions, bg: "bg-teal-50" },
          { label: "Confirmées", value: kpis.confirmed, bg: "bg-emerald-50" },
          { label: "Présences scannées (Live)", value: kpis.checkedIn, bg: "bg-blue-50" },
          { label: "En attente", value: kpis.pending, bg: "bg-amber-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Barre d'outils de filtrage */}
      <ParticipantToolbar
        statusFilter={statusFilter}
        defaultQuery={query}
        conferences={conferences}
        selectedConfId={selectedConfId}
      />

      {/* Section Table avec Suspense Boundary */}
      <section className="mt-4">
        <Suspense
          key={`${statusFilter}-${query}-${selectedConfId}`}
          fallback={<ParticipantsGridSkeleton />}
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
  const participants = await fetchParticipants(organizerId, statusFilter, query, confId);
  return <ParticipantOrganizerGrid participants={participants} statusFilter={statusFilter} />;
}

function ParticipantsGridSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-px p-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div className="h-4 w-4 rounded bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-1/4 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="h-5 w-24 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}