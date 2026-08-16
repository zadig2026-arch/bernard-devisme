/**
 * Suppression du « premier groupe de 48 images » de la rubrique « Personnages »,
 * demandée par Bernard le 13/08/2026 (mail « site », point 7) : « J'ai fait un
 * doublon alors que j'aurais pu les ventiler dans la bonne rubrique. »
 *
 * Contexte : la rubrique « Personnages » (series-mine-d-angle-s, ex « Mine
 * d'angle(s) ») contient encore les 48 œuvres du vieil import (ids
 * artwork-mine-d-angle-s-*, sans groupe, donc affichées en PREMIER sur la
 * page). Bernard a re-téléversé ces mêmes tableaux ailleurs, pour l'essentiel
 * dans « code barre et portraits crachés (format 50x65) » (series-les-trombines).
 * Le groupe récent « personnages » (965-981, 1084, 1291-1294) reste en place.
 *
 * GARDE-FOU : une œuvre n'est supprimée que si un exemplaire de REMPLACEMENT
 * existe : un autre document publié, dans une AUTRE rubrique, portant le même
 * numéro d'œuvre ET possédant au moins une image valide. Les vieilles œuvres
 * s'appellent souvent « Sans titre n°X » (X = ordre d'import, pas le numéro de
 * Bernard) : le numéro fiable est celui du NOM DE FICHIER (906.jpg) ou du titre
 * quand il commence par un nombre (« 897 angles »). Toute œuvre sans remplaçant
 * est CONSERVÉE et listée : on ne perd aucun tableau.
 *
 *   node scripts/cleanup-personnages-2026-08.mjs         (aperçu, ne supprime rien)
 *   node scripts/cleanup-personnages-2026-08.mjs --go    (supprime)
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

const SERIES_ID = "series-mine-d-angle-s";
const go = process.argv.includes("--go");

/** Numéro d'œuvre : en tête de titre, sinon en tête du nom de fichier de la
 *  première image (les « Sans titre n°X » de l'import n'ont pas le vrai numéro
 *  dans le titre, mais le fichier s'appelle 906.jpg, 897-angles-142-146-.jpg…). */
function artworkNumber(title, filename) {
  for (const source of [title, filename]) {
    const m = (source ?? "").trim().match(/^(\d{2,5})(?!\d)/);
    if (m) return m[1];
  }
  return null;
}

// Le premier groupe de la page = les œuvres SANS groupe. On ne vise que les 48
// documents du vieil import (ids artwork-mine-d-angle-s-*), pas les brouillons
// récents de Bernard qui n'ont pas encore de groupe.
const inside = await client.fetch(
  `*[_type == "artwork" && series._ref == $sid && !defined(subseries) &&
     (_id match "artwork-mine-d-angle-s-*" || _id match "drafts.artwork-mine-d-angle-s-*")]{
     _id, title,
     "filename": images[defined(asset)][0].asset->originalFilename,
     "validImages": count(images[defined(asset)])
   }`,
  { sid: SERIES_ID },
);

// Les remplaçants possibles : toute œuvre publiée dans une AUTRE rubrique,
// avec une image valide.
const outside = await client.fetch(
  `*[_type == "artwork" && !(_id in path("drafts.**")) && defined(series) &&
     series._ref != $sid && count(images[defined(asset)]) > 0]{
     _id, title, "serie": series->title,
     "filename": images[defined(asset)][0].asset->originalFilename
   }`,
  { sid: SERIES_ID },
);

const replacements = new Map();
for (const a of outside) {
  const n = artworkNumber(a.title, a.filename);
  if (!n) continue;
  if (!replacements.has(n)) replacements.set(n, []);
  replacements.get(n).push(a);
}

const toDelete = [];
const kept = [];
for (const a of inside) {
  const n = artworkNumber(a.title, a.filename);
  const match = n ? replacements.get(n) : null;
  if (match && match.length > 0) {
    toDelete.push({ ...a, number: n, replacedBy: match[0] });
  } else {
    kept.push({ ...a, number: n });
  }
}

console.log(`${inside.length} œuvres du vieil import, sans groupe, dans « Personnages ».`);
console.log(`  → ${toDelete.length} supprimables (un exemplaire existe ailleurs)`);
console.log(`  → ${kept.length} CONSERVÉES (aucun remplaçant trouvé)\n`);

if (kept.length > 0) {
  console.log("Œuvres conservées, à traiter à la main :");
  for (const a of kept) {
    console.log(
      `  ! ${a._id} — « ${a.title ?? "(sans titre)"} » (n° ${a.number ?? "?"}, ${a.validImages} image(s))`,
    );
  }
  console.log("");
}

// Une rubrique peut pointer sur une œuvre à supprimer via « Œuvre de
// couverture » (c'est le cas de Personnages → 897). On détache ce champ :
// la vignette du Studio replie alors sur la première œuvre de la rubrique.
const ids = toDelete.map((a) => a._id);
const coverHolders = ids.length
  ? await client.fetch(
      `*[_type == "series" && coverArtwork._ref in $ids]{_id, title, "cover": coverArtwork._ref}`,
      { ids },
    )
  : [];
for (const s of coverHolders) {
  console.log(
    `Œuvre de couverture à détacher : « ${s.title} » (${s._id}) pointe sur ${s.cover}`,
  );
}

// Rien d'autre ne doit référencer une œuvre qu'on supprime (mise en avant, etc.).
const referenced = ids.length
  ? await client.fetch(
      `*[references($ids) && !(_id in $ids) && !(_type == "series" && coverArtwork._ref in $ids)]{_id, _type}`,
      { ids },
    )
  : [];
if (referenced.length > 0) {
  console.log("⚠️  Ces documents référencent une œuvre à supprimer :");
  for (const r of referenced) console.log(`  - ${r._id} (${r._type})`);
  console.log("Arrêt : à examiner avant de continuer.");
  process.exit(1);
}

console.log("Ce qui serait supprimé :");
for (const a of toDelete) {
  console.log(
    `  - ${a._id} « ${a.title ?? "(sans titre)"} » (n° ${a.number}) → remplacée par « ${a.replacedBy.title} » (${a.replacedBy.serie})`,
  );
}

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour appliquer.");
  process.exit(0);
}

let tx = client.transaction();
for (const s of coverHolders) {
  tx = tx.patch(s._id, (p) => p.unset(["coverArtwork"]));
}
for (const a of toDelete) {
  tx = tx.delete(a._id).delete(`drafts.${a._id}`);
}
await tx.commit();
if (coverHolders.length > 0) {
  console.log(`${coverHolders.length} œuvre(s) de couverture détachée(s).`);
}
console.log(`\n${toDelete.length} œuvres supprimées (brouillons compris).`);

const rest = await client.fetch(
  `count(*[_type == "artwork" && series._ref == $sid])`,
  { sid: SERIES_ID },
);
console.log(`La rubrique « Personnages » garde ${rest} œuvre(s).`);
