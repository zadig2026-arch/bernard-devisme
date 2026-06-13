import { notFound } from "next/navigation";
import Link from "next/link";
import { SanityImage } from "@/components/sanity-image";
import { PortableText } from "@/components/portable-text";
import { ArtworkCard } from "@/components/artwork-card";
import { sanityFetch } from "@/sanity/lib/fetch";
import { journalBySlugQuery, allJournalSlugsQuery } from "@/sanity/lib/queries";
import { formatDate } from "@/lib/format";

type Entry = {
  title: string;
  date?: string;
  body?: unknown;
  images?: Array<{ asset?: unknown }>;
  relatedArtworks?: Array<{ _id: string; title: string; slug: string; images?: Array<unknown> }>;
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allJournalSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await sanityFetch<Entry | null>(journalBySlugQuery, { slug }, null);
  return e ? { title: e.title } : {};
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await sanityFetch<Entry | null>(journalBySlugQuery, { slug }, null);
  if (!e) notFound();

  return (
    <article className="container-page py-16 md:py-20">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/journal">← Journal</Link>
      </nav>

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">{formatDate(e.date)}</p>
        <h1 className="heading-display mt-3 text-3xl md:text-4xl italic">{e.title}</h1>
      </header>

      {e.images?.[0] && (
        <div className="mt-10 max-w-3xl">
          <SanityImage source={e.images[0] as never} alt={e.title} priority />
        </div>
      )}

      <div className="mt-10 max-w-3xl">
        <PortableText value={e.body} />
      </div>

      {e.images && e.images.length > 1 && (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {e.images.slice(1).map((img, i) => (
            <SanityImage key={i} source={img as never} alt={`${e.title} — ${i + 2}`} />
          ))}
        </div>
      )}

      {e.relatedArtworks && e.relatedArtworks.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-display text-xl">Œuvres mentionnées</h2>
          <div className="mt-6 grid gap-x-4 gap-y-8 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {e.relatedArtworks.map((a) => (
              <ArtworkCard
                key={a._id}
                slug={a.slug}
                title={a.title}
                image={a.images?.[0] as never}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
