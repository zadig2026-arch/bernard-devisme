"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vidéo des œuvres animées : le GIF et sa musique assemblés en MP4 synchronisé
 * (voir scripts/build-site-videos.mjs). Tente la lecture sonore directe,
 * autorisée quand elle suit le clic d'ouverture de l'œuvre ; si le navigateur
 * refuse (iOS notamment), la vidéo tourne en muet et le visiteur rend le son
 * via le bouton, comme avec l'ancien lecteur audio.
 */
export function AnimationVideo({
  src,
  variant = "light",
  className,
}: {
  src: string;
  variant?: "light" | "dark";
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    void video.play().catch(() => {
      // Autoplay sonore refusé : on joue en muet, le bouton rendra le son.
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => {});
    });
    return () => video.pause();
  }, [src]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) void video.play().catch(() => {});
  }

  const buttonClass =
    variant === "dark"
      ? "inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black"
      : "inline-flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] px-4 py-2 text-sm text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-ink)] hover:text-white";

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <video
        ref={videoRef}
        src={src}
        loop
        playsInline
        preload="auto"
        className="min-h-0 w-full flex-1 object-contain"
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={!muted}
        aria-label={muted ? "Écouter la musique" : "Couper la musique"}
        className={`mt-4 ${buttonClass}`}
      >
        <span aria-hidden className="text-base leading-none">
          {muted ? "▶" : "❚❚"}
        </span>
        <span>{muted ? "Écouter la musique" : "Couper la musique"}</span>
      </button>
    </div>
  );
}
