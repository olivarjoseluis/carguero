import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Carguero: motocarros y acarreos en Jamundí y Cali, directo por WhatsApp";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "Jamundí y Cali",
    title: "Tu carguero de confianza, a la vuelta de la esquina.",
    subtitle: "Encuentra motocarros en tu barrio, mira sus reseñas y escríbeles directo por WhatsApp.",
    badge: "Sin intermediarios",
  });
}
