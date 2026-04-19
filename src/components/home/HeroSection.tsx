"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface HeroStats {
  scientists: string;
  countries: number;
  papers: string;
  activeConferences: number;
  activeCountries: number;
}

interface HeroSectionProps {
  stats: HeroStats;
  trendingTopics?: string[];
}

const DEFAULT_TRENDING = [
  "Informatique",
  "Intelligence Artificielle",
  "Médecine",
  "Physique",
  "Droit",
];

export function HeroSection({
  stats,
  trendingTopics = DEFAULT_TRENDING,
}: HeroSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const go = (q: string) => {
    const trimmed = q.trim();
    const url = trimmed
      ? `/conferences?q=${encodeURIComponent(trimmed)}`
      : "/conferences";
    router.push(url);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    go(query);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 px-4 py-16">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          {stats.activeConferences} conférences actives dans {stats.activeCountries} pays
        </div>

        <h1 className="mb-4 font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
          Découvrez les grandes
          <br />
          <span className="text-blue-200">conférences scientifiques</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-blue-100/90 sm:text-lg">
          Inscriptions, soumissions d&apos;articles et certificats de participation - tout en un seul endroit.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl" role="search">
          <div className="flex overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-blue-900/30">
            <label htmlFor="hero-search" className="sr-only">Rechercher une conférence</label>
            <div className="flex items-center border-r border-slate-200 px-4">
              <Search className="h-5 w-5 text-slate-400" aria-hidden />
            </div>
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une conférence, un domaine, un pays…"
              className="flex-1 px-4 py-4 text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              className="whitespace-nowrap bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Rechercher
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="mt-1 mr-1 text-xs font-medium text-blue-200">Tendances :</span>
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => { setQuery(topic); go(topic); }}
                className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-white/25"
              >
                {topic}
              </button>
            ))}
          </div>
        </form>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-4">
          <StatBlock value={stats.scientists} label="Scientifiques inscrits" />
          <StatBlock value={stats.countries.toString()} label="Pays représentés" bordered />
          <StatBlock value={stats.papers} label="Articles publiés" />
        </div>
      </div>
    </section>
  );
}

function StatBlock({
  value, label, bordered = false,
}: { value: string; label: string; bordered?: boolean }) {
  return (
    <div className={bordered ? "border-x border-white/20 text-center" : "text-center"}>
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-blue-200">{label}</div>
    </div>
  );
}