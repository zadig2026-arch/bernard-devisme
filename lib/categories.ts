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

/**
 * Numéro d'un « album » de peintures d'après son titre, ex. « peintures
 * album 3 (1505-1648) » → 3. Ces albums s'affichent en tête de la partie
 * Peinture, du plus grand numéro au plus petit : un album créé plus tard se
 * range donc tout seul en haut, sans toucher au code (demande de Bernard,
 * 25/07/2026). Les albums lettrés (A, B), plus anciens, gardent leur place
 * habituelle et ne sont volontairement pas concernés.
 */
export function albumNumber(title: string): number | null {
  const m = title.match(/album\s*(\d+)(?!\d)/i);
  return m ? Number(m[1]) : null;
}

export const CATEGORIES: Category[] = [
  {
    id: "peinture",
    title: "Peinture",
    slugs: [
      // Les albums numérotés ne sont plus listés ici : ils passent en tête
      // automatiquement, du plus récent au plus ancien (voir albumNumber).
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
