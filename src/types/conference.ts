/**
 * Types métier pour les conférences côté front (liste publique).
 *
 * Ce type est volontairement décorrélé du modèle Prisma : il reflète ce que
 * le client a besoin d'afficher sur une carte. Le mapping vit dans
 * `src/lib/adapters/conference.ts`.
 */

export type RegistrationStatus = "OPEN" | "COMING_SOON" | "FULL" | "CLOSED";
export type ConferenceFormat = "IN_PERSON" | "ONLINE" | "HYBRID";
export type AccentColor = "blue" | "sky" | "amber" | "slate" | "emerald";

export interface DomainBadge {
  label: string;
  emoji?: string;
  tone: "blue" | "sky" | "amber" | "slate" | "emerald" | "violet-blue";
}

export interface Capacity {
  registered: number;
  total: number;
}

export interface HomeConference {
  id: string;
  title: string;
  organizer: string;
  partner?: string;

  dateRange: string;
  location: string;
  platform?: string;

  submissionDeadline?: string;
  submissionUrgent?: boolean;

  accent: AccentColor;
  domain: DomainBadge;
  format: ConferenceFormat;
  status: RegistrationStatus;
  daysBeforeOpen?: number;

  capacity: Capacity;

  href: string;
}