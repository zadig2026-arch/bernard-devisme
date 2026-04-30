"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type SeriesOpt = { title: string; slug: string };

export function Filters({
  series,
  mediums,
  years,
}: {
  series: SeriesOpt[];
  mediums: string[];
  years: number[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/oeuvres?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const select =
    "border border-[color:var(--color-rule)] bg-transparent px-3 py-2 text-sm";

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <select
        className={select}
        value={params.get("serie") ?? ""}
        onChange={(e) => update("serie", e.target.value)}
        aria-label="Filtrer par série"
      >
        <option value="">Toutes les séries</option>
        {series.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.title}
          </option>
        ))}
      </select>
      <select
        className={select}
        value={params.get("medium") ?? ""}
        onChange={(e) => update("medium", e.target.value)}
        aria-label="Filtrer par médium"
      >
        <option value="">Tous les médiums</option>
        {mediums.map((m) => (
          <option key={m} value={m}>
            {m[0].toUpperCase() + m.slice(1).replace(/-/g, " ")}
          </option>
        ))}
      </select>
      <select
        className={select}
        value={params.get("annee") ?? ""}
        onChange={(e) => update("annee", e.target.value)}
        aria-label="Filtrer par année"
      >
        <option value="">Toutes les années</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      {(params.get("serie") || params.get("medium") || params.get("annee")) && (
        <button
          type="button"
          onClick={() => router.replace("/oeuvres", { scroll: false })}
          className="text-sm underline underline-offset-4"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
