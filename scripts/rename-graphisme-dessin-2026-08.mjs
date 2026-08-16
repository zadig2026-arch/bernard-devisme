/**
 * « Graphisme » devient « Dessin » (demande de Bernard, mail du 13/08/2026,
 * point 3 : « Je n'arrive pas à changer graphisme par dessin »).
 *
 * Le libellé et l'adresse sont changés dans le code (lib/categories.ts,
 * components/site-header.tsx, sanity/schemaTypes/series.ts, redirection dans
 * next.config.ts). Ce script migre la DONNÉE : le champ `category` des
 * rubriques, qui stocke la valeur "graphisme", passe à "dessin" (publiés ET
 * brouillons, pour ne pas laisser un brouillon écraser la migration à la
 * prochaine publication de Bernard).
 *
 *   node scripts/rename-graphisme-dessin-2026-08.mjs         (aperçu)
 *   node scripts/rename-graphisme-dessin-2026-08.mjs --go    (applique)
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

const go = process.argv.includes("--go");

const docs = await client.fetch(
  `*[_type == "series" && category == "graphisme"]{_id, title}`,
);

console.log(`${docs.length} rubrique(s) en « graphisme » :`);
for (const d of docs) console.log(`  - ${d._id} — « ${d.title} »`);

if (docs.length === 0) {
  console.log("Rien à migrer.");
  process.exit(0);
}

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour appliquer.");
  process.exit(0);
}

let tx = client.transaction();
for (const d of docs) {
  tx = tx.patch(d._id, (p) => p.set({ category: "dessin" }));
}
await tx.commit();
console.log(`\n${docs.length} rubrique(s) migrée(s) vers « dessin ».`);
