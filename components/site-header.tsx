import Link from "next/link";

const NAV = [
  { href: "/oeuvres", label: "Œuvres" },
  { href: "/series", label: "Séries" },
  { href: "/expositions", label: "Expositions" },
  { href: "/journal", label: "Journal" },
  { href: "/parcours", label: "Parcours" },
  { href: "/regards", label: "Regards" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="container-page sticky top-0 z-30 backdrop-blur-md bg-[color:var(--color-paper)]/85">
      <div className="hairline-bottom flex items-baseline justify-between gap-6 py-5 border-b border-[color:var(--color-rule)]">
        <Link href="/" className="heading-display text-xl tracking-tight">
          Bernard Devisme
        </Link>
        <nav className="hidden md:block">
          <ul className="flex flex-wrap items-baseline gap-6 text-sm">
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
        <details className="md:hidden">
          <summary className="list-none cursor-pointer text-sm">Menu</summary>
          <ul className="absolute right-4 mt-3 flex flex-col gap-3 rounded-md border border-[color:var(--color-rule)] bg-[color:var(--color-paper)] p-4 text-sm shadow-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </header>
  );
}
