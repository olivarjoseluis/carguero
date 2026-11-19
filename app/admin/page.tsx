import type { Metadata } from "next";
import Link from "next/link";
import { adminClient } from "@/lib/supabase";
import { isAdmin, isAdminEnabled } from "@/lib/admin-auth";
import { formatKg, formatRating, vehicleLabel } from "@/lib/format";
import { SCHEDULES } from "@/lib/types";
import { Logo } from "@/components/icons";
import { AdminLogin } from "@/components/AdminLogin";
import { logout, setDriverStatus } from "./actions";

export const metadata: Metadata = { title: "Admin · Carguero", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Status = "pending" | "approved" | "rejected";

const TABS: { id: Status; label: string }[] = [
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobados" },
  { id: "rejected", label: "Rechazados" },
];

type AdminDriver = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  whatsapp: string;
  email: string | null;
  plate: string | null;
  body_type: string;
  capacity_kg: number;
  schedule: string[];
  has_soat: boolean;
  has_tecno: boolean;
  has_license: boolean;
  city_slug: string;
  photos: string[];
  status: Status;
  is_sample: boolean;
  rating_avg: number;
  review_count: number;
  created_at: string;
  driver_zones: { zones: { name: string } | null }[];
};

const COLUMNS =
  "id, slug, first_name, last_name, whatsapp, email, plate, body_type, capacity_kg, schedule, has_soat, has_tecno, has_license, city_slug, photos, status, is_sample, rating_avg, review_count, created_at, driver_zones(zones(name))";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(iso));

const cityName = (slug: string) => (slug === "jamundi" ? "Jamundí" : slug === "cali" ? "Cali" : slug);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const authed = await isAdmin();

  if (!authed) {
    return (
      <Shell>
        <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 pt-10">
          <h1 className="m-0 font-display text-[32px] font-bold tracking-[-0.025em]">Panel de administración</h1>
          <AdminLogin enabled={isAdminEnabled} />
        </div>
      </Shell>
    );
  }

  const { estado } = await searchParams;
  const status: Status = TABS.some((t) => t.id === estado) ? (estado as Status) : "pending";
  const sb = adminClient();

  if (!sb) {
    return (
      <Shell authed>
        <p className="m-0 rounded-[14px] bg-accent-soft p-4">Modo demo: conecta Supabase para administrar conductores.</p>
      </Shell>
    );
  }

  const count = (s: Status) => sb.from("drivers").select("id", { count: "exact", head: true }).eq("status", s);
  const [listRes, ...countRes] = await Promise.all([
    sb.from("drivers").select(COLUMNS).eq("status", status)
      // Pendientes: el más antiguo primero (cola). Los demás: el más reciente primero.
      .order("created_at", { ascending: status === "pending" }).limit(200),
    ...TABS.map((t) => count(t.id)),
  ]);

  if (listRes.error) throw new Error(`Supabase drivers: ${listRes.error.message}`);
  const drivers = listRes.data as unknown as AdminDriver[];
  const counts = Object.fromEntries(TABS.map((t, i) => [t.id, countRes[i].count ?? 0])) as Record<Status, number>;

  return (
    <Shell authed>
      <div className="flex flex-col gap-6">
        <h1 className="m-0 font-display text-[32px] font-bold tracking-[-0.025em]">Conductores</h1>

        <nav aria-label="Estado" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.id} href={`/admin?estado=${t.id}`} aria-current={t.id === status ? "page" : undefined}
              className={`rounded-full px-4 py-2.5 text-[15px] font-semibold no-underline ${
                t.id === status ? "bg-black text-white" : "bg-chip text-black"
              }`}
            >
              {t.label} <span className={t.id === status ? "text-[#bdbdbd]" : "text-muted"}>{counts[t.id]}</span>
            </Link>
          ))}
        </nav>

        {drivers.length === 0 ? (
          <p className="m-0 rounded-[18px] bg-white p-8 text-center text-muted">
            {status === "pending" ? "No hay registros por revisar." : "No hay conductores en esta lista."}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {drivers.map((d) => <DriverCard key={d.id} d={d} />)}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function DriverCard({ d }: { d: AdminDriver }) {
  const zones = d.driver_zones.map((z) => z.zones?.name).filter(Boolean).join(", ");
  const schedule = d.schedule.map((s) => SCHEDULES.find((x) => x.id === s)?.label ?? s).join(", ");
  const docs = [
    { ok: d.has_soat, label: "SOAT" },
    { ok: d.has_tecno, label: "Tecnomecánica" },
    { ok: d.has_license, label: "Licencia" },
  ];

  return (
    <li className="flex flex-col gap-4 rounded-[18px] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-[20px] font-bold">
            {d.first_name} {d.last_name}
            {d.is_sample && <span className="ml-2 rounded-full bg-chip px-2.5 py-1 align-middle text-[12px] font-semibold text-muted">Ejemplo</span>}
          </h2>
          <p className="m-0 mt-1 text-[14px] text-muted">
            Registrado el {formatDate(d.created_at)}
            {d.review_count > 0 && <> · ★ {formatRating(Number(d.rating_avg))} ({d.review_count})</>}
          </p>
        </div>
        <StatusButtons id={d.id} status={d.status} />
      </div>

      <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
        <Row label="WhatsApp">
          <a href={`https://wa.me/57${d.whatsapp}`} target="_blank" rel="noreferrer" className="font-semibold text-black">{d.whatsapp}</a>
        </Row>
        <Row label="Correo">{d.email ?? "—"}</Row>
        <Row label="Vehículo">{vehicleLabel(d.body_type)} · {formatKg(d.capacity_kg)}</Row>
        <Row label="Placa">{d.plate ?? "—"}</Row>
        <Row label="Zonas">{cityName(d.city_slug)}{zones && ` · ${zones}`}</Row>
        <Row label="Horario">{schedule || "—"}</Row>
      </dl>

      <div className="flex flex-wrap gap-2">
        {docs.map((doc) => (
          <span
            key={doc.label}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${doc.ok ? "bg-[#e6f4ea] text-[#1e6b34]" : "bg-[#fdecea] text-[#8a1c12]"}`}
          >
            {doc.ok ? "✓" : "✗"} {doc.label}
          </span>
        ))}
      </div>

      {d.photos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {d.photos.map((src, i) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Foto ${i + 1} de ${d.first_name}`} loading="lazy" className="h-28 w-28 rounded-[12px] object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="m-0 text-[14px] text-muted">Sin fotos.</p>
      )}
    </li>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-[88px] shrink-0 text-muted">{label}</dt>
      <dd className="m-0 min-w-0 break-words">{children}</dd>
    </div>
  );
}

function StatusButtons({ id, status }: { id: string; status: Status }) {
  const actions: { to: Status; label: string; className: string }[] = [
    { to: "approved", label: "Aprobar", className: "bg-black text-white" },
    { to: "rejected", label: "Rechazar", className: "bg-[#fdecea] text-[#8a1c12]" },
    { to: "pending", label: "Volver a pendiente", className: "bg-chip text-black" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.filter((a) => a.to !== status).map((a) => (
        <form key={a.to} action={setDriverStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={a.to} />
          <button type="submit" className={`h-11 cursor-pointer rounded-[10px] border-0 px-4 text-[15px] font-semibold ${a.className}`}>
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}

function Shell({ children, authed = false }: { children: React.ReactNode; authed?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="bg-black text-white">
        <div className="mx-auto flex h-[64px] max-w-[1080px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-2 text-white no-underline">
            <Logo size={24} />
            <span className="font-display text-[19px] font-extrabold tracking-[-0.02em]">Carguero</span>
            <span className="ml-1 rounded-full bg-[#1f1f1f] px-2.5 py-1 text-[12px] font-semibold">Admin</span>
          </Link>
          {authed && (
            <form action={logout}>
              <button type="submit" className="h-11 cursor-pointer rounded-full border-0 bg-[#1f1f1f] px-4 text-[15px] font-semibold text-white">
                Salir
              </button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 pb-12 pt-8 sm:px-6">{children}</main>
    </div>
  );
}
