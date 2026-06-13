#!/usr/bin/env node
/**
 * Retire l'animation « Danseurs » du site (aucune musique du lot ne convenait
 * pour une danse). Supprime l'œuvre les-animations-danseurs. Retour à 11
 * animations. Les assets (gif/mp3/mp4) restent en médiathèque, sans impact.
 *
 * Usage : node scripts/delete-danseurs-2026-06.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
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

const ID = "artwork-les-animations-danseurs";
const refs = await client.fetch(`*[references($id)]{_id}`, { id: ID });
if (refs.length) {
  console.error(`✗ ${ID} référencée par ${refs.map((r) => r._id).join(", ")} — suppression annulée`);
  process.exit(1);
}
await client.delete(ID);
console.log("✓ animation supprimée :", ID);

const left = await client.fetch(
  `count(*[_type=="artwork" && series->slug.current=="les-animations"])`,
);
console.log("Animations restantes :", left);
