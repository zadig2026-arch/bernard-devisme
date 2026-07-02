import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/fetch";
import { groq } from "next-sanity";

type SeriesEntry = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  count: number;
};

const allSeriesQuery = groq`*[_type == "series"]{
  _id,
  title,
  "slug": slug.current,
  category,
  "count": count(*[_type == "artwork" && references(^._id)])
}`;

// Mapping catégorie → séries partagé avec la navigation du Studio.
import { CATEGORIES } from "@/lib/categories";

export async function SeriesIndex({ categoryId, showTitles = true }: { categoryId?: string; showTitles?: boolean } = {}) {
  const all = await sanityFetch<SeriesEntry[]>(allSeriesQuery, {}, []);

  if (all.length === 0) return null;

  const cats = categoryId ? CATEGORIES.filter((c) => c.id === categoryId) : CATEGORIES;
  const knownIds = new Set(CATEGORIES.map((c) => c.id));

  // L'appartenance vient du champ `category` (Sanity, éditable par Bernard) ;
  // la liste de slugs historique ne sert plus qu'à préserver l'ordre
  // d'affichage de l'ancien site, les nouvelles rubriques venant à la suite.
  const itemsOf = (cat: (typeof CATEGORIES)[number]) => {
    const legacyOrder = new Map(cat.slugs.map((s, i) => [s, i]));
    return all
      .filter((s) => s.category === cat.id && s.count > 0)
      .sort(
        (a, b) =>
          (legacyOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
            (legacyOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER) ||
          a.title.localeCompare(b.title, "fr"),
      );
  };

  return (
    <div className="space-y-16 md:space-y-20">
      {cats.map((cat) => {
        const items = itemsOf(cat);
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
        const orphans = all.filter(
          (s) => (!s.category || !knownIds.has(s.category)) && s.count > 0,
        );
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
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-[color:var(--color-ink)] pb-2">
          <h2 className="heading-display text-2xl md:text-3xl text-[color:var(--color-ink)]">
            {title}
          </h2>
          <span className="eyebrow shrink-0">
            {items.length} série{items.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
      <ul className={`${showTitle ? "mt-1" : "border-t border-[color:var(--color-rule)]"}`}>
        {items.map((s) => (
          <li key={s._id} className="border-b border-[color:var(--color-rule)]">
            <Link
              href={`/series/${s.slug}`}
              className="block py-2 heading-display italic text-base md:text-lg text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-accent)]"
            >
              {s.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
