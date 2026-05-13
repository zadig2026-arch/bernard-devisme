import Link from "next/link";

const NAV = [
  { href: "/oeuvres/peinture", label: "Peinture" },
  { href: "/oeuvres/sculpture", label: "Sculpture" },
  { href: "/oeuvres/graphisme", label: "Graphisme" },
  { href: "/oeuvres/infographies", label: "Infographies" },
  { href: "/oeuvres/livres-objets", label: "Livres-objets et plus" },
  { href: "/parcours", label: "Parcours et CV" },
];

export function SiteHeader() {
  return (
    <header className="container-page sticky top-0 z-30 backdrop-blur-md bg-[color:var(--color-paper)]/85">
      <div className="flex flex-col gap-3 py-5 border-b border-[color:var(--color-rule)] sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <Link href="/" className="heading-display text-xl tracking-tight">
          Bernard Devisme
        </Link>
        <nav>
          <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition-colors"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
