import type { Metadata } from "next";
import { Inter, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

const SITE_TITLE = "Gama Express — Exterior Auto Parts for Every Vehicle";
const SITE_DESCRIPTION = "Genuine and aftermarket exterior auto parts in Kosovo — bumpers, body panels, lighting, mirrors, glass, and trim. Search by vehicle or OEM number. Fast delivery, verified fitment.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Gama Express",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "auto pjese Kosove",
    "pjese kembimi makina",
    "pjese kembimi per makina",
    "exterior auto parts Kosovo",
    "auto parts Kosovo",
    "bumper Kosove",
    "parafango Kosove",
    "OEM parts Kosovo",
    "pjese origjinale makine",
    "pasqyra makine Kosove",
    "xhama makine Kosove",
    "body panels Kosovo",
    "car bumpers Kosovo",
    "auto parts Prishtine",
    "auto parts Prizren",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Gama Express",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.jpg", width: 1707, height: 740 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable} ${plexMono.variable}`}>
      <body className="font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
