import Link from "next/link";
import { ArtworkCard } from "@/components/artwork-card";
import { EmptyState } from "@/components/empty-state";
import { PortableText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { homeQuery } from "@/sanity/lib/queries";
import { formatDate } from "@/lib/format";

type HomeData = {
  settings?: { intro?: unknown; agentInfo?: { name?: string; role?: string } };
  featuredArtworks?: Array<{
    _id: string;
    title: string;
    slug: string;
    year?: number;
    medium?: string[];
    dimensions?: string;
    images?: Array<unknown>;
  }>;
  series?: Array<{
    _id: string;
    title: string;
    slug: string;
    period?: string;
    statement?: unknown;
    coverArtwork?: { images?: Array<unknown>; title?: string };
  }>;
  latestJournal?: Array<{
    _id: string;
    title: string;
    slug: string;
    date?: string;
    excerpt?: string;
  }>;
};

export default async function HomePage() {
  const data = await sanityFetch<HomeData>(homeQuery, {}, {});
  const featured = data.featuredArtworks ?? [];
  const series = data.series ?? [];
  const journal = data.latestJournal ?? [];

  return (
    <div className="container-page py-16 md:py-24">
      <section className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="eyebrow">Atelier — Nieul-les-Saintes</p>
          <h1 className="heading-display mt-4 text-5xl md:text-7xl">Bernard&nbsp;Devisme</h1>
          <p className="mt-6 prose-art text-[color:var(--color-ink-muted)]">
            Peintre, sculpteur, infographiste. Diplômé des Beaux-Arts de Paris en 1970, élève
            d&rsquo;Étienne Martin, Robert Couturier, César et Collamarini. Une œuvre traversant le
            figuratif, l&rsquo;hyperréalisme et l&rsquo;abstrait, autour de la condition humaine et de
            la <em>Divine Comédie</em> de Dante.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link
              href="/oeuvres"
              className="border border-[color:var(--color-ink)] px-5 py-2.5 hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors"
            >
              Voir les œuvres
            </Link>
            <Link href="/parcours" className="px-5 py-2.5 underline underline-offset-4">
              Parcours
            </Link>
          </div>
        </div>
        {featured[0] && (
          <div className="md:col-span-5">
            <ArtworkCard
              slug={featured[0].slug}
              title={featured[0].title}
              year={featured[0].year}
              medium={featured[0].medium}
              dimensions={featured[0].dimensions}
              image={featured[0].images?.[0] as never}
              priority
            />
          </div>
        )}
      </section>

      {series.length > 0 && (
        <section className="mt-28">
          <header className="flex items-baseline justify-between">
            <h2 className="heading-display text-3xl md:text-4xl">Séries</h2>
            <Link href="/series" className="text-sm underline-offset-4 hover:underline">
              Toutes les séries →
            </Link>
          </header>
          <div className="hairline mt-6 grid gap-12 pt-10 md:grid-cols-3">
            {series.map((s) => (
              <Link key={s._id} href={`/series/${s.slug}`} className="group">
                {Boolean(s.coverArtwork?.images?.[0]) && (
                  <ArtworkCard slug="" title="" image={s.coverArtwork!.images![0] as never} />
                )}
                <p className="eyebrow mt-3">{s.period}</p>
                <p className="heading-display mt-1 text-2xl italic">{s.title}</p>
                <div className="mt-2 max-w-prose text-sm text-[color:var(--color-ink-muted)] line-clamp-3">
                  <PortableText value={s.statement} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 1 && (
        <section className="mt-28">
          <header className="flex items-baseline justify-between">
            <h2 className="heading-display text-3xl md:text-4xl">Œuvres choisies</h2>
            <Link href="/oeuvres" className="text-sm underline-offset-4 hover:underline">
              Catalogue complet →
            </Link>
          </header>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featured.slice(1).map((a) => (
              <ArtworkCard
                key={a._id}
                slug={a.slug}
                title={a.title}
                year={a.year}
                medium={a.medium}
                dimensions={a.dimensions}
                image={a.images?.[0] as never}
              />
            ))}
          </div>
        </section>
      )}

      {journal.length > 0 && (
        <section className="mt-28">
          <header className="flex items-baseline justify-between">
            <h2 className="heading-display text-3xl md:text-4xl">Journal d&rsquo;atelier</h2>
            <Link href="/journal" className="text-sm underline-offset-4 hover:underline">
              Toutes les entrées →
            </Link>
          </header>
          <ul className="hairline mt-6 divide-y divide-[color:var(--color-rule)] pt-2">
            {journal.map((e) => (
              <li key={e._id}>
                <Link href={`/journal/${e.slug}`} className="grid gap-1 py-6 md:grid-cols-12">
                  <span className="md:col-span-2 eyebrow">{formatDate(e.date)}</span>
                  <span className="md:col-span-4 heading-display text-xl italic">{e.title}</span>
                  {e.excerpt && (
                    <span className="md:col-span-6 text-sm text-[color:var(--color-ink-muted)]">
                      {e.excerpt}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length === 0 && series.length === 0 && journal.length === 0 && (
        <section className="mt-20">
          <EmptyState
            title="Site en cours de migration"
            body="Le contenu sera publié progressivement depuis l'atelier via le Studio. Connectez Sanity (NEXT_PUBLIC_SANITY_PROJECT_ID) pour activer le catalogue."
          />
        </section>
      )}
    </div>
  );
}
