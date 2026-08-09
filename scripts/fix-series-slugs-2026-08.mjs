/**
 * Répare les ADRESSES de rubriques invalides.
 *
 * Bernard, le 08/08/2026 : « la rubrique tentures est introuvable sur le site ».
 * Cause : en réutilisant l'ancienne rubrique « La Divine Comédie » il a tapé le
 * titre dans le champ URL, qui vaut donc « Les tentures » — avec une majuscule
 * et une espace. Le lien produit est /series/Les tentures, qui renvoie une 404.
 * La rubrique s'affichait bien dans la liste, mais était inatteignable.
 *
 * Le script balaie TOUTES les rubriques, pas seulement celle-là, et remet les
 * adresses non conformes au format attendu (minuscules, chiffres, tirets).
 *
 *   node scripts/fix-series-slugs-2026-08.mjs         (aperçu)
 *   node scripts/fix-series-slugs-2026-08.mjs --go    (applique)
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

const slugify = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

// NB : l'opérateur `match` de GROQ fait du texte à jokers, pas de la regex.
// Le tri se fait donc en JS, sur une vraie expression régulière.
const toutes = await client.fetch(
  `*[_type == "series"]{_id, title, "slug": slug.current}`,
);
const VALIDE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const bad = toutes.filter((s) => !s.slug || !VALIDE.test(s.slug));
let corrigees = 0;

if (bad.length === 0) {
  console.log("Aucune adresse de rubrique invalide.");
  process.exit(0);
}

// Les adresses déjà prises par les AUTRES rubriques (pas par soi-même).
const aCorriger = new Set(bad.map((s) => s._id));
const existants = new Set(
  toutes.filter((s) => s.slug && !aCorriger.has(s._id)).map((s) => s.slug),
);

for (const s of bad) {
  const base = slugify(s.slug || s.title);
  if (!base) {
    console.log(`${s._id} « ${s.title} » : ni adresse ni titre exploitable, ignorée.`);
    continue;
  }
  let next = base;
  // Deux rubriques ne peuvent pas partager la même adresse.
  let n = 2;
  while (existants.has(next)) next = `${base}-${n++}`;
  existants.add(next);

  console.log(`${s._id} « ${s.title} »`);
  console.log(`    « ${s.slug ?? "(vide)"} »  ->  « ${next} »`);

  if (go) {
    await client
      .patch(s._id)
      .set({ slug: { _type: "slug", current: next } })
      .commit();
    // Un brouillon en cours porterait encore l'ancienne adresse.
    await client
      .patch(`drafts.${s._id}`)
      .set({ slug: { _type: "slug", current: next } })
      .commit()
      .catch(() => {});
    corrigees += 1;
  }
}

console.log(
  go ? `\n${corrigees} adresse(s) corrigée(s).` : "\nAperçu seulement. Relancer avec --go.",
);
