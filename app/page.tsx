import Link from "next/link";
import { ArtworkCard } from "@/components/artwork-card";
import { EmptyState } from "@/components/empty-state";
import { SeriesIndex } from "@/components/series-index";
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
        <div className="md:col-span-8">
          <p className="eyebrow">Atelier — Nieul-les-Saintes</p>
          <h1 className="heading-display mt-4 text-3xl md:text-5xl">Bernard&nbsp;Devisme</h1>
          <div className="mt-8 prose-art text-[color:var(--color-ink-muted)] space-y-4">
            <p>
              Peintre, sculpteur et infographiste, né en 1947, diplômé des Beaux-Arts de Paris en 1970
              (mention très bien) après avoir passé 4 années dans les ateliers
              d&rsquo;Étienne Martin, Robert Couturier, César et Collamarini.
            </p>
            <p>
              Professeur d&rsquo;Arts Plastiques et d&rsquo;Infographie à l&rsquo;École Alsacienne à
              Paris pendant 35 ans. Je m&rsquo;installe en Vendée en 2007 puis en Charente-Maritime en 2016.
            </p>
            <p>
              Expositions et installations in situ, collectives et personnelles, en France et à
              l&rsquo;étranger, dès les années 70.
            </p>
            <p>
              Co-directeur de la galerie «&nbsp;Art Libre&nbsp;» de 1988 à 1990 à Rambouillet (78),
              puis directeur de l&rsquo;espace d&rsquo;art contemporain «&nbsp;Confluences&nbsp;»
              jusqu&rsquo;en 1992.
            </p>
            <p>
              Dessins de presse dans <em>L&rsquo;Écho Républicain</em> (Chartres, 1984–1991) puis dans{" "}
              <em>Ouest-France</em> (Fontenay-le-Comte, 2008–2017).
            </p>
            <p>
              Différentes personnes (françaises ou étrangères), artistes, écrivains, critiques
              d&rsquo;art, responsables d&rsquo;institutions culturelles ont défendu mon travail.
              Retrouvez leurs écrits dans la rubrique{" "}
              <Link href="/regards" className="underline underline-offset-4 hover:text-[color:var(--color-ink)]">
                Regards d&rsquo;après…
              </Link>
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm">
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

          <address className="mt-10 not-italic text-sm text-[color:var(--color-ink-muted)] space-y-1">
            <p>Atelier · 17810 Nieul-les-Saintes · 06 30 33 32 71</p>
            <p>
              <a href="mailto:bernarddevisme@orange.fr" className="hover:text-[color:var(--color-ink)]">
                bernarddevisme@orange.fr
              </a>
            </p>
            <p>
              Blogs :{" "}
              <a
                href="https://devismebernard.blogspot.com"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-[color:var(--color-ink)]"
              >
                devismebernard.blogspot.com
              </a>
              {" · "}
              <a
                href="https://crok-est-charlie.blogspot.com"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-[color:var(--color-ink)]"
              >
                crok-est-charlie.blogspot.com
              </a>{" "}
              <span className="text-xs">(dessins de presse)</span>
            </p>
          </address>
        </div>

        {featured[0] && (
          <div className="md:col-span-4 md:sticky md:top-24 md:self-start">
            <ArtworkCard
              slug={featured[0].slug}
              image={featured[0].images?.[0] as never}
              priority
            />
          </div>
        )}
      </section>

      <section className="mt-20">
        <header className="flex items-baseline justify-between">
          <h2 className="heading-display text-2xl md:text-3xl">Œuvres</h2>
        </header>
        <div className="mt-8">
          <SeriesIndex />
        </div>
      </section>

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
