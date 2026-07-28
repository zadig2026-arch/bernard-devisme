import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "@/components/portable-text";
import { SeriesGallery, type GalleryGroup, type GalleryItem } from "@/components/series-gallery";
import { sanityFetch } from "@/sanity/lib/fetch";
import { seriesBySlugQuery, allSeriesSlugsQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/image";
import { sortArtworks } from "@/lib/artwork-order";

type Artwork = {
  _id: string;
  _createdAt?: string;
  title: string;
  slug: string;
  year?: number;
  medium?: string[];
  dimensions?: string;
  saleStatus?: "available" | "sold";
  images?: Array<unknown>;
  audioUrl?: string;
  videoUrl?: string;
  /** `_key` du groupe (sous-série) auquel l'œuvre appartient. */
  subseries?: string;
};

type Series = {
  title: string;
  period?: string;
  statement?: unknown;
  /** Groupes d'œuvres déclarés sur la rubrique, dans l'ordre choisi au Studio. */
  subseries?: Array<{ _key: string; title: string; text?: unknown }>;
  artworks?: Artwork[];
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(allSeriesSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await sanityFetch<Series | null>(seriesBySlugQuery, { slug }, null);
  return s ? { title: s.title } : {};
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await sanityFetch<Series | null>(seriesBySlugQuery, { slug }, null);
  if (!s) notFound();

  const toItem = (a: Artwork): GalleryItem => ({
    _id: a._id,
    title: a.title?.trim() || undefined,
    year: a.year,
    thumb: urlForImage(a.images![0] as never).width(700).height(700).fit("max").url(),
    full: urlForImage(a.images![0] as never).width(2000).url(),
    audioUrl: a.audioUrl,
    videoUrl: a.videoUrl,
    dimensions: a.dimensions,
    saleStatus: a.saleStatus,
  });

  // Du plus récent au plus ancien, d'après le numéro de l'œuvre (voir
  // lib/artwork-order.ts). Le tri s'applique aussi à l'intérieur de chaque
  // groupe d'œuvres, puisque les groupes filtrent cette liste déjà ordonnée.
  const artworks = sortArtworks((s.artworks ?? []).filter((a) => a.images?.[0]));
  const declared = s.subseries ?? [];
  const declaredKeys = new Set(declared.map((g) => g._key));

  // Sans groupe déclaré, la rubrique s'affiche d'un bloc comme avant. Sinon :
  // les œuvres non rangées d'abord (sans titre), puis chaque groupe dans
  // l'ordre choisi au Studio.
  const groups: GalleryGroup[] = (
    declared.length === 0
      ? [{ key: "toutes", items: artworks.map(toItem) }]
      : [
          {
            key: "sans-groupe",
            items: artworks
              .filter((a) => !a.subseries || !declaredKeys.has(a.subseries))
              .map(toItem),
          },
          ...declared.map((g) => ({
            key: g._key,
            heading: (
              <div key={g._key} className="mb-6 border-t border-[color:var(--color-rule)] pt-6">
                <h2 className="heading-display text-2xl md:text-3xl italic">{g.title}</h2>
                {g.text ? (
                  <div className="mt-3">
                    <PortableText value={g.text} />
                  </div>
                ) : null}
              </div>
            ),
            items: artworks.filter((a) => a.subseries === g._key).map(toItem),
          })),
        ]
  ).filter((g) => g.items.length > 0);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="container-page py-16 md:py-20">
      <nav className="text-sm text-[color:var(--color-ink-muted)]">
        <Link href="/oeuvres" className="hover:text-[color:var(--color-ink)]">
          ← Toutes les œuvres
        </Link>
      </nav>

      {/* Le texte de rubrique passe sous le titre, sur toute la largeur de
          lecture : en colonne latérale, les textes longs de Bernard formaient
          un ruban vertical (sa demande du 25/07/2026). */}
      <header className="mt-8">
        <p className="eyebrow">{s.period ? `Série · ${s.period}` : "Série"}</p>
        <h1 className="heading-display mt-3 text-3xl md:text-4xl italic">{s.title}</h1>
        {s.statement ? (
          <div className="mt-6">
            <PortableText value={s.statement} />
          </div>
        ) : null}
      </header>

      <div className="mt-12">
        {total > 0 ? (
          <SeriesGallery groups={groups} />
        ) : (
          <p className="text-sm text-[color:var(--color-ink-muted)]">
            Les images de cette série seront bientôt disponibles.
          </p>
        )}
      </div>
    </div>
  );
}
