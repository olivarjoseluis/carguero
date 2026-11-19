import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { VercelAnalytics } from "@/components/VercelAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", weight: ["600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Carguero · Motocarros y acarreos en Cali y Jamundí",
  description:
    "Encuentra motocarros cerca de ti en Cali y Jamundí, mira sus valoraciones y escríbeles directo por WhatsApp. Sin intermediarios ni comisiones.",
  // La imagen sale de app/opengraph-image.tsx (y app/registro/opengraph-image.tsx para el registro)
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Carguero",
    title: "Carguero · Motocarros en Jamundí y Cali",
    description: "Tu carguero de confianza, a la vuelta de la esquina. Escríbeles directo por WhatsApp, sin intermediarios.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${interTight.variable}`}>
      <body className="font-sans">
        {children}
        <VercelAnalytics />
      </body>
    </html>
  );
}
