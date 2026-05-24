"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type GalleryItem = {
  _id: string;
  title?: string;
  year?: number;
  thumb: string;
  full: string;
};

export function SeriesGallery({ items }: { items: GalleryItem[] }) {
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
      <ul className="grid gap-x-4 gap-y-8 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {items.map((item, i) => (
          <li key={item._id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
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
                  {item.year && <span className="text-[color:var(--color-ink-muted)]">{item.year}</span>}
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>

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
            {(current.title || current.year) && (
              <figcaption className="mt-3 text-center text-sm text-white/80">
                {[current.title, current.year].filter(Boolean).join(" · ")}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
