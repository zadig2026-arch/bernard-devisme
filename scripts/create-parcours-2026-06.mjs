#!/usr/bin/env node
/**
 * Crée le document « Parcours et CV » (singleton id "parcours") dans Sanity à
 * partir du contenu jusque-là codé en dur, pour que Bernard puisse le modifier
 * depuis le Studio. Idempotent (createIfNotExists : n'écrase pas une édition
 * ultérieure de Bernard).
 *
 * Usage : node scripts/create-parcours-2026-06.mjs
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

const reperes = [
  ["1970", "Diplôme des Beaux-Arts de Paris, mention très bien."],
  ["1970–", "Expositions et installations in situ, collectives et personnelles, en France et à l'étranger."],
  ["1972–2007", "Professeur d'Arts Plastiques et d'Infographie à l'École Alsacienne, Paris (35 ans)."],
  ["1984–1991", "Dessins de presse pour L'Écho Républicain (Chartres)."],
  ["1988–1990", "Co-directeur de la galerie Art Libre à Rambouillet."],
  ["1990–1992", "Directeur de l'espace d'art contemporain Confluences."],
  ["1990s–", "La Divine Comédie de Dante nourrit l'œuvre depuis sa relecture."],
  ["2007", "Installation en Vendée."],
  ["2008–2017", "Dessins de presse pour Ouest-France (Fontenay-le-Comte)."],
  ["2016", "Installation de l'atelier en Charente-Maritime, à Nieul-les-Saintes."],
];

const doc = {
  _id: "parcours",
  _type: "parcours",
  intro:
    "Né en 1947. Diplômé des Beaux-Arts de Paris en 1970 (mention très bien), après quatre années dans les ateliers d’Étienne Martin, Robert Couturier, César et Collamarini.",
  reperes: reperes.map(([year, body], i) => ({ _key: `r${i}`, year, body })),
  demarche:
    "L’œuvre fusionne depuis 1970 des tendances diverses — du figuratif à l’hyperréalisme, en passant par l’abstrait. Le cœur du travail est la condition humaine, ses contradictions, ses aberrations.\n\nLes séries (Siamoiserie, Humanoïdes, Cageots, Truelles, Greffes, Xynthia, Charnier / Mémoires englouties, Ouroboros, Antiportraits, Pariétal, Danse des ténèbres, Gribouillage génétique, Livres-objets) déploient une grammaire commune : agglomérats, recouvrements, coulures, dripping, code-barre, archéologies de surface.",
};

const res = await client.createIfNotExists(doc);
console.log("✓ document Parcours prêt :", res._id);
