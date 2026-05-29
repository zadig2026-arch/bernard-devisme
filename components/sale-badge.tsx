/**
 * Indication discrète de disponibilité d'une œuvre, à la demande de l'artiste.
 * Volontairement sobre : pas de prix ni de vocabulaire marchand.
 */
export function SaleBadge({ status }: { status: "available" | "sold" }) {
  if (status === "sold") {
    return (
      <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[color:var(--color-ink-muted)]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-ink-muted)]" />
        Œuvre vendue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[color:var(--color-ink)]">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      Disponible
    </span>
  );
}
