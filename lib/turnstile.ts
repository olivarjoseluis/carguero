import "server-only";
import { headers } from "next/headers";

// Cloudflare Turnstile: verificación en el servidor (siteverify).
// - Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY la app corre sin Turnstile (modo demo / desarrollo).
// - Con sitekey, falla cerrado: sin secret, sin hostnames o con cualquier error, rechaza.

export type TurnstileAction = "review" | "signup" | "admin";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const expectedHostnames = new Set(
  (process.env.TURNSTILE_HOSTNAMES ?? "").split(",").map((h) => h.trim()).filter(Boolean),
);

export const isTurnstileEnabled = Boolean(siteKey);

export async function verifyTurnstile(token: unknown, action: TurnstileAction): Promise<boolean> {
  if (!isTurnstileEnabled) return true;

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || expectedHostnames.size === 0) {
    console.error("verifyTurnstile: falta TURNSTILE_SECRET o TURNSTILE_HOSTNAMES");
    return false;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  const h = await headers();
  const remoteip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();

  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, ...(remoteip ? { remoteip } : {}) }),
    });
    if (!r.ok) return false;
    const result = (await r.json()) as { success?: boolean; action?: string; hostname?: string };
    return result.success === true && result.action === action && expectedHostnames.has(result.hostname ?? "");
  } catch {
    return false; // Red caída, timeout o respuesta inválida: falla cerrado
  }
}
