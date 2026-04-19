"use client";

import { passwordStrength } from "@/lib/utils";

/**
 * Indicateur visuel de la force du mot de passe (4 barres).
 *  4 niveaux de couleur.
 */
export function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = passwordStrength(password);

  return (
    <div aria-live="polite">
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i <= score ? color : "#e2e8f0",
            }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color: password ? color : "#94a3b8" }}>
        {label}
      </p>
    </div>
  );
}