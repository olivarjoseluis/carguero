"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BodyType, PublicDriver, Zone } from "@/lib/types";
import { BODY_TYPES } from "@/lib/types";
import { formatKg, formatRating, plural, vehicleLabel } from "@/lib/format";
import { ArrowRight, Check, ChevronDown, PinIcon, TruckGlyph, WhatsAppIcon } from "./icons";

type Sort = "rating" | "reviews";

const CITIES = [
  { slug: "cali", name: "Cali" },
  { slug: "jamundi", name: "Jamundí" },
];

/** Hero con selector + mapa, y la sección de resultados. Comparten el estado de filtros. */
export function Finder({ zones, drivers, demo }: { zones: Zone[]; drivers: PublicDriver[]; demo: boolean }) {
  const [city, setCity] = useState("cali");
  const [zone, setZone] = useState("");
  const [type, setType] = useState<BodyType | "all">("all");
  const [sort, setSort] = useState<Sort>("rating");
  const [selected, setSelected] = useState<string | null>(null);

  const cityZones = useMemo(() => zones.filter((z) => z.city_slug === city), [zones, city]);
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? "";
  const cityName = CITIES.find((c) => c.slug === city)?.name ?? city;

  const list = useMemo(() => {
    let l = drivers.filter((d) => d.city_slug === city);
    if (zone) l = l.filter((d) => d.zone_ids.includes(zone));
    if (type !== "all") l = l.filter((d) => d.body_type === type);
    return [...l].sort((a, b) =>
      sort === "rating" ? b.rating_avg - a.rating_avg || b.review_count - a.review_count : b.review_count - a.review_count,
    );
  }, [drivers, city, zone, type, sort]);

  const selId = list.some((d) => d.id === selected) ? selected : list[0]?.id ?? null;
  const sel = list.find((d) => d.id === selId) ?? null;
  const place = zone ? `${zoneName(zone)}, ${cityName}` : cityName;
  const n = list.length;
  // Sin filtros y sin resultados = la ciudad todavía no tiene conductores (lanzamiento)
  const filtered = Boolean(zone) || type !== "all";
  const launching = n === 0 && !filtered;

  // Proyección simple lat/lng → % dentro del recuadro de la ciudad
  const bounds = useMemo(() => {
    const pts = cityZones.map((z) => [z.lat, z.lng] as const);
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
  }, [cityZones]);
  const project = (lat: number, lng: number) => {
    const x = bounds.maxLng === bounds.minLng ? 0.5 : (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
    const y = bounds.maxLat === bounds.minLat ? 0.5 : (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat);
    return { left: `${12 + x * 76}%`, top: `${20 + y * 58}%` };
  };

  const pickCity = (slug: string) => { setCity(slug); setZone(""); setSelected(null); };
  const showOnMap = (id: string) => {
    setSelected(id);
    document.getElementById("inicio")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* HERO */}
      <section id="inicio" className="bg-black text-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-stretch gap-12 px-6 pb-24 pt-16">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col justify-center gap-8">
            <div className="flex flex-col gap-5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#d6d6d6]">
                <span className="h-2 w-2 rounded-full bg-accent" />Cali · Jamundí
              </span>
              <h1 className="m-0 font-display text-[clamp(40px,5.4vw,66px)] font-bold leading-[1.02] tracking-[-0.03em]">
                Tu carguero de confianza, a la vuelta de la esquina.
              </h1>
              <p className="m-0 max-w-[520px] text-[19px] leading-[1.55] text-[#d6d6d6]">
                Encuentra motocarros cerca de ti, mira sus valoraciones y escríbeles directo por WhatsApp. Sin intermediarios ni comisiones.
              </p>
            </div>

            <div className="flex max-w-[520px] flex-col gap-5 rounded-[20px] bg-white p-6 text-black shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <div className="flex flex-col gap-2.5">
                <span id="lbl-ciudad" className="text-[13px] font-semibold text-muted">Ciudad</span>
                <div role="group" aria-labelledby="lbl-ciudad" className="flex gap-2 rounded-full bg-chip p-1">
                  {CITIES.map((c) => (
                    <button
                      key={c.slug} type="button" aria-pressed={c.slug === city} onClick={() => pickCity(c.slug)}
                      className={`h-11 flex-1 cursor-pointer rounded-full px-4 text-base font-semibold ${c.slug === city ? "bg-black text-white" : "bg-transparent text-black"}`}
                    >{c.name}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="barrio" className="text-[13px] font-semibold text-muted">Barrio o sector</label>
                <div className="relative">
                  <select
                    id="barrio" value={zone} onChange={(e) => { setZone(e.target.value); setSelected(null); }}
                    className="h-14 w-full appearance-none rounded-xl border-0 bg-chip px-12 text-[17px] font-medium text-black"
                  >
                    <option value="">Toda la ciudad</option>
                    {cityZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                  <span className="pointer-events-none absolute left-4 top-[18px]"><PinIcon /></span>
                  <span className="pointer-events-none absolute right-4 top-[18px]"><ChevronDown /></span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span id="lbl-tipo" className="text-[13px] font-semibold text-muted">Tipo de carrocería</span>
                <div role="group" aria-labelledby="lbl-tipo" className="flex flex-wrap gap-2">
                  {[{ id: "all" as const, label: "Todos" }, ...BODY_TYPES].map((t) => (
                    <button
                      key={t.id} type="button" aria-pressed={t.id === type} onClick={() => { setType(t.id); setSelected(null); }}
                      className={`h-11 cursor-pointer rounded-full border px-4 text-[15px] font-medium ${t.id === type ? "border-black bg-black text-white" : "border-[#d6d6d6] bg-white text-black"}`}
                    >{t.label}</button>
                  ))}
                </div>
              </div>

              <a href="#resultados" className="flex h-14 items-center justify-center gap-2.5 rounded-xl bg-accent text-[17px] font-bold text-black no-underline">
                <span>{n > 0 ? `Ver ${plural(n, "carguero", "cargueros")}` : "Ver cargueros"}</span>
                <ArrowRight />
              </a>
            </div>
          </div>

          {/* MAPA */}
          <div className="relative min-h-[580px] min-w-0 flex-[1_1_520px] overflow-hidden rounded-[28px] bg-[#1a1a1a]">
            <MapBackdrop />
            <div className="absolute left-5 right-5 top-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[15px] font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.25)]" aria-live="polite">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span>{launching ? `Muy pronto en ${place}` : `${plural(n, "carguero", "cargueros")} en ${place}`}</span>
              </div>
              {demo && <span className="rounded-full bg-white/15 px-3 py-2 text-[13px] font-medium text-white">Perfiles de ejemplo</span>}
            </div>

            {list.filter((d) => d.lat != null && d.lng != null).map((d) => {
              const on = d.id === selId;
              const pos = project(d.lat as number, d.lng as number);
              return (
                <button
                  key={d.id} type="button" onClick={() => setSelected(d.id)} aria-label={`Ver a ${d.display_name}, ${vehicleLabel(d.body_type)}`}
                  aria-pressed={on}
                  style={pos}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 transition-all duration-150 ${on ? "h-[54px] w-[54px] bg-accent shadow-[0_0_0_8px_rgba(255,255,255,0.16)]" : "h-11 w-11 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.4)]"}`}
                >
                  <TruckGlyph />
                </button>
              );
            })}

            {sel && (
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center gap-3.5 rounded-[18px] bg-white px-[18px] py-4 text-black shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
                <Avatar initials={sel.initials} size={52} />
                <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[17px] font-semibold">{sel.display_name}</span>
                    <span className="text-sm font-semibold">★ {formatRating(sel.rating_avg)}</span>
                    <span className="text-sm text-muted">({plural(sel.review_count, "reseña", "reseñas")})</span>
                  </div>
                  <span className="text-sm text-muted">
                    {vehicleLabel(sel.body_type)} · Hasta {formatKg(sel.capacity_kg)} · {sel.zone_ids.map(zoneName).join(", ")}
                  </span>
                </div>
                <WhatsAppButton driver={sel} compact />
              </div>
            )}
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* RESULTADOS */}
      <section id="resultados" className="scroll-mt-4 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-9 px-6 py-[88px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <h2 className="m-0 font-display text-[clamp(32px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.025em]">Cargueros en {place}</h2>
              <p className="m-0 text-[17px] text-muted">
                {n > 0
                  ? `${plural(n, "conductor disponible", "conductores disponibles")}.`
                  : launching ? "Aún no hay conductores publicados." : "Sin resultados con estos filtros."}
                {demo && n > 0 ? " Perfiles de ejemplo." : ""}
              </p>
            </div>
            <div role="group" aria-label="Ordenar" className={`gap-2 rounded-full bg-chip p-1 ${n > 1 ? "flex" : "hidden"}`}>
              {([["rating", "Mejor valorados"], ["reviews", "Más reseñas"]] as const).map(([id, label]) => (
                <button
                  key={id} type="button" aria-pressed={sort === id} onClick={() => setSort(id)}
                  className={`h-10 cursor-pointer rounded-full border-0 px-3.5 text-sm font-semibold ${sort === id ? "bg-black text-white" : "bg-transparent text-black"}`}
                >{label}</button>
              ))}
            </div>
          </div>

          {n > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-5">
              {list.map((d) => (
                <article key={d.id} className={`flex flex-col gap-[18px] rounded-[20px] border-2 bg-white p-6 transition-colors ${d.id === selId ? "border-black" : "border-[#ececec]"}`}>
                  <div className="flex items-center gap-3.5">
                    <Avatar initials={d.initials} size={56} />
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="m-0 text-lg font-semibold">{d.display_name}</h3>
                        {d.verified && <Check label="Documentos verificados" />}
                      </div>
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="whitespace-nowrap">
                          <span className="font-semibold">★ {formatRating(d.rating_avg)}</span>
                          <span className="text-muted"> · {plural(d.review_count, "reseña", "reseñas")}</span>
                        </span>
                        <span className="text-muted">{plural(d.jobs_count, "servicio", "servicios")}</span>
                      </div>
                    </div>
                  </div>
                  <dl className="m-0 flex flex-col text-[15px]">
                    <Row k="Vehículo" v={vehicleLabel(d.body_type)} />
                    <Row k="Capacidad" v={`Hasta ${formatKg(d.capacity_kg)}`} />
                    <Row k="Zonas" v={d.zone_ids.map(zoneName).join(", ")} />
                  </dl>
                  {d.latest_quote && (
                    <blockquote className="m-0 rounded-xl bg-paper px-4 py-3.5 text-sm leading-normal text-[#333]">“{d.latest_quote}”</blockquote>
                  )}
                  <div className="mt-auto flex gap-2.5">
                    <WhatsAppButton driver={d} />
                    <button
                      type="button" onClick={() => showOnMap(d.id)} aria-label={`Ver a ${d.display_name} en el mapa`}
                      className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center rounded-xl border-0 bg-chip"
                    ><PinIcon /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : launching ? (
            <div className="flex flex-col items-center gap-4 rounded-[20px] bg-paper px-6 py-12 text-center sm:px-8">
              <h3 className="m-0 font-display text-[26px] font-bold tracking-[-0.02em]">Carguero está arrancando en {cityName}</h3>
              <p className="m-0 max-w-[460px] text-base leading-normal text-muted">
                Estamos sumando a los primeros conductores. ¿Tienes motocarro? Registra tu perfil gratis y sé de los primeros en aparecer cuando los vecinos busquen.
              </p>
              <Link href="/registro" className="inline-flex h-12 items-center rounded-full bg-accent px-[22px] text-[15px] font-bold text-black no-underline">
                Registra tu carguero gratis
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-[20px] bg-paper px-6 py-12 text-center sm:px-8">
              <h3 className="m-0 font-display text-[26px] font-bold tracking-[-0.02em]">Aún no hay cargueros en este sector</h3>
              <p className="m-0 max-w-[460px] text-base leading-normal text-muted">
                Prueba con toda la ciudad o con otro tipo de carrocería. ¿Conoces a un conductor de la zona? Invítalo a registrarse gratis.
              </p>
              <button type="button" onClick={() => { setZone(""); setType("all"); }} className="h-12 cursor-pointer rounded-full border-0 bg-black px-[22px] text-[15px] font-semibold text-white">
                Ver toda la ciudad
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-[#eee] py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="m-0 text-right font-medium">{v}</dd>
    </div>
  );
}

export function Avatar({ initials, size }: { initials: string; size: number }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      className="flex flex-none items-center justify-center rounded-full bg-black font-display font-bold text-white"
    >{initials}</div>
  );
}

/** El enlace pasa por /c/[id]: registra el contacto (habilita la reseña) y redirige a WhatsApp sin exponer el número. */
function WhatsAppButton({ driver, compact = false }: { driver: PublicDriver; compact?: boolean }) {
  return (
    <a
      href={`/c/${driver.id}`} target="_blank" rel="noopener"
      aria-label={`Escribir a ${driver.display_name} por WhatsApp`}
      className={`inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap bg-accent font-bold text-black no-underline ${compact ? "h-12 rounded-full px-[18px] text-[15px]" : "h-12 flex-auto rounded-xl px-3.5 text-[15px]"}`}
    >
      <WhatsAppIcon />
      <span>WhatsApp</span>
    </a>
  );
}

function TrustStrip() {
  const items = ["Valoraciones de clientes reales", "Contacto directo por WhatsApp", "Cero comisiones por servicio", "Conductores de tu barrio"];
  return (
    <section className="border-b border-[#e8e8e8]">
      <ul className="m-0 mx-auto flex max-w-[1280px] list-none flex-wrap justify-between gap-x-12 gap-y-4 px-6 py-7">
        {items.map((t) => (
          <li key={t} className="flex flex-[1_1_240px] items-center gap-3 text-base font-medium">
            <span className="h-2 w-2 flex-none rounded-full bg-accent" />{t}
          </li>
        ))}
      </ul>
    </section>
  );
}

function MapBackdrop() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0">
      <rect width="600" height="640" fill="#1A1A1A" />
      <path d="M-20 120 C 120 140, 220 60, 360 110 S 560 150, 640 90" stroke="#2C2C2C" strokeWidth="18" fill="none" />
      <path d="M-20 330 C 140 300, 260 380, 420 330 S 580 300, 640 340" stroke="#2C2C2C" strokeWidth="26" fill="none" />
      <path d="M150 -20 C 170 160, 120 320, 180 660" stroke="#2C2C2C" strokeWidth="14" fill="none" />
      <path d="M420 -20 C 400 200, 470 380, 430 660" stroke="#2C2C2C" strokeWidth="20" fill="none" />
      <path d="M-20 520 C 160 500, 300 560, 640 500" stroke="#262626" strokeWidth="12" fill="none" />
      <path d="M260 -20 L 300 660" stroke="#242424" strokeWidth="6" fill="none" />
      <path d="M-20 220 L 640 250" stroke="#242424" strokeWidth="6" fill="none" />
      <path d="M-20 430 L 640 420" stroke="#242424" strokeWidth="6" fill="none" />
      <path d="M520 -20 C 540 200, 500 420, 560 660" stroke="#1F2B33" strokeWidth="30" fill="none" />
    </svg>
  );
}
