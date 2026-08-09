/**
 * Nettoie les TÉLÉVERSEMENTS INACHEVÉS de Bernard.
 *
 * Symptôme dans les données : un document `artwork` contient un bloc image sans
 * `asset`. Le Studio a bien créé le bloc, mais le fichier n'est jamais arrivé.
 * Résultat côté Bernard : une œuvre « Sans titre » vide de plus dans ses listes.
 * Résultat côté site : `urlForImage` planterait, d'où le filtre défensif
 * `images[defined(asset)]` posé le 22/07 dans sanity/lib/queries.ts.
 *
 * Le motif est RÉCURRENT (29/07, 30/07 x3, 01/08, 04/08, 05/08), ce qui pointe
 * vers un envoi interrompu et non vers une fausse manœuvre isolée. Piste à
 * confirmer avec lui : son Norton, dont la pop-up « sanity.io vous piste »
 * (capture jointe à son mail du 08/08) montre qu'une extension surveille et
 * peut couper les requêtes vers Sanity.
 *
 * GARDE-FOU : on ne supprime un document que s'il est un BROUILLON, sans titre
 * ET sans la moindre image valide — donc porteur d'aucun tableau. Sur un
 * document qui a par ailleurs des images valides, on retire seulement le bloc
 * cassé, sans toucher au reste.
 *
 *   node scripts/clean-failed-uploads-2026-08.mjs         (aperçu)
 *   node scripts/clean-failed-uploads-2026-08.mjs --go    (applique)
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
  `*[_type == "artwork" && count(images[!defined(asset)]) > 0]{
     _id, title, _updatedAt,
     "serie": series->title,
     "casses": images[!defined(asset)]{_key},
     "valides": coalesce(count(images[defined(asset)]), 0)
   } | order(_updatedAt asc)`,
);

const aSupprimer = docs.filter(
  (d) => d._id.startsWith("drafts.") && !d.title && d.valides === 0,
);
const aNettoyer = docs.filter((d) => !aSupprimer.includes(d));

console.log("BROUILLONS VIDES à supprimer (aucun tableau dedans) :");
for (const d of aSupprimer) {
  console.log(`  ✗ ${d._id} — ${d._updatedAt.slice(0, 10)} — rubrique : ${d.serie ?? "aucune"}`);
}

console.log("\nDOCUMENTS à nettoyer (on retire le bloc cassé, on garde le reste) :");
for (const d of aNettoyer) {
  console.log(
    `  ~ ${d._id} « ${d.title ?? "(sans titre)"} » — ${d.casses.length} bloc(s) cassé(s), ${d.valides} image(s) valide(s)`,
  );
}

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour appliquer.");
  process.exit(0);
}

let tx = client.transaction();
for (const d of aSupprimer) tx = tx.delete(d._id);
for (const d of aNettoyer) {
  tx = tx.patch(d._id, (p) =>
    p.unset(d.casses.map((b) => `images[_key=="${b._key}"]`)),
  );
}
await tx.commit();

console.log(
  `\n${aSupprimer.length} brouillon(s) vide(s) supprimé(s), ${aNettoyer.length} document(s) nettoyé(s).`,
);
