/**
 * Document de restitution : TOUS les textes retrouvés de l'ancien site
 * e-monsite, page par page, pour que Bernard puisse les relire et recopier ce
 * qu'il veut.
 *
 * Demande du 29/07/2026 : « n'ayant plus la main sur E-monsite, je n'ai plus
 * les textes. As-tu les moyens de les récupérer ? ». Les textes vivent dans
 * data/legacy-texts.json (harvest depuis la Wayback Machine) ; ceux qui ont pu
 * être replacés automatiquement l'ont déjà été par
 * apply-legacy-texts-2026-07.mjs, mais Bernard n'a aucun moyen de savoir ce
 * qui existe encore. D'où ce document, qui montre TOUT — y compris les
 * légendes de tableaux que l'import écarte volontairement du site.
 *
 *   node scripts/build-textes-anciens-2026-07.mjs
 *
 * Produit un HTML dans Config/livrables/clients/bernard-devisme/ ; le PDF se
 * fabrique ensuite avec Chrome en mode headless (voir la commande affichée en
 * fin d'exécution).
 */
import { createClient } from "@sanity/client";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = `${ROOT}/../../Config/livrables/clients/bernard-devisme/textes-ancien-site.html`;

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

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Le texte déjà en ligne, pour dire à Bernard ce qui lui reste à faire. */
const enLigne = await client.fetch(
  `*[_type == "series"]{ "slug": slug.current, _id, title, "texte": pt::text(statement) }`,
);
const bySlug = new Map(enLigne.map((s) => [s.slug, s]));
const byId = new Map(enLigne.map((s) => [s._id, s]));

const pages = JSON.parse(readFileSync(`${ROOT}/data/legacy-texts.json`, "utf8")).filter(
  (p) => !p.error,
);

/** Légende de tableau : « format 60 x 73 », « acrylique sur toile ». */
const estLegende = (l) =>
  /^(format|dimensions?|technique)\b/i.test(l) ||
  /^(acrylique|huile|encre|aquarelle|pastel|fusain|gravure|monotype|collage|raku)\b/i.test(l) ||
  /\d{2,3}\s*[x×]\s*\d{2,3}/.test(l);

/**
 * e-monsite coupait les phrases en autant de paragraphes que de lignes
 * affichées. Recoller ce qui n'est pas fini rend le document lisible ; les
 * légendes gardent leur ligne à elles.
 */
const recoller = (lignes) => {
  const out = [];
  for (const l of lignes) {
    const prev = out[out.length - 1];
    if (prev && !/[.!?:»"”)\]…]$/.test(prev) && !estLegende(l) && !estLegende(prev)) {
      out[out.length - 1] = `${prev} ${l}`.replace(/\s+/g, " ");
    } else {
      out.push(l);
    }
  }
  return out;
};

/** Tout le texte d'une page : l'intro, puis les blocs titrés qui la suivent. */
const blocsDe = (p) => {
  const out = [];
  if (p.intro?.length) out.push({ titre: null, lignes: recoller(p.intro) });
  for (const g of p.subseries ?? []) {
    if (g.text?.length) out.push({ titre: g.title, lignes: recoller(g.text) });
  }
  return out;
};

const withText = pages.filter((p) => blocsDe(p).length > 0);
const sansTexte = pages.filter((p) => blocsDe(p).length === 0);

const sections = withText
  .map((p) => {
    const cible = byId.get(`series-${p.slug}`) ?? bySlug.get(p.slug);
    const statut = !cible
      ? `<span class="statut">plus de rubrique</span>`
      : cible.texte?.trim()
        ? `<span class="statut">déjà en ligne</span>`
        : `<span class="statut a-remettre">à remettre</span>`;

    const corps = blocsDe(p)
      .map(
        (b) =>
          (b.titre ? `<h4>${esc(b.titre)}</h4>` : "") +
          b.lignes.map((l) => `<p>${esc(l)}</p>`).join("\n"),
      )
      .join("\n");

    return `<section>
  <h3>${esc(p.title)} ${statut}</h3>
  ${corps}
</section>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Tes textes de l'ancien site</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 20pt; font-weight: normal; margin-bottom: 4mm; }
  .chapo { color: #555; margin-bottom: 10mm; }
  /* Les textes s'enchaînent : une section par page laisserait 40 pages
     quasi vides. Seul le titre reste solidaire de son texte. */
  section { margin-bottom: 7mm; }
  h3 { font-size: 13pt; font-weight: bold; margin-bottom: 1.5mm; break-after: avoid; page-break-after: avoid; }
  h4 { font-size: 12pt; font-style: italic; font-weight: normal; margin: 3mm 0 1mm; break-after: avoid; page-break-after: avoid; }
  p { margin-bottom: 1.5mm; }
  .statut { font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt; font-weight: normal; color: #888; }
  .statut.a-remettre { color: #8a4a12; }
  .fin { margin-top: 10mm; padding-top: 4mm; border-top: 0.5pt solid #bbb; color: #555; font-size: 11pt; }
</style>
</head>
<body>

<h1>Tes textes de l'ancien site</h1>
<p class="chapo">Retrouvés dans les archives du web, page par page. Ceux marqués « à remettre » ne
sont pas encore sur le nouveau site.</p>

${sections}

<div class="fin">
  <p>Sans texte retrouvé : ${sansTexte.map((p) => esc(p.title)).join(", ")}.</p>
</div>

</body>
</html>`;

writeFileSync(OUT, html);
console.log(`Écrit : ${OUT}`);
console.log(`${withText.length} pages avec texte · ${sansTexte.length} sans texte`);
console.log(
  `\nPDF :\n  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \\\n    --print-to-pdf="${OUT.replace(/\.html$/, ".pdf").replace("textes-ancien-site", "Vos-textes-de-l-ancien-site")}" \\\n    --no-pdf-header-footer "file://${OUT}"`,
);
