import { ExternalLink, Globe, MapPin, Navigation } from "lucide-react";

/* 
 * Section "Lieu"  Server Component.
 *
 * Le schema Conference expose `lieu: String` (libre) + `websiteUrl?`. Pas de
 * géocodage (lat/lng) pour l'instant. On utilise Google Maps comme provider
 * de fallback (pas de token API requis pour un lien).
 *  */

interface VenueSectionProps {
  lieu: string;
  websiteUrl?: string | null;
  organisation?: string | null;
}

/**
 * Nettoie une URL pour l'affichage humain : retire protocole + trailing slash.
 *   "https://cite-sciences.fr/en/" → "cite-sciences.fr/en"
 */
function humanizeUrl(raw: string): string {
  return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

export function VenueSection({
  lieu,
  websiteUrl,
  organisation,
}: VenueSectionProps) {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu)}`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lieu)}`;

  return (
    <section
      id="sec-venue"
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
    >
      <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-100">
          <MapPin className="h-4 w-4 text-rose-700" />
        </span>
        Lieu de l&apos;événement
      </h2>

      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Placeholder carte — lien cliquable vers Google Maps */}
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative h-48 flex-shrink-0 overflow-hidden rounded-xl border border-blue-100 transition-all hover:border-blue-300 sm:w-64"
          style={{
            background: "linear-gradient(135deg, #e8f0fe, #dbeafe)",
          }}
          aria-label={`Ouvrir ${lieu} dans Google Maps`}
        >
          {/* Pattern décoratif */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 40%, #3b82f6 0%, transparent 40%), radial-gradient(circle at 70% 70%, #818cf8 0%, transparent 35%)",
            }}
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 text-blue-700 transition-transform group-hover:scale-105">
            <MapPin className="h-10 w-10" />
            <p className="text-sm font-semibold">Voir sur la carte</p>
            <p className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">
              Ouvrir dans Maps
              <ExternalLink className="h-3 w-3" />
            </p>
          </div>
        </a>

        {/* Informations venue */}
        <div className="flex-1 space-y-3">
          <div>
            {organisation && (
              <p className="font-heading text-lg font-bold text-slate-900">
                {organisation}
              </p>
            )}
            <p
              className={
                organisation
                  ? "mt-1 text-sm text-slate-500"
                  : "font-heading text-lg font-bold text-slate-900"
              }
            >
              {lieu}
            </p>
          </div>

          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
            >
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="hover:underline">{humanizeUrl(websiteUrl)}</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          )}

          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Navigation className="h-4 w-4" />
            Obtenir l&apos;itinéraire
          </a>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-700">
              Bon à savoir
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Les informations d&apos;accès détaillées (transports en commun,
              parking, accessibilité PMR) seront communiquées par email aux
              participants inscrits une semaine avant l&apos;événement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}