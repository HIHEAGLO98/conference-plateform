"use client";

import { Check, User, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type RoleValue = "PARTICIPANT" | "CONFERENCIER" | "ORGANISATEUR";

interface RoleSelectorProps {
  value: RoleValue;
  onChange: (value: RoleValue) => void;
  error?: string;
}

const ROLES: {
  value: RoleValue;
  label: string;
  description: string;
  icon: typeof User;
  bgColor: string;
  iconColor: string;
}[] = [
  {
    value: "PARTICIPANT",
    label: "Participant",
    description: "Assister aux conférences",
    icon: User,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-700",
  },
  {
    value: "CONFERENCIER",
    label: "Conférencier",
    description: "Soumettre des articles",
    icon: FileText,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-700",
  },
  {
    value: "ORGANISATEUR",
    label: "Organisateur",
    description: "Gérer des conférences",
    icon: Settings,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
];

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <div>
      <label className="mb-3 block text-sm font-semibold text-slate-700">
        Je suis… <span className="text-red-500">*</span>
      </label>

      <div
        role="radiogroup"
        aria-label="Sélectionnez votre rôle"
        className="grid grid-cols-3 gap-2"
      >
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = value === role.value;
          return (
            <button
              type="button"
              key={role.value}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(role.value)}
              className={cn(
                "relative cursor-pointer rounded-xl border-2 p-3 text-center transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              )}
            >
              <div
                className={cn(
                  "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl",
                  role.bgColor
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", role.iconColor)} strokeWidth={2} />
              </div>
              <p className="text-xs font-semibold text-slate-900">{role.label}</p>
              <p className="mt-0.5 text-xs leading-tight text-slate-400">
                {role.description}
              </p>
              <div
                className={cn(
                  "mx-auto mt-2 flex h-5 w-5 items-center justify-center rounded-full transition-colors",
                  isSelected ? "bg-blue-600" : "bg-slate-200"
                )}
              >
                {isSelected && (
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
        <svg
          className="h-3.5 w-3.5 flex-shrink-0 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Le rôle Organisateur est soumis à validation par l&apos;administrateur.
      </p>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}