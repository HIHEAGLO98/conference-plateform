import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RegisterFlow } from "@/components/conference/Registerflow";

/*
 * Page d'inscription à une conférence.
 * Route : /conferences/[slug]/register?tier=FREE|STUDENT|STANDARD|PREMIUM
 *
 * Responsabilités (Server Component) :
 *   1. Garde d'authentification → redirige vers /login si non connecté
 *   2. Vérifie que la conférence existe et est publiée
 *   3. Vérifie que le participant n'est pas déjà inscrit
 *   4. Passe les données au composant client RegisterFlow
 */

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tier?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const conference = await prisma.conference.findUnique({
    where: { slug },
    select: { titre: true, shortName: true },
  });
  if (!conference) return { title: "Inscription · ConferenceHub" };
  return {
    title: `Inscription - ${conference.shortName ?? conference.titre} · ConferenceHub`,
    robots: { index: false },
  };
}

export default async function RegisterPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  //  1. Authentification 
  const session = await auth();
  if (!session?.user?.id) {
    // Redirige vers le login avec retour sur la page d'inscription
    const callbackUrl = encodeURIComponent(
      `/conferences/${slug}/register${sp.tier ? `?tier=${sp.tier}` : ""}`
    );
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  //  2. Données participant 
  const [user, conference] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nom: true, prenom: true, email: true },
    }),
    prisma.conference.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, titre: true, shortName: true,
        description: true, lieu: true, ville: true, pays: true,
        dateDebut: true, dateFin: true, capaciteMax: true, statut: true,
        organisateur: {
          select: { nom: true, prenom: true, affiliation: true },
        },
      },
    }),
  ]);

  //  3. Vérifications 
  if (!conference || conference.statut !== "PUBLISHED") notFound();
  if (!user) redirect("/login");

  // Conférence terminée → retour à la page conférence
  if (new Date(conference.dateFin) < new Date()) {
    redirect(`/conferences/${slug}`);
  }

  // Déjà inscrit → on redirige vers la page conférence avec un message
  const existing = await prisma.inscription.findUnique({
    where: { userId_conferenceId: { userId: session.user.id, conferenceId: conference.id } },
    select: { id: true },
  });
//   if (existing) {
//     redirect(`/conferences/${slug}?already_registered=1`);
//   }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        {/* Header de page */}
        <div className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Inscription
            </p>
            <h1 className="mt-1 font-heading text-xl font-bold text-slate-900">
              {conference.shortName ?? conference.titre}
            </h1>
          </div>
        </div>

        {/* Flow client */}
        <RegisterFlow
          conference={{
            id: conference.id,
            slug: conference.slug,
            titre: conference.titre,
            shortName: conference.shortName,
            description: conference.description,
            lieu: conference.lieu,
            ville: conference.ville,
            pays: conference.pays,
            dateDebut: conference.dateDebut,
            dateFin: conference.dateFin,
            capaciteMax: conference.capaciteMax,
            organisateur: conference.organisateur,
          }}
          participant={{
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
          }}
        />
      </main>
      <Footer />
    </>
  );
}