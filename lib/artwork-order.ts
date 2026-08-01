/**
 * Ordre d'affichage des œuvres dans une rubrique.
 *
 * Bernard numérote ses œuvres (« 1417 », « 373 l enrubané ») et cette
 * numérotation suit l'ordre où il les a peintes. C'est donc elle qui fait foi,
 * du plus ancien au plus récent (numéros croissants).
 *
 * Le 29/07 on avait mis l'inverse, par analogie avec l'ordre des albums qu'il
 * venait de valider (6 → 1). C'était une extrapolation : ses deux mails
 * demandent « l'ordre chronologique » puis « de manière croissante »
 * (01/08/2026), soit l'ordre de l'ancien e-monsite.
 *
 * Avant, la requête triait par `year` — champ resté vide sur les 811 œuvres.
 * Le tri ne triait donc rien et Sanity retombait sur l'identifiant interne :
 * les œuvres importées de l'e-monsite (`artwork-les-361`) ressortaient dans
 * l'ordre par chance, celles créées au Studio (identifiant aléatoire) en vrac.
 * D'où le « dans certaines rubriques les images sont dans l'ordre
 * chronologique et pas dans d'autres ».
 *
 * Le numéro est LU, jamais stocké : rien à saisir pour Bernard, et une œuvre
 * qu'il nomme « 1652 » se range toute seule au bon endroit.
 */

export type Orderable = {
  _id: string;
  title?: string;
  _createdAt?: string;
};

/** Un numéro d'œuvre chez Bernard va de ~300 à ~1700 : 3 ou 4 chiffres. */
const ID_NUMBER = /(?<!\d)(\d{3,4})(?!\d)/g;

/**
 * Le numéro de l'œuvre, ou `null`.
 *
 * 1. En tête du titre : « 1417 », « 373 l enrubane ». C'est la seule source
 *    que Bernard alimente, et elle prime.
 * 2. À défaut, dans l'identifiant HÉRITÉ de l'e-monsite, construit à l'import
 *    depuis le nom du fichier d'origine (`artwork-gabarit-1068-2` → 1068). On
 *    retient le plus grand nombre de 3-4 chiffres pour ignorer les suffixes de
 *    doublon (`-2`). Les identifiants sans numéro exploitable (photos
 *    d'appareil `p1090325`, `dessins-2-1-10`) ne donnent rien : ces œuvres
 *    passent à la fin, ce qui reste stable.
 *
 * Une œuvre créée au Studio a un identifiant aléatoire (`6869ec81-f4d4-…`) où
 * n'importe quelle suite de chiffres ressemblerait à un numéro d'œuvre : on ne
 * lit donc que les identifiants `artwork-*`, seuls porteurs de sens.
 */
export function artworkNumber(a: Orderable): number | null {
  const fromTitle = a.title?.trim().match(/^(\d{2,5})(?!\d)/);
  if (fromTitle) return Number(fromTitle[1]);

  const id = a._id.replace(/^drafts\./, "");
  if (!id.startsWith("artwork-")) return null;

  const matches = [...id.matchAll(ID_NUMBER)].map((m) => Number(m[1]));
  return matches.length ? Math.max(...matches) : null;
}

/**
 * Numéros croissants. Les œuvres sans numéro ferment la marche, dans leur
 * ordre d'ajout — un ordre arbitraire mais stable, plutôt que le hasard de
 * l'identifiant.
 */
export function byArtworkOrder(a: Orderable, b: Orderable): number {
  const na = artworkNumber(a);
  const nb = artworkNumber(b);
  if (na !== null && nb !== null) return na - nb;
  if (na !== null) return -1;
  if (nb !== null) return 1;
  return (a._createdAt ?? "").localeCompare(b._createdAt ?? "");
}

export function sortArtworks<T extends Orderable>(artworks: T[]): T[] {
  return [...artworks].sort(byArtworkOrder);
}
