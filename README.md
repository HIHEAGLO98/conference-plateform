This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
DATABASE_URL="postgresql://conference_user:conference_pwd@localhost:5432/conference_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="REPLACE_ME_WITH_openssl_rand_base64_32"
RESEND_API_KEY=""
RESEND_FROM_EMAIL="no-reply@conference-platform.local"
UPLOAD_DIR="./public/uploads"
NEXT_PUBLIC_UPLOAD_BASE_URL="http://localhost:3000/uploads"
NEXT_PUBLIC_APP_NAME="Plateforme de Gestion de Conférences"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Formater le schema
npx prisma format

# Générer le client TypeScript
npx prisma generate

# Créer et appliquer la 1re migration
npx prisma migrate dev --name init

# Visualiser la base de données (interface web)
npx prisma studio