"use client";

import { useEffect, useState } from "react";

const TABS = [
  { id: "sec-about", label: "À propos" },
  { id: "sec-program", label: "Programme" },
  { id: "sec-speakers", label: "Intervenants" },
  { id: "sec-venue", label: "Lieu" },
  { id: "sec-faq", label: "FAQ" },
];

export function StickyNav() {
  const [activeSection, setActiveSection] = useState(TABS[0].id);

  useEffect(() => {
    // L'IntersectionObserver détecte quelle section est visible à l'écran
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Si la section entre dans la zone de visibilité définie
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // On décale la zone de détection vers le bas pour ignorer la navbar fixe
        rootMargin: "-100px 0px -60% 0px", 
      }
    );

    // On observe toutes les sections de la page
    TABS.forEach((tab) => {
      const element = document.getElementById(tab.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    
    // Défilement doux avec un décalage (offset) pour ne pas cacher 
    // le titre sous la navbar fixe
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-16 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div
          className="flex gap-0 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {TABS.map((t) => {
            const isActive = activeSection === t.id;
            return (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => handleClick(e, t.id)}
                className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm transition-colors ${
                  isActive
                    ? "border-blue-600 font-semibold text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}