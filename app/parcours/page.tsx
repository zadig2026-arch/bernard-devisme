export const metadata = { title: "Parcours" };

export default function ParcoursPage() {
  return (
    <div className="container-page py-16 md:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Parcours</p>
        <h1 className="heading-display mt-3 text-4xl md:text-6xl">Bernard Devisme</h1>
        <p className="mt-6 prose-art text-[color:var(--color-ink-muted)]">
          Né en 1947. Diplômé des Beaux-Arts de Paris en 1970 (mention très bien), après quatre années
          dans les ateliers d&rsquo;Étienne Martin, Robert Couturier, César et Collamarini.
        </p>
      </header>

      <section className="mt-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="eyebrow">Repères</p>
        </div>
        <ol className="md:col-span-8 space-y-8 border-l border-[color:var(--color-rule)] pl-6">
          <Item year="1970" body="Diplôme des Beaux-Arts de Paris, mention très bien." />
          <Item year="1970–" body="Expositions et installations in situ, collectives et personnelles, en France et à l'étranger." />
          <Item year="1972–2007" body="Professeur d'Arts Plastiques et d'Infographie à l'École Alsacienne, Paris (35 ans)." />
          <Item year="1984–1991" body="Dessins de presse pour L'Écho Républicain (Chartres)." />
          <Item year="1988–1990" body="Co-directeur de la galerie Art Libre à Rambouillet." />
          <Item year="1990–1992" body="Directeur de l'espace d'art contemporain Confluences." />
          <Item year="1990s–" body="La Divine Comédie de Dante nourrit l'œuvre depuis sa relecture." />
          <Item year="2007" body="Installation en Vendée." />
          <Item year="2008–2017" body="Dessins de presse pour Ouest-France (Fontenay-le-Comte)." />
          <Item year="2016" body="Installation de l'atelier en Charente-Maritime, à Nieul-les-Saintes." />
        </ol>
      </section>

      <section className="mt-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="eyebrow">Démarche</p>
        </div>
        <div className="md:col-span-8 prose-art">
          <p>
            L&rsquo;œuvre fusionne depuis 1970 des tendances diverses — du figuratif à l&rsquo;hyperréalisme,
            en passant par l&rsquo;abstrait. Le cœur du travail est la condition humaine, ses
            contradictions, ses aberrations.
          </p>
          <p className="mt-4">
            Les séries (<em>Siamoiserie</em>, <em>Humanoïdes</em>, <em>Cageots</em>, <em>Truelles</em>,
            <em> Greffes</em>, <em>Xynthia</em>, <em>Charnier / Mémoires englouties</em>, <em>Ouroboros</em>,
            <em> Antiportraits</em>, <em>Pariétal</em>, <em>Danse des ténèbres</em>, <em>Gribouillage
            génétique</em>, <em>Livres-objets</em>) déploient une grammaire commune : agglomérats,
            recouvrements, coulures, dripping, code-barre, archéologies de surface.
          </p>
        </div>
      </section>
    </div>
  );
}

function Item({ year, body }: { year: string; body: string }) {
  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[31px] top-2 h-2 w-2 rounded-full bg-[color:var(--color-ink)]"
      />
      <p className="eyebrow">{year}</p>
      <p className="mt-1">{body}</p>
    </li>
  );
}
