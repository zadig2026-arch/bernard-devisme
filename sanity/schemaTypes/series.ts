import { defineField, defineType } from "sanity";

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
    defineField({ name: "statement", title: "Texte de série", type: "array", of: [{ type: "block" }] }),
    defineField({
      name: "coverArtwork",
      title: "Œuvre de couverture",
      type: "reference",
      to: [{ type: "artwork" }],
    }),
  ],
  preview: { select: { title: "title", subtitle: "period", media: "coverArtwork.images.0" } },
});
