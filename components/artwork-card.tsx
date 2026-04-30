import Link from "next/link";
import Image from "next/image";
import { urlForImage } from "@/sanity/lib/image";

type Props = {
  slug?: string;
  title: string;
  year?: number;
  medium?: string[];
  dimensions?: string;
  image?: { asset?: unknown } | null;
  priority?: boolean;
};

export function ArtworkCard({ slug, title, year, medium, dimensions, image, priority }: Props) {
  const src = image ? urlForImage(image).width(900).height(900).fit("max").url() : null;
  const inner = (
    <>
      <div className="relative aspect-square overflow-hidden bg-[color:var(--color-rule)]/40">
        {src && (
          <Image
            src={src}
            alt={title || ""}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className="object-contain p-2 transition-transform duration-700 group-hover:scale-[1.02]"
          />
        )}
      </div>
      {title && (
        <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
          <span className="heading-display text-base text-[color:var(--color-ink)] italic">{title}</span>
          {year && <span className="text-[color:var(--color-ink-muted)]">{year}</span>}
        </div>
      )}
      {(medium?.length || dimensions) && (
        <p className="mt-1 text-xs text-[color:var(--color-ink-muted)]">
          {[medium?.join(", "), dimensions].filter(Boolean).join(" · ")}
        </p>
      )}
    </>
  );

  if (!slug) {
    return <div className="group block">{inner}</div>;
  }

  return (
    <Link href={`/oeuvres/${slug}`} className="group block">
      {inner}
    </Link>
  );
}
