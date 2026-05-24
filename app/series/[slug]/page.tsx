import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "@/components/portable-text";
import { SeriesGallery, type GalleryItem } from "@/components/series-gallery";
import { sanityFetch } from "@/sanity/lib/fetch";
import { seriesBySlugQuery, allSeriesSlugsQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";

type Series = {
  title: string;
  period?: string;
  statement?: unknown;
  artworks?: Array<{
    _id: string;
    title: string;
    slug: string;
    year?: number;
    medium?: string[];
    dimensions?: string;
    images?: Array<unknown>;
  }>;
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allSeriesSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await sanityFetch<Series | null>(seriesBySlugQuery, { slug }, null);
  return s ? { title: s.title } : {};
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await sanityFetch<Series | null>(seriesBySlugQuery, { slug }, null);
  if (!s) notFound();

  const items: GalleryItem[] = (s.artworks ?? [])
    .filter((a) => a.images?.[0])
    .map((a) => ({
      _id: a._id,
      title: a.title?.trim() || undefined,
      year: a.year,
      thumb: urlForImage(a.images![0] as never).width(700).height(700).fit("max").url(),
      full: urlForImage(a.images![0] as never).width(2000).url(),
    }));

  return (
    <div className="container-page py-16 md:py-20">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/oeuvres" className="hover:text-[color:var(--color-ink)]">
          ← Toutes les œuvres
        </Link>
      </nav>

      <header className="mt-8 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="eyebrow">Série · {s.period}</p>
          <h1 className="heading-display mt-3 text-3xl md:text-4xl italic">{s.title}</h1>
        </div>
        <div className="md:col-span-4">
          <PortableText value={s.statement} />
        </div>
      </header>

      <div className="mt-10">
        {items.length > 0 ? (
          <SeriesGallery items={items} />
        ) : (
          <p className="text-sm text-[color:var(--color-ink-muted)]">
            Les images de cette série seront bientôt disponibles.
          </p>
        )}
      </div>
    </div>
  );
}
