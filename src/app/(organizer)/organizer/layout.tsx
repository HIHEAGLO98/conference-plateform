import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizerProfile } from "@/lib/queries/organizer-dashboard";
import { OrganizerSidebar } from "@/components/organizer/OrganizerSidebar";
import { OrganizerHeader } from "@/components/organizer/OrganizerHeader";

/* 
 * Layout de l'espace Organisateur (dashboard).
 *
 * Responsabilités :
 *   1. Garde d'accès : redirige si non-authentifié ou rôle ≠ ORGANISATEUR/ADMIN.
 *   2. Sidebar fixe à gauche (256px) + Header sticky en haut (60px).
 *   3. Injecte les children dans la zone principale (marge-left 256px).
 *  */

export default async function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Garde d'accès 
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/organizer/dashboard");
  }

  const userRole = session.user.role;
  if (userRole !== "ORGANISATEUR") {
    // Un participant / conférencier qui tenterait d'accéder est renvoyé chez lui.
    redirect("/");
  }

  // 2. Données du layout (profil + compteur confs) 
  const [profile, conferenceCount] = await Promise.all([
    getOrganizerProfile(session.user.id),
    prisma.conference.count({
      where: { organisateurId: session.user.id },
    }),
  ]);

  if (!profile) {
    // Session valide mais user supprimé on force un re-login propre
    redirect("/login");
  }

 
  return (
    <div className="min-h-screen bg-slate-100">
      <OrganizerSidebar
        user={profile}
        conferenceCount={conferenceCount}
      />

      <div className="ml-64 flex min-h-screen flex-col">
        {/* Suspense autour du header pour le breadcrumb dynamique futur */}
        <Suspense
          fallback={
            <div className="h-15 border-b border-slate-200 bg-white" />
          }
        >
          <OrganizerHeader
            breadcrumb={[
              { label: "Espace organisateur", href: "/organizer/dashboard" },
              { label: "Vue d'ensemble" },
            ]}
            user={profile}
          />
          
        </Suspense>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}