import Link from "next/link";
import { Presentation } from "lucide-react";

interface FooterLink { label: string; href: string; }
interface FooterColumn { title: string; links: FooterLink[]; }

const COLUMNS: FooterColumn[] = [
  {
    title: "Plateforme",
    links: [
      { label: "Conférences", href: "/conferences" },
      { label: "Soumettre un article", href: "/submissions" },
      { label: "Organisateurs", href: "/organizers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "CGU", href: "/legal/terms" },
      { label: "Confidentialité", href: "/legal/privacy" },
      { label: "Accessibilité", href: "/legal/accessibility" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-slate-900 px-4 py-10 text-slate-400">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
        <div>
          <Link href="/" className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Presentation className="h-4 w-4 text-white" aria-hidden />
            </div>
            <span className="text-sm font-bold text-white">ConferenceHub</span>
          </Link>
          <p className="text-xs leading-relaxed">
            La plateforme de référence pour les conférences académiques internationales.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold text-white">{col.title}</h4>
            <ul className="space-y-2 text-xs">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 pt-6 text-center text-xs">
        © {year} ConferenceHub · Fait avec amour pour la communauté académique
      </div>
    </footer>
  );
}