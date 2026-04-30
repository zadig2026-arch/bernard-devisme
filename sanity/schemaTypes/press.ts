import { defineField, defineType } from "sanity";

export const press = defineType({
  name: "press",
  title: "Presse / Regards",
  type: "document",
  fields: [
    defineField({ name: "author", title: "Auteur", type: "string", validation: (r) => r.required() }),
    defineField({ name: "title", title: "Titre du texte", type: "string" }),
    defineField({ name: "publication", title: "Publication", type: "string" }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({ name: "excerpt", title: "Extrait", type: "text" }),
    defineField({ name: "fullText", title: "Texte complet", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "pdf", title: "PDF", type: "file" }),
  ],
  preview: { select: { title: "author", subtitle: "publication" } },
});
