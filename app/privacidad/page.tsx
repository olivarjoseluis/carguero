import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de tratamiento de datos · Carguero" };

export default function Privacidad() {
  return (
    <LegalPage title="Política de tratamiento de datos personales">
      <p>En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, [NOMBRE DEL RESPONSABLE], identificado con [NIT/CC], con domicilio en [CIUDAD] y correo [CORREO DE CONTACTO], es el responsable del tratamiento de los datos personales recogidos en Carguero.</p>
      <h2>Qué datos recogemos</h2>
      <p>De conductores: nombres, apellidos, número de WhatsApp, correo, placa, fotos del vehículo, barrios de trabajo y declaración de documentos. De clientes: el registro de que contactaron a un conductor y las reseñas que publican, sin datos de identificación.</p>
      <h2>Para qué los usamos</h2>
      <p>Para publicar el perfil del conductor, permitir que los clientes lo contacten, mostrar valoraciones y mejorar el servicio. Nunca publicamos el número de WhatsApp, la placa ni los apellidos completos.</p>
      <h2>Tus derechos</h2>
      <p>Puedes conocer, actualizar, rectificar y suprimir tus datos, y revocar la autorización, escribiendo a [CORREO DE CONTACTO]. Respondemos en los plazos de ley.</p>
    </LegalPage>
  );
}
