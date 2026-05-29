#!/usr/bin/env node
/**
 * Re-appariement son/animation par logique instrument (mai 2026).
 * Corrige les paires où le son ne correspondait pas à un instrument montré :
 *   - Jam (batterie+guitare+piano) : orgue -> piano (piano présent à l'écran)
 *   - 2 guitares et batterie        : piano -> batterie (batterie présente)
 * ORGAN014 reste volontairement non utilisé (aucune animation ne montre d'orgue).
 *
 * Écrit directement sur le document publié. Usage : node scripts/repair-pairings.mjs
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
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_WRITE_TOKEN");
  process.exit(1);
}
const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false });

const PIANO077 = "file-3451094b2c13f43c2e50f25bf87cfa44c6fbd18d-mp3";
const DRUMLOOP106 = "file-4ab4c4c2350f1f0c6b69cb5510ce9bcd37934384-mp3";

const PATCHES = [
  { id: "artwork-les-animations-jam", ref: PIANO077, note: "Jam -> PIANO077" },
  { id: "artwork-les-animations-2-guitares-batterie", ref: DRUMLOOP106, note: "2 guitares et batterie -> DRUMLOOP106" },
];

async function main() {
  for (const { id, ref, note } of PATCHES) {
    await client
      .patch(id)
      .set({ audio: { _type: "file", asset: { _type: "reference", _ref: ref } } })
      .commit();
    console.log(`✓ ${note}`);
  }
  console.log("\nTerminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
