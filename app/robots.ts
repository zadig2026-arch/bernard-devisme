import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL ?? "https://www.devismebernardpeintre.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/studio", "/api"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
