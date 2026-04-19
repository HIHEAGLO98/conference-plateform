import { FormaType } from "@/generated/prisma/client";
import type { HomeConferenceRow } from "@/lib/queries/conferences";
import type {
  AccentColor,
  ConferenceFormat,
  DomainBadge,
  HomeConference,
  RegistrationStatus,
} from "@/types/conference";

/**
 * Adapter Prisma → HomeConference.
 * Toute la logique d'affichage (couleurs, statut dérivé, libellés FR…) vit ici.
 */
export function prismaConferenceToHome(
  row: HomeConferenceRow,
  now: Date = new Date()
): HomeConference {
  const format = mapFormat(row.format);
  const status = deriveStatus(row, now);
  const domain = buildDomainBadge(row.theme);
  const accent = pickAccent(format, status, row.theme);

  const registered = row._count.inscriptions;
  const total = row.capaciteMax ?? 0;

  return {
    id: row.id,
    title: row.shortName ? `${row.shortName} - ${row.titre}` : row.titre,
    organizer: buildOrganizerLine(row),
    partner: extractPartner(row.organisation),

    dateRange: formatDateRange(row.dateDebut, row.dateFin),
    location: buildLocation(row, format),

    submissionDeadline: undefined,
    submissionUrgent: false,

    accent,
    domain,
    format,
    status,
    daysBeforeOpen:
      status === "COMING_SOON"
        ? Math.max(0, daysBetween(now, row.dateDebut))
        : undefined,

    capacity: { registered, total },

    href: `/conferences/${row.slug}`,
  };
}

/*  Mappings  */

function mapFormat(format: FormaType): ConferenceFormat {
  switch (format) {
    case FormaType.PRESENTIAL:
      return "IN_PERSON";
    case FormaType.VIRTUAL:
      return "ONLINE";
    case FormaType.HYBRID:
    default:
      return "HYBRID";
  }
}

function deriveStatus(row: HomeConferenceRow, now: Date): RegistrationStatus {
  if (row.dateFin.getTime() < now.getTime()) return "CLOSED";

  const registered = row._count.inscriptions;
  if (row.capaciteMax && row.capaciteMax > 0 && registered >= row.capaciteMax) {
    return "FULL";
  }

  const daysUntilStart = daysBetween(now, row.dateDebut);
  if (daysUntilStart > 60) return "COMING_SOON";

  return "OPEN";
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function buildOrganizerLine(row: HomeConferenceRow): string {
  const base = row.organisation?.trim();
  if (base) {
    const cleaned = base.split("·")[0]?.trim() ?? base;
    return `Organisée par ${cleaned}`;
  }
  const orga = row.organisateur;
  const fallback = orga.affiliation?.trim() || `${orga.prenom} ${orga.nom}`;
  return `Organisée par ${fallback}`;
}

function extractPartner(organisation: string | null): string | undefined {
  if (!organisation) return undefined;
  const parts = organisation.split("·");
  if (parts.length < 2) return undefined;
  const partner = parts.slice(1).join("·").trim();
  return partner.length > 0 ? partner : undefined;
}

function buildLocation(row: HomeConferenceRow, format: ConferenceFormat): string {
  if (format === "ONLINE") return row.lieu?.trim() || "En ligne";
  const ville = row.ville?.trim();
  const pays = row.pays?.trim();
  if (ville && pays) return `${ville}, ${pays}`;
  if (ville) return ville;
  if (pays) return pays;
  return row.lieu ?? "Lieu à confirmer";
}

function formatDateRange(start: Date, end: Date): string {
  const SAME_MONTH = start.getMonth() === end.getMonth();
  const SAME_YEAR = start.getFullYear() === end.getFullYear();
  const formatDay = (d: Date) => d.getDate().toString();
  const formatMonth = (d: Date) =>
    d.toLocaleDateString("fr-FR", { month: "long" });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (SAME_MONTH && SAME_YEAR) {
    return `${formatDay(start)} – ${formatDay(end)} ${cap(formatMonth(end))} ${end.getFullYear()}`;
  }
  if (SAME_YEAR) {
    return `${formatDay(start)} ${formatMonth(start)} – ${formatDay(end)} ${formatMonth(end)} ${end.getFullYear()}`;
  }
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${start.toLocaleDateString("fr-FR", opts)} - ${end.toLocaleDateString("fr-FR", opts)}`;
}

/*  Couleurs & badges dérivés du thème  */

interface DomainPreset {
  emoji?: string;
  tone: DomainBadge["tone"];
  accent: AccentColor;
}

const DOMAIN_PRESETS: Array<{ keywords: RegExp; preset: DomainPreset }> = [
  { keywords: /\b(ia|ai|machine\s*learning|ml|intelligence\s*artificielle)\b/i,
    preset: { emoji: "🤖", tone: "blue", accent: "blue" } },
  { keywords: /\b(data\s*science|données|big\s*data|analytique)\b/i,
    preset: { emoji: "🧬", tone: "violet-blue", accent: "sky" } },
  { keywords: /\b(neuro|cerveau|cognition)\b/i,
    preset: { emoji: "🧠", tone: "amber", accent: "amber" } },
  { keywords: /\b(chimie|chemistry|molécul)\b/i,
    preset: { emoji: "⚗️", tone: "slate", accent: "slate" } },
  { keywords: /\b(santé|médecine|médical|health|clinic)\b/i,
    preset: { emoji: "⚕️", tone: "emerald", accent: "emerald" } },
  { keywords: /\b(physique|physics|quantique)\b/i,
    preset: { emoji: "🔬", tone: "sky", accent: "sky" } },
  { keywords: /\b(droit|law|politique)\b/i,
    preset: { emoji: "⚖️", tone: "slate", accent: "slate" } },
];

function matchPreset(theme: string): DomainPreset {
  for (const { keywords, preset } of DOMAIN_PRESETS) {
    if (keywords.test(theme)) return preset;
  }
  return { tone: "blue", accent: "blue" };
}

function buildDomainBadge(theme: string): DomainBadge {
  const { emoji, tone } = matchPreset(theme);
  return { label: theme, emoji, tone };
}

function pickAccent(
  _format: ConferenceFormat,
  status: RegistrationStatus,
  theme: string
): AccentColor {
  if (status === "FULL" || status === "CLOSED") return "slate";
  if (status === "COMING_SOON") return "amber";
  return matchPreset(theme).accent;
}