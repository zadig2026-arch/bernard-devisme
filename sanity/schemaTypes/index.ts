import type { SchemaTypeDefinition } from "sanity";
import { artwork } from "./artwork";
import { series } from "./series";
import { exhibition } from "./exhibition";
import { press } from "./press";
import { journalEntry } from "./journalEntry";
import { page } from "./page";
import { siteSettings } from "./siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [artwork, series, exhibition, press, journalEntry, page, siteSettings],
};
