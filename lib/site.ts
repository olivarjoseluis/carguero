// URL pública del sitio. Orden: NEXT_PUBLIC_SITE_URL → dominio de producción de Vercel → localhost.
// Las tarjetas para redes sociales (og:image) necesitan una URL absoluta y pública: si quedara en
// localhost, WhatsApp y Facebook no podrían descargar la imagen.
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercelProd ? `https://${vercelProd}` : "http://localhost:3000")
).replace(/\/$/, "");
