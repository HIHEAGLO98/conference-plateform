import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Calendar,
  Download,
  Mail,
  Share2,
} from "lucide-react";

import { getConferenceBySlug } from "@/lib/queries/conference-detail";
import { ConferenceHero } from "@/components/conference/ConferenceHero";
import { StickyNav } from "@/components/conference/StickyNav";
import { AboutSection } from "@/components/conference/AboutSection";
import { ProgramSection } from "@/components/conference/ProgramSection";
import {SpeakersSection} from "@/components/conference/SpeakersSection";
import { extractSpeakers } from "@/lib/utils/speakers";
import { VenueSection } from "@/components/conference/VenueSection";
import { FaqSection } from "@/components/conference/FaqSection";
import { RegistrationSidebar } from "@/components/conference/RegistrationSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* 
 * Page — /conferences/[slug]
 *
 * Server Component : toute la donnée est résolue côté serveur via Prisma,
 * puis passée en props aux composants (client ou server selon les cas).
 *  */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);

  if (!conference) {
    return {
      title: "Conférence introuvable · ConferenceHub",
      robots: { index: false, follow: false },
    };
  }

  const displayName = conference.shortName ?? conference.titre;
  const description = conference.description.slice(0, 160);

  return {
    title: `${displayName} · ConferenceHub`,
    description,
    openGraph: {
      title: `${displayName} - ${conference.titre}`,
      description,
      type: "website",
      images: conference.bannerUrl ? [conference.bannerUrl] : undefined,
    },
  };
}

export default async function ConferenceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);

  if (!conference) notFound();

  const now = new Date();
  const daysUntilStart = Math.ceil(
    (conference.dateDebut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isUpcoming = conference.dateDebut > now;
  const showDeadlineAlert = isUpcoming && daysUntilStart <= 30;

  // Dérivation des intervenants depuis les sessions (pas de modèle Speaker en DB).
  const speakers = extractSpeakers(conference.sessions);

  return (
    <>
        <Navbar />
        <main className="min-h-screen bg-slate-50">
        {/*  Breadcrumb  */}
        <nav
            aria-label="Fil d'Ariane"
            className="border-b border-slate-100 bg-white"
        >
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8">
            <ol className="flex items-center gap-2 text-xs text-slate-500">
                <li>
                <Link href="/" className="font-medium hover:text-blue-600">
                    Accueil
                </Link>
                </li>
                <li className="text-slate-300" aria-hidden>
                ›
                </li>
                <li>
                <Link href="/" className="font-medium hover:text-blue-600">
                    Conférences
                </Link>
                </li>
                <li className="text-slate-300" aria-hidden>
                ›
                </li>
                <li>
                <span className="font-semibold text-slate-800">
                    {conference.shortName ?? conference.titre}
                </span>
                </li>
            </ol>
            </div>
        </nav>

        {/*  Hero  */}
        <ConferenceHero conference={conference} />

        {/*  Sticky section nav (scroll-spy + smooth scroll)  */}
        <StickyNav />

        {/*  Main 2-col layout  */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
            <div className="flex flex-col items-start gap-8 lg:flex-row">
            {/* LEFT CONTENT COL */}
            <div className="min-w-0 flex-1 space-y-6">
                {/* Deadline alert */}
                {showDeadlineAlert && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                    <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">
                        Début de la conférence dans {daysUntilStart}{" "}
                        {daysUntilStart > 1 ? "jours" : "jour"}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">
                        Inscription recommandée rapidement - la jauge se remplit
                        vite.
                    </p>
                    </div>
                </div>
                )}

                {/* À propos */}
                <AboutSection
                description={conference.description}
                theme={conference.theme}
                />

                {/* Chiffres clés */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                    value={Math.max(
                    1,
                    Math.ceil(
                        (conference.dateFin.getTime() -
                        conference.dateDebut.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                    ).toString()}
                    label="Jours de conférence"
                />
                <StatCard
                    value={conference._count.sessions.toString()}
                    label="Sessions planifiées"
                />
                <StatCard
                    value={conference._count.inscriptions.toString()}
                    label="Inscrits"
                />
                <StatCard
                    value={
                    conference.capaciteMax
                        ? conference.capaciteMax.toString()
                        : "∞"
                    }
                    label="Capacité"
                />
                </div>

                {/* Programme */}
                <ProgramSection
                sessions={conference.sessions}
                dateDebut={conference.dateDebut}
                dateFin={conference.dateFin}
                />

                {/* Intervenants (dérivés de Session.presenter) */}
                <SpeakersSection speakers={speakers} />

                {/* Lieu */}
                <VenueSection
                lieu={conference.lieu}
                websiteUrl={conference.websiteUrl}
                organisation={conference.organisation}
                />

                {/* FAQ */}
                <FaqSection faqs={conference.faqs} />
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="w-full flex-shrink-0 lg:w-80 xl:w-96">
                <div className="sticky top-36 space-y-4">
                <RegistrationSidebar
                    conferenceId={conference.id}
                    slug={conference.slug}
                    inscriptionsCount={conference._count.inscriptions}
                    capaciteMax={conference.capaciteMax}
                    dateFin={conference.dateFin}
                />

                {/* Actions rapides */}
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions rapides
                    </p>
                    <QuickAction
                    icon={<Calendar className="h-4 w-4 text-slate-500" />}
                    label="Ajouter à mon calendrier"
                    />
                    <QuickAction
                    icon={<Download className="h-4 w-4 text-slate-500" />}
                    label="Télécharger le programme (PDF)"
                    />
                    <QuickAction
                    icon={<Mail className="h-4 w-4 text-slate-500" />}
                    label="Contacter les organisateurs"
                    />
                    <QuickAction
                    icon={<Share2 className="h-4 w-4 text-slate-500" />}
                    label="Partager la conférence"
                    />
                </div>

                {/* Organisateurs */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Organisé par
                    </p>
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 font-heading text-xs font-bold text-blue-700">
                        {(conference.organisateur.prenom[0] ?? "") +
                        (conference.organisateur.nom[0] ?? "")}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                        {conference.organisateur.prenom}{" "}
                        {conference.organisateur.nom}
                        </p>
                        {conference.organisateur.affiliation && (
                        <p className="truncate text-xs text-slate-400">
                            {conference.organisateur.affiliation}
                        </p>
                        )}
                    </div>
                    </div>
                    {conference.organisation && (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                        Sous l&apos;égide de{" "}
                        <span className="font-medium text-slate-700">
                        {conference.organisation}
                        </span>
                    </p>
                    )}
                </div>
                </div>
            </aside>
            </div>
        </div>
        </main>
        <Footer />  
    </>
  );
}

/* 
 * Sub-components privés
 *  */

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="font-heading text-2xl font-bold text-blue-700">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function QuickAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
        {icon}
      </span>
      {label}
    </button>
  );
}