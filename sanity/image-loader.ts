import type { ImageLoaderProps } from "next/image";

export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.startsWith("https://cdn.sanity.io/")) return src;
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  if (!url.searchParams.has("auto")) url.searchParams.set("auto", "format");
  if (!url.searchParams.has("fit")) url.searchParams.set("fit", "max");
  return url.toString();
}
