#!/usr/bin/env node
import { createClient } from "@sanity/client";
import { readFileSync, createReadStream, existsSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";
import { config as loadEnv } from "node:process";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] ??= m[2];
  }
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_WRITE_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const PERIOD_BY_MEDIUM = {
  peinture: "1970–",
  sculpture: "1970–",
  dessin: "1970–",
  infographie: "1990–",
  "livre-objet": "2000–",
};

async function uploadImage(localPath, retries = 3) {
  const abs = resolve(process.cwd(), localPath);
  if (!existsSync(abs)) return null;
  const size = statSync(abs).size;
  if (size < 5000) return null;
  for (let i = 0; i < retries; i++) {
    try {
      const stream = createReadStream(abs);
      const asset = await client.assets.upload("image", stream, {
        filename: basename(abs),
      });
      return asset;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function main() {
  const catalog = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/catalogue.json"), "utf8"),
  );

  console.log(`📚 ${catalog.series.length} séries, ${catalog.series.reduce((n, s) => n + s.artworks.length, 0)} œuvres à importer`);

  const seriesIds = new Map();

  // Pass 1: create series
  console.log("\n📦 Étape 1 — création des séries");
  for (const s of catalog.series) {
    const id = `series-${s.slug}`;
    seriesIds.set(s.slug, id);
    await client.createOrReplace({
      _id: id,
      _type: "series",
      title: s.title,
      slug: { _type: "slug", current: s.slug },
      period: PERIOD_BY_MEDIUM[s.medium] || "—",
    });
    console.log(`  ✓ ${s.title}`);
  }

  // Pass 2: artworks (with image upload)
  console.log("\n🖼  Étape 2 — upload des images + création des œuvres");
  let imported = 0;
  let skipped = 0;
  const startedAt = Date.now();

  for (const s of catalog.series) {
    console.log(`\n  ▸ ${s.title} (${s.artworks.length} œuvres)`);
    let idx = 0;
    // Upload images in parallel batches of 5
    const BATCH = 5;
    for (let i = 0; i < s.artworks.length; i += BATCH) {
      const batch = s.artworks.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (a) => {
          try {
            const asset = await uploadImage(a.localImage);
            if (!asset) return { skip: true };
            return { asset, art: a };
          } catch (e) {
            return { error: e.message, art: a };
          }
        }),
      );

      for (const r of results) {
        idx++;
        if (r.skip) {
          skipped++;
          continue;
        }
        if (r.error) {
          console.warn(`    ✗ ${basename(r.art.localImage)} — ${r.error}`);
          skipped++;
          continue;
        }
        const baseSlug = basename(r.art.localImage).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const slug = `${s.slug}-${baseSlug}`;
        const title = r.art.title?.trim() || `Sans titre n°${idx}`;
        await client.createOrReplace({
          _id: `artwork-${slug}`,
          _type: "artwork",
          title,
          slug: { _type: "slug", current: slug },
          medium: [s.medium],
          series: { _type: "reference", _ref: seriesIds.get(s.slug) },
          status: "non-disponible",
          featured: false,
          images: [
            {
              _type: "image",
              _key: `img-${idx}`,
              asset: { _type: "reference", _ref: r.asset._id },
              caption: r.art.title || undefined,
            },
          ],
        });
        imported++;
      }
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      process.stdout.write(`    ${imported} importées, ${skipped} ignorées · ${elapsed}s\r`);
    }
    console.log("");
  }

  // Pass 3: site settings + cover artworks
  console.log("\n⚙️  Étape 3 — paramètres du site");
  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    contactEmail: "bernarddevisme@orange.fr",
    agentInfo: {
      name: "Bernadette",
      role: "Agente de l'artiste",
      email: "bernarddevisme@orange.fr",
      phone: "06 30 33 32 71",
      bio: "Bernadette accompagne Bernard Devisme dans la diffusion de son œuvre auprès des collectionneurs, galeries et institutions.",
    },
  });

  // Mark a few featured artworks (first artwork of 6 most representative series)
  const featuredSeries = ["la-divine-comedie", "les-truelles", "les-cageots", "les-anomalies", "les-oscillations", "les-installations"];
  for (const sl of featuredSeries) {
    const all = await client.fetch(
      `*[_type=="artwork" && series._ref==$ref][0...1]{_id}`,
      { ref: seriesIds.get(sl) },
    );
    for (const a of all) {
      await client.patch(a._id).set({ featured: true }).commit();
    }
  }

  // Set series cover artworks (first artwork)
  for (const s of catalog.series) {
    const first = await client.fetch(
      `*[_type=="artwork" && series._ref==$ref][0]{_id}`,
      { ref: seriesIds.get(s.slug) },
    );
    if (first) {
      await client
        .patch(seriesIds.get(s.slug))
        .set({ coverArtwork: { _type: "reference", _ref: first._id } })
        .commit();
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
  console.log(`\n✅ Import terminé en ${elapsed}s : ${imported} œuvres importées, ${skipped} ignorées.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
