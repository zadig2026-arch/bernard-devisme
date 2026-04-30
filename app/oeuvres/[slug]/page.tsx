import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SanityImage } from "@/components/sanity-image";
import { PortableText } from "@/components/portable-text";
import { ArtworkCard } from "@/components/artwork-card";
import { sanityFetch } from "@/sanity/lib/fetch";
import { artworkBySlugQuery, allArtworkSlugsQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";
import { formatDateRange } from "@/lib/format";

type Artwork = {
  title: string;
  year?: number;
  medium?: string[];
  dimensions?: string;
  status?: string;
  description?: unknown;
  inventoryNumber?: string;
  images?: Array<{ asset?: unknown; caption?: string }>;
  series?: { title: string; slug: string } | null;
  exhibitions?: Array<{
    title: string;
    slug: string;
    venue?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
  }>;
  related?: Array<{ _id: string; title: string; slug: string; year?: number; images?: Array<unknown> }>;
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allArtworkSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await sanityFetch<Artwork | null>(artworkBySlugQuery, { slug }, null);
  if (!data) return {};
  const cover = data.images?.[0] ? urlForImage(data.images[0]).width(1200).height(630).url() : undefined;
  return {
    title: data.title,
    description: data.medium?.join(", "),
    openGraph: cover ? { images: [{ url: cover, width: 1200, height: 630 }] } : undefined,
  };
}

const STATUS_LABEL: Record<string, string> = {
  disponible: "Disponible",
  "collection-privee": "Collection privée",
  "non-disponible": "Non disponible",
};

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await sanityFetch<Artwork | null>(artworkBySlugQuery, { slug }, null);
  if (!a) notFound();

  return (
    <article className="container-page py-12 md:py-16">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/oeuvres" className="hover:text-[color:var(--color-ink)]">
          ← Retour aux œuvres
        </Link>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8 lg:sticky lg:top-24 lg:self-start">
          {a.images?.[0] && (
            <SanityImage
              source={a.images[0] as never}
              alt={a.title}
              priority
              sizes="(min-width: 1024px) 66vw, 100vw"
            />
          )}
          {a.images && a.images.length > 1 && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {a.images.slice(1).map((img, i) => (
                <SanityImage key={i} source={img as never} alt={`${a.title} — vue ${i + 2}`} />
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <p className="eyebrow">{a.series?.title ?? "Œuvre"}</p>
          <h1 className="heading-display mt-3 text-4xl md:text-5xl italic">{a.title}</h1>
          <dl className="mt-8 space-y-3 text-sm">
            {a.year && (
              <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
                <dt className="text-[color:var(--color-ink-muted)]">Année</dt>
                <dd>{a.year}</dd>
              </div>
            )}
            {a.medium && a.medium.length > 0 && (
              <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
                <dt className="text-[color:var(--color-ink-muted)]">Médium</dt>
                <dd className="text-right">{a.medium.join(", ")}</dd>
              </div>
            )}
            {a.dimensions && (
              <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
                <dt className="text-[color:var(--color-ink-muted)]">Dimensions</dt>
                <dd>{a.dimensions}</dd>
              </div>
            )}
            {a.status && (
              <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
                <dt className="text-[color:var(--color-ink-muted)]">Statut</dt>
                <dd>{STATUS_LABEL[a.status] ?? a.status}</dd>
              </div>
            )}
            {a.inventoryNumber && (
              <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
                <dt className="text-[color:var(--color-ink-muted)]">N° d&rsquo;inventaire</dt>
                <dd>{a.inventoryNumber}</dd>
              </div>
            )}
          </dl>

          {Boolean(a.description) && (
            <div className="mt-8">
              <PortableText value={a.description} />
            </div>
          )}

          <div className="mt-8 border border-[color:var(--color-rule)] p-5">
            <p className="eyebrow">Acquisition / renseignements</p>
            <p className="mt-2 text-sm">
              Cette œuvre est représentée par Bernadette, agente de l&rsquo;artiste.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block border border-[color:var(--color-ink)] px-4 py-2 text-sm hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
            >
              Nous contacter
            </Link>
          </div>

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

      {a.related && a.related.length > 0 && (
        <section className="mt-28">
          <h2 className="heading-display text-2xl">Dans la même série</h2>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-4">
            {a.related.map((r) => (
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
