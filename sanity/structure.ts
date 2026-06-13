import type { StructureResolver } from "sanity/structure";

/**
 * Studio volontairement épuré pour Bernard : seulement ce dont il a besoin pour
 * ajouter / supprimer une œuvre et modifier les textes. Les types vides et
 * techniques (expositions, journal, presse, pages) sont retirés de la
 * navigation (ils restent dans le schéma, réactivables au besoin).
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Le site de Bernard")
    .items([
      S.documentTypeListItem("artwork").title("Toutes les œuvres"),
      S.listItem()
        .title("Œuvres par rubrique")
        .child(
          S.documentTypeList("series")
            .title("Rubriques")
            .child((seriesId) =>
              S.documentList()
                .title("Œuvres de la rubrique")
                .schemaType("artwork")
                .filter('_type == "artwork" && series._ref == $seriesId')
                .params({ seriesId })
                .defaultOrdering([{ field: "title", direction: "asc" }]),
            ),
        ),
      S.divider(),
      S.documentTypeListItem("series").title("Rubriques (titres et textes)"),
      S.listItem()
        .title("Texte d'accueil")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Texte d'accueil"),
        ),
    ]);
