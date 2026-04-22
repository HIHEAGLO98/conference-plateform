import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, Calendar, FileText, Layers, Users } from "lucide-react";

import { auth } from "@/auth";
import {
  getOrganizerConferences,
  getOrganizerConferencesLite,
  getOrganizerKpis,
  getOrganizerProfile,
  getOrganizerRecentInscriptions,
} from "@/lib/queries/organizer-dashboard";
import { KpiGrid } from "@/components/organizer/KpiGrid";
import { ConferenceHierarchy } from "@/components/organizer/ConferenceHierarchy";
import { QuickActionsSidebar } from "@/components/organizer/QuickActionsSidebar";
import { CreateConferenceModal } from "@/components/modals/CreateConferenceModal";
import { CreateSessionModal } from "@/components/modals/CreateSessionModal";

/* 
 * Page du dashboard organisateur — Server Component.
 * Sécurité : toutes les queries sont filtrées par `organizerId` dans
 * `organizer-dashboard.ts` (cf. `where: { organisateurId }`).
 *  */

interface DashboardPageProps {
  searchParams: Promise<{ modal?: string; conf?: string }>;
}

export default async function OrganizerDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const organizerId = session.user.id;
  const sp = await searchParams;
  const activeModal = sp.modal;

  // Profil récupéré ici aussi pour la bannière (prenom). Petite duplication
  // assumée avec le layout pour éviter un prop-drilling inutile.
  const profile = await getOrganizerProfile(organizerId);
  const displayName = profile?.prenom?.split(" ")[0] ?? "Organisateur";

  return (
    <>
      <div className="mx-auto max-w-[1360px] px-6 py-6 lg:px-10 lg:py-8">
        {/*  Welcome banner  */}
        <WelcomeBanner firstName={displayName} />

        {/*  KPI Grid  */}
        <section className="mb-7">
          <Suspense fallback={<KpiGridSkeleton />}>
            <KpiSection organizerId={organizerId} />
          </Suspense>
        </section>

        {/* ═══ Main layout 2 colonnes : hiérarchie + sidebar actions ═══ */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <SectionHeader
              title="Mes conférences & sessions"
              subtitle="Vue hiérarchique de votre contenu"
            />
            <Suspense fallback={<HierarchySkeleton />}>
              <ConferenceHierarchySection organizerId={organizerId} />
            </Suspense>
          </section>

          <aside>
            <Suspense fallback={<SidebarSkeleton />}>
              <SidebarSection organizerId={organizerId} />
            </Suspense>
          </aside>
        </div>

        {/* ═══ Alertes publication (brouillons) ═════════════════════════ */}
        <Suspense fallback={null}>
          <DraftAlertSection organizerId={organizerId} />
        </Suspense>
      </div>

      {/* ═══ Modals URL-driven ═════════════════════════════════════════ */}
      {activeModal === "create-conf" && <CreateConferenceModal />}
      {activeModal === "create-session" && (
        <Suspense fallback={null}>
          <CreateSessionModalLoader organizerId={organizerId} />
        </Suspense>
      )}
    </>
  );
}

/* 
 * Sous-composants async pour les Suspense boundaries
 *
 * Chacun fetch ses propres données et reste indépendant des autres → les blocs
 * s'affichent dans l'ordre où Prisma répond.
 *  */

async function KpiSection({ organizerId }: { organizerId: string }) {
  const kpis = await getOrganizerKpis(organizerId);
  return <KpiGrid kpis={kpis} />;
}

async function ConferenceHierarchySection({
  organizerId,
}: {
  organizerId: string;
}) {
  const conferences = await getOrganizerConferences(organizerId);
  return <ConferenceHierarchy conferences={conferences} />;
}

async function SidebarSection({ organizerId }: { organizerId: string }) {
  const recent = await getOrganizerRecentInscriptions(organizerId);
  return <QuickActionsSidebar recentInscriptions={recent} />;
}

async function CreateSessionModalLoader({
  organizerId,
}: {
  organizerId: string;
}) {
  const conferences = await getOrganizerConferencesLite(organizerId);
  return <CreateSessionModal conferences={conferences} />;
}

/** Alerte "X brouillon(s) prêt(s) à être publié(s)" — en bas de page. */
async function DraftAlertSection({ organizerId }: { organizerId: string }) {
  const kpis = await getOrganizerKpis(organizerId);
  if (kpis.conferences.draft === 0) return null;
  return (
    <aside className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <AlertCircle className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-900">
          {kpis.conferences.draft} conférence
          {kpis.conferences.draft > 1 ? "s" : ""} en brouillon
        </p>
        <p className="mt-0.5 text-xs text-amber-800">
          Pensez à publier vos conférences pour qu'elles apparaissent sur le
          portail public.
        </p>
      </div>
      <Link
        href="/dashboard/conferences?statut=DRAFT"
        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Gérer les brouillons
      </Link>
    </aside>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Presentational sub-components
 * ────────────────────────────────────────────────────────────────────────── */

function WelcomeBanner({ firstName }: { firstName: string }) {
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return (
    <section className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-600 to-teal-700 p-6 text-white shadow-[0_4px_20px_rgba(20,184,166,0.25)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-100/80">
            {today}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-bold">
            Bonjour {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-teal-50/90">
            Voici un aperçu de l'activité de vos conférences et sessions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="?modal=create-conf"
            scroll={false}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Calendar className="h-4 w-4" />
            Nouvelle conférence
          </Link>
          <Link
            href="?modal=create-session"
            scroll={false}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
          >
            <Layers className="h-4 w-4" />
            Ajouter une session
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="font-heading text-lg font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
    </header>
  );
}

/* 
 * Skeletons — placeholders pendant que Suspense attend les données
 *  */

function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[Calendar, Layers, Users, FileText].map((Icon, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
              <Icon className="h-4 w-4" />
            </span>
            <div className="h-4 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="h-7 w-12 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
          <div className="mt-1 h-3 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function HierarchySkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-64 rounded bg-slate-200" />
                <div className="h-3 w-40 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="space-y-2 border-t border-slate-100 p-4">
            {[0, 1, 2].map((j) => (
              <div
                key={j}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-48 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 h-4 w-24 rounded bg-slate-200" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 h-4 w-32 rounded bg-slate-200" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-24 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}