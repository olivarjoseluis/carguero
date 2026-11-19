"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkPassword, endSession, isAdmin, isAdminEnabled, startSession } from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isAdminEnabled) return { error: "El panel está deshabilitado: falta ADMIN_PASSWORD (mínimo 12 caracteres)." };
  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), "admin")))
    return { error: "No pudimos confirmar que eres una persona. Espera la verificación e intenta de nuevo." };
  if (!checkPassword(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 1000)); // Frena intentos seguidos
    return { error: "Contraseña incorrecta." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

const STATUSES = ["pending", "approved", "rejected"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setDriverStatus(form: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!UUID.test(id) || !STATUSES.includes(status as (typeof STATUSES)[number])) return;

  const sb = adminClient();
  if (!sb) return;
  const { error } = await sb.from("drivers").update({ status }).eq("id", id);
  if (error) {
    console.error("setDriverStatus", error);
    throw new Error("No se pudo cambiar el estado del conductor.");
  }

  revalidatePath("/"); // El directorio público lee public_drivers (solo aprobados)
  revalidatePath("/admin");
}
