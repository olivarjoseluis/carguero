import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase";
import { SAMPLE_DRIVERS } from "@/lib/data";
import { LAST_CONTACT_COOKIE, type LastContact } from "@/lib/types";

const FOURTEEN_DAYS = 60 * 60 * 24 * 14;

/**
 * GET /c/:driverId?src=grupo-jamundi-1
 * 1. Registra el contacto (contact_events) y obtiene un token de reseña de un solo uso.
 * 2. Guarda el último contacto en una cookie para mostrar "¿Cómo te fue?" al volver.
 * 3. Redirige a WhatsApp. El número nunca llega al HTML de la página.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = req.nextUrl.searchParams.get("src")?.slice(0, 60) ?? "web";
  const sb = adminClient();

  let phone: string;
  let firstName: string;
  let contact: LastContact;

  if (sb) {
    const { data: driver } = await sb
      .from("drivers")
      .select("id, first_name, last_name, whatsapp, status")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (!driver) return NextResponse.redirect(new URL("/?error=conductor", req.url));

    const { data: event, error } = await sb
      .from("contact_events")
      .insert({ driver_id: driver.id, source })
      .select("token")
      .single();
    if (error || !event) return NextResponse.redirect(new URL("/?error=contacto", req.url));

    phone = driver.whatsapp;
    firstName = driver.first_name.split(" ")[0];
    contact = {
      token: event.token,
      name: `${firstName} ${driver.last_name[0]}.`,
      initials: (driver.first_name[0] + driver.last_name[0]).toUpperCase(),
      at: Date.now(),
    };
  } else {
    // Modo demo sin Supabase
    const d = SAMPLE_DRIVERS.find((x) => x.id === id) ?? SAMPLE_DRIVERS[0];
    phone = "3000000000";
    firstName = d.display_name.split(" ")[0];
    contact = { token: "demo", name: d.display_name, initials: d.initials, at: Date.now() };
  }

  const text = `Hola ${firstName}, te encontré en Carguero. Necesito un acarreo, ¿tienes disponibilidad?`;
  const res = NextResponse.redirect(`https://wa.me/57${phone}?text=${encodeURIComponent(text)}`);
  res.cookies.set(LAST_CONTACT_COOKIE, JSON.stringify(contact), {
    maxAge: FOURTEEN_DAYS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
