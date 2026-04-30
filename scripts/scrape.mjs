#!/usr/bin/env node
// Scrape Bernard Devisme's e-monsite into local data/
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const IMG_DIR = join(DATA_DIR, 'images');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Medium classification by URL prefix
function classifyMedium(url) {
  if (url.includes('/pages/sculptures/')) return 'sculpture';
  if (url.includes('/pages/dessin/')) return 'dessin';
  if (url.includes('/pages/infographies/')) return 'infographie';
  if (url.includes('/pages/annee-2013/')) return 'peinture';
  if (url.includes('/pages/et-plus-encore/')) return 'livre-objet';
  return null;
}

// URLs to ignore (index pages, parcours, agenda, contact, livredor, in-construction stubs)
const IGNORE_PATTERNS = [
  /\/agenda\//,
  /\/contact\//,
  /\/livredor\//,
  /\/pages\/parcours\//,
  /\/pages\/(sculptures|dessin|infographies|annee-2013|et-plus-encore)\/$/,
  /\/$/,
  /en-construction\.html/,
  /atelier\.html/,
  /l-oeil-du-maitre\.html/,
  /la-commanderie/,
  /exposition-d-un-regard/,
];

function shouldIgnore(url) {
  return IGNORE_PATTERNS.some(p => p.test(url));
}

async function fetchText(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

async function fetchBuffer(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
}

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&acirc;/g, 'â')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&ucirc;/g, 'û')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&icirc;/g, 'î')
    .replace(/&iuml;/g, 'ï')
    .replace(/&euml;/g, 'ë');
}

function isFileNameLikeAlt(alt) {
  if (!alt) return true;
  const s = alt.trim();
  // "326.jpg", "IMG_0234.JPG", "20956210341-jpg.jpg", "324-de-1.pure", "P1010234"
  if (/^[\w-]+\.(jpe?g|png|gif|pure)$/i.test(s)) return true;
  if (/^IMG[_\-]?\d+/i.test(s)) return true;
  if (/^P\d{6,}/i.test(s)) return true;
  if (/^DSC[_\-]?\d+/i.test(s)) return true;
  if (/^\d+(-[a-z0-9]+)*$/i.test(s)) return true;
  return false;
}

function basenameFromUrl(u) {
  const noQuery = u.split('?')[0];
  const last = noQuery.split('/').pop();
  return last;
}

function parsePage(html, sourceUrl) {
  // Title
  let titleMatch = html.match(/<h1[^>]*class="[^"]*view-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
  let title = titleMatch ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim()) : null;

  // Images — first try img-center, fall back to any img with ?fx= (e-monsite gallery thumbs)
  const imgCenter = html.match(/<img[^>]*class="[^"]*img-center[^"]*"[^>]*>/gi) || [];
  let imgs = imgCenter;
  if (imgs.length === 0) {
    imgs = (html.match(/<img[^>]*src="[^"]*\/medias\/images\/[^"]*\?fx=[^"]*"[^>]*>/gi) || []);
  }
  if (imgs.length === 0) {
    // legacy s3.e-monsite.com hosted images
    imgs = (html.match(/<img[^>]*src="https?:\/\/s3\.e-monsite\.com\/[^"]+"[^>]*>/gi) || []);
  }
  const seen = new Set();
  const artworks = [];
  for (const tag of imgs) {
    const srcM = tag.match(/src="([^"]+)"/i);
    if (!srcM) continue;
    let src = srcM[1];
    // strip ?... entirely (fx, v, etc.) — we want clean hi-res URL
    src = src.replace(/\?.*$/, '').replace(/&.*$/, '');
    // s3.e-monsite.com hi-res: drop resize_NNN_NNN/ segment
    src = src.replace(/\/resize_\d+_\d+\//, '/');
    // make absolute
    if (src.startsWith('//')) src = 'http:' + src;
    if (src.startsWith('/')) src = 'http://www.devismebernardpeintre.com' + src;
    if (seen.has(src)) continue;
    seen.add(src);

    const altM = tag.match(/alt="([^"]*)"/i);
    const altRaw = altM ? decodeEntities(altM[1]).trim() : '';
    const altTitle = isFileNameLikeAlt(altRaw) ? null : altRaw;

    artworks.push({
      title: altTitle,
      imageUrl: src,
    });
  }
  return { title, artworks };
}

function slugFromUrl(url) {
  const m = url.match(/\/([^/]+)\.html$/);
  if (!m) return 'unknown';
  return m[1].replace(/^-+/, '').replace(/-+$/, '');
}

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

async function downloadImage(url, destPath) {
  if (existsSync(destPath)) {
    const s = await stat(destPath);
    if (s.size >= 5 * 1024) return s.size; // skip if already valid
  }
  try {
    const buf = await fetchBuffer(url);
    if (buf.length < 5 * 1024) return null; // placeholder
    await writeFile(destPath, buf);
    return buf.length;
  } catch (e) {
    return null;
  }
}

// Concurrency-limited map
async function pmap(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  await ensureDir(DATA_DIR);
  await ensureDir(IMG_DIR);

  console.log('Fetching sitemap...');
  const sitemap = await fetchText('http://www.devismebernardpeintre.com/sitemap.xml');
  const allUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const targetUrls = allUrls.filter(u => !shouldIgnore(u) && classifyMedium(u));
  console.log(`Found ${allUrls.length} urls, will scrape ${targetUrls.length}`);

  const series = [];
  const problems = [];

  // Fetch pages in parallel (10 at a time)
  console.log('Fetching pages...');
  const pages = await pmap(targetUrls, 10, async (url) => {
    try {
      const html = await fetchText(url);
      const parsed = parsePage(html, url);
      return { url, html, parsed };
    } catch (e) {
      problems.push({ url, error: String(e) });
      return null;
    }
  });

  // Build series + collect downloads
  const downloadJobs = [];
  for (const p of pages) {
    if (!p) continue;
    const { url, parsed } = p;
    const medium = classifyMedium(url);
    const slug = slugFromUrl(url);
    if (!parsed.artworks.length) {
      problems.push({ url, error: 'no images found' });
      continue;
    }
    const seriesObj = {
      slug,
      title: parsed.title || slug,
      medium,
      sourceUrl: url,
      artworks: [],
    };
    const seriesImgDir = join(IMG_DIR, slug);
    series.push({ seriesObj, seriesImgDir, sourceArtworks: parsed.artworks });
    for (const a of parsed.artworks) {
      const base = basenameFromUrl(a.imageUrl);
      const localRel = `data/images/${slug}/${base}`;
      const localAbs = join(seriesImgDir, base);
      downloadJobs.push({
        url: a.imageUrl,
        localAbs,
        localRel,
        seriesObj,
        title: a.title,
        seriesImgDir,
      });
    }
  }

  // Ensure all series dirs exist
  for (const s of series) await ensureDir(s.seriesImgDir);

  console.log(`Downloading ${downloadJobs.length} images...`);
  let done = 0;
  await pmap(downloadJobs, 10, async (job) => {
    const size = await downloadImage(job.url, job.localAbs);
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${downloadJobs.length}`);
    if (size === null) {
      problems.push({ url: job.url, error: 'download failed or placeholder' });
      return;
    }
    job.seriesObj.artworks.push({
      title: job.title,
      imageUrl: job.url,
      localImage: job.localRel,
      fileSize: size,
    });
  });

  // Sort artworks within each series to a stable order (by URL)
  for (const s of series) {
    s.seriesObj.artworks.sort((a, b) => a.imageUrl.localeCompare(b.imageUrl));
  }

  const catalogue = {
    scrapedAt: new Date().toISOString(),
    series: series.map(s => s.seriesObj).filter(s => s.artworks.length > 0),
    problems,
  };

  const outPath = join(DATA_DIR, 'catalogue.json');
  await writeFile(outPath, JSON.stringify(catalogue, null, 2));

  // Stats
  const totalArtworks = catalogue.series.reduce((n, s) => n + s.artworks.length, 0);
  const totalBytes = catalogue.series.reduce((n, s) => n + s.artworks.reduce((nn, a) => nn + (a.fileSize || 0), 0), 0);
  console.log(`\nDone.`);
  console.log(`Series: ${catalogue.series.length}`);
  console.log(`Artworks: ${totalArtworks}`);
  console.log(`Total bytes: ${totalBytes} (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Problems: ${problems.length}`);
  if (problems.length) {
    console.log('First 10 problems:');
    for (const p of problems.slice(0, 10)) console.log('  -', p.url, '::', p.error);
  }
  console.log(`Catalogue: ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
