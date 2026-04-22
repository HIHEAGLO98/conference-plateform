"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* 
 * Navigation collante inter-sections avec scroll fluide + état actif.
 *
 * Stratégie :
 *   1. Clic → `scrollIntoView` avec offset custom (nav principale ~64px
 *      + sticky-nav ~56px = 120px).
 *   2. Scroll libre → `IntersectionObserver` détecte quelle section entre
 *      dans la zone "upper-third" du viewport et met l'onglet actif.
 *  */

export interface StickyNavItem {
  id: string;
  label: string;
}

const DEFAULT_ITEMS: StickyNavItem[] = [
  { id: "sec-about", label: "À propos" },
  { id: "sec-program", label: "Programme" },
  { id: "sec-speakers", label: "Intervenants" },
  { id: "sec-venue", label: "Lieu" },
  { id: "sec-faq", label: "FAQ" },
];

/** Offset pour ne pas que le haut de la section passe sous la sticky nav. */
const SCROLL_OFFSET_PX = 120;

interface StickyNavProps {
  items?: StickyNavItem[];
}

export function StickyNav({ items = DEFAULT_ITEMS }: StickyNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  // Flag temporaire : quand l'utilisateur clique, on "gèle" l'observer pendant
  // le scroll programmatique pour éviter des flips d'onglet transitoires.
  const frozenRef = useRef<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (frozenRef.current) return;

        // On garde l'entrée visible avec le top le plus proche du viewport-top.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: `-${SCROLL_OFFSET_PX}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    const targets: Element[] = [];
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        targets.push(el);
      }
    }

    return () => {
      for (const el of targets) observer.unobserve(el);
      observer.disconnect();
    };
  }, [items]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;

      const top =
        el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;

      setActiveId(id);
      frozenRef.current = true;
      window.scrollTo({ top, behavior: "smooth" });

      // Dégèle l'observer ~500ms après (durée typique d'un smooth scroll).
      window.setTimeout(() => {
        frozenRef.current = false;
      }, 600);
    },
    []
  );

  return (
    <div className="sticky top-16 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <nav
          aria-label="Navigation des sections"
          className="flex gap-0 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "whitespace-nowrap border-b-2 px-5 py-4 text-sm transition-colors",
                  isActive
                    ? "border-blue-600 font-semibold text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}