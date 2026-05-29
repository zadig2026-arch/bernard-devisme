/**
 * Indication discrète de disponibilité d'une œuvre, à la demande de l'artiste.
 * Volontairement sobre : pas de prix ni de vocabulaire marchand.
 */
export function SaleBadge({
  status,
  variant = "light",
}: {
  status: "available" | "sold";
  variant?: "light" | "dark";
}) {
  const base = "inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em]";
  if (status === "sold") {
    const text = variant === "dark" ? "text-white/70" : "text-[color:var(--color-ink-muted)]";
    const dot = variant === "dark" ? "bg-white/70" : "bg-[color:var(--color-ink-muted)]";
    return (
      <span className={`${base} ${text}`}>
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        Œuvre vendue
      </span>
    );
  }
  const text = variant === "dark" ? "text-white" : "text-[color:var(--color-ink)]";
  const dot = variant === "dark" ? "bg-emerald-400" : "bg-emerald-600";
  return (
    <span className={`${base} ${text}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      Disponible
    </span>
  );
}
