import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devismebernardpeintre.com"),
  title: {
    default: "Bernard Devisme — peintre, sculpteur, infographiste",
    template: "%s · Bernard Devisme",
  },
  description:
    "Œuvre de Bernard Devisme — peinture, sculpture, dessin, gravure, infographie, raku, installation. Catalogue, expositions et journal d'atelier.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Bernard Devisme",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      {/* Layout racine minimal : le chrome du site vit dans (site)/layout.tsx,
          pour que /studio s'affiche seul, en plein écran. */}
      <body className="min-h-full">{children}</body>
    </html>
  );
}
