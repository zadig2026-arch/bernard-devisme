"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lecteur audio minimal pour les œuvres animées : un bouton discret que le
 * visiteur active manuellement (les navigateurs bloquent l'autoplay sonore).
 * La boucle tourne tant qu'elle n'est pas coupée.
 */
export function AudioPlayer({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("pause", onEnded);
    return () => {
      audio.removeEventListener("pause", onEnded);
      audio.pause();
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Couper la musique" : "Écouter la musique"}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] px-4 py-2 text-sm text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-ink)] hover:text-white"
      >
        <span aria-hidden className="text-base leading-none">
          {playing ? "❚❚" : "▶"}
        </span>
        <span>{playing ? "Couper la musique" : label || "Écouter la musique"}</span>
      </button>
      <audio ref={audioRef} src={src} loop preload="none" />
    </div>
  );
}
