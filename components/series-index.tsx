import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/fetch";
import { groq } from "next-sanity";
import { RECENT_ARTWORK_FILTER } from "@/lib/novelty";

type SeriesEntry = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  count: number;
  /** Œuvres ajoutées récemment (voir lib/novelty.ts) : > 0 = signal « nouveautés ». */
  newCount: number;
};

const allSeriesQuery = groq`*[_type == "series"]{
  _id,
  title,
  "slug": slug.current,
  category,
  "count": count(*[_type == "artwork" && references(^._id)]),
  "newCount": count(*[_type == "artwork" && references(^._id) && ${RECENT_ARTWORK_FILTER}])
}`;

// Mapping catégorie → séries partagé avec la navigation du Studio.
import { CATEGORIES, albumNumber, leadingYear } from "@/lib/categories";

export async function SeriesIndex({ categoryId, showTitles = true }: { categoryId?: string; showTitles?: boolean } = {}) {
  const all = await sanityFetch<SeriesEntry[]>(allSeriesQuery, {}, []);

  if (all.length === 0) return null;

  const cats = categoryId ? CATEGORIES.filter((c) => c.id === categoryId) : CATEGORIES;
  const knownIds = new Set(CATEGORIES.map((c) => c.id));

  // L'appartenance vient du champ `category` (Sanity, éditable par Bernard).
  //
  // Ordre dans une partie (demandes de Bernard, 25/07 puis 26/10/2026) :
  //  1. les rubriques dont le titre commence par une année, de la plus
  //     récente à la plus ancienne (2026 en haut) : c'est ainsi qu'il nomme
  //     désormais toutes ses rubriques de peinture, et une rubrique « 2027_… »
  //     se placera toute seule en tête ;
  //  2. puis les « albums » numérotés, du plus grand numéro au plus petit ;
  //  3. puis l'ordre historique de l'ancien site (liste de slugs), les
  //     nouvelles rubriques sans année venant à la suite, par ordre
  //     alphabétique.
  // Tout est lu dans le titre, rien à saisir pour Bernard.
  const itemsOf = (cat: (typeof CATEGORIES)[number]) => {
    const legacyOrder = new Map(cat.slugs.map((s, i) => [s, i]));
    const rank = (s: SeriesEntry) =>
      leadingYear(s.title) !== null
        ? -2
        : albumNumber(s.title) !== null
          ? -1
          : (legacyOrder.get(s.slug) ?? Number.MAX_SAFE_INTEGER);
    return all
      .filter((s) => s.category === cat.id && s.count > 0)
      .sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;
        const ya = leadingYear(a.title);
        const yb = leadingYear(b.title);
        if (ya !== null && yb !== null && ya !== yb) return yb - ya; // 2026, 2025, 2024…
        const na = albumNumber(a.title);
        const nb = albumNumber(b.title);
        if (na !== null && nb !== null && na !== nb) return nb - na; // 7, 6, 5…
        return a.title.localeCompare(b.title, "fr");
      });
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
              className="flex items-baseline justify-between gap-4 py-2 heading-display italic text-base md:text-lg text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-accent)]"
            >
              <span>{s.title}</span>
              {s.newCount > 0 && <NewBadge count={s.newCount} />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Le signal « nouveautés » d'une rubrique : des images y ont été ajoutées
 * dans les NEW_DAYS derniers jours (lib/novelty.ts). Sobre, dans la couleur
 * d'accent, pour attirer l'œil sans crier.
 */
function NewBadge({ count }: { count: number }) {
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5 not-italic font-sans text-[0.65rem] uppercase tracking-[0.14em] text-[color:var(--color-accent)]"
      title={`${count} nouvelle${count > 1 ? "s" : ""} image${count > 1 ? "s" : ""}`}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />
      Nouveautés
    </span>
  );
}
