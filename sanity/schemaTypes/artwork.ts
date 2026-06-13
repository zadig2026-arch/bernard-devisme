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
      title: "Format / dimensions (optionnel)",
      type: "string",
      description: "ex. 80 × 100 cm, ou 25 F, format paysage…",
    }),
    defineField({
      name: "saleStatus",
      title: "Disponibilité (optionnel)",
      type: "string",
      description:
        "Laisser vide pour ne rien afficher. Sinon, indiquer si l'œuvre est à vendre ou déjà vendue.",
      options: {
        list: [
          { title: "À vendre", value: "available" },
          { title: "Vendue", value: "sold" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "audio",
      title: "Musique d'ambiance (optionnel)",
      type: "file",
      description:
        "Pour les œuvres animées : une courte boucle sonore que le visiteur pourra écouter en cliquant sur un bouton. Formats conseillés : MP3.",
      options: { accept: "audio/*" },
    }),
    defineField({
      name: "video",
      title: "Animation sonorisée (optionnel)",
      type: "file",
      description:
        "Pour les œuvres animées : la vidéo MP4 où l'animation et sa musique sont déjà assemblées et synchronisées. Si elle est renseignée, la visionneuse joue cette vidéo à la place de l'image et de la musique séparées. Générée par scripts/build-site-videos.mjs.",
      options: { accept: "video/mp4" },
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
