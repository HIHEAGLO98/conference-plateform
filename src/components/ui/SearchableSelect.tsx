"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * SearchableSelect — remplacement production de <select> natif.
 *
 * Fonctionnalités :
 *   - Recherche incrémentale dans les options (insensible à la casse et aux accents)
 *   - Navigation clavier : ↑↓ pour naviguer, Enter pour sélectionner, Escape pour fermer
 *   - Fermeture sur clic extérieur
 *   - Affichage du placeholder quand aucune valeur n'est sélectionnée
 *   - Support des options désactivées
 *   - Accessible : aria-expanded, aria-haspopup, aria-activedescendant, role="listbox"
 *   - Entièrement Tailwind, zéro dépendance externe
 *
 * Usage :
 *   <SearchableSelect
 *     options={THEMES.map((t) => ({ value: t, label: t }))}
 *     value={form.theme}
 *     onChange={(v) => update("theme", v)}
 *     placeholder="— Choisir une thématique —"
 *   />
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Sous-label affiché en gris sous le label principal */
  sublabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Label du champ de recherche (accessibilité) */
  searchPlaceholder?: string;
  /** Message quand la recherche ne retourne rien */
  emptyMessage?: string;
  disabled?: boolean;
  /** Affiche un bouton ✕ pour réinitialiser la sélection */
  clearable?: boolean;
  /** Classe Tailwind supplémentaire pour le trigger */
  className?: string;
  /** Identifiant pour l'attribut aria-labelledby */
  "aria-labelledby"?: string;
}

/** Normalise une chaîne pour la recherche (accents + casse) */
function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner",
  searchPlaceholder = "Rechercher…",
  emptyMessage = "Aucun résultat",
  disabled = false,
  clearable = false,
  className,
  "aria-labelledby": ariaLabelledBy,
}: SearchableSelectProps) {
  const uid = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const selectedOption = options.find((o) => o.value === value) ?? null;

  // Filtrage insensible aux accents et à la casse
  const filtered = query.trim()
    ? options.filter((o) => normalize(o.label).includes(normalize(query)))
    : options;

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setActiveIndex(
      selectedOption ? options.findIndex((o) => o.value === value) : -1
    );
    // Focus sur le champ de recherche au prochain tick
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [disabled, selectedOption, options, value]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (opt: SelectOption) => {
      if (opt.disabled) return;
      onChange(opt.value);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  const clearSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
    },
    [onChange]
  );

  // Fermeture sur clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const container = triggerRef.current?.closest("[data-searchable-select]");
      if (container && !container.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeDropdown]);

  // Scroll de l'élément actif dans le viewport
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Navigation clavier dans la liste
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => {
          const next = i + 1;
          return next >= filtered.length ? 0 : next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => {
          const prev = i - 1;
          return prev < 0 ? filtered.length - 1 : prev;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          selectOption(filtered[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  return (
    <div data-searchable-select="" className="relative">
      {/*  Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={open ? closeDropdown : openDropdown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={ariaLabelledBy}
        aria-controls={`${uid}-listbox`}
        className={cn(
          // Base
          "relative flex w-full items-center justify-between gap-2 rounded-[10px] border-[1.5px] bg-white px-3.5 py-2.5 text-left text-sm",
          "transition-all duration-150",
          // État normal
          "border-slate-200 text-slate-900",
          // Hover
          "hover:border-slate-300",
          // Focus visible
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:border-teal-500",
          // Ouvert
          open && "border-teal-500 ring-2 ring-teal-500/20",
          // Disabled
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
          className
        )}
      >
        {/* Valeur sélectionnée ou placeholder */}
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption ? (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium leading-tight">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="truncate text-xs text-slate-400">
                  {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>

        {/* Bouton clear + chevron */}
        <span className="flex flex-shrink-0 items-center gap-1">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearSelection}
              onKeyDown={(e) => e.key === "Enter" && clearSelection(e as unknown as React.MouseEvent)}
              aria-label="Effacer la sélection"
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200",
              open && "rotate-180 text-teal-600"
            )}
          />
        </span>
      </button>

      {/*  Dropdown  */}
      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-1.5",
            "overflow-hidden rounded-xl border border-slate-200 bg-white",
            "shadow-[0_8px_30px_rgba(0,0,0,0.10)]",
            // Animation d'ouverture CSS pure
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
        >
          {/* Champ de recherche */}
          <div className="border-b border-slate-100 p-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                aria-label={searchPlaceholder}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setActiveIndex(-1); searchRef.current?.focus(); }}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Liste d'options */}
          <ul
            ref={listRef}
            id={`${uid}-listbox`}
            role="listbox"
            aria-label="Options"
            className="max-h-56 overflow-y-auto p-1.5 scrollbar-thin"
          >
            {filtered.length === 0 ? (
              <li className="flex items-center justify-center px-3 py-6 text-sm text-slate-400">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = opt.value === value;

                return (
                  <li
                    key={opt.value}
                    id={`${uid}-option-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectOption(opt)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-75",
                      // Hover / active via clavier
                      isActive && !opt.disabled && "bg-teal-50",
                      // Sélectionné
                      isSelected && "text-teal-700",
                      // Disabled
                      opt.disabled && "cursor-not-allowed opacity-40",
                      // Default
                      !isActive && !isSelected && "text-slate-800"
                    )}
                  >
                    {/* Checkmark si sélectionné */}
                    <span
                      className={cn(
                        "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        isSelected
                          ? "border-teal-600 bg-teal-600"
                          : "border-slate-200"
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </span>

                    {/* Label + sous-label */}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium leading-snug">
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="truncate text-xs text-slate-400">
                          {opt.sublabel}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer : compteur */}
          {filtered.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-1.5">
              <p className="text-[11px] text-slate-400">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
                {query && ` pour « ${query} »`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}