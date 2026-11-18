import type { Metadata } from "next";
import { getZones } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { RegistroForm } from "@/components/RegistroForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Registra tu carguero gratis · Carguero",
  description: "Crea gratis el perfil de tu motocarro en Cali o Jamundí y recibe clientes de tu zona por WhatsApp. Sin comisiones.",
};

export default async function RegistroPage() {
  const zones = await getZones();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader variant="minimal" />
      <main className="flex-1 bg-paper">
        <RegistroForm zones={zones} />
      </main>
    </div>
  );
}
