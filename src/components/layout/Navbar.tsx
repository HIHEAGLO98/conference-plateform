import Link from "next/link";
import { Presentation } from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "./UserMenu";
import { MobileMenuToggle } from "./MobileMenuToggle";

interface NavLink { label: string; href: string; }

const NAV_LINKS: NavLink[] = [
  { label: "Conférences", href: "/conferences" },
  { label: "Appels à communications", href: "/calls" },
  { label: "Institutions", href: "/institutions" },
  { label: "Contact", href: "/contact" },
];

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Presentation className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading text-base font-bold tracking-tight text-slate-800">
              ConferenceHub
            </span>
            <span className="mt-0.5 hidden text-xs text-slate-400 sm:block">
              Plateforme académique
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu
              user={{
                name: user.name ?? "Utilisateur",
                email: user.email ?? "",
                role: user.role,
              }}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 sm:inline-flex"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
          <MobileMenuToggle links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}