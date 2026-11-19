import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Sesión del panel /admin: una sola contraseña (ADMIN_PASSWORD) y una cookie firmada con HMAC.
// Cambiar ADMIN_PASSWORD cierra todas las sesiones abiertas.

const COOKIE = "cg_admin";
const MAX_AGE_S = 12 * 60 * 60; // 12 horas
const password = process.env.ADMIN_PASSWORD ?? "";

/** Sin una contraseña de al menos 12 caracteres el panel queda deshabilitado. */
export const isAdminEnabled = password.length >= 12;

const sign = (exp: string) => createHmac("sha256", password).update(`carguero-admin:${exp}`).digest("hex");
const sha = (s: string) => createHash("sha256").update(s).digest();

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string): boolean {
  if (!isAdminEnabled) return false;
  return timingSafeEqual(sha(input), sha(password)); // Mismo largo siempre: no filtra la longitud
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: MAX_AGE_S,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin(): Promise<boolean> {
  if (!isAdminEnabled) return false;
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, sign(exp));
}
