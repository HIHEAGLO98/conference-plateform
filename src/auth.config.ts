import type { NextAuthConfig } from "next-auth";

/**
 * Config NextAuth **Edge-compatible** (utilisée par le middleware).
 * ATTENTION : ne jamais importer `bcrypt`/`prisma` ici — ils ne tournent pas sur l'edge runtime.
 * Toute la logique « lourde » (DB + hash) va dans `src/auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  },
  providers: [], // déclarés dans auth.ts
  callbacks: {
    /** Enrichit le JWT puis la Session avec id + role de l'utilisateur. */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    /** Guard simple pour le middleware. On raffinera par rôle plus tard. */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = ["/dashboard", "/participant", "/conferencier", "/organisateur", "/admin"];
      const isProtected = protectedPrefixes.some((p) => nextUrl.pathname.startsWith(p));
      const isAuthPage = ["/login", "/register"].includes(nextUrl.pathname);

      if (isProtected && !isLoggedIn) return false; // → redirige vers /login
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;