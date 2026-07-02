import type { StructureResolver, StructureBuilder } from "sanity/structure";
import { CATEGORIES, ASSIGNED_SLUGS, type Category } from "../lib/categories";

/**
 * Studio volontairement épuré pour Bernard : la navigation reprend la
 * structure du site public (Peinture / Sculpture / Graphisme / Infographies /
 * Livres-objets et plus), chaque partie listant ses rubriques puis les œuvres
 * de chaque rubrique. Les types vides et techniques (expositions, journal,
 * presse, pages) sont retirés de la navigation (ils restent dans le schéma,
 * réactivables au besoin).
 */

/** Les œuvres d'une rubrique. Créer une œuvre ici pré-remplit sa rubrique. */
const artworksOfSeries = (S: StructureBuilder, seriesId: string) =>
  S.documentList()
    .title("Œuvres de la rubrique")
    .schemaType("artwork")
    .apiVersion("2024-01-01")
    .filter('_type == "artwork" && series._ref == $seriesId')
    .params({ seriesId })
    .defaultOrdering([{ field: "title", direction: "asc" }])
    // ⚠️ DOIT rester le DERNIER appel de la chaîne : chaque méthode chaînée
    // clone le builder et ré-infère les templates par défaut, ce qui écrase
    // les templates personnalisés posés avant.
    .initialValueTemplates([S.initialValueTemplateItem("artwork-in-series", { seriesId })]);

/** Une partie du site (Peinture, Sculpture...) : ses rubriques → leurs œuvres. */
const categoryItem = (S: StructureBuilder, cat: Category) =>
  S.listItem()
    .title(cat.title)
    .id(cat.id)
    .child(
      S.documentList()
        .title(cat.title)
        .schemaType("series")
        .apiVersion("2024-01-01")
        .filter('_type == "series" && slug.current in $slugs')
        .params({ slugs: cat.slugs })
        .defaultOrdering([{ field: "title", direction: "asc" }])
        .child((seriesId) => artworksOfSeries(S, seriesId)),
    );

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Le site de Bernard")
    .items([
      // Les parties du site, dans le même ordre que le menu du site public.
      ...CATEGORIES.map((cat) => categoryItem(S, cat)),
      S.listItem()
        .title("Autres rubriques")
        .id("autres-rubriques")
        .child(
          S.documentList()
            .title("Autres rubriques")
            .schemaType("series")
            .apiVersion("2024-01-01")
            .filter('_type == "series" && !(slug.current in $slugs)')
            .params({ slugs: ASSIGNED_SLUGS })
            .defaultOrdering([{ field: "title", direction: "asc" }])
            .child((seriesId) => artworksOfSeries(S, seriesId)),
        ),
      S.divider(),
      S.documentTypeListItem("artwork").title("Toutes les œuvres"),
      S.documentTypeListItem("series").title("Rubriques (titres et textes)"),
      S.divider(),
      S.listItem()
        .title("Texte d'accueil")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Texte d'accueil"),
        ),
      S.listItem()
        .title("Parcours et CV")
        .id("parcours")
        .child(
          S.document().schemaType("parcours").documentId("parcours").title("Parcours et CV"),
        ),
    ]);
