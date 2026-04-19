"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  /** Valeur actuelle (0–6 chiffres). */
  value: string;
  /** Callback à chaque changement. */
  onChange: (value: string) => void;
  /** Callback appelé quand les 6 chiffres sont saisis. */
  onComplete?: (value: string) => void;
  /** Nombre de cases (default: 6). */
  length?: number;
  /** Désactive toute interaction. */
  disabled?: boolean;
  /** Force l'état d'erreur (bord rouge + shake). */
  error?: boolean;
  /** Label accessible pour les lecteurs d'écran. */
  "aria-label"?: string;
}

/**
 * Composant OTP à N cases (6 par défaut).
 *
 * Features :
 * - Auto-focus sur la case suivante à la saisie
 * - Backspace → recule d'une case si vide
 * - Flèches gauche/droite → navigation
 * - Paste d'un code complet → remplit toutes les cases
 * - Filtre : digits uniquement
 * - `onComplete` fire-once quand les N cases sont remplies
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error = false,
  "aria-label": ariaLabel = "Code de vérification",
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const completedRef = useRef(false);

  // Transforme la value en tableau de longueur fixe (padding espaces)
  const digits = useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  // Déclenche onComplete une seule fois par "completion"
  useEffect(() => {
    if (value.length === length && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(value);
    } else if (value.length < length) {
      completedRef.current = false;
    }
  }, [value, length, onComplete]);

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  };

  const setDigitAt = (index: number, digit: string) => {
    const chars = value.split("").slice(0, length);
    while (chars.length < length) chars.push("");
    chars[index] = digit;
    const next = chars.join("").replace(/\s+$/, ""); // trim trailing empties
    onChange(next);
  };

  const handleChange = (index: number, raw: string) => {
    // Filtre digits uniquement, prend le dernier caractère si plusieurs
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigitAt(index, "");
      return;
    }
    const digit = cleaned.slice(-1);
    setDigitAt(index, digit);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        setDigitAt(index - 1, "");
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      focusAt(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      focusAt(length - 1);
      return;
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    // Focus la dernière case remplie
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex justify-center gap-2"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "otp-input",
            digit && "filled",
            error && "error",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
      ))}
    </div>
  );
}