import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Registra tu motocarro gratis en Carguero y recibe clientes de tu zona";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Para conductores",
    title: "Pon tu carguero donde los clientes lo buscan.",
    subtitle: "Registro en 5 minutos. Recibe clientes de tu zona por WhatsApp.",
    badge: "Gratis · Sin comisiones",
  });
}
