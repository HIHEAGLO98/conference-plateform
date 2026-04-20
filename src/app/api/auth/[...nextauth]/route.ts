/**
 * Route handler NextAuth v5 - simple réexport des handlers.
 * Toute la config vit dans `src/auth.ts`.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;