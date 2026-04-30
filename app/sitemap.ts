import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allArtworkSlugsQuery,
  allSeriesSlugsQuery,
  allExhibitionSlugsQuery,
  allJournalSlugsQuery,
} from "@/sanity/lib/queries";

const BASE = process.env.SITE_URL ?? "https://www.devismebernardpeintre.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, series, exhibitions, journal] = await Promise.all([
    sanityFetch<string[]>(allArtworkSlugsQuery, {}, []),
    sanityFetch<string[]>(allSeriesSlugsQuery, {}, []),
    sanityFetch<string[]>(allExhibitionSlugsQuery, {}, []),
    sanityFetch<string[]>(allJournalSlugsQuery, {}, []),
  ]);

  const staticPaths = [
    "",
    "/oeuvres",
    "/series",
    "/expositions",
    "/journal",
    "/parcours",
    "/regards",
    "/agent",
    "/contact",
    "/mentions-legales",
  ];

  return [
    ...staticPaths.map((p) => ({ url: `${BASE}${p}`, changeFrequency: "monthly" as const })),
    ...artworks.map((s) => ({ url: `${BASE}/oeuvres/${s}` })),
    ...series.map((s) => ({ url: `${BASE}/series/${s}` })),
    ...exhibitions.map((s) => ({ url: `${BASE}/expositions/${s}` })),
    ...journal.map((s) => ({ url: `${BASE}/journal/${s}` })),
  ];
}
