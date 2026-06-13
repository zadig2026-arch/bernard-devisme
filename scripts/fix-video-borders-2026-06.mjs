#!/usr/bin/env node
/**
 * Re-téléverse les 3 vidéos dont le liseré blanc latéral a été corrigé
 * (GIF aplatis via scripts/flatten_gifs.py + rebuild build-site-videos.mjs)
 * et repatche le champ `video` des œuvres correspondantes.
 *
 * Usage : node scripts/fix-video-borders-2026-06.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync, createReadStream } from "node:fs";
import { resolve, join } from "node:path";

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

const VIDEO_DIR = resolve(process.cwd(), "data/videos");
const SLUGS = [
  "les-animations-animation-2-guitares",
  "les-animations-animation-drums2",
  "les-animations-animation-guit-jaune",
];

for (const slug of SLUGS) {
  const mp4 = join(VIDEO_DIR, `${slug}.mp4`);
  if (!existsSync(mp4)) {
    console.error(`✗ MP4 manquant : ${mp4}`);
    process.exit(1);
  }
  process.stdout.write(`MP4  ${slug} … `);
  const asset = await client.assets.upload("file", createReadStream(mp4), {
    filename: `${slug}.mp4`,
    contentType: "video/mp4",
  });
  console.log(asset._id);
  const docId = await client.fetch(`*[_type=="artwork" && slug.current==$slug][0]._id`, { slug });
  if (!docId) {
    console.error(`✗ œuvre introuvable : ${slug}`);
    process.exitCode = 1;
    continue;
  }
  await client
    .patch(docId)
    .set({ video: { _type: "file", asset: { _type: "reference", _ref: asset._id } } })
    .commit();
  console.log(`✓ ${slug} repatché`);
}
console.log("\nTerminé.");
