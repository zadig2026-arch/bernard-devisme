"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export const dynamic = "force-static";
export const viewport = { width: "device-width", initialScale: 1 };

export default function StudioPage() {
  return <NextStudio config={config} />;
}
