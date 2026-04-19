import Link from "next/link";
import { Presentation } from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "./UserMenu";

/**
 * Navbar intelligente — **Server Component**.
 * Lit la session côté serveur (pas de flash de contenu non authentifié).
 * Délègue uniquement le dropdown interactif au client (`UserMenu`).
 */
export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-slate-900">
            ConferenceHub
          </span>
        </Link>

        {/* Nav principale */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Navigation principale"
        >
          <Link
            href="/conferences"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Conférences
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            À propos
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Contact
          </Link>
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
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
                className="text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}