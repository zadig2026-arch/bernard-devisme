/**
 * Mail de Bernard du 08/09/2026 (« site »), deux demandes :
 *
 * 1. « dans 2024 peintures je n'arrive pas à effacer : 1442-1443-1444
 *    envoyées dans "transitions" ».
 *    Même scénario que l'album 3 le 08/08 : le 24/08 à 9h41 il a ouvert les
 *    trois œuvres de « 2024_peintures » et VIDÉ le champ Rubrique (brouillons
 *    jamais publiés, donc le site les affiche toujours dans 2024), puis à 9h44
 *    il les a re-téléversées dans « 2018_Transitions » (mêmes fichiers : Sanity
 *    a réutilisé les mêmes assets image). Les exemplaires de 2024 sont donc
 *    des DOUBLONS : on les supprime (publié + brouillon), rien n'est perdu.
 *
 * 2. « déplacer la rubrique "les gueules" de "dessin" vers "infographies" en
 *    BLOC ». L'appartenance est le champ « Partie du site » de la rubrique :
 *    un seul changement, les 5 œuvres suivent. On le fait pour lui, en
 *    écrivant directement le document publié (pas de brouillon en cours).
 *
 * GARDE-FOUS : une œuvre de 2024 n'est supprimée que si un exemplaire publié
 * existe dans Transitions avec le MÊME numéro ET le MÊME asset image, et si
 * rien d'autre (rubrique, couverture…) ne la référence. Sinon elle est
 * conservée et listée.
 *
 *   node scripts/fix-2024-gueules-2026-09.mjs         (aperçu, n'écrit rien)
 *   node scripts/fix-2024-gueules-2026-09.mjs --go    (applique)
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

const SERIE_2024 = "series-peintures-2024";
const SERIE_TRANSITIONS = "series-wx";
const SERIE_GUEULES = "series-les-gueules";
const NUMEROS = ["1442", "1443", "1444"];
const go = process.argv.includes("--go");

// ---------- 1. Doublons 1442-1444 ----------
const docs = await client.fetch(
  `*[_type == "artwork" && title in $nums]{
     _id, title, "serie": series._ref,
     "assets": images[defined(asset)].asset._ref,
     "refs": *[references(^._id)]._id
   }`,
  { nums: NUMEROS },
);

const aSupprimer = [];
const conserves = [];
for (const num of NUMEROS) {
  const publie2024 = docs.find((d) => d.title === num && d.serie === SERIE_2024 && !d._id.startsWith("drafts."));
  if (!publie2024) {
    conserves.push(`${num} : aucun exemplaire publié dans 2024, rien à faire`);
    continue;
  }
  const remplacant = docs.find(
    (d) =>
      d.title === num &&
      d.serie === SERIE_TRANSITIONS &&
      !d._id.startsWith("drafts.") &&
      d.assets.length > 0 &&
      d.assets.every((a) => publie2024.assets.includes(a)),
  );
  const brouillon = docs.find((d) => d._id === `drafts.${publie2024._id}`);
  const refsExternes = publie2024.refs.filter((r) => r !== `drafts.${publie2024._id}`);
  if (!remplacant) {
    conserves.push(`${num} : CONSERVÉ, pas de remplaçant identique dans Transitions`);
  } else if (refsExternes.length) {
    conserves.push(`${num} : CONSERVÉ, référencé par ${refsExternes.join(", ")}`);
  } else {
    aSupprimer.push({ num, ids: [publie2024._id, brouillon?._id].filter(Boolean), remplacant: remplacant._id });
  }
}

console.log("— 1. Doublons de 2024_peintures —");
for (const s of aSupprimer) console.log(`  supprimer ${s.num} (${s.ids.join(" + ")}), remplaçant Transitions ${s.remplacant}`);
for (const c of conserves) console.log(`  ${c}`);

// ---------- 2. « les gueules » → Infographies ----------
const gueules = await client.fetch(
  `{"pub": *[_id == $id][0]{_id, title, category},
    "draft": *[_id == "drafts." + $id][0]{_id, category},
    "nb": count(*[_type == "artwork" && series._ref == $id])}`,
  { id: SERIE_GUEULES },
);
console.log("\n— 2. Rubrique « les gueules » —");
console.log(`  publié : ${gueules.pub?.title} / partie ${gueules.pub?.category} / ${gueules.nb} œuvres`);
console.log(`  brouillon en cours : ${gueules.draft ? gueules.draft._id + " (partie " + gueules.draft.category + ")" : "aucun"}`);
const deplacerGueules = gueules.pub && gueules.pub.category !== "infographies";
console.log(deplacerGueules ? "  → passer la partie à « infographies »" : "  déjà dans Infographies, rien à faire");

if (!go) {
  console.log("\nAperçu seulement. Relancer avec --go pour appliquer.");
  process.exit(0);
}

const tx = client.transaction();
for (const s of aSupprimer) for (const id of s.ids) tx.delete(id);
if (deplacerGueules) {
  tx.patch(SERIE_GUEULES, (p) => p.set({ category: "infographies" }));
  if (gueules.draft) tx.patch(gueules.draft._id, (p) => p.set({ category: "infographies" }));
}
const res = await tx.commit();
console.log(`\nAppliqué (transaction ${res.transactionId}).`);

const verif = await client.fetch(
  `{"restants2024": *[_type == "artwork" && series._ref == $s2024 && title in $nums]._id,
    "transitions": *[_type == "artwork" && series._ref == $swx && title in $nums && !(_id in path("drafts.**"))].title,
    "gueules": *[_id == $sg][0].category}`,
  { s2024: SERIE_2024, swx: SERIE_TRANSITIONS, nums: NUMEROS, sg: SERIE_GUEULES },
);
console.log("Vérification :", JSON.stringify(verif));
