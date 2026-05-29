#!/usr/bin/env node
/**
 * Convertit les boucles .WAV de Bernard en MP3 (ffmpeg), les téléverse dans
 * Sanity, et associe une boucle à chacune des 6 œuvres animées.
 *
 * Usage :
 *   1. Déposer les .WAV dans data/audio-src/
 *   2. node scripts/animation-audio.mjs
 *
 * Les boucles non mappées sont quand même téléversées (médiathèque Sanity)
 * pour que Bernard puisse les associer lui-même dans le Studio.
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

const SRC_DIR = resolve(process.cwd(), "data/audio-src");
const OUT_DIR = resolve(process.cwd(), "data/audio-mp3");

// Appairage boucle -> œuvre animée. Adapter au besoin.
// Clé = sous-chaîne distinctive du nom de fichier ; valeur = slug de l'œuvre.
const MAPPING = [
  { match: "DRUMLOOP104_x8_", slug: "les-animations-animation-drums" },
  { match: "DRUMLOOP106", slug: "les-animations-animation-drums2" },
  { match: "DRUMLOOP104_x8 echo", slug: "les-animations-bongo-2" },
  { match: "ELECBASS_", slug: "les-animations-animation-2-guitares" },
  { match: "ELECBASS echo", slug: "les-animations-animation-guit-jaune" },
  { match: "PIANO018", slug: "les-animations-animation-piano-drums1" },
];

function toMp3(wavPath) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const out = join(OUT_DIR, basename(wavPath, extname(wavPath)) + ".mp3");
  execFileSync("ffmpeg", ["-y", "-i", wavPath, "-codec:a", "libmp3lame", "-q:a", "4", out], {
    stdio: "ignore",
  });
  return out;
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Dossier introuvable : ${SRC_DIR}\nDéposez-y les .WAV puis relancez.`);
    process.exit(1);
  }
  const wavs = readdirSync(SRC_DIR).filter((f) => /\.wav$/i.test(f));
  if (wavs.length === 0) {
    console.error(`Aucun .WAV dans ${SRC_DIR}`);
    process.exit(1);
  }

  const assetBySource = {};
  for (const wav of wavs) {
    const mp3 = toMp3(join(SRC_DIR, wav));
    process.stdout.write(`Upload ${basename(mp3)} … `);
    const asset = await client.assets.upload("file", createReadStream(mp3), {
      filename: basename(mp3),
      contentType: "audio/mpeg",
    });
    assetBySource[wav] = asset._id;
    console.log(asset._id);
  }

  for (const { match, slug } of MAPPING) {
    const srcName = Object.keys(assetBySource).find((f) => f.includes(match));
    if (!srcName) {
      console.warn(`⚠ aucune boucle ne correspond à "${match}" pour ${slug}`);
      continue;
    }
    const doc = await client.fetch(`*[_type=="artwork" && slug.current==$slug][0]._id`, { slug });
    if (!doc) {
      console.warn(`⚠ œuvre introuvable : ${slug}`);
      continue;
    }
    await client
      .patch(doc)
      .set({ audio: { _type: "file", asset: { _type: "reference", _ref: assetBySource[srcName] } } })
      .commit();
    console.log(`✓ ${slug} ← ${srcName}`);
  }
  console.log("\nTerminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
