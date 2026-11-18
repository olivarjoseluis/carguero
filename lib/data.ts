import "server-only";
import { publicClient } from "./supabase";
import type { PublicDriver, Zone } from "./types";

/**
 * Lee zonas y conductores aprobados desde Supabase.
 * Si todavía no configuraste Supabase (.env.local vacío), usa datos de ejemplo
 * para que puedas ver la landing funcionando desde el primer `npm run dev`.
 */
export async function getDirectory(): Promise<{ zones: Zone[]; drivers: PublicDriver[]; demo: boolean }> {
  const sb = publicClient();
  if (!sb) return { zones: SAMPLE_ZONES, drivers: SAMPLE_DRIVERS, demo: true };

  const [zonesRes, driversRes] = await Promise.all([
    sb.from("zones").select("*").order("city_slug").order("sort_order"),
    sb.from("public_drivers").select("*").order("rating_avg", { ascending: false }),
  ]);

  if (zonesRes.error) throw new Error(`Supabase zones: ${zonesRes.error.message}`);
  if (driversRes.error) throw new Error(`Supabase public_drivers: ${driversRes.error.message}`);

  return {
    zones: zonesRes.data as Zone[],
    drivers: (driversRes.data as PublicDriver[]).map((d) => ({ ...d, rating_avg: Number(d.rating_avg) })),
    demo: false,
  };
}

export async function getZones(): Promise<Zone[]> {
  const sb = publicClient();
  if (!sb) return SAMPLE_ZONES;
  const { data, error } = await sb.from("zones").select("*").order("city_slug").order("sort_order");
  if (error) throw new Error(`Supabase zones: ${error.message}`);
  return data as Zone[];
}

// ─── Datos de ejemplo (mismos que supabase/seed.sql) ───────────────────────────
const z = (id: string, city_slug: string, name: string, lat: number, lng: number, sort_order: number): Zone => ({
  id, city_slug, city_name: city_slug === "cali" ? "Cali" : "Jamundí", name, lat, lng, sort_order,
});

export const SAMPLE_ZONES: Zone[] = [
  z("valle-del-lili", "cali", "Valle del Lili", 3.374, -76.523, 1),
  z("ciudad-jardin", "cali", "Ciudad Jardín", 3.364, -76.535, 2),
  z("el-caney", "cali", "El Caney", 3.392, -76.515, 3),
  z("pance", "cali", "Pance", 3.333, -76.545, 4),
  z("san-fernando", "cali", "San Fernando", 3.433, -76.543, 5),
  z("centro-cali", "cali", "Centro", 3.452, -76.532, 6),
  z("el-limonar", "cali", "El Limonar", 3.395, -76.54, 7),
  z("melendez", "cali", "Meléndez", 3.378, -76.548, 8),
  z("alfaguara", "jamundi", "Alfaguara", 3.279, -76.533, 1),
  z("terranova", "jamundi", "Terranova", 3.263, -76.544, 2),
  z("ciudad-country", "jamundi", "Ciudad Country", 3.286, -76.521, 3),
  z("centro-jamundi", "jamundi", "Centro", 3.2605, -76.5395, 4),
  z("bochalema", "jamundi", "Bochalema", 3.3, -76.53, 5),
];

const d = (
  id: string, display_name: string, body_type: PublicDriver["body_type"], capacity_kg: number,
  city_slug: string, lat: number, lng: number, zone_ids: string[], rating_avg: number,
  review_count: number, jobs_count: number, verified: boolean, latest_quote: string,
): PublicDriver => ({
  id, slug: id, display_name,
  initials: display_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
  body_type, capacity_kg, schedule: ["semana"], verified, city_slug, lat, lng, photo: null,
  rating_avg, review_count, jobs_count, is_sample: true, zone_ids, latest_quote,
});

export const SAMPLE_DRIVERS: PublicDriver[] = [
  d("hernan-r", "Hernán R.", "volteo", 1000, "cali", 3.376, -76.5225, ["valle-del-lili", "el-caney"], 4.9, 38, 112, true, "Llevó los escombros de la remodelación en un solo viaje."),
  d("marisol-g", "Marisol G.", "furgon", 600, "cali", 3.35, -76.54, ["ciudad-jardin", "pance"], 4.8, 21, 64, true, "El furgón cerrado fue clave porque estaba lloviendo."),
  d("jhon-c", "Jhon C.", "platon", 1000, "cali", 3.445, -76.537, ["centro-cali", "san-fernando"], 4.7, 54, 160, false, "Me ayudó a cargar el sofá por las escaleras sin cobrar extra."),
  d("luz-m", "Luz M.", "furgon", 700, "cali", 3.43, -76.544, ["san-fernando", "centro-cali"], 5.0, 12, 30, true, "Muy amable y el precio fue el que acordamos."),
  d("oscar-p", "Óscar P.", "platon", 900, "cali", 3.388, -76.516, ["el-caney", "valle-del-lili"], 4.6, 17, 48, false, "Rápido para un mini trasteo de domingo."),
  d("wilson-a", "Wilson A.", "volteo", 1200, "cali", 3.34, -76.547, ["pance", "ciudad-jardin"], 4.8, 9, 22, true, "Llevó arena y ladrillo hasta la finca sin problema."),
  d("diego-t", "Diego T.", "platon", 800, "jamundi", 3.277, -76.535, ["alfaguara", "terranova"], 4.9, 26, 81, true, "Conoce todos los conjuntos de Alfaguara, cero vueltas."),
  d("yaneth-l", "Yaneth L.", "furgon", 600, "jamundi", 3.285, -76.522, ["ciudad-country", "centro-jamundi"], 4.7, 14, 37, false, "Me trasteó el local en dos viajes, muy organizada."),
  d("carlos-e", "Carlos E.", "volteo", 1000, "jamundi", 3.262, -76.541, ["centro-jamundi", "terranova"], 4.8, 31, 95, true, "Cumplido y con buen precio para escombros."),
];
