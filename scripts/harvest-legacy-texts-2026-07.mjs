/**
 * Récupération des TEXTES de l'ancien site e-monsite depuis la Wayback Machine.
 *
 * Contexte : le scrape initial (scripts/scrape.mjs) n'a rapatrié que les titres
 * et les images, pas les textes que Bernard avait écrits pour accompagner
 * chaque rubrique. L'ancien site n'existe plus (le domaine pointe sur Vercel
 * depuis le 19/06/2026), mais archive.org en a des instantanés de mars/avril
 * 2026.
 *
 * Structure des pages e-monsite : une suite de « row-container », chacun avec
 * un titre optionnel (h2.row-title), du texte optionnel (div.column-content)
 * et des images. Le premier bloc de texte, avant toute image, est le texte
 * d'intro de la rubrique. Les blocs titrés suivants sont les SOUS-SÉRIES que
 * Bernard veut retrouver (ex. Tendance singulière = Gorgonéïons / Têtaramilles
 * / tentures).
 *
 * Ce script ne touche À RIEN dans Sanity : il écrit un rapport JSON que
 * scripts/apply-legacy-texts-2026-07.mjs applique ensuite.
 *
 *   node scripts/harvest-legacy-texts-2026-07.mjs [--only <slug>] [--out <fichier>]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CATALOGUE = `${ROOT}/data/catalogue.json`;
const CACHE_DIR = `${ROOT}/data/legacy-html`;
const argOf = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};
const OUT = argOf("--out") ?? `${ROOT}/data/legacy-texts.json`;
const ONLY = argOf("--only");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) bernard-devisme-restore/1.0";
const SNAPSHOT_TS = "20260401"; // avant la bascule du domaine (19/06/2026)

/** Bruit de pied de page e-monsite, présent sur toutes les pages. */
const FOOTER_NOISE = [
  /La plupart des oeuvres présentées sont disponibles à la vente/i,
  /laisser vos commentaires et coordonnées dans le livre d'or/i,
  /tous les documents sont copyright/i,
  /Date de dernière mise à jour/i,
  /Ajouter un commentaire/i,
];
const isNoise = (t) => FOOTER_NOISE.some((r) => r.test(t));

const ENTITIES = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", hellip: "…",
  laquo: "«", raquo: "»", eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
  agrave: "à", acirc: "â", ccedil: "ç", ocirc: "ô", ugrave: "ù", ucirc: "û",
  icirc: "î", iuml: "ï", oelig: "œ", Eacute: "É", Egrave: "È", Agrave: "À",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—",
  deg: "°", middot: "·", bull: "•", times: "×", euro: "€", trade: "™",
};
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name] ?? m);
}

/** HTML d'un bloc → paragraphes texte, un par <p>/<br>, vidés du bruit. */
function htmlToParagraphs(html) {
  return decodeEntities(
    html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 1 && !isNoise(l));
}

/** archive.org renvoie des 429 en rafale : on réessaie en espaçant. */
async function fetchWithRetry(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res;
    if (res.status !== 429 && res.status !== 503) return res;
    const wait = 5000 * 2 ** i;
    console.log(`  (${res.status}, nouvelle tentative dans ${wait / 1000}s)`);
    await new Promise((r) => setTimeout(r, wait));
  }
  return null;
}

async function fetchArchived(sourceUrl, slug) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const cached = `${CACHE_DIR}/${slug}.html`;
  if (existsSync(cached)) return readFileSync(cached, "utf8");

  const availRes = await fetchWithRetry(
    `https://archive.org/wayback/available?url=${sourceUrl.replace(/^https?:\/\//, "")}&timestamp=${SNAPSHOT_TS}`,
  );
  if (!availRes?.ok) return null;
  const avail = await availRes.json();
  const snap = avail?.archived_snapshots?.closest;
  if (!snap?.available) return null;

  // `id_` = contenu original, sans la barre d'outils injectée par archive.org.
  const raw = snap.url.replace(/\/web\/(\d+)\//, "/web/$1id_/");
  const res = await fetchWithRetry(raw);
  if (!res?.ok) return null;
  const html = await res.text();
  writeFileSync(cached, html);
  return html;
}

/** Page e-monsite → { intro: string[], rows: [{title, text[], images[]}] }. */
function parseLegacyPage(html) {
  const blocks = html.split(/(?=<div class="row-container)/).filter((b) => b.startsWith('<div class="row-container'));

  const rows = [];
  for (const b of blocks) {
    const tm = b.match(/<h2 class="row-title">([\s\S]*?)<\/h2>/i);
    const title = tm ? decodeEntities(tm[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() : null;

    const cells = b.match(/<div id="cell-[^"]*" class="column-content">[\s\S]*?(?=<div data-role="cell"|<\/div>\s*<\/div>\s*<\/div>)/gi) ?? [];
    const text = cells.flatMap((c) => htmlToParagraphs(c));

    const images = [...b.matchAll(/<img[^>]*src="([^"]+)"/gi)]
      .map((m) => m[1])
      .filter((u) => u.includes("/medias/") || u.includes("s3.e-monsite"))
      .map((u) => decodeURIComponent(u.split("?")[0].split("/").pop()));

    if (title || text.length || images.length) rows.push({ title, text, images });
  }

  // Le premier bloc est l'intro de la rubrique. Chaque bloc TITRÉ suivant
  // ouvre une sous-série, à laquelle appartiennent les images des blocs non
  // titrés qui viennent après (l'ancien site étalait une série sur plusieurs
  // lignes d'images).
  const firstSub = rows.findIndex((r, i) => i > 0 && r.title);
  const introRows = firstSub === -1 ? rows : rows.slice(0, firstSub);
  const intro = introRows.flatMap((r) => r.text);

  return { intro, rows, introRowCount: introRows.length };
}

const catalogue = JSON.parse(readFileSync(CATALOGUE, "utf8"));
const series = catalogue.series.filter((s) => !ONLY || s.slug === ONLY);

const report = [];
for (const s of series) {
  const html = await fetchArchived(s.sourceUrl, s.slug);
  if (!html) {
    report.push({ slug: s.slug, title: s.title, error: "aucun instantané archivé" });
    console.log(`✗ ${s.slug} : pas d'archive`);
    continue;
  }
  const { intro, rows, introRowCount } = parseLegacyPage(html);

  // Sous-séries = blocs titrés situés APRÈS l'intro et suivis d'images. Les
  // images des blocs non titrés qui suivent appartiennent au dernier titre vu.
  const subseries = [];
  let current = null;
  for (const r of rows.slice(introRowCount)) {
    if (r.title) {
      // e-monsite répétait souvent le titre en première ligne de texte.
      const text = r.text.filter((t) => t.toLowerCase() !== r.title.toLowerCase());
      current = { title: r.title, text, images: [...r.images] };
      subseries.push(current);
    } else if (current) {
      current.images.push(...r.images);
      current.text.push(...r.text);
    }
  }

  report.push({
    slug: s.slug,
    title: s.title,
    sourceUrl: s.sourceUrl,
    intro,
    subseries: subseries.filter((g) => g.images.length > 0),
    orphanImages: rows.slice(introRowCount).reduce((n, r) => n + (r.title ? 0 : 0), 0),
  });
  const n = subseries.filter((g) => g.images.length > 0).length;
  console.log(
    `✓ ${s.slug} · intro ${intro.join(" ").length} signes · ${n} sous-série${n > 1 ? "s" : ""}`,
  );
  await new Promise((r) => setTimeout(r, 1500));
}

writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\nRapport écrit : ${OUT}`);
console.log(
  `Rubriques avec texte d'intro : ${report.filter((r) => r.intro?.length).length}/${report.length}`,
);
console.log(
  `Rubriques avec sous-séries : ${report.filter((r) => r.subseries?.length).length}/${report.length}`,
);
