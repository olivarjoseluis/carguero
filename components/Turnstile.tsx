"use client";

import Script from "next/script";
import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";

// Widget de Cloudflare Turnstile (render explícito). Sin NEXT_PUBLIC_TURNSTILE_SITE_KEY no muestra nada.
// Cada token sirve una sola vez: después de cada envío, el formulario llama reset().

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export type TurnstileHandle = { reset: () => void };

export function Turnstile({ action, onToken, ref }: {
  action: "review" | "signup";
  onToken: (token: string) => void;
  ref?: Ref<TurnstileHandle>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;

  const render = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !box.current || !window.turnstile || widgetId.current !== null) return;
    widgetId.current = window.turnstile.render(box.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
      language: "es",
      // "flexible" necesita al menos 300 px; en celulares angostos (360 px) la tarjeta deja menos espacio
      size: box.current.clientWidth >= 300 ? "flexible" : "compact",
      callback: (t: string) => tokenCb.current(t),
      "expired-callback": () => tokenCb.current(""),
      "error-callback": () => tokenCb.current(""),
    });
  }, [action]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      tokenCb.current("");
      if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
    },
  }), []);

  // Si el script ya estaba cargado (navegación entre páginas), render directo
  useEffect(() => {
    render();
    return () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [render]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render} />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
