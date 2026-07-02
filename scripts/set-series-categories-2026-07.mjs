/**
 * Migration 2026-07 : pose le champ `category` (Partie du site) sur chaque
 * série existante, d'après le mapping historique de lib/categories.ts.
 * À lancer UNE FOIS après `npx sanity schema deploy` :
 *   node scripts/set-series-categories-2026-07.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// Miroir de lib/categories.ts (script .mjs, pas d'import TS possible).
const CATEGORY_BY_SLUG = new Map(
  Object.entries({
    peinture: [
      "peintures-album-3", "peintures-2024", "peintures-2023", "amalgame", "wx",
      "la-divine-comedie-serie-2020", "transitions-2", "les-trombines", "gabarit",
      "l-eau-et-les-reves", "les-inconnus", "mine-d-angle-s", "filets-d-encre",
      "contre-tout-contre-sens", "concretions", "endroit-envers", "le-temps-inacheve",
      "la-divine-comedie", "les-anomalies", "les", "les-angles", "les-oscillations",
      "peintures", "les-peintures-abstraites",
    ],
    sculpture: [
      "sculptures-recentes", "les-assemblages", "les-bois", "les-truelles",
      "les-freluquets", "vendetheque-de-la-chataigneraie", "les-bidules",
      "les-installations", "installations-in-situ", "paysages-reves",
    ],
    graphisme: [
      "les-caboches", "dessins-2-1", "les-visages-recuperes", "les-dessins",
      "dessins-2", "les-cageots", "les-ecorces", "les-gueules",
    ],
    infographies: ["les-montages", "les-animations", "textes-amants", "monde-extensible"],
    "livres-objets": ["livres-objets", "livres-objets-raku", "plus"],
  }).flatMap(([cat, slugs]) => slugs.map((s) => [s, cat])),
);

const all = await client.fetch(
  '*[_type == "series" && !(_id in path("drafts.**"))]{_id, title, "slug": slug.current, category}',
);

let patched = 0;
const unmatched = [];
for (const s of all) {
  const cat = CATEGORY_BY_SLUG.get(s.slug);
  if (!cat) {
    unmatched.push(`${s.title} (${s.slug})`);
    continue;
  }
  if (s.category === cat) continue;
  await client.patch(s._id).set({ category: cat }).commit();
  patched++;
}

console.log(`séries: ${all.length} · patchées: ${patched}`);
if (unmatched.length) console.log("sans catégorie (→ Autres):", unmatched.join(" | "));
