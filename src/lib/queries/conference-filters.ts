
export type StatusKey = "open" | "coming_soon" | "closed";
export type FormatFilter = "in_person" | "online" | "hybrid";

export interface ConferenceFilters {
  q: string;
  format: FormatFilter | "";
  statuses: Set<StatusKey>;
  domains: Set<string>;
  fromDate: string;
  toDate: string;
  location: string;
}

export interface DomainDefinition {
  id: string;
  label: string;
  keywords: string[];
}

export const DOMAIN_DEFINITIONS: DomainDefinition[] = [
  { id: "ia",  label: "Informatique & IA",      keywords: ["informatique", "ia", "ai", "machine learning", "intelligence artificielle"] },
  { id: "med", label: "Sciences médicales",     keywords: ["santé", "médecine", "médical", "health", "clinic"] },
  { id: "phy", label: "Physique & Chimie",      keywords: ["physique", "physics", "chimie", "chemistry", "quantique"] },
  { id: "hum", label: "Sciences humaines",      keywords: ["sciences humaines", "sociologie", "psychologie", "histoire", "anthropologie"] },
  { id: "eng", label: "Ingénierie",             keywords: ["ingénierie", "engineering", "matériaux", "mécanique"] },
  { id: "law", label: "Droit & Sc. politiques", keywords: ["droit", "law", "politique"] },
];

const DOMAIN_ID_SET = new Set(DOMAIN_DEFINITIONS.map((d) => d.id));

// Ajout de l'export ici pour que le fichier serveur puisse l'utiliser
export const DOMAIN_KEYWORDS: Record<string, string[]> = Object.fromEntries(
  DOMAIN_DEFINITIONS.map((d) => [d.id, d.keywords])
);

export function emptyFilters(): ConferenceFilters {
  return {
    q: "",
    format: "",
    statuses: new Set(),
    domains: new Set(),
    fromDate: "",
    toDate: "",
    location: "",
  };
}

export function countActiveFilters(filters: ConferenceFilters): number {
  return (
    (filters.q.trim() ? 1 : 0) +
    (filters.format !== "" ? 1 : 0) +
    filters.statuses.size +
    filters.domains.size +
    (filters.fromDate ? 1 : 0) +
    (filters.toDate ? 1 : 0) +
    (filters.location.trim() ? 1 : 0)
  );
}

export interface ReadableSearchParams {
  get(key: string): string | null;
}

export function parseConferenceFiltersFromParams(sp: ReadableSearchParams): ConferenceFilters {
  const filters = emptyFilters();
  filters.q = (sp.get("q") ?? "").trim();

  const fmt = sp.get("format");
  if (fmt === "in_person" || fmt === "online" || fmt === "hybrid") {
    filters.format = fmt;
  }

  const statusParam = sp.get("status");
  if (statusParam) {
    for (const s of statusParam.split(",")) {
      if (s === "open" || s === "coming_soon" || s === "closed") {
        filters.statuses.add(s);
      }
    }
  }

  const domainsParam = sp.get("domains");
  if (domainsParam) {
    for (const d of domainsParam.split(",")) {
      if (DOMAIN_ID_SET.has(d)) filters.domains.add(d);
    }
  }

  filters.fromDate = sp.get("from") ?? "";
  filters.toDate = sp.get("to") ?? "";
  filters.location = (sp.get("loc") ?? "").trim();

  return filters;
}

export function parseConferenceFiltersFromRecord(
  record: Record<string, string | string[] | undefined>
): ConferenceFilters {
  const get = (key: string): string | null => {
    const v = record[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  return parseConferenceFiltersFromParams({ get });
}

export function serializeConferenceFilters(filters: ConferenceFilters): URLSearchParams {
  const sp = new URLSearchParams();
  const q = filters.q.trim();
  if (q) sp.set("q", q);
  if (filters.format !== "") sp.set("format", filters.format);
  if (filters.statuses.size > 0) sp.set("status", Array.from(filters.statuses).sort().join(","));
  if (filters.domains.size > 0) sp.set("domains", Array.from(filters.domains).sort().join(","));
  if (filters.fromDate) sp.set("from", filters.fromDate);
  if (filters.toDate) sp.set("to", filters.toDate);
  const loc = filters.location.trim();
  if (loc) sp.set("loc", loc);
  return sp;
}