import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { VercelAnalytics } from "@/components/VercelAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", weight: ["600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Carguero · Motocarros y acarreos en Cali y Jamundí",
  description:
    "Encuentra motocarros cerca de ti en Cali y Jamundí, mira sus valoraciones y escríbeles directo por WhatsApp. Sin intermediarios ni comisiones.",
  openGraph: { title: "Carguero", description: "Tu carguero de confianza, a la vuelta de la esquina.", images: ["/motocarro.png"] },
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
