"use client";

/**
 * Sanity Studio embarqué — toutes les routes sous /studio sont gérées ici.
 * Voir https://github.com/sanity-io/next-sanity
 */

import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

export const dynamic = "force-static";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
