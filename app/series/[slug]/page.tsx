import { notFound } from "next/navigation";
import Link from "next/link";
import { ArtworkCard } from "@/components/artwork-card";
import { PortableText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { seriesBySlugQuery, allSeriesSlugsQuery } from "@/sanity/lib/queries";

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

  return (
    <div className="container-page py-16 md:py-20">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/series" className="hover:text-[color:var(--color-ink)]">
          ← Toutes les séries
        </Link>
      </nav>

      <header className="mt-8 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="eyebrow">Série · {s.period}</p>
          <h1 className="heading-display mt-3 text-5xl md:text-7xl italic">{s.title}</h1>
        </div>
        <div className="md:col-span-4">
          <PortableText value={s.statement} />
        </div>
      </header>

      <div className="hairline mt-16 grid gap-x-6 gap-y-14 pt-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {s.artworks?.map((a, i) => (
          <ArtworkCard
            key={a._id}
            slug={a.slug}
            title={a.title}
            year={a.year}
            medium={a.medium}
            dimensions={a.dimensions}
            image={a.images?.[0] as never}
            priority={i < 4}
          />
        ))}
      </div>
    </div>
  );
}
