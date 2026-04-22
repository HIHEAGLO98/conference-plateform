"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";

import { cn } from "@/lib/utils";

/* 
 * Section "À propos" — description éditoriale avec toggle "Lire la suite".
 *
 * La description peut être longue (jusqu'à plusieurs centaines de caractères).
 * On coupe à `collapsedChars` pour l'affichage initial, on restaure la version
 * intégrale au clic. Pour les descriptions plus courtes que le seuil, le bouton
 * n'est même pas rendu.
 *  */

interface AboutSectionProps {
  description: string;
  theme?: string | null;
  /** Longueur (en caractères) au-delà de laquelle on tronque. Default: 450. */
  collapsedChars?: number;
}

/** Split une chaîne sur les doubles retours à la ligne pour obtenir des <p>. */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function AboutSection({
  description,
  theme,
  collapsedChars = 450,
}: AboutSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const paragraphs = useMemo(
    () => splitParagraphs(description),
    [description]
  );

  const needsToggle = description.length > collapsedChars;

  // Si on est en mode collapsed, on tronque proprement au dernier espace.
  const displayedContent = useMemo(() => {
    if (!needsToggle || expanded) return paragraphs;

    const truncated = description.slice(0, collapsedChars);
    const lastSpace = truncated.lastIndexOf(" ");
    const clean = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated)
      .replace(/[.,;:]+$/, "")
      .trim();
    return [`${clean}…`];
  }, [description, paragraphs, needsToggle, expanded, collapsedChars]);

  return (
    <section
      id="sec-about"
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
    >
      <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
          <Info className="h-4 w-4 text-blue-700" />
        </span>
        À propos de la conférence
      </h2>

      <div className="space-y-3 text-sm leading-relaxed text-slate-600">
        {displayedContent.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          {expanded ? "Réduire" : "Lire la suite"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
      )}

      {theme && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Thématique principale
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {theme}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}