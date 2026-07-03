/**
 * Migration 2026-07 : pose la bio de la page d'accueil (jusqu'ici en dur dans
 * app/(site)/page.tsx) dans le champ `intro` du singleton siteSettings, pour
 * que Bernard puisse l'éditer au Studio (entrée « Texte d'accueil »).
 *   node scripts/set-home-intro-2026-07.mjs
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

let k = 0;
const key = () => `intro${(k++).toString(36).padStart(4, "0")}`;
const block = (children, markDefs = []) => ({
  _type: "block",
  _key: key(),
  style: "normal",
  markDefs,
  children,
});
const span = (text, marks = []) => ({ _type: "span", _key: key(), text, marks });

const regardsLinkKey = key();

const intro = [
  block([
    span(
      "Peintre, sculpteur et infographiste, né en 1947, diplômé des Beaux-Arts de Paris en 1970 (mention très bien) après avoir passé 4 années dans les ateliers d’Étienne Martin, Robert Couturier, César et Collamarini.",
    ),
  ]),
  block([
    span(
      "Professeur d’Arts Plastiques et d’Infographie à l’École Alsacienne à Paris pendant 35 ans. Je m’installe en Vendée en 2007 puis en Charente-Maritime en 2016.",
    ),
  ]),
  block([
    span(
      "Expositions et installations in situ, collectives et personnelles, en France et à l’étranger, dès les années 70.",
    ),
  ]),
  block([
    span(
      "Co-directeur de la galerie « Art Libre » de 1988 à 1990 à Rambouillet (78), puis directeur de l’espace d’art contemporain « Confluences » jusqu’en 1992.",
    ),
  ]),
  block([
    span("Dessins de presse dans "),
    span("L’Écho Républicain", ["em"]),
    span(" (Chartres, 1984–1991) puis dans "),
    span("Ouest-France", ["em"]),
    span(" (Fontenay-le-Comte, 2008–2017)."),
  ]),
  block(
    [
      span(
        "Différentes personnes (françaises ou étrangères), artistes, écrivains, critiques d’art, responsables d’institutions culturelles ont défendu mon travail. Retrouvez leurs écrits dans la rubrique ",
      ),
      span("Regards d’après…", [regardsLinkKey]),
    ],
    [{ _type: "link", _key: regardsLinkKey, href: "/regards" }],
  ),
];

await client.patch("siteSettings").set({ intro }).commit();
const check = await client.fetch('*[_id == "siteSettings"][0]{ "blocs": count(intro) }');
console.log("intro posée ·", check.blocs, "paragraphes");
