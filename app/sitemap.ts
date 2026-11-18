import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/registro", "/privacidad", "/terminos"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.5 }));
}
