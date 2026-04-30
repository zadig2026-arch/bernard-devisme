import { Suspense } from "react";
import { ArtworkCard } from "@/components/artwork-card";
import { EmptyState } from "@/components/empty-state";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allArtworksQuery } from "@/sanity/lib/queries";
import { Filters } from "./filters";

type Artwork = {
  _id: string;
  title: string;
  slug: string;
  year?: number;
  medium?: string[];
  dimensions?: string;
  series?: { title: string; slug: string };
  status?: string;
  images?: Array<unknown>;
};

export const metadata = { title: "Œuvres" };

export default async function OeuvresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const serie = typeof sp.serie === "string" ? sp.serie : undefined;
  const medium = typeof sp.medium === "string" ? sp.medium : undefined;
  const year = typeof sp.annee === "string" ? Number(sp.annee) : undefined;

  const all = await sanityFetch<Artwork[]>(allArtworksQuery, {}, []);
  const filtered = all.filter((a) => {
    if (serie && a.series?.slug !== serie) return false;
    if (medium && !a.medium?.includes(medium)) return false;
    if (year && a.year !== year) return false;
    return true;
  });

  const allSeries = Array.from(
    new Map(all.flatMap((a) => (a.series ? [[a.series.slug, a.series]] : [])).values() as never).values?.() ??
      new Map<string, { title: string; slug: string }>(
        all.flatMap((a) => (a.series ? [[a.series.slug, a.series] as const] : [])),
      ).values(),
  );
  const allMediums = Array.from(new Set(all.flatMap((a) => a.medium ?? []))).sort();
  const allYears = Array.from(new Set(all.map((a) => a.year).filter((y): y is number => !!y))).sort(
    (a, b) => b - a,
  );

  return (
    <div className="container-page py-16 md:py-20">
      <header className="flex items-baseline justify-between gap-6">
        <h1 className="heading-display text-4xl md:text-6xl">Œuvres</h1>
        <p className="text-sm text-[color:var(--color-ink-muted)]">
          {filtered.length} {filtered.length > 1 ? "œuvres" : "œuvre"}
        </p>
      </header>

      <Suspense>
        <Filters series={allSeries as never} mediums={allMediums} years={allYears} />
      </Suspense>

      <div className="hairline mt-8 grid gap-x-6 gap-y-14 pt-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((a, i) => (
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
      {filtered.length === 0 && (
        <div className="mt-12">
          <EmptyState
            title="Aucune œuvre"
            body="Ajustez les filtres ou réinitialisez la sélection."
          />
        </div>
      )}
    </div>
  );
}
