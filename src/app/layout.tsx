import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "ConferenceHub — Conférences scientifiques",
    template: "%s · ConferenceHub",
  },
  description:
    "La plateforme de référence pour découvrir, s'inscrire et publier dans les conférences académiques internationales.",
  applicationName: "ConferenceHub",
  keywords: [
    "conférence", "conférences académiques", "recherche",
    "papiers scientifiques", "soumission d'articles", "inscription", "certificats de participation",
  ],
  authors: [{ name: "ConferenceHub" }],
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}