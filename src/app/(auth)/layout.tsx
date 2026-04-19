import { Presentation } from "lucide-react";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { AuthTabs } from "@/components/auth/AuthTabs";

/**
 * Layout partagé entre /login et /register.
 * - Server Component : aucune interactivité ici
 * - Brand panel (gauche) statique
 * - Tabs client pour naviguer entre login/register
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <BrandPanel />

      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 sm:p-10">
        {/* Logo mobile (caché en desktop) */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-lg font-bold text-slate-900">
            ConferenceHub
          </span>
        </div>

        <div className="w-full max-w-md">
          <AuthTabs />
          {children}
        </div>
      </main>
    </div>
  );
}