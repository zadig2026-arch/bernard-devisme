/**
 * Les parties du site (catégories), partagées entre le site
 * (components/series-index.tsx) et la navigation du Studio
 * (sanity/structure.ts).
 *
 * L'APPARTENANCE d'une rubrique à une partie vit dans Sanity (champ
 * `category` du type series, éditable par Bernard). Les listes `slugs`
 * ci-dessous ne servent plus qu'à préserver l'ORDRE d'affichage historique
 * de l'ancien e-monsite : les rubriques listées s'affichent dans cet ordre,
 * les nouvelles (créées par Bernard) s'ajoutent à la suite, par ordre
 * alphabétique.
 */
export type Category = { id: string; title: string; slugs: string[] };

export const CATEGORIES: Category[] = [
  {
    id: "peinture",
    title: "Peinture",
    slugs: [
      "peintures-album-3",
      "peintures-2024",
      "peintures-2023",
      "amalgame",
      "wx",
      "la-divine-comedie-serie-2020",
      "transitions-2",
      "les-trombines",
      "gabarit",
      "l-eau-et-les-reves",
      "les-inconnus",
      "mine-d-angle-s",
      "filets-d-encre",
      "contre-tout-contre-sens",
      "concretions",
      "endroit-envers",
      "le-temps-inacheve",
      "la-divine-comedie",
      "les-anomalies",
      "les",
      "les-angles",
      "les-oscillations",
      "peintures",
      "les-peintures-abstraites",
    ],
  },
  {
    id: "sculpture",
    title: "Sculpture",
    slugs: [
      "sculptures-recentes",
      "les-assemblages",
      "les-bois",
      "les-truelles",
      "les-freluquets",
      "vendetheque-de-la-chataigneraie",
      "les-bidules",
      "les-installations",
      "installations-in-situ",
      "paysages-reves",
    ],
  },
  {
    id: "graphisme",
    title: "Graphisme",
    slugs: [
      "les-caboches",
      "dessins-2-1",
      "les-visages-recuperes",
      "les-dessins",
      "dessins-2",
      "les-cageots",
      "les-ecorces",
      "les-gueules",
    ],
  },
  {
    id: "infographies",
    title: "Infographies",
    slugs: ["les-montages", "les-animations", "textes-amants", "monde-extensible"],
  },
  {
    id: "livres-objets",
    title: "Livres-objets et plus",
    slugs: ["livres-objets", "livres-objets-raku", "plus"],
  },
];
