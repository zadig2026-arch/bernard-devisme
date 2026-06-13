#!/usr/bin/env node
/**
 * Remplace l'animation « Sans titre n°5 » (piano + batterie, défaut signalé par
 * Bernard) par la nouvelle animation « Danseurs » (d01.gif, fond turquoise) :
 *  - upload GIF (image) + SOUL (audio) + MP4 synchronisé (video)
 *  - création de l'œuvre les-animations-danseurs
 *  - suppression de l'œuvre les-animations-animation-piano-drums1
 *
 * Usage : node scripts/create-danseurs-2026-06.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync, createReadStream } from "node:fs";
import { resolve } from "node:path";

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

const GIF = resolve(process.cwd(), "data/gifs-live/danseurs.gif");
const MP3 = resolve(process.cwd(), "data/audio-mp3-2026-06-12/SOUL.mp3");
const MP4 = resolve(process.cwd(), "data/videos/les-animations-danseurs.mp4");
for (const p of [GIF, MP3, MP4]) {
  if (!existsSync(p)) { console.error(`✗ fichier manquant : ${p}`); process.exit(1); }
}

const OLD_ID = "artwork-les-animations-animation-piano-drums1"; // « Sans titre n°5 »

// Sécurité : refuser la suppression si l'ancienne œuvre est référencée ailleurs
const refs = await client.fetch(`*[references($id)]{_id}`, { id: OLD_ID });
if (refs.length) {
  console.error(`✗ ${OLD_ID} est référencée par ${refs.map((r) => r._id).join(", ")} — suppression annulée`);
  process.exit(1);
}

const img = await client.assets.upload("image", createReadStream(GIF), {
  filename: "danseurs.gif",
  contentType: "image/gif",
});
console.log("image", img._id);
const audio = await client.assets.upload("file", createReadStream(MP3), {
  filename: "SOUL.mp3",
  contentType: "audio/mpeg",
});
console.log("audio", audio._id);
const video = await client.assets.upload("file", createReadStream(MP4), {
  filename: "les-animations-danseurs.mp4",
  contentType: "video/mp4",
});
console.log("video", video._id);

const doc = {
  _id: "artwork-les-animations-danseurs",
  _type: "artwork",
  title: "Danseurs",
  slug: { _type: "slug", current: "les-animations-danseurs" },
  medium: ["infographie"],
  series: { _type: "reference", _ref: "series-les-animations" },
  featured: false,
  images: [
    { _key: "img-1", _type: "image", asset: { _type: "reference", _ref: img._id }, caption: "Danseurs" },
  ],
  audio: { _type: "file", asset: { _type: "reference", _ref: audio._id } },
  video: { _type: "file", asset: { _type: "reference", _ref: video._id } },
};
const res = await client.createOrReplace(doc);
console.log("✓ œuvre créée :", res._id);

await client.delete(OLD_ID);
console.log("✓ œuvre supprimée :", OLD_ID, "(Sans titre n°5)");
console.log("\nTerminé.");
