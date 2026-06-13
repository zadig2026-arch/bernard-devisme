#!/usr/bin/env node
/**
 * Applique l'envoi de musiques de Bernard du 11/06/2026 :
 *  1. convertit les 23 WAV (data/audio-src-2026-06-12) en MP3 et les téléverse
 *     dans la médiathèque Sanity (Bernard peut ré-associer dans le Studio) ;
 *  2. téléverse les 11 MP4 synchronisés (data/videos, cf. build-site-videos.mjs) ;
 *  3. patche chaque œuvre animée : `audio` = nouvelle boucle appariée,
 *     `video` = MP4 synchronisé.
 *
 * Usage : node scripts/apply-pairings-2026-06.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync, mkdirSync, readdirSync, createReadStream } from "node:fs";
import { resolve, basename, extname, join } from "node:path";
import { execFileSync } from "node:child_process";

// --- env ---
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
const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false });

const WAV_DIR = resolve(process.cwd(), "data/audio-src-2026-06-12");
const MP3_DIR = resolve(process.cwd(), "data/audio-mp3-2026-06-12");
const VIDEO_DIR = resolve(process.cwd(), "data/videos");

// slug d'œuvre -> WAV apparié (le MP4 du même slug porte la même musique)
const PAIRING = {
  "les-animations-2-guitares-batterie": "batterie et 2 guitares______12s.WAV",
  "les-animations-animation-2-guitares": "Stepp_double guitare.WAV",
  "les-animations-animation-drums": "DRUMLOOP104_x8_________15s.WAV",
  "les-animations-animation-drums2": "DRUMLOOP106_x10_______26s ok.WAV",
  "les-animations-animation-guit-jaune": "ELECBASS_______________18s.WAV",
  "les-animations-batterie-guitare": "batterie et guitare.WAV",
  "les-animations-bongo-2": "bongo 1.WAV",
  "les-animations-contrebasse": "SNTHBASS121________30s lent.WAV",
  "les-animations-jam": "Plage 032guit piano______8s.WAV",
  "les-animations-la-frite": "go west_93_04___orgue bongo.WAV",
  "les-animations-animation-piano-drums1": "PIANO018___________13s métalic.WAV",
};

function toMp3(wavPath) {
  if (!existsSync(MP3_DIR)) mkdirSync(MP3_DIR, { recursive: true });
  const out = join(MP3_DIR, basename(wavPath, extname(wavPath)) + ".mp3");
  if (!existsSync(out)) {
    execFileSync("ffmpeg", ["-y", "-i", wavPath, "-codec:a", "libmp3lame", "-q:a", "4", out], {
      stdio: "ignore",
    });
  }
  return out;
}

async function main() {
  // 1. MP3 : conversion + upload de tout l'envoi (médiathèque complète)
  const wavs = readdirSync(WAV_DIR).filter((f) => /\.wav$/i.test(f));
  const audioAssetByWav = {};
  for (const wav of wavs) {
    const mp3 = toMp3(join(WAV_DIR, wav));
    process.stdout.write(`MP3  ${basename(mp3)} … `);
    const asset = await client.assets.upload("file", createReadStream(mp3), {
      filename: basename(mp3),
      contentType: "audio/mpeg",
    });
    audioAssetByWav[wav] = asset._id;
    console.log(asset._id);
  }

  // 2. MP4 : upload des vidéos synchronisées
  const videoAssetBySlug = {};
  for (const slug of Object.keys(PAIRING)) {
    const mp4 = join(VIDEO_DIR, `${slug}.mp4`);
    if (!existsSync(mp4)) {
      console.error(`✗ MP4 manquant : ${mp4} (lancer build-site-videos.mjs)`);
      process.exit(1);
    }
    process.stdout.write(`MP4  ${slug} … `);
    const asset = await client.assets.upload("file", createReadStream(mp4), {
      filename: `${slug}.mp4`,
      contentType: "video/mp4",
    });
    videoAssetBySlug[slug] = asset._id;
    console.log(asset._id);
  }

  // 3. Patch des œuvres
  for (const [slug, wav] of Object.entries(PAIRING)) {
    const docId = await client.fetch(`*[_type=="artwork" && slug.current==$slug][0]._id`, { slug });
    if (!docId) {
      console.error(`✗ œuvre introuvable : ${slug}`);
      process.exitCode = 1;
      continue;
    }
    await client
      .patch(docId)
      .set({
        audio: { _type: "file", asset: { _type: "reference", _ref: audioAssetByWav[wav] } },
        video: { _type: "file", asset: { _type: "reference", _ref: videoAssetBySlug[slug] } },
      })
      .commit();
    console.log(`✓ ${slug} ← ${wav}`);
  }
  console.log("\nTerminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
