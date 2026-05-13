import { defineField, defineType } from "sanity";

export const artwork = defineType({
  name: "artwork",
  title: "Œuvre",
  type: "document",
  fields: [
    defineField({
      name: "images",
      title: "Image(s)",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "caption", title: "Légende", type: "string" }],
        },
      ],
      validation: (r) => r.min(1).error("Au moins une image est requise."),
    }),
    defineField({
      name: "title",
      title: "Titre (optionnel)",
      type: "string",
    }),
    defineField({
      name: "slug",
      title: "URL",
      type: "slug",
      options: {
        source: (doc) => {
          const title = (doc as { title?: string }).title;
          return title?.trim() || `oeuvre-${Date.now().toString(36)}`;
        },
        maxLength: 96,
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "year", title: "Année (optionnel)", type: "number" }),
    defineField({
      name: "medium",
      title: "Médium (optionnel)",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Peinture", value: "peinture" },
          { title: "Sculpture", value: "sculpture" },
          { title: "Dessin", value: "dessin" },
          { title: "Gravure", value: "gravure" },
          { title: "Infographie", value: "infographie" },
          { title: "Raku", value: "raku" },
          { title: "Installation", value: "installation" },
          { title: "Livre-objet", value: "livre-objet" },
          { title: "Technique mixte", value: "technique-mixte" },
        ],
      },
    }),
    defineField({
      name: "dimensions",
      title: "Dimensions (optionnel)",
      type: "string",
      description: "ex. 80 × 100 cm",
    }),
    defineField({
      name: "series",
      title: "Série (optionnel)",
      type: "reference",
      to: [{ type: "series" }],
    }),
    defineField({
      name: "description",
      title: "Description (optionnel)",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "featured",
      title: "Afficher sur la page d'accueil",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "year", media: "images.0" },
    prepare({ title, subtitle, media }) {
      return { title: title || "Sans titre", subtitle: subtitle?.toString(), media };
    },
  },
  orderings: [
    { title: "Année (récent)", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
    { title: "Titre (A→Z)", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
  ],
});
