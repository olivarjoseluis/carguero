import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo afecta a `next dev`: permite probar desde el celular en la red local (http://192.168.18.65:3000).
  // Si tu IP cambia, actualízala aquí.
  allowedDevOrigins: ["192.168.18.65"],
  // Las fotos del registro van directo del navegador a Supabase Storage (lib/photos.ts),
  // así que las server actions usan el límite por defecto de 1 MB.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
