"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { BodyType, Zone } from "@/lib/types";
import { BODY_TYPES, CAPACITIES, SCHEDULES } from "@/lib/types";
import { attachPhotos, registerDriver } from "@/app/registro/actions";
import { MAX_PHOTOS, compressPhoto, isUploadable, uploadPhoto } from "@/lib/photos";
import { TURNSTILE_SITE_KEY, Turnstile, type TurnstileHandle } from "./Turnstile";
import { Avatar } from "./Finder";
import { ArrowRight, Check, ChevronDown, WhatsAppIcon } from "./icons";

const STEPS = ["Tus datos", "Vehículo", "Zona", "Documentos"];
const CITIES = [{ slug: "cali", name: "Cali" }, { slug: "jamundi", name: "Jamundí" }];
const DOCS = [
  { id: "soat", label: "SOAT vigente", hint: "Seguro obligatorio al día" },
  { id: "tecno", label: "Revisión técnico-mecánica", hint: "Si aplica según el modelo del vehículo" },
  { id: "license", label: "Licencia de conducción", hint: "Categoría acorde al vehículo" },
] as const;

const input = "h-14 w-full rounded-xl border border-[#d6d6d6] bg-white px-4 text-[17px] text-black";
const cap = (w: string) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "");

export function RegistroForm({ zones }: { zones: Zone[] }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [bodyType, setBodyType] = useState<BodyType | "">("");
  const [capacity, setCapacity] = useState("");
  const [plate, setPlate] = useState("");
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Enviando…");
  const [photoWarning, setPhotoWarning] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);
  const [city, setCity] = useState("cali");
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [consent, setConsent] = useState(false);

  const first = firstName.trim().split(/\s+/)[0] ?? "";
  const last = lastName.trim().split(/\s+/)[0] ?? "";
  const shortName = first ? `${cap(first)}${last ? ` ${last[0].toUpperCase()}.` : ""}` : "Tu nombre";
  const initials = first ? (first[0] + (last[0] ?? "")).toUpperCase() : "TÚ";
  const digits = whatsapp.replace(/\D/g, "");
  const cityZones = zones.filter((z) => z.city_slug === city);
  const verified = DOCS.every((d) => docs[d.id]);

  const validate = (s: number) => {
    if (s === 1) {
      if (!first) return "Escribe tu nombre.";
      if (!last) return "Escribe tus apellidos.";
      if (!/^3\d{9}$/.test(digits)) return "Revisa tu WhatsApp: debe tener 10 dígitos y empezar por 3.";
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Revisa el correo.";
    }
    if (s === 2) {
      if (!bodyType) return "Elige el tipo de carrocería.";
      if (!capacity) return "Elige la capacidad de carga.";
    }
    if (s === 3) {
      if (!zoneIds.length) return "Elige al menos un barrio donde trabajas.";
      if (!schedule.length) return "Cuéntanos qué días trabajas.";
    }
    if (s === 4 && !consent) return "Para publicar tu perfil necesitamos tu autorización de datos.";
    return "";
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string, max?: number) => {
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else if (!max || list.length < max) set([...list, id]);
    setError("");
  };

  const pickPhotos = async (files: File[]) => {
    setError("");
    setCompressing(true);
    const blobs = await Promise.all(files.slice(0, MAX_PHOTOS).map((f) => compressPhoto(f)));
    setCompressing(false);
    const ok = blobs.filter(isUploadable);
    setPhotos(ok);
    if (ok.length < blobs.length)
      setError(`${blobs.length - ok.length === 1 ? "Una foto no se pudo usar" : "Algunas fotos no se pudieron usar"}. Prueba con una foto JPG o PNG de la galería.`);
  };

  const next = () => {
    if (compressing) return;
    const err = validate(step);
    if (err) return setError(err);
    setError("");
    if (step < 4) return setStep(step + 1);

    const fd = new FormData();
    fd.set("firstName", firstName);
    fd.set("lastName", lastName);
    fd.set("whatsapp", digits);
    fd.set("email", email);
    fd.set("plate", plate);
    fd.set("bodyType", bodyType);
    fd.set("capacity", capacity);
    fd.set("city", city);
    zoneIds.forEach((z) => fd.append("zones", z));
    schedule.forEach((s) => fd.append("schedule", s));
    DOCS.forEach((d) => docs[d.id] && fd.set(d.id, "on"));
    if (consent) fd.set("consent", "on");
    photos.forEach((p) => fd.append("photoTypes", p.type));
    fd.set("cf-turnstile-response", captcha);

    start(async () => {
      // 1. Datos del registro (sin archivos). Verifica Turnstile y devuelve URLs firmadas para las fotos.
      setBusyLabel("Enviando…");
      const res = await registerDriver(fd);
      turnstile.current?.reset(); // El token sirve una sola vez
      if (!res.ok) return setError(res.error);

      // 2. Fotos: directo del navegador a Supabase Storage. Si fallan, el registro ya quedó guardado.
      if (res.slug && res.uploads.length) {
        setBusyLabel("Subiendo fotos…");
        const sent = await Promise.allSettled(res.uploads.map((url, i) => uploadPhoto(url, photos[i])));
        const attached = await attachPhotos(res.slug);
        setPhotoWarning(sent.some((s) => s.status === "rejected") || res.uploads.length < photos.length || !attached.ok);
      }
      setDone(res.firstName);
    });
  };

  const checks = [first && last, digits.length === 10, bodyType, capacity, photos.length > 0, zoneIds.length > 0, schedule.length > 0, verified];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const zoneLabel = zoneIds.length
    ? `${zoneIds.map((id) => zones.find((z) => z.id === id)?.name).join(", ")} · ${CITIES.find((c) => c.slug === city)?.name}`
    : "Por definir";

  return (
    <div className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-10 px-6 pb-24 pt-14">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
        {done ? (
          <div className="flex flex-col gap-5 rounded-[28px] bg-black p-[clamp(28px,5vw,56px)] text-white" role="status">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" fill="none" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <h1 className="m-0 font-display text-[clamp(32px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">¡Listo, {done}! Tu perfil está en revisión.</h1>
            <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] text-[#d6d6d6]">
              Lo revisamos en menos de 24 horas y te avisamos por WhatsApp cuando esté publicado. Mientras tanto, comparte Carguero con tus clientes de siempre para que te dejen las primeras valoraciones.
            </p>
            {photoWarning && (
              <p className="m-0 max-w-[560px] rounded-xl bg-[#2a2a2a] px-4 py-3 text-[15px] leading-normal text-white">
                Algunas fotos no se pudieron subir. Tu registro sí quedó guardado: te las pediremos por WhatsApp.
              </p>
            )}
            <Link href="/" className="inline-flex h-[52px] items-center self-start rounded-xl bg-accent px-[22px] text-base font-bold text-black no-underline">Volver al inicio</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-muted">
                <span className="h-2 w-2 rounded-full bg-accent" />Registro gratis · 5 minutos
              </span>
              <h1 className="m-0 font-display text-[clamp(34px,4.2vw,52px)] font-bold leading-[1.05] tracking-[-0.03em]">Pon tu carguero donde los clientes lo buscan.</h1>
            </div>

            <ol aria-label="Pasos del registro" className="m-0 grid list-none grid-cols-4 gap-2 p-0">
              {STEPS.map((label, i) => {
                const n = i + 1;
                return (
                  <li key={label} className="flex flex-col gap-2" aria-current={n === step ? "step" : undefined}>
                    <span className={`block h-1 rounded-full ${n <= step ? "bg-black" : "bg-[#d6d6d6]"}`} />
                    <span className={`sr-only text-[13px] sm:not-sr-only ${n === step ? "font-bold" : "font-medium"} ${n <= step ? "text-black" : "text-[#6b6b6b]"}`}>{n}. {label}</span>
                  </li>
                );
              })}
            </ol>
            {/* En celular, los cuatro nombres no caben: solo se muestra el paso actual */}
            <p className="-mt-4 mb-0 text-sm font-semibold sm:hidden" aria-hidden="true">Paso {step} de 4 · {STEPS[step - 1]}</p>

            <div className="flex flex-col gap-6 rounded-3xl bg-white p-[clamp(20px,3vw,36px)]">
              {step === 1 && (
                <Section title="Tus datos" sub="Así te van a contactar los clientes. Tu número no se muestra: solo aparece el botón de WhatsApp.">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-4">
                      <Field id="f-nombre" label="Nombres" className="flex-[1_1_220px]">
                        <input id="f-nombre" className={input} autoComplete="given-name" placeholder="Ej. Hernán Darío" value={firstName} onChange={(e) => { setFirstName(e.target.value); setError(""); }} />
                      </Field>
                      <Field id="f-apellidos" label="Apellidos" className="flex-[1_1_220px]">
                        <input id="f-apellidos" className={input} autoComplete="family-name" placeholder="Ej. Rodríguez Gómez" value={lastName} onChange={(e) => { setLastName(e.target.value); setError(""); }} />
                      </Field>
                    </div>
                    <span className="text-[13px] text-muted">En tu perfil se verá como «{shortName}». Tus apellidos completos no se publican.</span>
                  </div>
                  <Field id="f-wa" label="Número de WhatsApp">
                    <div className="flex gap-2">
                      <span className="flex h-14 items-center rounded-xl bg-chip px-4 text-[17px] font-medium">+57</span>
                      <input id="f-wa" className={`${input} min-w-0 flex-auto`} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="300 123 4567" value={whatsapp} onChange={(e) => { setWhatsapp(e.target.value); setError(""); }} />
                    </div>
                  </Field>
                  <Field id="f-mail" label="Correo" hint="(para entrar a tu perfil)">
                    <input id="f-mail" className={input} type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                </Section>
              )}

              {step === 2 && (
                <Section title="Tu vehículo" sub="Los clientes filtran por tipo de carrocería y capacidad.">
                  <div className="flex flex-col gap-2.5">
                    <span id="lbl-carroceria" className="text-sm font-semibold">Tipo de carrocería</span>
                    <div role="group" aria-labelledby="lbl-carroceria" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                      {BODY_TYPES.map((b) => (
                        <button
                          key={b.id} type="button" aria-pressed={bodyType === b.id} onClick={() => { setBodyType(b.id); setError(""); }}
                          className={`flex min-h-[76px] cursor-pointer flex-col items-start gap-1 rounded-[14px] border-2 bg-white p-4 text-left text-black ${bodyType === b.id ? "border-black shadow-[inset_0_0_0_1px_#000]" : "border-[#e2e2e2]"}`}
                        >
                          <span className="text-base font-semibold">{b.label}</span>
                          <span className="text-[13px] text-muted">{b.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Field id="f-kg" label="Capacidad de carga" className="flex-[1_1_200px]">
                      <div className="relative">
                        <select id="f-kg" className={`${input} appearance-none pr-11`} value={capacity} onChange={(e) => { setCapacity(e.target.value); setError(""); }}>
                          <option value="">Elige una opción</option>
                          {CAPACITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <span className="pointer-events-none absolute right-3.5 top-[18px]"><ChevronDown /></span>
                      </div>
                    </Field>
                    <Field id="f-placa" label="Placa" hint="(no se publica)" className="flex-[1_1_200px]">
                      <input id="f-placa" className={`${input} uppercase`} placeholder="ABC12D" value={plate} onChange={(e) => setPlate(e.target.value)} />
                    </Field>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Fotos del vehículo</span>
                    <label htmlFor="f-fotos" className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#d6d6d6] p-5">
                      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3" fill="none" stroke="#000" strokeWidth="2" /><circle cx="12" cy="13" r="3.5" fill="none" stroke="#000" strokeWidth="2" /><path d="M9 6l1.5-2h3L15 6" fill="none" stroke="#000" strokeWidth="2" strokeLinejoin="round" /></svg>
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-base font-semibold" aria-live="polite">{compressing ? "Preparando fotos…" : photos.length ? `${photos.length} ${photos.length === 1 ? "foto lista" : "fotos listas"}` : "Agregar fotos"}</span>
                        <span className="text-[13px] text-muted">Hasta 4 fotos. Los perfiles con foto reciben más mensajes.</span>
                      </span>
                    </label>
                    <input id="f-fotos" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pickPhotos(Array.from(e.target.files ?? []))} />
                  </div>
                </Section>
              )}

              {step === 3 && (
                <Section title="Dónde trabajas" sub="Apareces cuando alguien busca en estos sectores. Nunca mostramos tu dirección.">
                  <div className="flex flex-col gap-2.5">
                    <span id="lbl-ciudad-r" className="text-sm font-semibold">Ciudad</span>
                    <div role="group" aria-labelledby="lbl-ciudad-r" className="flex max-w-[360px] gap-2 rounded-full bg-chip p-1">
                      {CITIES.map((c) => (
                        <button key={c.slug} type="button" aria-pressed={city === c.slug} onClick={() => { setCity(c.slug); setZoneIds([]); }}
                          className={`h-11 flex-1 cursor-pointer rounded-full border-0 px-4 text-base font-semibold ${city === c.slug ? "bg-black text-white" : "bg-transparent text-black"}`}>{c.name}</button>
                      ))}
                    </div>
                  </div>
                  <ChipGroup id="lbl-zonas" label="Barrios o sectores" hint="(elige hasta 4)"
                    items={cityZones.map((z) => ({ id: z.id, label: z.name }))} selected={zoneIds}
                    onToggle={(id) => toggle(zoneIds, setZoneIds, id, 4)} />
                  <ChipGroup id="lbl-horario" label="¿Cuándo trabajas?"
                    items={SCHEDULES} selected={schedule} onToggle={(id) => toggle(schedule, setSchedule, id)} />
                </Section>
              )}

              {step === 4 && (
                <Section title="Documentos y confianza" sub="Con los tres al día ganas el sello de verificado. Te pediremos una foto de cada uno después.">
                  <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e2e2e2]">
                    {DOCS.map((d, i) => (
                      <label key={d.id} className={`flex min-h-14 cursor-pointer items-center gap-3.5 px-5 py-[18px] ${i ? "border-t border-[#eee]" : ""}`}>
                        <input type="checkbox" checked={!!docs[d.id]} onChange={() => setDocs({ ...docs, [d.id]: !docs[d.id] })} className="h-[22px] w-[22px] flex-none accent-black" />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-base font-semibold">{d.label}</span>
                          <span className="text-[13px] text-muted">{d.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl bg-paper px-5 py-[18px]">
                    <input type="checkbox" checked={consent} onChange={() => { setConsent(!consent); setError(""); }} className="mt-0.5 h-[22px] w-[22px] flex-none accent-black" />
                    <span className="text-sm leading-[1.55] text-[#333]">
                      Autorizo a Carguero a tratar mis datos personales para publicar mi perfil y ponerme en contacto con clientes, según la{" "}
                      <Link href="/privacidad" target="_blank" className="font-semibold text-black">política de tratamiento de datos</Link> (Ley 1581 de 2012). Acepto los{" "}
                      <Link href="/terminos" target="_blank" className="font-semibold text-black">términos de uso</Link>.
                    </span>
                  </label>
                  <Turnstile ref={turnstile} action="signup" onToken={setCaptcha} />
                </Section>
              )}

              {error && (
                <div role="alert" className="flex items-center gap-2.5 rounded-xl bg-accent-soft px-4 py-3.5 text-[15px] font-medium text-[#8a2a06]">
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#8A2A06" strokeWidth="2" /><path d="M12 7.5v5.5M12 16.5v.01" stroke="#8A2A06" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-[#eee] pt-2">
                {step > 1 ? (
                  <button type="button" onClick={() => { setStep(step - 1); setError(""); }} className="h-[52px] flex-none cursor-pointer rounded-xl border-0 bg-chip px-4 text-base font-semibold text-black sm:px-5">Atrás</button>
                ) : (
                  <span className="hidden text-sm text-muted sm:inline">Paso 1 de 4</span>
                )}
                <button type="button" onClick={next} disabled={pending || compressing || (step === 4 && !!TURNSTILE_SITE_KEY && !captcha)}
                  className="inline-flex h-[52px] flex-1 cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border-0 bg-accent px-5 text-base font-bold text-black disabled:opacity-60 sm:ml-auto sm:flex-none sm:px-7">
                  <span>{pending ? busyLabel : step === 4 ? "Publicar mi perfil" : "Continuar"}</span>
                  <span className="hidden sm:block"><ArrowRight /></span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Vista previa */}
      <aside aria-label="Vista previa del perfil" className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Así te verán los clientes</span>
        <article className="flex flex-col gap-[18px] rounded-[20px] border-2 border-black bg-white p-6">
          <div className="flex items-center gap-3.5">
            <Avatar initials={initials} size={56} />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <h3 className="m-0 text-lg font-semibold">{shortName}</h3>
                {verified && <Check label="Documentos verificados" />}
              </div>
              <span className="text-sm text-muted">Nuevo en Carguero · sin reseñas aún</span>
            </div>
          </div>
          <dl className="m-0 flex flex-col text-[15px]">
            <PreviewRow k="Vehículo" v={bodyType ? `Motocarro · ${BODY_TYPES.find((b) => b.id === bodyType)?.label.toLowerCase()}` : "Por definir"} />
            <PreviewRow k="Capacidad" v={CAPACITIES.find((c) => String(c.value) === capacity)?.label ?? "Por definir"} />
            <PreviewRow k="Zonas" v={zoneLabel} />
            <PreviewRow k="Horario" v={schedule.length ? SCHEDULES.filter((s) => schedule.includes(s.id)).map((s) => s.label).join(", ") : "Por definir"} />
          </dl>
          <span className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent text-[15px] font-bold text-black">
            <WhatsAppIcon />WhatsApp
          </span>
        </article>
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white px-5 py-[18px]">
          <span className="text-[15px] font-semibold">Perfil completo al {completeness}%</span>
          <div className="h-2 overflow-hidden rounded-full bg-[#eee]" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="Perfil completo">
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${completeness}%` }} />
          </div>
          <span className="text-[13px] leading-normal text-muted">Gratis para siempre. Sin comisiones: lo que cobras es tuyo.</span>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-2xl font-bold tracking-[-0.01em]">{title}</h2>
        <p className="m-0 text-[15px] text-muted">{sub}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ id, label, hint, className = "", children }: { id: string; label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">{label} {hint && <span className="font-normal text-muted">{hint}</span>}</label>
      {children}
    </div>
  );
}

function ChipGroup({ id, label, hint, items, selected, onToggle }: {
  id: string; label: string; hint?: string; items: { id: string; label: string }[]; selected: string[]; onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span id={id} className="text-sm font-semibold">{label} {hint && <span className="font-normal text-muted">{hint}</span>}</span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {items.map((it) => {
          const on = selected.includes(it.id);
          return (
            <button key={it.id} type="button" aria-pressed={on} onClick={() => onToggle(it.id)}
              className={`h-11 cursor-pointer rounded-full border px-4 text-[15px] font-medium ${on ? "border-black bg-black text-white" : "border-[#d6d6d6] bg-white text-black"}`}>{it.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-[#eee] py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="m-0 text-right font-medium">{v}</dd>
    </div>
  );
}
