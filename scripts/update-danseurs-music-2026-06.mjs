#!/usr/bin/env node
/**
 * Remplace la musique de l'animation « Danseurs » : SOUL (trop molle pour une
 * danse, beat mou) -> XTRA110_HOUSE (house, beat marqué, ~110 BPM). Upload du
 * nouveau MP4 + de la musique, puis patch audio + video de l'œuvre.
 *
 * Usage : node scripts/update-danseurs-music-2026-06.mjs
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

const MP3 = resolve(process.cwd(), "data/audio-mp3-2026-06-12/XTRA110_HOUSE_____3s.mp3");
const MP4 = resolve(process.cwd(), "data/videos/les-animations-danseurs.mp4");
for (const p of [MP3, MP4]) {
  if (!existsSync(p)) { console.error(`✗ fichier manquant : ${p}`); process.exit(1); }
}

const audio = await client.assets.upload("file", createReadStream(MP3), {
  filename: "XTRA110_HOUSE.mp3",
  contentType: "audio/mpeg",
});
console.log("audio", audio._id);
const video = await client.assets.upload("file", createReadStream(MP4), {
  filename: "les-animations-danseurs.mp4",
  contentType: "video/mp4",
});
console.log("video", video._id);

const res = await client
  .patch("artwork-les-animations-danseurs")
  .set({
    audio: { _type: "file", asset: { _type: "reference", _ref: audio._id } },
    video: { _type: "file", asset: { _type: "reference", _ref: video._id } },
  })
  .commit();
console.log("✓ Danseurs mis à jour (musique HOUSE) :", res._id);
