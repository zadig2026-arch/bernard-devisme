import Link from "next/link";
import Image from "next/image";
import { sanityFetch } from "@/sanity/lib/fetch";
import { groq } from "next-sanity";
import { urlForImage } from "@/sanity/lib/image";

type SeriesEntry = {
  _id: string;
  title: string;
  slug: string;
  count: number;
  cover?: { asset?: unknown } | null;
};

const allSeriesWithCoverQuery = groq`*[_type == "series"]{
  _id,
  title,
  "slug": slug.current,
  "count": count(*[_type == "artwork" && references(^._id)]),
  "cover": coalesce(
    coverArtwork->images[0],
    *[_type == "artwork" && references(^._id)][0].images[0]
  )
}`;

type Category = { id: string; title: string; slugs: string[] };

const CATEGORIES: Category[] = [
  {
    id: "peinture",
    title: "Peinture",
    slugs: [
      "peintures-album-3",
      "peintures-2024",
      "peintures-2023",
      "amalgame",
      "wx",
      "la-divine-comedie-serie-2020",
      "transitions-2",
      "les-trombines",
      "gabarit",
      "l-eau-et-les-reves",
      "les-inconnus",
      "mine-d-angle-s",
      "filets-d-encre",
      "contre-tout-contre-sens",
      "concretions",
      "endroit-envers",
      "le-temps-inacheve",
      "la-divine-comedie",
      "les-anomalies",
      "les",
      "les-angles",
      "les-oscillations",
      "peintures",
      "les-peintures-abstraites",
    ],
  },
  {
    id: "sculpture",
    title: "Sculpture",
    slugs: [
      "sculptures-recentes",
      "les-assemblages",
      "les-bois",
      "les-truelles",
      "les-freluquets",
      "vendetheque-de-la-chataigneraie",
      "les-bidules",
      "les-installations",
      "installations-in-situ",
      "paysages-reves",
    ],
  },
  {
    id: "graphisme",
    title: "Graphisme",
    slugs: [
      "les-caboches",
      "dessins-2-1",
      "les-visages-recuperes",
      "les-dessins",
      "dessins-2",
      "les-cageots",
      "les-ecorces",
      "les-gueules",
    ],
  },
  {
    id: "infographies",
    title: "Infographies",
    slugs: ["les-montages", "les-animations", "textes-amants", "monde-extensible"],
  },
  {
    id: "livres-objets",
    title: "Livres-objets et plus",
    slugs: ["livres-objets", "livres-objets-raku", "plus"],
  },
];

export async function SeriesIndex({ categoryId, showTitles = true }: { categoryId?: string; showTitles?: boolean } = {}) {
  const all = await sanityFetch<SeriesEntry[]>(allSeriesWithCoverQuery, {}, []);
  const bySlug = new Map(all.map((s) => [s.slug, s]));

  if (all.length === 0) return null;

  const cats = categoryId ? CATEGORIES.filter((c) => c.id === categoryId) : CATEGORIES;

  return (
    <div className="space-y-12">
      {cats.map((cat) => {
        const items = cat.slugs
          .map((s) => bySlug.get(s))
          .filter((x): x is SeriesEntry => Boolean(x) && (x as SeriesEntry).count > 0);
        if (items.length === 0) return null;
        return (
          <CategoryBlock
            key={cat.id}
            id={cat.id}
            title={cat.title}
            items={items}
            showTitle={showTitles}
          />
        );
      })}
      {!categoryId && (() => {
        const assigned = new Set<string>();
        CATEGORIES.forEach((c) => c.slugs.forEach((s) => assigned.add(s)));
        const orphans = all.filter((s) => !assigned.has(s.slug) && s.count > 0);
        return orphans.length > 0 ? (
          <CategoryBlock id="autres" title="Autres" items={orphans} showTitle={showTitles} />
        ) : null;
      })()}
    </div>
  );
}

export function getCategoryMeta(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

function CategoryBlock({ id, title, items, showTitle = true }: { id: string; title: string; items: SeriesEntry[]; showTitle?: boolean }) {
  return (
    <section id={id} className="scroll-mt-28">
      {showTitle && (
        <h2 className="eyebrow text-[color:var(--color-accent)] text-sm tracking-[0.2em]">
          {title}
        </h2>
      )}
      <ul className="mt-4 grid gap-x-3 gap-y-5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
        {items.map((s) => (
          <li key={s._id}>
            <Link href={`/series/${s.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden bg-[color:var(--color-rule)]/30">
                {s.cover && (
                  <Image
                    src={urlForImage(s.cover).width(240).height(240).fit("crop").url()}
                    alt={s.title}
                    fill
                    sizes="(min-width: 1280px) 11vw, (min-width: 1024px) 14vw, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <p className="mt-1.5 heading-display italic text-xs leading-tight group-hover:text-[color:var(--color-accent)]">
                {s.title}
              </p>
              <p className="text-[10px] text-[color:var(--color-ink-muted)]">
                {s.count} œuvre{s.count > 1 ? "s" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
