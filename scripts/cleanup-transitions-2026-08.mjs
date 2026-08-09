/**
 * Suppression des rubriques « Transitions 1 » et « Transitions 2 », demandée par
 * Bernard le 08/08/2026 (mail « site ») et écrite par lui dans le titre même de
 * la rubrique : « Transitions 1 à supprimer aussi comme transitions 2_à toi de
 * jouer Zadig ».
 *
 * Contexte : Bernard a refait ses « albums peintures » en re-téléversant ses
 * tableaux. Les anciennes rubriques Transitions 1 et 2 ont donc gardé de VIEUX
 * exemplaires des mêmes tableaux (« 1091 lofae 1 » ici, « 1091 Lofaé 1 » dans
 * l'album 1). Ce sont ces doublons qu'il voit. Il n'arrive pas à supprimer la
 * rubrique parce que Sanity refuse tant qu'un document la référence.
 *
 * GARDE-FOU : une œuvre n'est supprimée que si un exemplaire de REMPLACEMENT
 * existe, c'est-à-dire un autre document publié, HORS de ces deux rubriques,
 * portant le même numéro d'œuvre ET possédant au moins une image valide. Toute
 * œuvre sans remplaçant est CONSERVÉE et listée : on ne perd aucun tableau.
 * Si des œuvres restent, les rubriques ne sont pas supprimées (elles ne peuvent
 * pas l'être) et le script le dit.
 *
 *   node scripts/cleanup-transitions-2026-08.mjs         (aperçu, ne supprime rien)
 *   node scripts/cleanup-transitions-2026-08.mjs --go    (supprime)
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

const SERIES_IDS = ["series-wx", "series-transitions-2"];
const go = process.argv.includes("--go");

/** Clé de rapprochement : le numéro d'œuvre en tête de titre (« 1091 lofae 1 »
 *  → « 1091 »). À défaut, le titre normalisé sans accents ni casse. */
function key(title) {
  const t = (title ?? "").trim();
  const num = t.match(/^(\d{2,5})(?!\d)/);
  if (num) return `n:${num[1]}`;
  return `t:${t
    .toLowerCase()
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()}`;
}

const series = await client.fetch(
  `*[_id in $ids]{_id, title, "slug": slug.current}`,
  { ids: SERIES_IDS },
);
console.log("Rubriques visées :");
for (const s of series) console.log(`  - ${s._id} — « ${s.title} »`);
if (series.length === 0) {
  console.log("Aucune des deux rubriques n'existe : déjà supprimées ?");
  process.exit(0);
}

// Toutes les œuvres (publiées ET brouillons) rattachées à ces rubriques.
const inside = await client.fetch(
  `*[_type == "artwork" && series._ref in $ids]{
     _id, title,
     "serie": series._ref,
     "validImages": count(images[defined(asset)])
   }`,
  { ids: SERIES_IDS },
);

// Les remplaçants possibles : toute œuvre publiée AILLEURS, avec une image valide.
const outside = await client.fetch(
  `*[_type == "artwork" && !(_id in path("drafts.**")) && defined(series) &&
     !(series._ref in $ids) && count(images[defined(asset)]) > 0]{
     _id, title, "serie": series->title
   }`,
  { ids: SERIES_IDS },
);

const replacements = new Map();
for (const a of outside) {
  const k = key(a.title);
  if (!replacements.has(k)) replacements.set(k, []);
  replacements.get(k).push(a);
}

const toDelete = [];
const kept = [];
for (const a of inside) {
  const isDraft = a._id.startsWith("drafts.");
  // Un brouillon dont le publié est lui-même supprimé part avec lui ; un
  // brouillon orphelin sans image ne porte aucun tableau.
  const match = replacements.get(key(a.title));
  if (match && match.length > 0) {
    toDelete.push({ ...a, isDraft, replacedBy: match[0] });
  } else if (isDraft && a.validImages === 0) {
    toDelete.push({ ...a, isDraft, replacedBy: null, reason: "brouillon vide" });
  } else {
    kept.push(a);
  }
}

console.log(`\n${inside.length} œuvres rattachées à ces rubriques.`);
console.log(`  → ${toDelete.length} supprimables (un exemplaire existe ailleurs)`);
console.log(`  → ${kept.length} CONSERVÉES (aucun remplaçant trouvé)\n`);

if (kept.length > 0) {
  console.log("Œuvres conservées, à traiter à la main :");
  for (const a of kept) {
    console.log(`  ! ${a._id} — « ${a.title ?? "(sans titre)"} » (${a.validImages} image(s))`);
  }
  console.log("");
}

// Rien ne doit référencer une œuvre qu'on supprime (mise en avant, etc.).
const ids = toDelete.map((a) => a._id);
const referenced = ids.length
  ? await client.fetch(
      `*[references($ids) && !(_id in $ids) && _type != "series"]{_id, _type}`,
      { ids },
    )
  : [];
if (referenced.length > 0) {
  console.log("⚠️  Ces documents référencent une œuvre à supprimer :");
  for (const r of referenced) console.log(`  - ${r._id} (${r._type})`);
  console.log("Arrêt : à examiner avant de continuer.");
  process.exit(1);
}

const sample = toDelete.slice(0, 10);
console.log("Échantillon de ce qui serait supprimé :");
for (const a of sample) {
  const via = a.replacedBy
    ? `remplacée par « ${a.replacedBy.title} » (${a.replacedBy.serie})`
    : a.reason;
  console.log(`  - ${a._id} « ${a.title ?? "(sans titre)"} » → ${via}`);
}
if (toDelete.length > sample.length) {
  console.log(`  … et ${toDelete.length - sample.length} autres`);
}

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour appliquer.");
  process.exit(0);
}

let tx = client.transaction();
for (const a of toDelete) tx = tx.delete(a._id);
await tx.commit();
console.log(`\n${toDelete.length} œuvres supprimées.`);

// Les rubriques ne partent que si plus rien ne les référence.
const rest = await client.fetch(
  `count(*[_type == "artwork" && series._ref in $ids])`,
  { ids: SERIES_IDS },
);
if (rest > 0) {
  console.log(
    `${rest} œuvre(s) référencent encore ces rubriques : rubriques CONSERVÉES.`,
  );
  process.exit(0);
}

let tx2 = client.transaction();
for (const id of SERIES_IDS) {
  tx2 = tx2.delete(id).delete(`drafts.${id}`);
}
await tx2.commit();
console.log("Rubriques Transitions 1 et Transitions 2 supprimées (brouillons compris).");
