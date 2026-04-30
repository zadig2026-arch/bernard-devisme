import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/empty-state";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allJournalQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";
import { formatDate } from "@/lib/format";

type Entry = {
  _id: string;
  title: string;
  slug: string;
  date?: string;
  excerpt?: string;
  images?: { asset?: unknown } | null;
};

export const metadata = {
  title: "Journal d'atelier",
  description: "Chroniques d'atelier, accrochages, expérimentations.",
};

export default async function JournalIndex() {
  const entries = await sanityFetch<Entry[]>(allJournalQuery, {}, []);

  return (
    <div className="container-page py-16 md:py-20">
      <h1 className="heading-display text-4xl md:text-6xl">Journal d&rsquo;atelier</h1>
      <p className="mt-4 max-w-2xl text-[color:var(--color-ink-muted)]">
        Notes, accrochages, expérimentations. Une chronique tenue depuis l&rsquo;atelier de
        Nieul-les-Saintes.
      </p>

      {entries.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="Pas encore d'entrée publiée" />
        </div>
      ) : (
        <ul className="hairline mt-12 divide-y divide-[color:var(--color-rule)] pt-2">
          {entries.map((e) => (
            <li key={e._id}>
              <Link href={`/journal/${e.slug}`} className="grid gap-4 py-8 md:grid-cols-12">
                <div className="md:col-span-3 relative aspect-[4/3] bg-[color:var(--color-rule)]/40">
                  {e.images && (
                    <Image
                      src={urlForImage(e.images).width(600).height(450).url()}
                      alt={e.title}
                      fill
                      sizes="(min-width: 768px) 25vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="md:col-span-9">
                  <p className="eyebrow">{formatDate(e.date)}</p>
                  <p className="heading-display mt-1 text-3xl italic">{e.title}</p>
                  {e.excerpt && (
                    <p className="mt-2 max-w-prose text-[color:var(--color-ink-muted)]">{e.excerpt}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
