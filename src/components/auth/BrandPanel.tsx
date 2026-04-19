import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  Users,
  Presentation,
} from "lucide-react";

/**
 * Panel gauche (Server Component — statique, zéro JS envoyé au client).
 * Reproduit fidèlement le brand panel de la maquette auth.html.
 */
export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 p-10 lg:flex lg:w-5/12 xl:w-[42%]">
      {/* Décors */}
      <div
        aria-hidden
        className="absolute right-0 top-0 h-96 w-96 -translate-y-1/3 translate-x-1/3 rounded-full bg-blue-600/10"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/5"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5"
      />

      <div className="relative z-10">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
            <Presentation className="h-6 w-6 text-white" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            ConferenceHub
          </span>
        </div>

        {/* Headline */}
        <h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-white xl:text-4xl">
          La plateforme de
          <br />
          référence pour les
          <br />
          <span className="text-blue-400">conférences scientifiques</span>
        </h2>
        <p className="mb-10 max-w-xs text-sm leading-relaxed text-slate-300">
          Rejoignez une communauté internationale de chercheurs, scientifiques
          et professionnels académiques.
        </p>

        {/* Features */}
        <div className="space-y-5">
          <Feature
            icon={CheckCircle2}
            iconBg="bg-emerald-500/20"
            iconColor="text-emerald-400"
            title="Inscription & QR Code automatique"
            desc="Votre badge de présence généré instantanément"
          />
          <Feature
            icon={FileText}
            iconBg="bg-blue-500/20"
            iconColor="text-blue-400"
            title="Soumission d'articles simplifiée"
            desc="Formulaire guidé en 4 étapes avec suivi du statut"
          />
          <Feature
            icon={ShieldCheck}
            iconBg="bg-purple-500/20"
            iconColor="text-purple-400"
            title="Attestation PDF officielle"
            desc="Téléchargeable depuis votre espace personnel"
          />
          <Feature
            icon={Users}
            iconBg="bg-amber-500/20"
            iconColor="text-amber-400"
            title="Gestion complète des conférences"
            desc="Outils de planification et suivi des participants"
          />
        </div>
      </div>

      {/* Stats bottom */}
      <div className="relative z-10 border-t border-white/10 pt-6">
        <div className="flex gap-8">
          <Stat value="124+" label="Conférences" />
          <Stat value="8 400+" label="Membres" />
          <Stat value="62" label="Pays" />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} ConferenceHub - Plateforme académique
          internationale
        </p>
      </div>
    </aside>
  );
}

function Feature({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  desc,
}: {
  icon: typeof CheckCircle2;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  );
}