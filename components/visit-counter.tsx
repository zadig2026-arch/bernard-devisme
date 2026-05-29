"use client";

import { useEffect, useState } from "react";

/**
 * Compteur de visites public, façon site historique. Incrémente une fois par
 * session (sessionStorage) pour ne pas gonfler le total à chaque navigation.
 */
export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const already = sessionStorage.getItem("bd-visit-counted");

    async function run() {
      try {
        const res = await fetch("/api/views", { method: already ? "GET" : "POST" });
        const data = (await res.json()) as { count: number | null };
        if (!cancelled && typeof data.count === "number") {
          setCount(data.count);
          if (!already) sessionStorage.setItem("bd-visit-counted", "1");
        }
      } catch {
        /* compteur silencieux en cas d'échec */
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <p className="mt-2 tabular-nums">
      {count.toLocaleString("fr-FR")} visite{count > 1 ? "s" : ""}
    </p>
  );
}
