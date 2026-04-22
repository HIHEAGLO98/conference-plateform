import {
  AlertTriangle,
  Calendar,
  FileText,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";

import type { OrganizerKpis } from "@/lib/queries/organizer-dashboard";

/* 
 * KpiGrid — Server Component (pas d'interactivité).
 *
 * 4 cartes KPI : Conférences · Sessions · Participants · Articles.
 * Chaque carte = icône colorée + chiffre principal + libellé + sous-texte.
 *  */

interface KpiGridProps {
  kpis: OrganizerKpis;
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        icon={<Calendar className="h-4 w-4 text-teal-600" />}
        iconBg="bg-teal-50"
        value={kpis.conferences.total}
        label="Conférences créées"
        sub={`${kpis.conferences.published} publiées · ${kpis.conferences.draft} brouillon${kpis.conferences.draft > 1 ? "s" : ""}`}
        pill={
          kpis.conferences.draft > 0
            ? {
                text: `+${kpis.conferences.draft} en cours`,
                tone: "teal",
              }
            : undefined
        }
      />
      <KpiCard
        icon={<Layers className="h-4 w-4 text-blue-600" />}
        iconBg="bg-blue-50"
        value={kpis.sessions.total}
        label="Sessions au total"
        sub={
          kpis.conferences.total > 0
            ? `liées à ${kpis.conferences.total} conférence${kpis.conferences.total > 1 ? "s" : ""}`
            : "Aucune conférence"
        }
        pill={
          kpis.sessions.almostFull > 0
            ? {
                text: `⚠ ${kpis.sessions.almostFull} presque pleine${kpis.sessions.almostFull > 1 ? "s" : ""}`,
                tone: "amber",
                icon: <AlertTriangle className="h-3 w-3" />,
              }
            : undefined
        }
      />
      <KpiCard
        icon={<Users className="h-4 w-4 text-indigo-600" />}
        iconBg="bg-indigo-50"
        value={kpis.participants.total}
        label="Participants inscrits"
        sub="sur l'ensemble des conférences"
        pill={
          kpis.participants.todayNew > 0
            ? {
                text: `+${kpis.participants.todayNew} aujourd'hui`,
                tone: "emerald",
                icon: <TrendingUp className="h-3 w-3" />,
              }
            : undefined
        }
      />
      <KpiCard
        icon={<FileText className="h-4 w-4 text-purple-600" />}
        iconBg="bg-purple-50"
        value={kpis.articles.total}
        label="Articles reçus"
        sub={
          kpis.articles.pending > 0
            ? `${kpis.articles.pending} en attente d'évaluation`
            : "aucun en attente"
        }
        pill={
          kpis.articles.thisWeekNew > 0
            ? {
                text: `+${kpis.articles.thisWeekNew} cette semaine`,
                tone: "blue",
              }
            : undefined
        }
      />
    </div>
  );
}

/*  Sub-components  */

type PillTone = "teal" | "amber" | "emerald" | "blue";

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  sub: string;
  pill?: {
    text: string;
    tone: PillTone;
    icon?: React.ReactNode;
  };
}

const PILL_TONES: Record<PillTone, string> = {
  teal: "bg-teal-50 text-teal-700",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
  blue: "text-blue-600",
};

function KpiCard({ icon, iconBg, value, label, sub, pill }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </span>
        {pill && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${PILL_TONES[pill.tone]}`}
          >
            {pill.icon}
            {pill.text}
          </span>
        )}
      </div>
      <p className="font-heading text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}