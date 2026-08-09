/**
 * Les 4 œuvres que Bernard « ne parvient pas à effacer » de l'album 3
 * (mail du 08/08/2026 : « album 3, je ne parviens pas à effacer :
 * 1426-1431-1415 et 1422. Je les ai ventilés ailleurs »).
 *
 * Ce qui s'est passé : il a ouvert chaque œuvre et VIDÉ le champ Rubrique. Ça
 * crée un brouillon, qu'il n'a jamais publié — le site sert la version publiée,
 * donc elles restent dans l'album 3. Et même publié, vider la rubrique ne
 * supprime pas l'œuvre : elle devient orpheline, donc invisible partout.
 *
 * Les 4 numéros tombent dans la plage de l'album 4 (1392-1437), pas dans celle
 * de l'album 3 (1293-1388). Deux ont bien été re-téléversées dans l'album 4
 * (1415, 1422) : leur exemplaire de l'album 3 est un doublon. Les deux autres
 * n'existent qu'une fois : on les DÉPLACE vers l'album 4 au lieu de les perdre.
 *
 *   node scripts/fix-album-3-2026-08.mjs         (aperçu, n'écrit rien)
 *   node scripts/fix-album-3-2026-08.mjs --go    (applique)
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

const ALBUM_3 = "series-peintures-2023";
const ALBUM_4 = "0aad7ccc-04dd-4193-8f61-928794e6eea3";
const NUMEROS = ["1415", "1422", "1426", "1431"];
const go = process.argv.includes("--go");

const docs = await client.fetch(
  `*[_type == "artwork" && title in $nums]{
     _id, title, "serie": series._ref, "serieTitre": series->title,
     "validImages": coalesce(count(images[defined(asset)]), 0)
   }`,
  { nums: NUMEROS },
);

const publies = docs.filter((d) => !d._id.startsWith("drafts."));
const brouillons = docs.filter((d) => d._id.startsWith("drafts."));

const aSupprimer = [];
const aDeplacer = [];

for (const num of NUMEROS) {
  const versions = publies.filter((d) => d.title === num);
  const dansAlbum3 = versions.filter((d) => d.serie === ALBUM_3);
  const ailleurs = versions.filter((d) => d.serie !== ALBUM_3);

  for (const d of dansAlbum3) {
    // Un exemplaire complet existe déjà hors de l'album 3 → celui-ci est le doublon.
    const remplacant = ailleurs.find((a) => a.validImages > 0);
    if (remplacant) {
      aSupprimer.push({ ...d, motif: `doublon de ${remplacant._id} (${remplacant.serieTitre})` });
    } else if (d.validImages > 0) {
      aDeplacer.push(d);
    } else {
      aSupprimer.push({ ...d, motif: "aucune image valide" });
    }
  }
  // Les fantômes créés hors rubrique et sans image ne portent aucun tableau.
  for (const d of ailleurs) {
    if (d.validImages === 0 && !d.serie) {
      aSupprimer.push({ ...d, motif: "document sans image ni rubrique (upload inachevé)" });
    }
  }
}

console.log("À DÉPLACER vers l'album 4 :");
for (const d of aDeplacer) {
  console.log(`  → ${d._id} « ${d.title} » (depuis ${d.serieTitre})`);
}
console.log("\nÀ SUPPRIMER :");
for (const d of aSupprimer) {
  console.log(`  ✗ ${d._id} « ${d.title} » — ${d.motif}`);
}
console.log("\nBROUILLONS à écarter (rubrique vidée, jamais publiée) :");
for (const d of brouillons) {
  console.log(`  ✗ ${d._id} « ${d.title} »`);
}

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour appliquer.");
  process.exit(0);
}

let tx = client.transaction();
for (const d of aDeplacer) {
  tx = tx.patch(d._id, (p) =>
    p.set({ series: { _type: "reference", _ref: ALBUM_4 } }),
  );
}
// Les brouillons partent en premier : sinon ils ré-imposeraient la rubrique vide.
for (const d of brouillons) tx = tx.delete(d._id);
for (const d of aSupprimer) tx = tx.delete(d._id).delete(`drafts.${d._id}`);
await tx.commit();

console.log(
  `\n${aDeplacer.length} œuvre(s) déplacée(s), ${aSupprimer.length} supprimée(s), ${brouillons.length} brouillon(s) écarté(s).`,
);
