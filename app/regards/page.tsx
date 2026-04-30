import { sanityFetch } from "@/sanity/lib/fetch";
import { groq } from "next-sanity";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";

const query = groq`*[_type == "press"]|order(date desc){
  _id, author, title, publication, date, excerpt
}`;

type Press = {
  _id: string;
  author: string;
  title?: string;
  publication?: string;
  date?: string;
  excerpt?: string;
};

export const metadata = {
  title: "Regards d'après…",
  description: "Textes critiques et regards portés sur l'œuvre de Bernard Devisme.",
};

export default async function RegardsPage() {
  const items = await sanityFetch<Press[]>(query, {}, []);

  return (
    <div className="container-page py-16 md:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Regards d&rsquo;après…</p>
        <h1 className="heading-display mt-3 text-4xl md:text-6xl">Textes critiques</h1>
        <p className="mt-6 prose-art text-[color:var(--color-ink-muted)]">
          Au fil des années, des artistes, écrivains, critiques d&rsquo;art et responsables
          d&rsquo;institutions culturelles ont défendu ce travail. Voici leurs écrits.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="Aucun texte publié" />
        </div>
      ) : (
        <ul className="mt-16 divide-y divide-[color:var(--color-rule)] border-t border-[color:var(--color-rule)]">
          {items.map((p) => (
            <li key={p._id} className="py-8 grid gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <p className="eyebrow">{p.publication}</p>
                <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{formatDate(p.date)}</p>
              </div>
              <div className="md:col-span-9">
                {p.title && <p className="heading-display text-2xl italic">{p.title}</p>}
                <p className="mt-1 text-sm">{p.author}</p>
                {p.excerpt && <p className="mt-3 prose-art">{p.excerpt}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
