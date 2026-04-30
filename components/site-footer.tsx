import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="container-page mt-32 border-t border-[color:var(--color-rule)] py-10 text-sm text-[color:var(--color-ink-muted)]">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <p className="heading-display text-base text-[color:var(--color-ink)]">Atelier</p>
          <p className="mt-2">17810 Nieul-les-Saintes, Charente-Maritime</p>
          <p>06 30 33 32 71</p>
        </div>
        <div>
          <p className="heading-display text-base text-[color:var(--color-ink)]">Représentation</p>
          <p className="mt-2">Bernadette — agente</p>
          <Link href="/agent" className="underline-offset-4 hover:underline">En savoir plus</Link>
        </div>
        <div>
          <p className="heading-display text-base text-[color:var(--color-ink)]">© {new Date().getFullYear()}</p>
          <p className="mt-2">Tous droits réservés.</p>
          <Link href="/mentions-legales" className="underline-offset-4 hover:underline">Mentions légales</Link>
        </div>
      </div>
    </footer>
  );
}
