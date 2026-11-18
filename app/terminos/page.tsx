import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Términos de uso · Carguero" };

export default function Terminos() {
  return (
    <LegalPage title="Términos de uso">
      <p>Carguero es un directorio que conecta a personas que necesitan un acarreo con conductores independientes de motocarros en Cali y Jamundí.</p>
      <h2>Rol de Carguero</h2>
      <p>Carguero no presta el servicio de transporte ni cobra comisiones. El precio, la hora y las condiciones se acuerdan directamente entre cliente y conductor, que son responsables del servicio.</p>
      <h2>Conductores</h2>
      <p>Cada conductor declara que su información y sus documentos (SOAT, revisión técnico-mecánica y licencia) son verdaderos y están vigentes. Carguero puede suspender perfiles con información falsa o malas prácticas.</p>
      <h2>Reseñas</h2>
      <p>Solo puede calificar quien contactó al conductor desde Carguero. Retiramos reseñas ofensivas, falsas o que incluyan datos personales.</p>
    </LegalPage>
  );
}
