import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Proxy edge-safe (Next.js 16 — ex-"middleware").
 *
 * auth.config.ts NE DOIT PAS importer prisma ni bcrypt :
 * le proxy tourne sur l'Edge runtime.
 *
 * Rôle :
 * - Protège les routes privées via le callback `authorized`
 * - Redirige les utilisateurs connectés qui tombent sur /login ou /register
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Ignore l'API NextAuth, les assets statiques et les fichiers publics
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};