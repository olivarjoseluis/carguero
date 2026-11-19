import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

const base = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/registro", "/privacidad", "/terminos"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.5 }));
}
