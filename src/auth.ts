import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";
import { authConfig } from "@/auth.config";

/**
 * Point d'entrée NextAuth côté Node.js (runtime complet).
 * Exporte `auth`, `signIn`, `signOut`, `handlers` consommés partout dans l'app.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validation Zod - refuse silencieusement si le payload est corrompu
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // 2. Récupération utilisateur
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.motDePasse) return null;

        // 3. Comptes bloqués / non vérifiés : refus explicite
        if (user.status === "BLOCKED") {
          throw new Error("Votre compte a été bloqué. Contactez l'administrateur.");
        }
        // (Optionnel) : forcer la vérification email avant connexion
        // if (user.status === "PENDING_VERIFICATION") {
        //   throw new Error("Veuillez vérifier votre email avant de vous connecter.");
        // }

        // 4. Comparaison du hash bcrypt
        const isValid = await bcrypt.compare(password, user.motDePasse);
        if (!isValid) return null;

        // 5. Mise à jour `lastLoginAt` (fire-and-forget, ne bloque pas)
        prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => {
            /* noop */
          });

        // 6. Payload minimal retourné vers le JWT
        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
        };
      },
    }),
  ],
});