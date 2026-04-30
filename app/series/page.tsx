import Link from "next/link";
import { ArtworkCard } from "@/components/artwork-card";
import { EmptyState } from "@/components/empty-state";
import { PortableText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allSeriesQuery } from "@/sanity/lib/queries";

type Series = {
  _id: string;
  title: string;
  slug: string;
  period?: string;
  statement?: unknown;
  count?: number;
  coverArtwork?: { images?: Array<unknown>; title?: string } | null;
};

export const metadata = { title: "Séries" };

export default async function SeriesIndex() {
  const series = await sanityFetch<Series[]>(allSeriesQuery, {}, []);

  return (
    <div className="container-page py-16 md:py-20">
      <h1 className="heading-display text-4xl md:text-6xl">Séries</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-ink-muted)]">
        L&rsquo;œuvre se déploie en cycles thématiques : la condition humaine, la <em>Divine Comédie</em>,
        l&rsquo;objet trivial revisité, la mémoire et la trace.
      </p>

      {series.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="Aucune série publiée" />
        </div>
      ) : (
        <div className="hairline mt-12 grid gap-x-8 gap-y-16 pt-10 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <Link key={s._id} href={`/series/${s.slug}`} className="group block">
              {Boolean(s.coverArtwork?.images?.[0]) && (
                <ArtworkCard
                  slug=""
                  title=""
                  image={s.coverArtwork!.images![0] as never}
                />
              )}
              <p className="eyebrow mt-4">{s.period}</p>
              <p className="heading-display mt-1 text-2xl italic group-hover:text-[color:var(--color-accent)]">
                {s.title}
              </p>
              {typeof s.count === "number" && (
                <p className="mt-1 text-xs text-[color:var(--color-ink-muted)]">
                  {s.count} œuvre{s.count > 1 ? "s" : ""}
                </p>
              )}
              <div className="mt-3 line-clamp-3 text-sm text-[color:var(--color-ink-muted)]">
                <PortableText value={s.statement} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
