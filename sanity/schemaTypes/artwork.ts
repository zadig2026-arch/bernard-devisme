import { defineField, defineType } from "sanity";

export const artwork = defineType({
  name: "artwork",
  title: "Œuvre",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Titre", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "URL",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "year", title: "Année", type: "number" }),
    defineField({
      name: "medium",
      title: "Médium",
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
    defineField({ name: "dimensions", title: "Dimensions", type: "string", description: "ex. 80 × 100 cm" }),
    defineField({
      name: "series",
      title: "Série",
      type: "reference",
      to: [{ type: "series" }],
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "caption", title: "Légende", type: "string" }],
        },
      ],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: "status",
      title: "Statut",
      type: "string",
      options: {
        list: [
          { title: "Disponible", value: "disponible" },
          { title: "Collection privée", value: "collection-privee" },
          { title: "Non disponible", value: "non-disponible" },
        ],
        layout: "radio",
      },
      initialValue: "non-disponible",
    }),
    defineField({ name: "description", title: "Description", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "inventoryNumber", title: "N° d'inventaire", type: "string" }),
    defineField({ name: "featured", title: "Mettre en avant", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "title", subtitle: "year", media: "images.0" },
  },
  orderings: [
    { title: "Année (récent)", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
    { title: "Titre (A→Z)", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
  ],
});
