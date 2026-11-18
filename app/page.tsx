import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDirectory } from "@/lib/data";
import { LAST_CONTACT_COOKIE, type LastContact } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";
import { Finder } from "@/components/Finder";
import { ReviewPrompt } from "@/components/ReviewPrompt";
import { Waitlist } from "@/components/Waitlist";
import { CopyKey } from "@/components/CopyKey";
import { SiteFooter } from "@/components/SiteFooter";


async function readLastContact(): Promise<LastContact | null> {
  const raw = (await cookies()).get(LAST_CONTACT_COOKIE)?.value;
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as LastContact;
    return c.token && c.name ? c : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [{ zones, drivers, demo }, lastContact] = await Promise.all([getDirectory(), readLastContact()]);
  const brebKey = process.env.NEXT_PUBLIC_BREB_KEY ?? "[TU LLAVE BRE-B]";

  return (
    <>
      <SiteHeader />
      {lastContact && <ReviewPrompt contact={lastContact} />}
      <main>
        <Finder zones={zones} drivers={drivers} demo={demo} />

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="bg-paper">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-6 py-24">
            <div className="flex max-w-[640px] flex-col gap-3.5">
              <span className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Cómo funciona</span>
              <h2 className="m-0 font-display text-[clamp(32px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.025em]">Del trasteo al “listo” en tres pasos.</h2>
            </div>
            <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5 p-0">
              {[
                ["Elige tu ciudad y barrio", "Te mostramos los cargueros que trabajan cerca, con su vehículo y capacidad."],
                ["Compara su reputación", "Lee lo que dicen otros clientes. Solo opina quien de verdad contactó al conductor."],
                ["Escríbele directo", "Acuerdan precio y hora por WhatsApp. Al terminar, deja tu valoración y ayudas al siguiente vecino."],
              ].map(([t, d], i) => (
                <li key={t} className="flex flex-col gap-4 rounded-[20px] bg-white p-8">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl font-display text-[28px] font-extrabold ${i === 0 ? "bg-accent text-black" : "bg-black text-white"}`}>{i + 1}</span>
                  <h3 className="m-0 text-[21px] font-semibold">{t}</h3>
                  <p className="m-0 text-base leading-[1.55] text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CONDUCTORES */}
        <section id="conductores" className="bg-black text-white">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-14 px-6 py-[104px]">
            <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#d6d6d6]">
                <span className="h-2 w-2 rounded-full bg-accent" />Para conductores
              </span>
              <h2 className="m-0 font-display text-[clamp(36px,4.4vw,56px)] font-bold leading-[1.05] tracking-[-0.03em]">Tu motocarro trabaja más cuando te encuentran.</h2>
              <p className="m-0 max-w-[520px] text-lg leading-[1.55] text-[#d6d6d6]">
                Crea tu perfil gratis en cinco minutos. Los clientes de tu zona te escriben directo y cada buen servicio suma a tu reputación.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/registro" className="inline-flex h-14 items-center rounded-xl bg-accent px-[26px] text-[17px] font-bold text-black no-underline">Registra tu carguero gratis</Link>
                <a href="#como-funciona" className="inline-flex h-14 items-center rounded-xl bg-[#1f1f1f] px-[22px] text-[17px] font-semibold text-white no-underline">Ver cómo funciona</a>
              </div>
            </div>
            <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
              <div className="relative aspect-video overflow-hidden rounded-[28px] bg-[#3a3a3a]">
                <Image src="/motocarro.png" alt="Motocarro de carga naranja con platón tipo volteo" fill sizes="(max-width: 1100px) 100vw, 620px" className="object-cover" />
              </div>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
                {[
                  ["Perfil gratis", "Fotos, vehículo, capacidad y barrios donde trabajas."],
                  ["Clientes cerca", "Apareces cuando alguien busca en tu sector."],
                  ["Sin comisiones", "Lo que cobras es tuyo. Acuerdas directo con el cliente."],
                  ["Reputación que suma", "Tus valoraciones te siguen y te diferencian."],
                ].map(([t, d]) => (
                  <li key={t} className="flex flex-col gap-3 rounded-[20px] border border-[#2a2a2a] bg-[#141414] p-6 sm:p-7">
                    <span className="text-lg font-semibold">{t}</span>
                    <span className="text-[15px] leading-normal text-[#bdbdbd]">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* COMPRA Y VENTA */}
        <section id="compra-venta" className="bg-white">
          <div className="mx-auto max-w-[1280px] px-6 py-24">
            <div className="flex flex-wrap items-center justify-between gap-10 rounded-[28px] bg-paper p-[clamp(28px,5vw,64px)]">
              <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
                <span className="self-start rounded-full bg-accent px-3 py-1.5 text-[13px] font-bold text-black">Próximamente</span>
                <h2 className="m-0 font-display text-[clamp(30px,3.4vw,42px)] font-bold leading-[1.1] tracking-[-0.025em]">Compra y venta de motocarros</h2>
                <p className="m-0 max-w-[520px] text-[17px] leading-[1.55] text-muted">
                  Un lugar hecho para vehículos de trabajo: nuevos, usados y repuestos, con vendedores que ya tienen reputación.
                </p>
              </div>
              <Waitlist />
            </div>
          </div>
        </section>

        {/* APOYA */}
        <section id="apoya" className="border-t border-[#e8e8e8] bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-8 px-6 py-[72px]">
            <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
              <h2 className="m-0 font-display text-[30px] font-bold tracking-[-0.02em]">Carguero es gratis. Si te sirvió, apóyalo.</h2>
              <p className="m-0 max-w-[560px] text-base leading-[1.55] text-muted">Tu aporte cubre el servidor y el mantenimiento. Cada mes publicamos en qué se usó.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-chip py-3 pl-5 pr-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Llave Bre-B</span>
                <span className="font-display text-xl font-bold">{brebKey}</span>
              </div>
              <CopyKey value={brebKey} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
