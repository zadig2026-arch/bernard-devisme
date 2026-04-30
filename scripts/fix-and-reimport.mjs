#!/usr/bin/env node
import { createClient } from "@sanity/client";
import { readFileSync, createReadStream, existsSync, statSync, renameSync } from "node:fs";
import { resolve, basename, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

function detectFormat(p) {
  const out = execFileSync("file", ["-b", p], { encoding: "utf8" }).trim();
  if (/AVIF/i.test(out)) return "avif";
  if (/HEIF|HEIC/i.test(out)) return "heif";
  if (/PNG/i.test(out)) return "png";
  if (/JPEG/i.test(out)) return "jpeg";
  if (/TIFF/i.test(out)) return "tiff";
  if (/GIF/i.test(out)) return "gif";
  if (/WebP/i.test(out)) return "webp";
  return "unknown:" + out.slice(0, 60);
}

function convertToJpeg(srcPath) {
  const tmpOut = srcPath + ".converted.jpg";
  // sips -s format jpeg writes to a new file
  execFileSync("sips", ["-s", "format", "jpeg", srcPath, "--out", tmpOut], {
    stdio: "pipe",
  });
  // Replace original
  renameSync(tmpOut, srcPath);
}

async function uploadImage(localPath, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const stream = createReadStream(localPath);
      return await client.assets.upload("image", stream, {
        filename: basename(localPath),
      });
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function main() {
  const catalog = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/catalogue.json"), "utf8"),
  );

  console.log("🔍 Identification des œuvres manquantes…");

  // Build set of already-imported slugs
  const existing = new Set(
    await client.fetch(`*[_type=="artwork"][].slug.current`),
  );
  console.log(`   ${existing.size} œuvres déjà dans Sanity`);

  // Compute candidate slug for each catalog entry
  const missing = [];
  for (const s of catalog.series) {
    let idx = 0;
    for (const a of s.artworks) {
      idx++;
      const baseSlug = basename(a.localImage)
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const slug = `${s.slug}-${baseSlug}`;
      if (!existing.has(slug)) {
        missing.push({ series: s, artwork: a, slug, idx });
      }
    }
  }
  console.log(`   ${missing.length} œuvres manquantes\n`);

  // Detect formats
  const stats = { converted: 0, alreadyJpeg: 0, missing: 0, uploaded: 0, failed: 0 };
  const seriesIds = new Map();
  for (const s of catalog.series) seriesIds.set(s.slug, `series-${s.slug}`);

  for (const m of missing) {
    const path = resolve(process.cwd(), m.artwork.localImage);
    if (!existsSync(path) || statSync(path).size < 5000) {
      stats.missing++;
      continue;
    }
    const fmt = detectFormat(path);
    if (fmt !== "jpeg") {
      try {
        convertToJpeg(path);
        stats.converted++;
        process.stdout.write(`  🔄 ${basename(path)} (${fmt} → jpeg)\n`);
      } catch (e) {
        console.warn(`  ✗ conversion ratée : ${basename(path)} — ${e.message}`);
        stats.failed++;
        continue;
      }
    } else {
      stats.alreadyJpeg++;
    }

    try {
      const asset = await uploadImage(path);
      const title = m.artwork.title?.trim() || `Sans titre n°${m.idx}`;
      await client.createOrReplace({
        _id: `artwork-${m.slug}`,
        _type: "artwork",
        title,
        slug: { _type: "slug", current: m.slug },
        medium: [m.series.medium],
        series: { _type: "reference", _ref: seriesIds.get(m.series.slug) },
        status: "non-disponible",
        featured: false,
        images: [
          {
            _type: "image",
            _key: `img-${m.idx}`,
            asset: { _type: "reference", _ref: asset._id },
            caption: m.artwork.title || undefined,
          },
        ],
      });
      stats.uploaded++;
    } catch (e) {
      console.warn(`  ✗ upload ratée : ${basename(path)} — ${e.message}`);
      stats.failed++;
    }
  }

  console.log("\n📊 Résumé :");
  console.log(`   converties  : ${stats.converted}`);
  console.log(`   déjà JPEG   : ${stats.alreadyJpeg}`);
  console.log(`   uploadées   : ${stats.uploaded}`);
  console.log(`   manquantes  : ${stats.missing}`);
  console.log(`   échecs      : ${stats.failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
