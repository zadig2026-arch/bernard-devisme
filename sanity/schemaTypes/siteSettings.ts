import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Paramètres du site",
  type: "document",
  fields: [
    defineField({ name: "intro", title: "Texte d'introduction", type: "array", of: [{ type: "block" }] }),
    defineField({ name: "contactEmail", title: "Email de contact", type: "string" }),
    defineField({
      name: "agentInfo",
      title: "Agent / représentation",
      type: "object",
      fields: [
        { name: "name", title: "Nom", type: "string" },
        { name: "role", title: "Rôle", type: "string" },
        { name: "email", title: "Email", type: "string" },
        { name: "phone", title: "Téléphone", type: "string" },
        { name: "bio", title: "Bio courte", type: "text" },
      ],
    }),
    defineField({
      name: "socialLinks",
      title: "Liens externes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Libellé", type: "string" },
            { name: "url", title: "URL", type: "url" },
          ],
        },
      ],
    }),
  ],
});
