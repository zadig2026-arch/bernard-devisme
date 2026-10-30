import { defineField, defineType } from "sanity";

/**
 * Page « Parcours et CV » — singleton (un seul document, id fixe "parcours").
 * Rendue par app/parcours/page.tsx. Garde la même mise en page : une
 * présentation, une frise de repères (année + texte), et un texte de démarche.
 */
export const parcours = defineType({
  name: "parcours",
  title: "Parcours et CV",
  type: "document",
  fields: [
    defineField({
      name: "intro",
      title: "Présentation",
      type: "text",
      rows: 4,
      description: "Le paragraphe d'introduction, sous le titre.",
    }),
    defineField({
      name: "reperes",
      title: "Repères (frise chronologique)",
      type: "array",
      description:
        "Une ligne par année (ou période) : l'année dans « Année », le texte dans « Texte ». Le site les affiche du plus récent au plus ancien (2026 en haut), quel que soit l'ordre ici.",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "year",
              title: "Année",
              type: "string",
              description: "Ex. 2026, ou une période : 1972–2007.",
            }),
            defineField({
              name: "body",
              title: "Texte",
              type: "text",
              rows: 3,
              description: "Les retours à la ligne sont conservés sur le site.",
            }),
          ],
          preview: { select: { title: "year", subtitle: "body" } },
        },
      ],
    }),
    defineField({
      name: "demarche",
      title: "Démarche",
      type: "text",
      rows: 8,
      description: "Le texte de la section Démarche. Laissez une ligne vide entre deux paragraphes.",
    }),
  ],
  preview: { prepare: () => ({ title: "Parcours et CV" }) },
});
