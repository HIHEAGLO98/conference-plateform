import Link from "next/link";
import { FileQuestion, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icône d'erreur stylisée */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-blue-100 rounded-3xl rotate-6 animate-pulse"></div>
          <div className="absolute inset-0 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shadow-sm -rotate-3 transition-transform hover:rotate-0">
            <FileQuestion className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Textes */}
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          Page introuvable
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-8">
          Désolé, la conférence ou la page que vous recherchez n'existe pas. 
          Elle a peut-être été supprimée, renommée, ou l'URL est incorrecte.
        </p>

        {/* Boutons d'action (CTAs) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Home className="w-4 h-5" />
            Retour à l'accueil
          </Link>
          <Link
            href="/conferences"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-all"
          >
            <Search className="w-4 h-5" />
            Parcourir les conférences
          </Link>
        </div>

        {/* Code d'erreur discret */}
        <div className="mt-12 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Erreur 404
        </div>
      </div>
    </div>
  );
}