import { notFound } from "next/navigation";
import Link from "next/link";
import { SanityImage } from "@/components/sanity-image";
import { ArtworkCard } from "@/components/artwork-card";
import { PortableText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { exhibitionBySlugQuery, allExhibitionSlugsQuery } from "@/sanity/lib/queries";
import { formatDateRange } from "@/lib/format";

type Exhibition = {
  title: string;
  venue?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  description?: unknown;
  coverImage?: unknown;
  gallery?: Array<{ asset?: unknown; caption?: string }>;
  artworks?: Array<{ _id: string; title: string; slug: string; year?: number; images?: Array<unknown> }>;
  press?: Array<{ _id: string; author: string; title?: string; publication?: string; date?: string; excerpt?: string }>;
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allExhibitionSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await sanityFetch<Exhibition | null>(exhibitionBySlugQuery, { slug }, null);
  return e ? { title: e.title } : {};
}

export default async function ExhibitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await sanityFetch<Exhibition | null>(exhibitionBySlugQuery, { slug }, null);
  if (!e) notFound();

  return (
    <div className="container-page py-16 md:py-20">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/expositions">← Toutes les expositions</Link>
      </nav>

      <header className="mt-8 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="eyebrow">{e.type} · {formatDateRange(e.startDate, e.endDate)}</p>
          <h1 className="heading-display mt-3 text-4xl md:text-6xl italic">{e.title}</h1>
          <p className="mt-2 text-[color:var(--color-ink-muted)]">
            {[e.venue, e.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="md:col-span-4">
          <PortableText value={e.description} />
        </div>
      </header>

      {Boolean(e.coverImage) && (
        <div className="mt-12">
          <SanityImage source={e.coverImage as never} alt={e.title} priority />
        </div>
      )}

      {e.gallery && e.gallery.length > 0 && (
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {e.gallery.map((img, i) => (
            <SanityImage key={i} source={img as never} alt={img.caption ?? `Vue ${i + 1}`} />
          ))}
        </section>
      )}

      {e.artworks && e.artworks.length > 0 && (
        <section className="mt-20">
          <h2 className="heading-display text-2xl">Œuvres exposées</h2>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-4">
            {e.artworks.map((a) => (
              <ArtworkCard
                key={a._id}
                slug={a.slug}
                title={a.title}
                year={a.year}
                image={a.images?.[0] as never}
              />
            ))}
          </div>
        </section>
      )}

      {e.press && e.press.length > 0 && (
        <section className="mt-20">
          <h2 className="heading-display text-2xl">Presse</h2>
          <ul className="mt-6 space-y-6">
            {e.press.map((p) => (
              <li key={p._id} className="border-l-2 border-[color:var(--color-accent)] pl-4">
                <p className="eyebrow">{p.publication}</p>
                <p className="heading-display text-lg italic">{p.title}</p>
                <p className="text-sm text-[color:var(--color-ink-muted)]">{p.author}</p>
                {p.excerpt && <p className="mt-2 text-sm">{p.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
