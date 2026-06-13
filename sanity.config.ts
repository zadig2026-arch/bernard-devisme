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
  schema,
  // Studio épuré et en français : navigation sur mesure, interface traduite,
  // sans l'outil technique Vision.
  plugins: [structureTool({ structure }), frFRLocale()],
  title: "Bernard Devisme — Studio",
});
