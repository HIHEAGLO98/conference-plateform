import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SessionType } from "@generated/prisma/client";
import { SessionToolbar } from "@/components/organizer/sessions/SessionToolbar";
import { SessionOrganizerGrid } from "@/components/organizer/sessions/SessionOrganizerGrid";

export const dynamic = "force-dynamic";

// Type aligné sur le select Prisma pour la grille
export interface SessionRow {
  id: string;
  titre: string;
  description: string | null;
  type: SessionType;
  salle: string | null;
  intervenants: string[];
  horaireDebut: Date;
  horaireFin: Date;
  capacite: number;
  conference: {
    id: string;
    titre: string;
    shortName: string | null;
  };
}

export interface SessionsKpis {
  total: number;
  keynotes: number;
  workshops: number;
  talks: number;
}

type TypeFilter = SessionType | "ALL";

// Fetcher pour charger les sessions filtrées
async function fetchSessions(
  organizerId: string,
  typeFilter: TypeFilter,
  query: string,
  confId: string
): Promise<SessionRow[]> {
  const where = {
    conference: {
      organisateurId: organizerId,
      ...(confId ? { id: confId } : {}),
    },
    ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
    ...(query.trim()
      ? {
          OR: [
            { titre: { contains: query, mode: "insensitive" as const } },
            { salle: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  return await prisma.session.findMany({
    where,
    orderBy: { horaireDebut: "asc" },
    include: {
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

// Fetcher pour les compteurs KPI et la liste des conférences (pour le filtre Select)
async function fetchLayoutData(organizerId: string) {
  const [conferences, sessions] = await Promise.all([
    prisma.conference.findMany({
      where: { organisateurId: organizerId },
      select: { id: true, titre: true, shortName: true },
      orderBy: { dateDebut: "desc" },
    }),
    prisma.session.findMany({
      where: { conference: { organisateurId: organizerId } },
      select: { type: true },
    }),
  ]);

  const kpis: SessionsKpis = {
    total: sessions.length,
    keynotes: sessions.filter((s) => s.type === "KEYNOTE").length,
    workshops: sessions.filter((s) => s.type === "WORKSHOP").length,
    talks: sessions.filter((s) => s.type === "TALK").length,
  };

  return { conferences, kpis };
}

interface PageProps {
  searchParams: Promise<{ type?: string; q?: string; confId?: string }>;
}

export default async function OrganizerSessionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/organizer/sessions");
  if (session.user.role !== "ORGANISATEUR") redirect("/");

  const organizerId = session.user.id;
  const sp = await searchParams;

  // Résolution et nettoyage du filtre d'Enum
  const rawType = sp.type?.toUpperCase();
  const typeFilter: TypeFilter = [
    "KEYNOTE", "WORKSHOP", "PANEL", "TALK", "POSTER", "BREAK"
  ].includes(rawType ?? "")
    ? (rawType as TypeFilter)
    : "ALL";

  const query = (sp.q ?? "").trim();
  const selectedConfId = sp.confId ?? "";

  const { conferences, kpis } = await fetchLayoutData(organizerId);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 lg:py-7">
      {/* KPI Section */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Sessions totales", value: kpis.total, bg: "bg-teal-50", text: "text-teal-600" },
          { label: "Keynotes", value: kpis.keynotes, bg: "bg-purple-50", text: "text-purple-600" },
          { label: "Workshops", value: kpis.workshops, bg: "bg-orange-50", text: "text-orange-600" },
          { label: "Talks / Présentations", value: kpis.talks, bg: "bg-blue-50", text: "text-blue-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <SessionToolbar
        typeFilter={typeFilter}
        defaultQuery={query}
        conferences={conferences}
        selectedConfId={selectedConfId}
      />

      {/* Suspense Container avec Skeleton pour éviter les blocages de rendu d'URL */}
      <section className="mt-4">
        <Suspense
          key={`${typeFilter}-${query}-${selectedConfId}`}
          fallback={<SessionsGridSkeleton />}
        >
          <GridDataWrapper
            organizerId={organizerId}
            typeFilter={typeFilter}
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
  typeFilter,
  query,
  confId,
}: {
  organizerId: string;
  typeFilter: TypeFilter;
  query: string;
  confId: string;
}) {
  const sessions = await fetchSessions(organizerId, typeFilter, query, confId);
  return <SessionOrganizerGrid sessions={sessions} typeFilter={typeFilter} />;
}

function SessionsGridSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-px p-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div className="h-4 w-4 rounded bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-1/4 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="h-6 w-16 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}