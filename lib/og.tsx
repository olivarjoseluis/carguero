import { ImageResponse } from "next/og";

// Tarjetas para redes sociales (WhatsApp, Facebook, X, LinkedIn): 1200×630 PNG generadas en el build.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ACCENT = "#ff5a1f";

/**
 * Descarga Inter Tight desde Google Fonts, solo con los caracteres que usa la tarjeta.
 * Sin User-Agent de navegador, Google entrega TTF, que es lo que acepta next/og (no WOFF2).
 * Si falla (sin red durante el build), la tarjeta se genera con la fuente por defecto.
 */
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter+Tight:wght@${weight}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export async function ogCard({ eyebrow, title, subtitle, badge }: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
}) {
  const domain = "carguero.vercel.app";
  const all = `Carguero${eyebrow}${title}${subtitle}${badge}${domain}`;
  const [bold, medium] = await Promise.all([loadFont(800, all), loadFont(500, all)]);
  const fonts = [
    ...(bold ? [{ name: "Inter Tight", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(medium ? [{ name: "Inter Tight", data: medium, weight: 500 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          background: "#000", color: "#fff", padding: "64px 72px", fontFamily: "Inter Tight",
        }}
      >
        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 28 28">
            <rect x="1" y="1" width="26" height="26" rx="7" fill={ACCENT} />
            <path d="M7 17h9v-6h3l2 3v3h-1" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="19" r="1.8" fill="#000" />
            <circle cx="19" cy="19" r="1.8" fill="#000" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em" }}>Carguero</div>
        </div>

        {/* Mensaje */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 500, color: "#bdbdbd", letterSpacing: "0.08em" }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: ACCENT }} />
            {eyebrow.toUpperCase()}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.3, color: "#d4d4d4", maxWidth: 960 }}>{subtitle}</div>
        </div>

        {/* Pie */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", background: ACCENT, color: "#000", fontSize: 28, fontWeight: 800, padding: "14px 28px", borderRadius: 999 }}>
            {badge}
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#bdbdbd" }}>{domain}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
