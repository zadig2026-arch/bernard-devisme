import { defineField, defineType } from "sanity";

export const journalEntry = defineType({
  name: "journalEntry",
  title: "Journal d'atelier",
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
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "excerpt", title: "Chapeau", type: "text", rows: 3 }),
    defineField({ name: "body", title: "Texte", type: "array", of: [{ type: "block" }, { type: "image", options: { hotspot: true } }] }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "relatedArtworks",
      title: "Œuvres liées",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artwork" }] }],
    }),
  ],
  preview: { select: { title: "title", subtitle: "date", media: "images.0" } },
  orderings: [{ title: "Date (récent)", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
});
