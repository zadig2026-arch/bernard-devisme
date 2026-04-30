import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="heading-display mt-4 text-5xl md:text-7xl">Page introuvable</h1>
      <p className="mt-4 text-[color:var(--color-ink-muted)]">
        La page que vous cherchez n&rsquo;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block border border-[color:var(--color-ink)] px-5 py-2.5 text-sm hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
      >
        Retour à l&rsquo;accueil
      </Link>
    </div>
  );
}
