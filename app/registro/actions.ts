"use server";

import { adminClient } from "@/lib/supabase";
import { BODY_TYPES, SCHEDULES } from "@/lib/types";
import { MAX_PHOTOS, PHOTO_EXT } from "@/lib/photos";
import { verifyTurnstile } from "@/lib/turnstile";

export type RegisterResult =
  | { ok: true; firstName: string; slug: string | null; uploads: string[] }
  | { ok: false; error: string };

// Las URLs firmadas de subida duran 2 horas; después de eso no se aceptan fotos nuevas para el registro.
const PHOTO_WINDOW_MS = 2 * 60 * 60 * 1000;

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const titleCase = (s: string) =>
  s.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());

/**
 * Crea el conductor en estado "pending" (lo apruebas en Supabase cambiando status a 'approved')
 * y devuelve una URL firmada de subida por foto, en la carpeta <slug>/ del bucket "fotos".
 * El navegador sube las fotos directo a Storage y luego llama attachPhotos(slug).
 */
export async function registerDriver(form: FormData): Promise<RegisterResult> {
  const firstName = titleCase(String(form.get("firstName") ?? ""));
  const lastName = titleCase(String(form.get("lastName") ?? ""));
  const whatsapp = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
  const email = String(form.get("email") ?? "").trim().toLowerCase() || null;
  const plate = String(form.get("plate") ?? "").trim().toUpperCase().slice(0, 10) || null;
  const bodyType = String(form.get("bodyType") ?? "");
  const capacity = Number(form.get("capacity"));
  const city = String(form.get("city") ?? "");
  const zones = form.getAll("zones").map(String).slice(0, 4);
  const schedule = form.getAll("schedule").map(String).filter((s) => SCHEDULES.some((x) => x.id === s));
  const consent = form.get("consent") === "on";
  const photoTypes = form.getAll("photoTypes").map(String);

  // Validación en el servidor (nunca confíes solo en la del navegador)
  if (!firstName || !lastName) return { ok: false, error: "Escribe tu nombre y apellidos." };
  if (!/^3\d{9}$/.test(whatsapp)) return { ok: false, error: "El WhatsApp debe tener 10 dígitos y empezar por 3." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Revisa el correo." };
  if (!BODY_TYPES.some((b) => b.id === bodyType)) return { ok: false, error: "Elige el tipo de carrocería." };
  if (!Number.isFinite(capacity) || capacity < 100 || capacity > 5000) return { ok: false, error: "Elige la capacidad." };
  if (!["cali", "jamundi"].includes(city)) return { ok: false, error: "Elige la ciudad." };
  if (!zones.length) return { ok: false, error: "Elige al menos un barrio." };
  if (!schedule.length) return { ok: false, error: "Elige qué días trabajas." };
  if (!consent) return { ok: false, error: "Necesitamos tu autorización de datos para publicar el perfil." };
  if (photoTypes.length > MAX_PHOTOS || photoTypes.some((t) => !(t in PHOTO_EXT)))
    return { ok: false, error: "Las fotos deben ser JPG, PNG o WebP (máximo 4)." };

  // Cloudflare Turnstile: después de validar el formulario, antes de tocar la base de datos
  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), "signup")))
    return { ok: false, error: "No pudimos confirmar que eres una persona. Espera la verificación e intenta de nuevo." };

  const sb = adminClient();
  if (!sb) return { ok: true, firstName: firstName.split(" ")[0], slug: null, uploads: [] }; // Modo demo sin Supabase

  // Ubicación aproximada = centro del primer barrio elegido (nunca la dirección del conductor)
  const { data: zoneRows, error: zErr } = await sb.from("zones").select("id, lat, lng").eq("city_slug", city).in("id", zones);
  if (zErr || !zoneRows?.length) return { ok: false, error: "Los barrios elegidos no son válidos." };
  const first = zoneRows.find((z) => z.id === zones[0]) ?? zoneRows[0];

  const slug = `${slugify(firstName.split(" ")[0])}-${slugify(lastName)[0] ?? "x"}-${crypto.randomUUID().slice(0, 6)}`;

  const { data: driver, error } = await sb
    .from("drivers")
    .insert({
      slug,
      first_name: firstName,
      last_name: lastName,
      whatsapp,
      email,
      plate,
      body_type: bodyType,
      capacity_kg: capacity,
      schedule,
      has_soat: form.get("soat") === "on",
      has_tecno: form.get("tecno") === "on",
      has_license: form.get("license") === "on",
      city_slug: city,
      location: `SRID=4326;POINT(${first.lng} ${first.lat})`,
      photos: [],
      consent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !driver) {
    console.error("registerDriver", error);
    return { ok: false, error: "No pudimos guardar tu registro. Intenta de nuevo en un momento." };
  }

  await sb.from("driver_zones").insert(zones.filter((z) => zoneRows.some((r) => r.id === z)).map((zone_id) => ({ driver_id: driver.id, zone_id })));

  // Fotos: una URL firmada por foto. Si alguna falla, el registro igual queda guardado.
  const uploads: string[] = [];
  for (const [i, type] of photoTypes.entries()) {
    const { data } = await sb.storage.from("fotos").createSignedUploadUrl(`${slug}/${i + 1}.${PHOTO_EXT[type]}`);
    if (!data) break; // uploads[i] debe corresponder a la foto i
    uploads.push(data.signedUrl);
  }

  return { ok: true, firstName: firstName.split(" ")[0], slug, uploads };
}

/**
 * Guarda en el perfil las fotos que el navegador ya subió a <slug>/.
 * Solo publica lo que de verdad existe en Storage (y solo se pudo subir con las URLs firmadas
 * que recibió quien hizo el registro), así que llamarla de nuevo no permite colar fotos ajenas.
 */
export async function attachPhotos(slug: string): Promise<{ ok: boolean }> {
  if (typeof slug !== "string" || !/^[a-z0-9-]{3,80}$/.test(slug)) return { ok: false };
  const sb = adminClient();
  if (!sb) return { ok: true };

  const { data: driver } = await sb.from("drivers").select("id, status, created_at").eq("slug", slug).maybeSingle();
  if (!driver || driver.status !== "pending" || Date.now() - new Date(driver.created_at).getTime() > PHOTO_WINDOW_MS)
    return { ok: false };

  const { data: stored } = await sb.storage.from("fotos").list(slug, { limit: MAX_PHOTOS + 1, sortBy: { column: "name", order: "asc" } });
  const photos = (stored ?? [])
    .filter((o) => /^[1-4]\.(jpg|webp|png)$/.test(o.name))
    .map((o) => sb.storage.from("fotos").getPublicUrl(`${slug}/${o.name}`).data.publicUrl);

  const { error } = await sb.from("drivers").update({ photos }).eq("id", driver.id);
  return { ok: !error };
}
