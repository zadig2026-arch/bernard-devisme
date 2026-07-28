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

/** Tout le texte d'une page : l'intro, puis les blocs titrés qui la suivent. */
const blocsDe = (p) => {
  const out = [];
  if (p.intro?.length) out.push({ titre: null, lignes: p.intro });
  for (const g of p.subseries ?? []) {
    if (g.text?.length) out.push({ titre: g.title, lignes: g.text });
  }
  return out;
};

const withText = pages.filter((p) => blocsDe(p).length > 0);
const sansTexte = pages.filter((p) => blocsDe(p).length === 0);

const sections = withText
  .map((p) => {
    const cible = byId.get(`series-${p.slug}`) ?? bySlug.get(p.slug);
    const dejaEnLigne = Boolean(cible?.texte?.trim());
    const statut = !cible
      ? `<span class="statut absent">Cette page n'a pas de rubrique sur le nouveau site</span>`
      : dejaEnLigne
        ? `<span class="statut ok">Texte déjà en ligne dans « ${esc(cible.title)} »</span>`
        : `<span class="statut todo">À recopier dans « ${esc(cible.title)} » si vous le souhaitez</span>`;

    const corps = blocsDe(p)
      .map(
        (b) =>
          (b.titre ? `<h4>${esc(b.titre)}</h4>` : "") +
          b.lignes.map((l) => `<p>${esc(l)}</p>`).join("\n"),
      )
      .join("\n");

    return `<section>
  <h3>${esc(p.title)}</h3>
  ${statut}
  <div class="texte">${corps}</div>
</section>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Vos textes de l'ancien site — Bernard Devisme</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12.5pt; line-height: 1.55; color: #1a1a1a; }
  .cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; text-align: center; page-break-after: always; }
  .cover .site { font-size: 12pt; letter-spacing: 3px; text-transform: uppercase; color: #777; margin-bottom: 14mm; }
  .cover h1 { font-size: 32pt; font-weight: normal; line-height: 1.25; margin-bottom: 10mm; }
  .cover .sub { font-size: 14pt; color: #444; margin-bottom: 20mm; }
  .cover .note { margin-top: 20mm; font-size: 11pt; color: #777; }
  .intro { page-break-after: always; }
  h2 { font-size: 19pt; font-weight: normal; border-bottom: 1.5pt solid #1a1a1a; padding-bottom: 3mm; margin-bottom: 6mm; }
  .intro p { margin-bottom: 4mm; }
  .intro ul { margin: 0 0 5mm 6mm; }
  .intro li { margin-bottom: 2.5mm; }
  /* Les textes s'enchaînent : une section par page laisserait 40 pages
     quasi vides. Seul le bloc titre + étiquette reste solidaire. */
  section { margin-bottom: 8mm; padding-bottom: 4mm; border-bottom: 0.5pt solid #ccc; }
  section > h3, section > .statut { break-after: avoid; page-break-after: avoid; }
  h3 { font-size: 15pt; font-weight: normal; font-style: italic; margin-bottom: 2mm; }
  h4 { font-size: 12.5pt; font-weight: bold; margin: 4mm 0 1.5mm; }
  .statut { display: inline-block; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; padding: 1mm 3mm; border-radius: 2mm; margin-bottom: 3mm; }
  .statut.ok { background: #e8f0e4; color: #33562a; }
  .statut.todo { background: #fdf0e0; color: #8a4a12; }
  .statut.absent { background: #eee; color: #555; }
  .texte p { margin-bottom: 2mm; }
  .reste { page-break-before: always; }
  .reste li { margin-bottom: 1.5mm; }
</style>
</head>
<body>

<div class="cover">
  <div class="site">devismebernardpeintre.com</div>
  <h1>Vos textes<br>de l'ancien site</h1>
  <div class="sub">Tout ce qui a pu être retrouvé, page par page</div>
  <div class="note">Document préparé par Zadig Becques · zadig.pro</div>
</div>

<div class="intro">
  <h2>Ce que vous avez entre les mains</h2>
  <p>Votre ancien site n'existe plus en ligne, mais il en reste des copies dans les archives publiques
  du web. J'y ai récupéré vos textes, page par page. Ce document les rassemble tous.</p>
  <p>Vous n'avez rien à faire d'urgent : la plupart sont <strong>déjà remis en place</strong> sur le
  nouveau site. Chaque texte porte une étiquette :</p>
  <ul>
    <li><span class="statut ok">Texte déjà en ligne</span> il est sur le site, vous n'avez rien à faire.</li>
    <li><span class="statut todo">À recopier</span> la rubrique existe, mais elle n'a pas encore ce texte.
    Vous pouvez le recopier depuis ce document si vous le voulez.</li>
    <li><span class="statut absent">Pas de rubrique</span> cette page de l'ancien site n'a pas
    d'équivalent aujourd'hui (parcours, expositions passées). Le texte est conservé ici.</li>
  </ul>
  <p>Les textes sont donnés <strong>tels quels</strong>, y compris les indications de format et de
  technique qui accompagnaient vos tableaux. Sur le site, ces légendes ont été écartées des textes de
  présentation : elles s'y lisaient comme des phrases. Vous les retrouvez ici si vous en avez besoin.</p>
</div>

${sections}

<div class="reste">
  <h2>Pages sans texte retrouvé</h2>
  <p>Ces pages de l'ancien site ne contenaient que des images, ou leur texte n'a pas survécu dans les
  archives :</p>
  <ul>
    ${sansTexte.map((p) => `<li>${esc(p.title)}</li>`).join("\n    ")}
  </ul>
</div>

</body>
</html>`;

writeFileSync(OUT, html);
console.log(`Écrit : ${OUT}`);
console.log(`${withText.length} pages avec texte · ${sansTexte.length} sans texte`);
console.log(
  `\nPDF :\n  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \\\n    --print-to-pdf="${OUT.replace(/\.html$/, ".pdf").replace("textes-ancien-site", "Vos-textes-de-l-ancien-site")}" \\\n    --no-pdf-header-footer "file://${OUT}"`,
);
