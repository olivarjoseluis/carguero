import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Nombres actuales de Supabase (Publishable / Secret). Se aceptan también los antiguos (anon / service_role).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Sin URL ni publishable key la app corre en modo demo con datos de ejemplo. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/** Cliente con la publishable key: solo lee vistas públicas y llama funciones públicas. */
export function publicClient(): SupabaseClient | null {
  if (!url || !publishableKey) return null;
  return createClient(url, publishableKey, { auth: { persistSession: false } });
}

/**
 * Cliente con la secret key: SOLO en el servidor (registro, contactos y lista de espera).
 * Devuelve null únicamente en modo demo. Si Supabase está conectado pero falta la secret key,
 * falla en voz alta en lugar de fingir que guardó.
 */
export function adminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!secretKey) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en .env.local (Supabase > Project Settings > API Keys > Secret keys).",
    );
  }
  return createClient(url!, secretKey, { auth: { persistSession: false } });
}
