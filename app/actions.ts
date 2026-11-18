"use server";

import { adminClient } from "@/lib/supabase";

export type WaitlistState = { ok: boolean; message: string } | null;

export async function joinWaitlist(_prev: WaitlistState, form: FormData): Promise<WaitlistState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: "Revisa el correo." };

  const sb = adminClient();
  if (sb) {
    const { error } = await sb.from("waitlist").upsert({ email, topic: "compra-venta" });
    if (error) return { ok: false, message: "No pudimos guardarte. Intenta de nuevo." };
  }
  return { ok: true, message: "Listo. Te escribimos cuando abra la sección." };
}
