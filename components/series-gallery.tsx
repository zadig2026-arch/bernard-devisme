"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimationVideo } from "@/components/animation-video";
import { AudioPlayer } from "@/components/audio-player";
import { SaleBadge } from "@/components/sale-badge";

export type GalleryItem = {
  _id: string;
  title?: string;
  year?: number;
  thumb: string;
  full: string;
  audioUrl?: string;
  videoUrl?: string;
  dimensions?: string;
  saleStatus?: "available" | "sold";
};

/**
 * Un groupe d'œuvres à l'intérieur d'une rubrique (les « sous-séries » du CMS).
 * `heading` est rendu côté serveur et passé tel quel : le titre et le texte du
 * groupe restent du Portable Text rendu hors du bundle client.
 */
export type GalleryGroup = { key: string; heading?: ReactNode; items: GalleryItem[] };

export function SeriesGallery({ groups }: { groups: GalleryGroup[] }) {
  // La visionneuse navigue à travers TOUTE la rubrique, groupes confondus :
  // les index sont donc ceux de la liste aplatie.
  const items = groups.flatMap((g) => g.items);
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length)),
    [items.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  const current = index !== null ? items[index] : null;

  return (
    <>
      {groups.map((group, gi) => {
        // Décalage de ce groupe dans la liste aplatie, pour que le clic ouvre
        // la bonne œuvre dans la visionneuse.
        const offset = groups.slice(0, gi).reduce((n, g) => n + g.items.length, 0);
        return (
          <section key={group.key} className={gi > 0 ? "mt-16 md:mt-20" : undefined}>
            {group.heading}
            <ul className="grid gap-x-4 gap-y-8 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {group.items.map((item, i) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => setIndex(offset + i)}
                    aria-label={`Agrandir ${item.title || "l’œuvre"}`}
                    className="group block w-full text-left"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[color:var(--color-rule)]/40">
                      <Image
                        src={item.thumb}
                        alt={item.title || ""}
                        fill
                        sizes="(min-width: 1280px) 14vw, (min-width: 768px) 20vw, 33vw"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    {(item.title || item.year) && (
                      <div className="mt-2 flex items-baseline justify-between gap-2 text-sm">
                        {item.title && (
                          <span className="heading-display italic text-[color:var(--color-ink)]">
                            {item.title}
                          </span>
                        )}
                        {item.year && (
                          <span className="text-[color:var(--color-ink-muted)]">{item.year}</span>
                        )}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {open && current && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition-colors hover:bg-white/20"
          >
            ×
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Œuvre précédente"
                className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-4xl leading-none text-white transition-colors hover:bg-white/20 sm:left-5"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Œuvre suivante"
                className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-4xl leading-none text-white transition-colors hover:bg-white/20 sm:right-5"
              >
                ›
              </button>
            </>
          )}

          <figure
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {current.videoUrl ? (
              <AnimationVideo
                key={current._id}
                src={current.videoUrl}
                variant="dark"
                className="h-[78vh] w-[86vw]"
              />
            ) : (
              <div className="relative h-[82vh] w-[86vw]">
                <Image
                  src={current.full}
                  alt={current.title || ""}
                  fill
                  sizes="86vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}
            {(current.title || current.year || current.dimensions) && (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {[current.title, current.year, current.dimensions].filter(Boolean).join(" · ")}
              </figcaption>
            )}
            {current.saleStatus && (
              <div className="mt-2">
                <SaleBadge status={current.saleStatus} variant="dark" />
              </div>
            )}
            {!current.videoUrl && current.audioUrl && (
              <AudioPlayer key={current._id} src={current.audioUrl} variant="dark" autoPlay />
            )}
          </figure>
        </div>
      )}
    </>
  );
}
