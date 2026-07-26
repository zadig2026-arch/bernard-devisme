/**
 * Suppression de « peintures album 6 » (ex-rubrique « amalgame »), demandée par
 * Bernard le 25/07/2026 (« Tu peux supprimer l'album 6, les sans titres sont
 * sans images : erreurssssss »).
 *
 * La rubrique n'a plus aucune œuvre publiée ; il ne reste que 9 BROUILLONS
 * sans titre, restes d'uploads ratés (aucun n'a d'image valide). Sanity refuse
 * de supprimer une rubrique tant qu'un document la référence, brouillons
 * compris : on supprime donc d'abord les brouillons, puis la rubrique.
 *
 *   node scripts/delete-album-6-2026-07.mjs          (aperçu, ne supprime rien)
 *   node scripts/delete-album-6-2026-07.mjs --go     (supprime)
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

const SERIES_ID = "series-amalgame";
const go = process.argv.includes("--go");

const series = await client.fetch('*[_id == $id][0]{_id, title, "slug": slug.current}', {
  id: SERIES_ID,
});
if (!series) {
  console.log(`Rubrique ${SERIES_ID} introuvable : déjà supprimée ?`);
  process.exit(0);
}

const referencing = await client.fetch(
  '*[references($id)]{_id, _type, title, "nbImagesOk": count(images[defined(asset)])}',
  { id: SERIES_ID },
);

console.log(`Rubrique : ${series.title} (${series.slug})`);
console.log(`Documents qui la référencent : ${referencing.length}`);
for (const d of referencing) {
  console.log(`  - ${d._id} · ${d._type} · titre: ${d.title ?? "—"} · images valides: ${d.nbImagesOk ?? 0}`);
}

// Garde-fou : on ne supprime QUE des brouillons d'œuvres sans titre ni image
// valide. Tout le reste fait échouer le script plutôt que de perdre du contenu.
const unsafe = referencing.filter(
  (d) =>
    !d._id.startsWith("drafts.") ||
    d._type !== "artwork" ||
    (d.title ?? "").trim() !== "" ||
    (d.nbImagesOk ?? 0) > 0,
);
if (unsafe.length) {
  console.error("\nARRÊT : des documents ne sont pas des brouillons vides :");
  for (const d of unsafe) console.error(`  - ${d._id} (${d.title ?? "sans titre"})`);
  process.exit(1);
}

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour supprimer.");
  process.exit(0);
}

for (const d of referencing) {
  await client.delete(d._id);
  console.log(`supprimé : ${d._id}`);
}
await client.delete(SERIES_ID);
console.log(`supprimé : ${SERIES_ID}`);
console.log("Terminé.");
