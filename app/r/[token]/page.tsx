import type { Metadata } from "next";
import Link from "next/link";
import { publicClient } from "@/lib/supabase";
import { SAMPLE_DRIVERS } from "@/lib/data";
import { vehicleLabel } from "@/lib/format";
import { Avatar } from "@/components/Finder";
import { Logo } from "@/components/icons";
import { ReviewForm } from "@/components/ReviewForm";

export const metadata: Metadata = { title: "Califica tu servicio · Carguero", robots: { index: false } };

type Ctx = { driver_name: string; initials: string; body_type: string; contacted_at: string; status: "ok" | "used" | "expired" };

async function loadContext(token: string): Promise<Ctx | null> {
  const sb = publicClient();
  if (!sb) {
    const d = SAMPLE_DRIVERS[0];
    return { driver_name: d.display_name, initials: d.initials, body_type: d.body_type, contacted_at: new Date().toISOString(), status: "ok" };
  }
  const { data } = await sb.rpc("review_context", { p_token: token });
  return (data?.[0] as Ctx | undefined) ?? null;
}

export default async function ReviewPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const [{ token }, { s }] = await Promise.all([params, searchParams]);
  const ctx = await loadContext(token);
  const initial = Math.min(5, Math.max(0, Number(s) || 0));

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="bg-black text-white">
        <div className="mx-auto flex h-[60px] max-w-[480px] items-center justify-between px-5">
          <Link href="/" className="flex min-h-11 items-center gap-2 text-white no-underline">
            <Logo size={24} />
            <span className="font-display text-[19px] font-extrabold tracking-[-0.02em]">Carguero</span>
          </Link>
          <span className="text-[13px] text-[#bdbdbd]">Reseña verificada</span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        {!ctx || ctx.status !== "ok" ? (
          <div className="flex flex-col gap-4 pt-6">
            <h1 className="m-0 font-display text-[28px] font-bold tracking-[-0.025em]">
              {!ctx ? "Este enlace no es válido" : ctx.status === "used" ? "Ya calificaste este servicio" : "Este enlace ya venció"}
            </h1>
            <p className="m-0 text-base leading-normal text-muted">
              {!ctx
                ? "Revisa que el enlace esté completo. Si el conductor te lo envió, pídele que lo comparta de nuevo."
                : ctx.status === "used"
                  ? "Gracias, tu reseña ya está publicada. Cada servicio se puede calificar una sola vez."
                  : "Los enlaces de reseña duran 14 días después del contacto."}
            </p>
            <Link href="/" className="flex h-14 items-center justify-center rounded-[14px] bg-black text-[17px] font-semibold text-white no-underline">Buscar un carguero</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3.5 rounded-[18px] bg-paper p-4">
              <Avatar initials={ctx.initials} size={56} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[17px] font-semibold">{ctx.driver_name}</span>
                <span className="text-sm text-muted">{vehicleLabel(ctx.body_type)}</span>
                <span className="text-[13px] text-muted">
                  Lo contactaste el {new Date(ctx.contacted_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: "America/Bogota" })}
                </span>
              </div>
            </div>
            <ReviewForm token={token} driverName={ctx.driver_name} initialStars={initial} />
          </>
        )}
      </main>
    </div>
  );
}
