"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Vercel Web Analytics (sin cookies). Los enlaces de reseña /r/<token> se agrupan como /r/[token]
// para no enviar a terceros un token que permite publicar una reseña.
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith("/admin")) return null; // El panel no cuenta como visita
  url.pathname = url.pathname.replace(/^\/r\/[^/]+/, "/r/[token]");
  return { ...event, url: url.toString() };
}

export function VercelAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
