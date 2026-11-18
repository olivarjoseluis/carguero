"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";
import { Check } from "./icons";

export function Waitlist() {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, null);

  if (state?.ok) {
    return (
      <div className="flex min-w-0 flex-[1_1_380px] items-center gap-3 rounded-2xl bg-white px-6 py-5" role="status">
        <Check size={24} />
        <span className="text-base font-medium">{state.message}</span>
      </div>
    );
  }

  return (
    <form action={action} className="flex min-w-0 flex-[1_1_380px] flex-col gap-2.5">
      <label htmlFor="aviso" className="text-sm font-semibold">Avísame cuando abra</label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id="aviso" name="email" type="email" required placeholder="tu@correo.com" autoComplete="email"
          className="h-14 min-w-0 flex-[1_1_220px] rounded-xl border border-[#d6d6d6] bg-white px-4 text-base text-black"
        />
        <button type="submit" disabled={pending} className="h-14 cursor-pointer rounded-xl border-0 bg-black px-6 text-base font-semibold text-white disabled:opacity-60">
          {pending ? "Guardando…" : "Avísame"}
        </button>
      </div>
      {state && !state.ok && <span role="alert" className="text-sm font-medium text-[#8a2a06]">{state.message}</span>}
    </form>
  );
}
