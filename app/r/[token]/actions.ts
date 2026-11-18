"use server";

import { cookies } from "next/headers";
import { publicClient } from "@/lib/supabase";
import { LAST_CONTACT_COOKIE } from "@/lib/types";
import { verifyTurnstile } from "@/lib/turnstile";

export type ReviewResult = { status: "ok" | "used" | "expired" | "invalid" | "error" | "captcha" };

export async function submitReview(input: {
  token: string; stars: number; tags: string[]; comment: string; captcha: string;
}): Promise<ReviewResult> {
  const stars = Math.round(Number(input.stars));
  if (!input.token || stars < 1 || stars > 5) return { status: "invalid" };
  if (!Array.isArray(input.tags) || typeof input.comment !== "string") return { status: "invalid" };

  // Cloudflare Turnstile antes de publicar
  if (!(await verifyTurnstile(input.captcha, "review"))) return { status: "captcha" };

  const sb = publicClient();
  if (!sb) {
    // Modo demo: no se guarda nada
    (await cookies()).delete(LAST_CONTACT_COOKIE);
    return { status: "ok" };
  }

  const { data, error } = await sb.rpc("submit_review", {
    p_token: input.token,
    p_stars: stars,
    p_tags: input.tags.slice(0, 8).map((t) => t.slice(0, 40)),
    p_comment: input.comment.slice(0, 280),
  });
  if (error) return { status: "error" };
  if (data === "ok" || data === "used") (await cookies()).delete(LAST_CONTACT_COOKIE);
  return { status: data as ReviewResult["status"] };
}
