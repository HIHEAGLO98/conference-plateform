import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Users, FileText, Layers, TrendingUp } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatsToolbar } from "@/components/organizer/stats/StatsToolbar";
import {
  RegistrationsLineChart,
  ProfilesPieChart,
  FunnelBarChart,
} from "@/components/organizer/stats/StatsCharts";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ confId?: string }>;
}

async function fetchStatsData(organizerId: string, confId?: string) {
  // 1. Liste des conférences pour le filtre
  const conferences = await prisma.conference.findMany({
    where: { organisateurId: organizerId },
    select: { id: true, titre: true, shortName: true },
    orderBy: { dateDebut: "desc" },
  });

  // Clause WHERE commune
  const baseWhere = {
    organisateurId: organizerId,
    ...(confId ? { id: confId } : {}),
  };

  // 2. Fetch des agrégats (En parallèle pour la performance)
  const [inscriptions, articles, sessions] = await Promise.all([
    // Toutes les inscriptions liées aux conférences filtrées
    prisma.inscription.findMany({
      where: { conference: baseWhere, statut: { in: ["CONFIRMED", "ATTENDED"] } },
      select: { dateInscription: true, type: true },
    }),
    // Tous les articles liés aux sessions des conférences filtrées
    prisma.article.findMany({
      where: { sessions: { some: { session: { conference: baseWhere } } } },
      select: { statut: true },
    }),
    // Les sessions
    prisma.session.count({
      where: { conference: baseWhere },
    }),
  ]);

  // --- TRAITEMENT DES DONNÉES POUR LES GRAPHIQUES ---

  // KPI 1 : Acceptation globale
  const totalArticles = articles.length;
  const acceptedArticles = articles.filter(a => a.statut === "ACCEPTED").length;
  const acceptanceRate = totalArticles > 0 ? Math.round((acceptedArticles / totalArticles) * 100) : 0;

  // Donut Chart : Inscriptions par type
  const typeCount = inscriptions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

  // Bar Chart (Entonnoir) : Statuts des articles
  const statusCount = articles.reduce((acc, curr) => {
    acc[curr.statut] = (acc[curr.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const funnelData = [
    { name: "Reçus", value: totalArticles, color: "#94a3b8" }, // slate-400
    { name: "En révision", value: (statusCount["REVIEWING"] || 0) + (statusCount["PENDING"] || 0), color: "#6366f1" }, // indigo-500
    { name: "Acceptés", value: statusCount["ACCEPTED"] || 0, color: "#0d9488" }, // teal-600
  ];

  // Line Chart : Simulation d'évolution temporelle (Regroupement par jour)
  // Note: On regroupe en JS car Prisma SQLite/Postgres n'ont pas la même syntaxe de GROUP BY DATE
  const datesCount = inscriptions.reduce((acc, curr) => {
    const dateStr = curr.dateInscription.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // On crée un tableau cumulatif
  let cumul = 0;
  const lineData = Object.entries(datesCount)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Tri simpliste
    .map(([date, count]) => {
      cumul += count;
      return { date, inscrits: cumul };
    });

  return {
    conferences,
    kpis: {
      inscriptions: inscriptions.length,
      sessions: sessions,
      acceptanceRate,
      articles: totalArticles,
    },
    charts: { pieData, funnelData, lineData },
  };
}

export default async function OrganizerStatsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ORGANISATEUR") redirect("/");

  const sp = await searchParams;
  const confId = sp.confId;

  const data = await fetchStatsData(session.user.id, confId);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-8 lg:py-7">
      
      {/* Barre d'outils et Contexte */}
      <StatsToolbar selectedConfId={confId ?? ""} conferences={data.conferences} />

      {/* KPI STRIP */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Inscriptions Confirmées</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{data.kpis.inscriptions}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Soumissions (Total)</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{data.kpis.articles}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Sessions Programmées</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{data.kpis.sessions}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Taux d'Acceptation</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">{data.kpis.acceptanceRate}%</p>
        </div>
      </div>

      {/* GRILLE D'ANALYSES CROISÉES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* COLONNE GAUCHE : Logistique */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="mb-6 font-heading text-lg font-bold text-slate-900">Rythme des inscriptions</h3>
            {data.charts.lineData.length > 0 ? (
               <RegistrationsLineChart data={data.charts.lineData} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Pas assez de données pour générer la courbe.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="mb-6 font-heading text-lg font-bold text-slate-900">Profils des participants</h3>
            {data.charts.pieData.length > 0 ? (
               <ProfilesPieChart data={data.charts.pieData} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Aucun participant enregistré.</p>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : Contenu Scientifique */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="mb-6 font-heading text-lg font-bold text-slate-900">Entonnoir Éditorial</h3>
            <p className="mb-6 text-sm text-slate-500">
              Sur {data.kpis.articles} articles reçus au total, voici l'état d'avancement des évaluations par votre comité de lecture.
            </p>
            {data.charts.funnelData[0].value > 0 ? (
               <FunnelBarChart data={data.charts.funnelData} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Aucune soumission à évaluer.</p>
            )}
          </div>

          {/* Widget Bonus : Informations complémentaires */}
          <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-6">
            <h3 className="mb-2 font-heading text-lg font-bold text-teal-900">Astuce d'Organisation</h3>
            <p className="text-sm leading-relaxed text-teal-800">
              Le taux d'acceptation idéal pour maintenir un haut niveau scientifique se situe généralement entre <strong>20% et 35%</strong>. 
              Si votre taux dépasse les 50%, envisagez de diviser votre événement en plusieurs sous-tracks ou d'augmenter le niveau d'exigence des relecteurs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}