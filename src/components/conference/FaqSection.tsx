"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConferenceFaqItem } from "@/lib/queries/conference-detail";

/* 
 * Section "FAQ" — accordéon single-open.
 *
 * Stratégie UI :
 *   - Un seul item ouvert à la fois (state = id | null).
 *   - Clic sur l'item ouvert → le ferme.
 *   - ChevronDown qui pivote à 180° quand ouvert (CSS-only transition).
 *   - `aria-expanded` + `aria-controls` / `role="region"` pour l'accessibilité.
 *
 * Les FAQs sont pré-triées par `ordre` côté Prisma (cf. conferenceDetailSelect).
 *  */

interface FaqSectionProps {
  faqs: ConferenceFaqItem[];
  /** Email de contact affiché dans le CTA de bas de section. */
  contactEmail?: string;
}

export function FaqSection({
  faqs,
  contactEmail = "contact@conferencehub.fr",
}: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(() => faqs[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="sec-faq"
      className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
    >
      <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-slate-900">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <HelpCircle className="h-4 w-4 text-amber-700" />
        </span>
        Questions fréquentes
        {faqs.length > 0 && (
          <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {faqs.length}
          </span>
        )}
      </h2>

      {faqs.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          Aucune question fréquente n&apos;a encore été publiée.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {faqs.map((faq) => {
            const isOpen = faq.id === openId;
            const panelId = `faq-panel-${faq.id}`;
            const buttonId = `faq-button-${faq.id}`;

            return (
              <div key={faq.id}>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(faq.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors",
                    isOpen ? "bg-slate-50" : "bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 flex-shrink-0 text-slate-400 transition-transform",
                      isOpen && "rotate-180 text-blue-600"
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-4 pb-4 pt-0"
                  >
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contact fallback */}
      <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
            <Mail className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Une autre question ?
            </p>
            <p className="text-xs text-slate-500">
              L&apos;équipe organisatrice vous répond sous 48h.
            </p>
          </div>
        </div>
        <a
          href={`mailto:${contactEmail}`}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
        >
          <Mail className="h-4 w-4" />
          Nous contacter
        </a>
      </div>
    </section>
  );
}