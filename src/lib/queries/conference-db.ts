import "server-only"; 
import { FormaType, Prisma } from "@/generated/prisma/client";
import { ConferenceFilters, DOMAIN_KEYWORDS } from "./conference-filters";

const MS_PER_DAY = 86_400_000;
const COMING_SOON_THRESHOLD_DAYS = 60;

function parseISODate(raw: string): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapFormatToEnum(format: ConferenceFilters["format"]): FormaType | undefined {
  switch (format) {
    case "in_person": return FormaType.PRESENTIAL;
    case "online":    return FormaType.VIRTUAL;
    case "hybrid":    return FormaType.HYBRID;
    default:          return undefined;
  }
}

export function buildConferenceWhere(
  filters: ConferenceFilters,
  now: Date,
  base: Prisma.ConferenceWhereInput
): Prisma.ConferenceWhereInput {
  const AND: Prisma.ConferenceWhereInput[] = [base];

  const q = filters.q.trim();
  if (q) {
    AND.push({
      OR: [
        { titre:        { contains: q, mode: "insensitive" } },
        { shortName:    { contains: q, mode: "insensitive" } },
        { theme:        { contains: q, mode: "insensitive" } },
        { organisation: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const format = mapFormatToEnum(filters.format);
  if (format) AND.push({ format });

  if (filters.statuses.size > 0) {
    const soonThreshold = new Date(now.getTime() + COMING_SOON_THRESHOLD_DAYS * MS_PER_DAY);
    const orConditions: Prisma.ConferenceWhereInput[] = [];

    if (filters.statuses.has("closed")) {
      orConditions.push({ dateFin: { lt: now } });
    }
    if (filters.statuses.has("open")) {
      orConditions.push({
        AND: [
          { dateFin:   { gte: now } },
          { dateDebut: { lte: soonThreshold } },
        ],
      });
    }
    if (filters.statuses.has("coming_soon")) {
      orConditions.push({
        AND: [
          { dateFin:   { gte: now } },
          { dateDebut: { gt:  soonThreshold } },
        ],
      });
    }
    if (orConditions.length > 0) AND.push({ OR: orConditions });
  }

  if (filters.domains.size > 0) {
    const domainOr: Prisma.ConferenceWhereInput[] = [];
    for (const id of filters.domains) {
      const keywords = DOMAIN_KEYWORDS[id];
      if (!keywords) continue;
      for (const kw of keywords) {
        domainOr.push({ theme: { contains: kw, mode: "insensitive" } });
      }
    }
    if (domainOr.length > 0) AND.push({ OR: domainOr });
  }

  const fromDate = parseISODate(filters.fromDate);
  if (fromDate) AND.push({ dateFin: { gte: fromDate } });

  const toDate = parseISODate(filters.toDate);
  if (toDate) AND.push({ dateDebut: { lte: toDate } });

  const location = filters.location.trim();
  if (location) {
    AND.push({
      OR: [
        { ville: { contains: location, mode: "insensitive" } },
        { pays:  { contains: location, mode: "insensitive" } },
        { lieu:  { contains: location, mode: "insensitive" } },
      ],
    });
  }

  return { AND };
}