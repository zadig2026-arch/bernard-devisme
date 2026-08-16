import { createElement } from "react";
import { defineField, defineType } from "sanity";
import { SeriesFirstArtworkThumb } from "../components/series-thumb";
import { SeriesInputWithDelete } from "../components/series-input-with-delete";

export const series = defineType({
  name: "series",
  title: "Série",
  type: "document",
  // Bouton « Supprimer cette rubrique et ses œuvres » en bas de la fiche
  // (demande de Bernard du 13/08/2026, avec confirmation chiffrée).
  components: { input: SeriesInputWithDelete },
  fields: [
    defineField({ name: "title", title: "Titre", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "category",
      title: "Partie du site",
      type: "string",
      description: "Dans quelle partie du site ranger cette rubrique.",
      options: {
        layout: "radio",
        list: [
          { title: "Peinture", value: "peinture" },
          { title: "Sculpture", value: "sculpture" },
          { title: "Dessin", value: "dessin" },
          { title: "Infographies", value: "infographies" },
          { title: "Livres-objets et plus", value: "livres-objets" },
        ],
      },
    }),
    // L'adresse d'une rubrique fabrique le lien du site. Le 08/08/2026 Bernard
    // a tapé le titre ici (« Les tentures », majuscule et espace) : la rubrique
    // s'affichait dans la liste mais son lien renvoyait une 404. D'où le
    // nettoyage automatique à la génération ET le refus de publier une adresse
    // mal formée, avec un message qui dit quoi faire.
    defineField({
      name: "slug",
      title: "Adresse de la page",
      type: "slug",
      description:
        "Cliquez sur « Générer » après avoir écrit le titre. Uniquement des lettres minuscules sans accent, des chiffres et des tirets.",
      options: {
        source: "title",
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 96),
      },
      validation: (r) =>
        r.required().custom((value) => {
          const current = value?.current;
          if (!current) return "Cliquez sur « Générer » pour créer l'adresse.";
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(current)
            ? true
            : "Cette adresse rendrait la rubrique introuvable sur le site. Cliquez sur « Générer » pour la recréer à partir du titre.";
        }),
    }),
    defineField({ name: "period", title: "Période", type: "string", description: "ex. 1995–2010" }),
    defineField({
      name: "statement",
      title: "Texte de la rubrique",
      type: "array",
      of: [{ type: "block" }],
      description: "S'affiche en haut de la page, avant les œuvres.",
    }),
    // Sous-séries : plusieurs groupes d'œuvres titrés dans une même rubrique
    // (demande de Bernard du 25/07/2026 : « Tendance singulière » contient
    // Gorgonéïons, Têtaramilles et Coups de gueule). L'œuvre choisit ensuite
    // son groupe dans une liste (champ `subseries` du type artwork).
    defineField({
      name: "subseries",
      title: "Groupes d'œuvres (facultatif)",
      type: "array",
      description:
        "Pour séparer plusieurs séries dans une même rubrique. Chaque groupe affiche son titre au-dessus de ses œuvres. Faites glisser pour changer l'ordre.",
      of: [
        {
          type: "object",
          name: "subserie",
          title: "Groupe",
          fields: [
            defineField({
              name: "title",
              title: "Titre du groupe",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "text",
              title: "Texte du groupe (facultatif)",
              type: "array",
              of: [{ type: "block" }],
            }),
          ],
          preview: { select: { title: "title" } },
        },
      ],
    }),
    defineField({
      name: "coverArtwork",
      title: "Œuvre de couverture",
      type: "reference",
      to: [{ type: "artwork" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "period",
      media: "coverArtwork.images.0",
      id: "_id",
    },
    prepare({ title, subtitle, media, id }) {
      return {
        title,
        subtitle,
        // À défaut d'œuvre de couverture, on montre la première œuvre de la
        // rubrique plutôt que l'icône « feuille cornée ».
        media: media ?? (() => createElement(SeriesFirstArtworkThumb, { seriesId: id })),
      };
    },
  },
});
