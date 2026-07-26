import { useEffect, useState } from "react";
import { useClient } from "sanity";

/**
 * Vignette d'une rubrique dans les listes du Studio : la première œuvre de la
 * rubrique, à la place de l'icône « feuille cornée » (demande de Bernard du
 * 15/07/2026). Utilisée seulement quand la rubrique n'a pas d'œuvre de
 * couverture explicite ; une rubrique encore vide garde l'icône par défaut.
 */
export function SeriesFirstArtworkThumb({ seriesId }: { seriesId?: string }) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!seriesId) return;
    let cancelled = false;
    client
      .fetch<string | null>(
        `*[_type == "artwork" && references($id) && count(images[defined(asset)]) > 0]
           | order(_createdAt asc)[0].images[defined(asset)][0].asset->url`,
        { id: seriesId.replace(/^drafts\./, "") },
      )
      .then((u) => {
        if (!cancelled && u) setUrl(`${u}?w=120&h=120&fit=crop&auto=format`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client, seriesId]);

  if (!url) return null;
  return <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}
