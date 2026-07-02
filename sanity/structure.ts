import type { StructureResolver, StructureBuilder } from "sanity/structure";
import { CATEGORIES, type Category } from "../lib/categories";

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

/**
 * Une partie du site (Peinture, Sculpture...) : ses rubriques → leurs œuvres.
 * L'appartenance vient du champ `category` des séries (éditable par Bernard) ;
 * créer une rubrique ici pré-remplit sa partie du site.
 *
 * Le résolveur `child` intercepte AUSSI les documents fraîchement créés par
 * le « + » du panneau : pour eux, il faut ouvrir le formulaire de la rubrique,
 * pas la liste (vide) de ses œuvres. On distingue les deux cas en vérifiant
 * si la rubrique est déjà PUBLIÉE (une rubrique en cours de création n'a
 * qu'un brouillon, voire rien).
 */
const categoryItem = (S: StructureBuilder, cat: Category) =>
  S.listItem()
    .title(cat.title)
    .id(cat.id)
    .child(
      S.documentList()
        .title(cat.title)
        .schemaType("series")
        .apiVersion("2024-01-01")
        .filter('_type == "series" && category == $cat')
        .params({ cat: cat.id })
        .defaultOrdering([{ field: "title", direction: "asc" }])
        .child(async (seriesId, { structureContext }) => {
          const client = structureContext.getClient({ apiVersion: "2024-01-01" });
          const published = await client.fetch<boolean>("count(*[_id == $id]) > 0", {
            id: seriesId,
          });
          return published
            ? artworksOfSeries(S, seriesId)
            : S.document()
                .schemaType("series")
                .documentId(seriesId)
                .initialValueTemplate("series-in-category", { categoryId: cat.id });
        })
        // ⚠️ DOIT rester le DERNIER appel de la chaîne (voir artworksOfSeries).
        .initialValueTemplates([
          S.initialValueTemplateItem("series-in-category", { categoryId: cat.id }),
        ]),
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
            .filter('_type == "series" && (!defined(category) || !(category in $cats))')
            .params({ cats: CATEGORIES.map((c) => c.id) })
            .defaultOrdering([{ field: "title", direction: "asc" }])
            .child((seriesId) => artworksOfSeries(S, seriesId)),
        ),
      S.divider(),
      S.documentTypeListItem("artwork").title("Ajouter / modifier une œuvre"),
      S.documentTypeListItem("series").title("Ajouter / modifier une rubrique"),
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
