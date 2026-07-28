import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SanityImage } from "@/components/sanity-image";
import { PortableText } from "@/components/portable-text";
import { AnimationVideo } from "@/components/animation-video";
import { ArtworkCard } from "@/components/artwork-card";
import { AudioPlayer } from "@/components/audio-player";
import { SaleBadge } from "@/components/sale-badge";
import { SeriesIndex, getCategoryMeta, CATEGORY_IDS } from "@/components/series-index";
import { sanityFetch } from "@/sanity/lib/fetch";
import { artworkBySlugQuery, allArtworkSlugsQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";
import { formatDateRange } from "@/lib/format";
import { sortArtworks } from "@/lib/artwork-order";

type Artwork = {
  title?: string;
  year?: number;
  medium?: string[];
  dimensions?: string;
  description?: unknown;
  images?: Array<{ asset?: unknown; caption?: string }>;
  saleStatus?: "available" | "sold";
  audioUrl?: string;
  videoUrl?: string;
  series?: { title: string; slug: string } | null;
  exhibitions?: Array<{
    title: string;
    slug: string;
    venue?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  }>;
  related?: Array<{
    _id: string;
    _createdAt?: string;
    title: string;
    slug: string;
    year?: number;
    images?: Array<unknown>;
  }>;
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allArtworkSlugsQuery, {}, []);
  return [
    ...CATEGORY_IDS.map((slug) => ({ slug })),
    ...slugs.map((slug) => ({ slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryMeta(slug);
  if (cat) return { title: cat.title };
  const data = await sanityFetch<Artwork | null>(artworkBySlugQuery, { slug }, null);
  if (!data) return {};
  const cover = data.images?.[0] ? urlForImage(data.images[0]).width(1200).height(630).url() : undefined;
  return {
    title: data.title || "Œuvre",
    description: data.medium?.join(", "),
    openGraph: cover ? { images: [{ url: cover, width: 1200, height: 630 }] } : undefined,
  };
}

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cat = getCategoryMeta(slug);
  if (cat) {
    return (
      <div className="container-page py-16 md:py-20">
        <nav className="text-sm text-[color:var(--color-ink-muted)]">
          <Link href="/oeuvres" className="hover:text-[color:var(--color-ink)]">
            ← Toutes les œuvres
          </Link>
        </nav>
        <header className="mt-6">
          <h1 className="heading-display text-3xl md:text-5xl">{cat.title}</h1>
        </header>
        <div className="mt-12">
          <SeriesIndex categoryId={cat.id} showTitles={false} />
        </div>
      </div>
    );
  }

  const a = await sanityFetch<Artwork | null>(artworkBySlugQuery, { slug }, null);
  if (!a) notFound();

  const displayTitle = a.title?.trim() || "Sans titre";
  // Les voisines de la rubrique, dans le même ordre que la page de rubrique.
  const related = sortArtworks(a.related ?? []).slice(0, 4);

  return (
    <article className="container-page py-12 md:py-16">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/oeuvres" className="hover:text-[color:var(--color-ink)]">
          ← Retour aux œuvres
        </Link>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:sticky lg:top-24 lg:self-start">
          {a.videoUrl ? (
            <AnimationVideo src={a.videoUrl} className="w-full" />
          ) : (
            a.images?.[0] && (
              <SanityImage
                source={a.images[0] as never}
                alt={displayTitle}
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            )
          )}
          {a.images && a.images.length > 1 && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {a.images.slice(1).map((img, i) => (
                <SanityImage key={i} source={img as never} alt={`${displayTitle} — vue ${i + 2}`} />
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5">
          {a.series?.title && <p className="eyebrow">{a.series.title}</p>}
          <h1 className="heading-display mt-3 text-3xl md:text-4xl italic">{displayTitle}</h1>
          {(a.year || (a.medium && a.medium.length > 0) || a.dimensions) && (
            <p className="mt-4 text-sm text-[color:var(--color-ink-muted)]">
              {[a.year, a.medium?.join(", "), a.dimensions].filter(Boolean).join(" · ")}
            </p>
          )}
          {a.saleStatus && (
            <div className="mt-4">
              <SaleBadge status={a.saleStatus} />
            </div>
          )}

          {a.audioUrl && !a.videoUrl && <AudioPlayer src={a.audioUrl} />}

          {Boolean(a.description) && (
            <div className="mt-8">
              <PortableText value={a.description} />
            </div>
          )}

          {a.exhibitions && a.exhibitions.length > 0 && (
            <section className="mt-10">
              <p className="eyebrow">Expositions</p>
              <ul className="mt-3 space-y-2 text-sm">
                {a.exhibitions.map((e) => (
                  <li key={e.slug}>
                    <Link href={`/expositions/${e.slug}`} className="hover:underline">
                      {e.title} · {e.venue}, {e.city} · {formatDateRange(e.startDate, e.endDate)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="heading-display text-xl">Dans la même série</h2>
          <div className="mt-6 grid gap-x-4 gap-y-8 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {related.map((r) => (
              <ArtworkCard
                key={r._id}
                slug={r.slug}
                title={r.title}
                year={r.year}
                image={r.images?.[0] as never}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
