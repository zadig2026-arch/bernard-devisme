import Image from "next/image";
import { urlForImage } from "@/sanity/lib/image";
import type { SanityImageSource } from "@sanity/image-url";

type Props = {
  source: SanityImageSource;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  aspect?: "square" | "auto";
};

export function SanityImage({ source, alt, sizes, priority, className, aspect = "auto" }: Props) {
  if (!source) return null;
  const url = urlForImage(source).width(1800).url();
  const placeholder = urlForImage(source).width(40).blur(40).url();
  return (
    <div className={`relative ${aspect === "square" ? "aspect-square" : ""} ${className ?? ""}`}>
      <Image
        src={url}
        alt={alt}
        fill={aspect === "square"}
        width={aspect === "auto" ? 1800 : undefined}
        height={aspect === "auto" ? 1200 : undefined}
        sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
        priority={priority}
        placeholder="blur"
        blurDataURL={placeholder}
        className="h-auto w-full object-contain"
      />
    </div>
  );
}
