import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allExhibitionsQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";
import { formatDateRange } from "@/lib/format";

type Exhibition = {
  _id: string;
  title: string;
  slug: string;
  venue?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  coverImage?: { asset?: unknown } | null;
};

export const metadata = { title: "Expositions" };

export default async function ExhibitionsIndex() {
  const all = await sanityFetch<Exhibition[]>(allExhibitionsQuery, {}, []);
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter((e) => (e.endDate ?? e.startDate ?? "") >= now);
  const past = all.filter((e) => (e.endDate ?? e.startDate ?? "") < now);

  return (
    <div className="container-page py-16 md:py-20">
      <h1 className="heading-display text-4xl md:text-6xl">Expositions</h1>
      {all.length === 0 && (
        <div className="mt-12">
          <EmptyState title="Aucune exposition publiée" />
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mt-12">
          <p className="eyebrow">À venir</p>
          <List items={upcoming} />
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">Passées</p>
          <List items={past} />
        </section>
      )}
    </div>
  );
}

function List({ items }: { items: Exhibition[] }) {
  return (
    <ul className="mt-6 divide-y divide-[color:var(--color-rule)] border-t border-[color:var(--color-rule)]">
      {items.map((e) => (
        <li key={e._id}>
          <Link
            href={`/expositions/${e.slug}`}
            className="grid gap-3 py-6 md:grid-cols-12 md:items-center"
          >
            <div className="relative aspect-[4/3] md:col-span-3 bg-[color:var(--color-rule)]/40">
              {e.coverImage && (
                <Image
                  src={urlForImage(e.coverImage).width(600).height(450).url()}
                  alt={e.title}
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="md:col-span-9">
              <p className="eyebrow">{formatDateRange(e.startDate, e.endDate)}</p>
              <p className="heading-display mt-1 text-2xl italic">{e.title}</p>
              <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">
                {[e.venue, e.city].filter(Boolean).join(" · ")}
                {e.type && ` · ${e.type}`}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
