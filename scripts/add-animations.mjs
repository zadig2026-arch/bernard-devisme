#!/usr/bin/env node
/**
 * Ajoute les nouvelles animations envoyées par Bernard (mai 2026) qui n'étaient
 * pas encore sur le site, et leur associe un son par défaut (Bernard ré-ajuste
 * ensuite dans le Studio).
 *
 * Idempotent : _id déterministes via createOrReplace. Relançable sans doublon.
 * Pour annuler : supprimer les 5 documents artwork-les-animations-<slug> listés.
 *
 * Usage : node scripts/add-animations.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync, createReadStream } from "node:fs";
import { resolve, join } from "node:path";

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

const GIF_DIR = "/Users/zag/Downloads/Animations + sons : Bernard";

// son déjà monté dans Sanity (refs récupérées par requête GROQ)
const SOUND = {
  ORGAN: "file-da5916b0403aebe3b01e256011285aa6075c0cec-mp3",
  SNTHBASS: "file-f5a5830435ffe24392763dabf24c2c844b018f88-mp3",
  PIANO077: "file-3451094b2c13f43c2e50f25bf87cfa44c6fbd18d-mp3",
  DRUMLOOP104: "file-b59860eca310a4c2643341f95893ca4f8e2ba6a0-mp3",
  SYNTHFLUTE: "file-885169323d84330fb23309db5e30acd4ff47f747-mp3",
};

// Les 5 nouvelles animations. gif = nom de fichier dans GIF_DIR.
const ITEMS = [
  { slug: "les-animations-jam", title: "Jam", gif: "Jam Animation1 (1).gif", sound: SOUND.ORGAN },
  { slug: "les-animations-contrebasse", title: "Contrebasse", gif: "contrebasse.gif", sound: SOUND.SNTHBASS },
  { slug: "les-animations-2-guitares-batterie", title: "2 guitares et batterie", gif: "Animation 2 guitares +batterie.gif", sound: SOUND.PIANO077 },
  { slug: "les-animations-batterie-guitare", title: "Batterie et guitare", gif: "Bat guit R (1).gif", sound: SOUND.DRUMLOOP104 },
  { slug: "les-animations-la-frite", title: "La frite", gif: "La frite.gif", sound: SOUND.SYNTHFLUTE },
];

async function main() {
  for (const item of ITEMS) {
    const gifPath = join(GIF_DIR, item.gif);
    if (!existsSync(gifPath)) {
      console.warn(`⚠ GIF introuvable, on saute : ${gifPath}`);
      continue;
    }
    process.stdout.write(`Upload ${item.gif} … `);
    const asset = await client.assets.upload("image", createReadStream(gifPath), {
      filename: item.gif,
      contentType: "image/gif",
    });
    console.log(asset._id);

    const doc = {
      _id: `artwork-${item.slug}`,
      _type: "artwork",
      title: item.title,
      slug: { _type: "slug", current: item.slug },
      images: [
        {
          _key: "img-1",
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          caption: item.title,
        },
      ],
      audio: { _type: "file", asset: { _type: "reference", _ref: item.sound } },
      medium: ["infographie"],
      series: { _ref: "series-les-animations", _type: "reference" },
      status: "non-disponible",
      featured: false,
    };
    await client.createOrReplace(doc);
    console.log(`✓ ${item.slug} créée (son ${item.sound})`);
  }
  console.log("\nTerminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
