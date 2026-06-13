import { defineField, defineType } from "sanity";

export const artwork = defineType({
  name: "artwork",
  title: "Œuvre",
  type: "document",
  fields: [
    // --- L'essentiel pour Bernard : image, titre, rubrique ---
    defineField({
      name: "images",
      title: "Image(s)",
      type: "array",
      description: "Glissez ici la ou les photos de l'œuvre.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "caption", title: "Légende", type: "string" }],
        },
      ],
      validation: (r) => r.min(1).error("Ajoutez au moins une image."),
    }),
    defineField({
      name: "title",
      title: "Titre (facultatif)",
      type: "string",
      description: "Laissez vide si l'œuvre n'a pas de titre.",
    }),
    defineField({
      name: "series",
      title: "Rubrique",
      type: "reference",
      description: "Dans quelle rubrique ranger cette œuvre.",
      to: [{ type: "series" }],
    }),

    // --- Détails facultatifs ---
    defineField({ name: "year", title: "Année (facultatif)", type: "number" }),
    defineField({
      name: "dimensions",
      title: "Format / dimensions (facultatif)",
      type: "string",
      description: "ex. 80 × 100 cm",
    }),
    defineField({
      name: "saleStatus",
      title: "Disponibilité (facultatif)",
      type: "string",
      description: "Laisser vide pour ne rien afficher.",
      options: {
        list: [
          { title: "À vendre", value: "available" },
          { title: "Vendue", value: "sold" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "description",
      title: "Texte / description (facultatif)",
      type: "array",
      of: [{ type: "block" }],
    }),

    // --- Champs techniques, masqués (gérés automatiquement ou par Zadig) ---
    defineField({
      name: "slug",
      title: "URL",
      type: "slug",
      hidden: true,
      options: {
        source: (doc) => (doc as { title?: string }).title?.trim() || `oeuvre-${Date.now().toString(36)}`,
        maxLength: 96,
      },
      initialValue: () => ({
        _type: "slug",
        current: `oeuvre-${Date.now().toString(36)}${Math.floor(Math.random() * 10000)}`,
      }),
    }),
    defineField({
      name: "medium",
      title: "Médium",
      type: "array",
      hidden: true,
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
      name: "audio",
      title: "Musique d'ambiance",
      type: "file",
      hidden: true,
      options: { accept: "audio/*" },
    }),
    defineField({
      name: "video",
      title: "Animation sonorisée",
      type: "file",
      hidden: true,
      options: { accept: "video/mp4" },
    }),
    defineField({
      name: "featured",
      title: "Afficher sur la page d'accueil",
      type: "boolean",
      hidden: true,
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
