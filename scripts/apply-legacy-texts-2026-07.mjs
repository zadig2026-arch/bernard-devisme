/**
 * Applique dans Sanity le rapport produit par harvest-legacy-texts-2026-07.mjs :
 * les textes d'intro des rubriques de l'ancien site e-monsite, et les
 * « groupes d'œuvres » (sous-séries) reconstitués depuis ses lignes titrées.
 *
 * Garde-fous :
 *  - on n'écrase JAMAIS un texte déjà présent (Bernard en a retapé plusieurs
 *    à la main le 24/07) ni des groupes déjà déclarés ;
 *  - les œuvres sont rattachées à leur groupe par le nom de fichier d'origine
 *    de leur image, conservé par l'import initial.
 *
 *   node scripts/apply-legacy-texts-2026-07.mjs          (aperçu)
 *   node scripts/apply-legacy-texts-2026-07.mjs --go     (écrit)
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const go = process.argv.includes("--go");
// --rewrite : réécrit aussi les rubriques déjà remplies PAR CE SCRIPT (utile
// après une correction de mise en forme). Les textes de Bernard (PROTECTED)
// restent intouchables.
const rewrite = process.argv.includes("--rewrite");
// --diff : affiche l'avant/après de chaque texte réécrit (à lire avant --go).
const diff = process.argv.includes("--diff");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const env = Object.fromEntries(
  readFileSync(`${ROOT}/.env.local`, "utf8")
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

let keyCounter = 0;
const nextKey = (prefix) => `${prefix}${(keyCounter++).toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Portable Text → texte brut, pour comparer un texte en base à un texte calculé. */
const plainText = (blocks) =>
  (blocks ?? [])
    .flatMap((b) => (b.children ?? []).map((c) => c.text ?? ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const toBlocks = (lines) =>
  lines.map((text) => ({
    _type: "block",
    _key: nextKey("b"),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: nextKey("s"), text, marks: [] }],
  }));

/**
 * Les pages de l'ancien site mélangeaient de la prose, des légendes de tableau
 * (« "le manège désenchanté" 146 x 114 », « acrylique sur toile ») et des
 * libellés de fichiers téléchargeables (« Animation1.gif (242.16 Ko) »).
 * On ne garde que la prose : Bernard remettra les légendes s'il les veut.
 */
const isJunk = (line) =>
  /\.(gif|jpe?g|png|mp3|wav|pdf|docx?|xlsx?|zip)\b/i.test(line) ||
  /\(\s*[\d.,]+\s*(K|M|G)o\s*\)/i.test(line);

const isCaption = (line) =>
  /^["«].{0,60}["»]?\s*\d{2,3}\s*[x×]\s*\d{2,3}/i.test(line) ||
  (line.split(/\s+/).length < 6 && line.length < 45);

/** Légende de tableau : « format 60 x 73 », « acrylique sur toile », « 45 x 90 ». */
const looksLikeCaption = (line) =>
  /^(format|dimensions?|technique)\b/i.test(line) ||
  /^(acrylique|huile|encre|aquarelle|pastel|fusain|gravure|monotype|collage|raku)\b/i.test(line) ||
  /\d{2,3}\s*[x×]\s*\d{2,3}/.test(line);

const isProse = (line) => !isJunk(line) && line.length >= 45 && !isCaption(line);

/**
 * L'intro tolère une phrase courte, mais pas les légendes ni les fichiers.
 * `looksLikeCaption` rattrape les légendes que le seuil de longueur laissait
 * passer (« format 55 x 46 acrylique sur toile »), qui traînaient en fin de
 * plusieurs textes de rubrique et s'y lisaient comme de la présentation.
 */
const isIntroProse = (line) =>
  !isJunk(line) &&
  !isCaption(line) &&
  !looksLikeCaption(line) &&
  (line.length >= 40 || line.split(/\s+/).length >= 6);

/**
 * e-monsite coupait les phrases en autant de <p> que de lignes affichées
 * (« … utilise avec une grande liberté des éléments (yeux, » / « bouches…) »).
 * On recolle : une ligne qui ne finit pas sur une ponctuation forte continue
 * dans la suivante.
 *
 * Le recollage doit voir les lignes BRUTES, pas les lignes déjà filtrées :
 * une fin de phrase est souvent trop courte pour passer le filtre de prose et
 * disparaissait donc avant d'avoir pu être recollée (« Les peintures
 * abstraites » s'arrêtait sur « … rien dans », sans sa chute). D'où `keep`,
 * qui dit quelles lignes ouvrent un paragraphe ; les autres ne servent qu'à
 * compléter un paragraphe ouvert et resté en suspens, et jamais s'il s'agit
 * d'une légende de tableau ou d'un nom de fichier.
 */
function joinWrappedLines(lines, keep = () => true) {
  const out = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    const pending = prev && !/[.!?:»"”)\]…]$/.test(prev);
    if (pending && !isJunk(line) && !looksLikeCaption(line)) {
      out[out.length - 1] = `${prev} ${line}`.replace(/\s+/g, " ");
    } else if (keep(line)) {
      out.push(line);
    }
  }
  return out;
}

/** Rubriques dont Bernard a écrit ou retapé le texte lui-même : on n'y touche jamais. */
const PROTECTED = new Set([
  "series-la-divine-comedie",
  "series-le-temps-inacheve",
  "series-les-ecorces",
  "series-les-cageots",
  "series-peintures",
  "series-les",
  "series-les-gueules",
  // Textes saisis par Bernard le 27/07/2026 dans le Studio, après le premier
  // passage de ce script (« j'ai commencé à mettre quelques textes »). Les
  // titres ont changé depuis, pas les identifiants : `series-peintures-2023`
  // s'appelle aujourd'hui « peintures album 3 » et `series-peintures-album-3 »
  // « peintures album 6 ».
  "series-peintures-2023",
  "series-peintures-album-3",
]);

const norm = (f) => f.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]/g, "");

const report = JSON.parse(readFileSync(`${ROOT}/data/legacy-texts.json`, "utf8"));
const entries = report.filter((r) => !r.error && (!ONLY || r.slug === ONLY));

let statementsSet = 0;
let subseriesSet = 0;
let artworksTagged = 0;
const skipped = [];

for (const entry of entries) {
  const series = await client.fetch(
    '*[_type == "series" && !(_id in path("drafts.**")) && (_id == $id || slug.current == $slug)][0]{_id, title, statement, subseries}',
    { id: `series-${entry.slug}`, slug: entry.slug },
  );
  if (!series) {
    skipped.push(`${entry.slug} : rubrique absente de Sanity`);
    continue;
  }

  const patch = {};

  // 1. Texte d'intro de la rubrique.
  const introLines = joinWrappedLines(entry.intro ?? [], isIntroProse);
  if (introLines.length) {
    if (series.statement?.length && !(rewrite && !PROTECTED.has(series._id))) {
      skipped.push(`${series.title} : texte déjà présent, laissé tel quel`);
    } else {
      // `--diff` : ce que la réécriture changerait, avant de l'écrire. Les
      // heuristiques de nettoyage ont déjà tronqué des textes en silence, on
      // ne réécrit plus sans avoir relu.
      const before = plainText(series.statement);
      const after = introLines.join(" ");
      if (before === after) {
        skipped.push(`${series.title} : réécriture sans changement`);
      } else {
        if (diff) {
          console.log(`\n~~~ ${series.title} (${series._id})`);
          console.log(`  AVANT : ${before || "(vide)"}`);
          console.log(`  APRÈS : ${after}`);
        }
        patch.statement = toBlocks(introLines);
      }
    }
  }

  // 2. Groupes d'œuvres + rattachement des œuvres.
  const tagOps = [];
  if (entry.subseries?.length) {
    if (series.subseries?.length && !(rewrite && !PROTECTED.has(series._id))) {
      skipped.push(`${series.title} : groupes déjà déclarés, laissés tels quels`);
    } else {
      const artworks = await client.fetch(
        '*[_type == "artwork" && !(_id in path("drafts.**")) && references($id)]{_id, "files": images[].asset->originalFilename}',
        { id: series._id },
      );
      const byFile = new Map();
      for (const a of artworks) {
        for (const f of a.files ?? []) if (f) byFile.set(norm(f), a._id);
      }

      const groups = [];
      for (const g of entry.subseries) {
        const ids = [...new Set(g.images.map((f) => byFile.get(norm(f))).filter(Boolean))];
        if (ids.length === 0) continue;
        const key = nextKey("g");
        const text = (g.text ?? []).filter(isProse);
        groups.push({
          _type: "subserie",
          _key: key,
          title: g.title,
          ...(text.length ? { text: toBlocks(text) } : {}),
        });
        for (const id of ids) tagOps.push({ id, key });
      }
      // Un seul groupe qui couvre toute la rubrique n'apporte rien.
      if (groups.length >= 2) patch.subseries = groups;
      else tagOps.length = 0;
    }
  }

  if (!Object.keys(patch).length && tagOps.length === 0) continue;

  console.log(
    `${series.title} (${series._id})` +
      (patch.statement ? ` · texte ${introLines.length} §` : "") +
      (patch.subseries ? ` · ${patch.subseries.length} groupes / ${tagOps.length} œuvres` : ""),
  );
  if (patch.subseries) {
    for (const g of patch.subseries) {
      console.log(`    – ${g.title} : ${tagOps.filter((t) => t.key === g._key).length} œuvres`);
    }
  }

  if (go) {
    if (Object.keys(patch).length) await client.patch(series._id).set(patch).commit();
    for (const t of tagOps) await client.patch(t.id).set({ subseries: t.key }).commit();
  }
  if (patch.statement) statementsSet++;
  if (patch.subseries) subseriesSet++;
  artworksTagged += tagOps.length;
}

console.log(
  `\n${go ? "Appliqué" : "Aperçu"} : ${statementsSet} textes · ${subseriesSet} rubriques découpées en groupes · ${artworksTagged} œuvres rattachées`,
);
if (skipped.length) console.log(`\nIgnorés (${skipped.length}) :\n  ` + skipped.join("\n  "));
if (!go) console.log("\nRelancer avec --go pour écrire dans Sanity.");
