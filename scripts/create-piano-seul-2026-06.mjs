#!/usr/bin/env node
/**
 * Ajoute l'animation « Piano » (pianiste seul) à la série Les animations :
 * upload du GIF (image), de la musique PIANO077 (audio) et du MP4 synchronisé
 * (video, cf. build-site-videos.mjs), puis création de l'œuvre.
 *
 * Usage : node scripts/create-piano-seul-2026-06.mjs
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

const GIF = resolve(process.cwd(), "data/gifs-live/piano-seul.gif");
const MP3 = resolve(process.cwd(), "data/audio-mp3-2026-06-12/PIANO077______________10s.mp3");
const MP4 = resolve(process.cwd(), "data/videos/les-animations-piano-seul.mp4");
for (const p of [GIF, MP3, MP4]) {
  if (!existsSync(p)) { console.error(`✗ fichier manquant : ${p}`); process.exit(1); }
}

const img = await client.assets.upload("image", createReadStream(GIF), {
  filename: "piano-seul.gif",
  contentType: "image/gif",
});
console.log("image", img._id);
const audio = await client.assets.upload("file", createReadStream(MP3), {
  filename: "PIANO077.mp3",
  contentType: "audio/mpeg",
});
console.log("audio", audio._id);
const video = await client.assets.upload("file", createReadStream(MP4), {
  filename: "les-animations-piano-seul.mp4",
  contentType: "video/mp4",
});
console.log("video", video._id);

const doc = {
  _id: "artwork-les-animations-piano-seul",
  _type: "artwork",
  title: "Piano",
  slug: { _type: "slug", current: "les-animations-piano-seul" },
  medium: ["infographie"],
  series: { _type: "reference", _ref: "series-les-animations" },
  featured: false,
  images: [
    { _key: "img-1", _type: "image", asset: { _type: "reference", _ref: img._id }, caption: "Piano" },
  ],
  audio: { _type: "file", asset: { _type: "reference", _ref: audio._id } },
  video: { _type: "file", asset: { _type: "reference", _ref: video._id } },
};

const res = await client.createOrReplace(doc);
console.log("✓ œuvre créée :", res._id);
