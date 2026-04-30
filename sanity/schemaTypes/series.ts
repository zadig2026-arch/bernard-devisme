import { defineField, defineType } from "sanity";

export const series = defineType({
  name: "series",
  title: "Série",
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
