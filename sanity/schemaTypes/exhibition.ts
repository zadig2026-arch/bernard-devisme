import { defineField, defineType } from "sanity";

export const exhibition = defineType({
  name: "exhibition",
  title: "Exposition",
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
    defineField({ name: "venue", title: "Lieu", type: "string" }),
    defineField({ name: "city", title: "Ville", type: "string" }),
    defineField({ name: "startDate", title: "Date de début", type: "date" }),
    defineField({ name: "endDate", title: "Date de fin", type: "date" }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Personnelle", value: "personnelle" },
          { title: "Collective", value: "collective" },
          { title: "In situ", value: "in-situ" },
          { title: "Salon", value: "salon" },
        ],
      },
    }),
    defineField({ name: "description", title: "Description", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "coverImage", title: "Image de couverture", type: "image", options: { hotspot: true } }),
    defineField({
      name: "gallery",
      title: "Galerie d'accrochage",
      type: "array",
      of: [{ type: "image", options: { hotspot: true }, fields: [{ name: "caption", type: "string" }] }],
    }),
    defineField({
      name: "artworks",
      title: "Œuvres exposées",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artwork" }] }],
    }),
    defineField({
      name: "press",
      title: "Presse",
      type: "array",
      of: [{ type: "reference", to: [{ type: "press" }] }],
    }),
  ],
  preview: { select: { title: "title", subtitle: "venue", media: "coverImage" } },
  orderings: [
    { title: "Date (récent)", name: "dateDesc", by: [{ field: "startDate", direction: "desc" }] },
  ],
});
