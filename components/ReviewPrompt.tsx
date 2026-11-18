"use client";

import { useState } from "react";
import Link from "next/link";
import type { LastContact } from "@/lib/types";
import { LAST_CONTACT_COOKIE } from "@/lib/types";
import { Avatar } from "./Finder";
import { Close, Star } from "./icons";

function ago(ms: number) {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

/** Franja "¿Cómo te fue con …?" que aparece si el visitante contactó a un conductor en los últimos 14 días. */
export function ReviewPrompt({ contact }: { contact: LastContact }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const dismiss = () => {
    document.cookie = `${LAST_CONTACT_COOKIE}=; Max-Age=0; path=/`;
    setOpen(false);
  };

  return (
    <div role="region" aria-label="Califica tu último servicio" className="border-b border-[#ffd9c7] bg-accent-soft text-black">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-6 py-3">
        <Avatar initials={contact.initials} size={40} />
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <span className="text-base font-semibold">¿Cómo te fue con {contact.name}?</span>
          <span className="text-sm text-muted">Le escribiste {ago(contact.at)}. Toca una estrella para calificarlo.</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link key={n} href={`/r/${contact.token}?s=${n}`} aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`} className="flex h-11 w-11 items-center justify-center rounded-[10px]">
              <Star size={26} />
            </Link>
          ))}
        </div>
        <button type="button" onClick={dismiss} aria-label="Cerrar aviso" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent">
          <Close />
        </button>
      </div>
    </div>
  );
}
