import { Presentation } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // 

export function BrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col items-center justify-center bg-slate-50 lg:flex overflow-hidden border-r border-slate-200">
      
      {/* Branding */}
      <div className="absolute left-10 top-10 z-10 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700">
          <Presentation className="h-5 w-5 text-white" />
        </div>
        <Link href="/" className="font-heading text-xl font-bold text-slate-900">
          ConferenceHub
        </Link>
      </div>

      {/* Conteneur de l'illustration */}
      <div className="relative z-0 flex w-full max-w-lg items-center justify-center p-8">
        <Image 
          src="/login/login-rafiki.svg" 
          alt="Illustration d'authentification"
          width={500} // Largeur intrinsèque de sécurité
          height={500} // Hauteur intrinsèque de sécurité
          priority // Force le chargement rapide (très important pour l'UX au login)
          className="w-full h-auto" // Tailwind gère la responsivité réelle
        />
      </div>
      
    </div>
  );
}