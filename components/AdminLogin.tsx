"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login, type LoginState } from "@/app/admin/actions";
import { TURNSTILE_SITE_KEY, Turnstile, type TurnstileHandle } from "./Turnstile";

export function AdminLogin({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [captcha, setCaptcha] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  // El token de Turnstile sirve una sola vez: después de un intento fallido, pide uno nuevo
  useEffect(() => {
    if (state.error) turnstile.current?.reset();
  }, [state]);

  if (!enabled) {
    return (
      <p className="m-0 rounded-[14px] bg-accent-soft p-4 text-[15px] leading-normal">
        El panel está deshabilitado. Agrega <code>ADMIN_PASSWORD</code> (mínimo 12 caracteres) a las variables de entorno y
        vuelve a desplegar.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Contraseña
        <input
          name="password" type="password" required autoComplete="current-password" autoFocus
          className="h-12 rounded-[12px] border border-line bg-white px-4 text-base font-normal"
        />
      </label>
      <input type="hidden" name="cf-turnstile-response" value={captcha} />
      <Turnstile ref={turnstile} action="admin" onToken={setCaptcha} />
      {state.error && (
        <p role="alert" className="m-0 rounded-[12px] bg-[#fdecea] p-3 text-[15px] text-[#8a1c12]">{state.error}</p>
      )}
      <button
        type="submit" disabled={pending || (!!TURNSTILE_SITE_KEY && !captcha)}
        className="h-12 cursor-pointer rounded-[12px] border-0 bg-black text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
