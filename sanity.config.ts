"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { frFRLocale } from "@sanity/locale-fr-fr";
import { dataset, projectId } from "@/sanity/env";
import { schema } from "@/sanity/schemaTypes";
import { structure } from "@/sanity/structure";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    ...schema,
    // Créer une œuvre depuis une rubrique pré-remplit le champ Rubrique
    // (utilisé par sanity/structure.ts via initialValueTemplates).
    templates: (prev) => [
      ...prev,
      {
        id: "artwork-in-series",
        title: "Œuvre dans la rubrique",
        schemaType: "artwork",
        parameters: [{ name: "seriesId", title: "Rubrique", type: "string" }],
        value: ({ seriesId }: { seriesId: string }) => ({
          series: { _type: "reference", _ref: seriesId },
        }),
      },
      {
        id: "series-in-category",
        title: "Rubrique dans une partie du site",
        schemaType: "series",
        parameters: [{ name: "categoryId", title: "Partie du site", type: "string" }],
        value: ({ categoryId }: { categoryId: string }) => ({
          category: categoryId,
        }),
      },
    ],
  },
  // Studio épuré et en français : navigation sur mesure, interface traduite,
  // sans l'outil technique Vision.
  plugins: [structureTool({ structure }), frFRLocale()],
  title: "Bernard Devisme — Studio",
});
