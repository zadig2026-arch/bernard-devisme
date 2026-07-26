import { createElement } from "react";
import { defineField, defineType } from "sanity";
import { SeriesFirstArtworkThumb } from "../components/series-thumb";

export const series = defineType({
  name: "series",
  title: "Série",
  type: "document",
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
          { title: "Graphisme", value: "graphisme" },
          { title: "Infographies", value: "infographies" },
          { title: "Livres-objets et plus", value: "livres-objets" },
        ],
      },
    }),
    defineField({
      name: "slug",
      title: "URL",
      type: "slug",
      description: "Cliquez sur « Générer » après avoir écrit le titre.",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
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
