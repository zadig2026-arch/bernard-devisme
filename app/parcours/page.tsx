import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/fetch";

export const metadata = { title: "Parcours" };

type Repere = { year?: string; body?: string };
type Parcours = { intro?: string; reperes?: Repere[]; demarche?: string };

const parcoursQuery = groq`*[_type == "parcours"][0]{ intro, reperes, demarche }`;

// Contenu de secours (affiché si le document n'est pas encore renseigné dans
// le CMS) — repris de la version d'origine pour ne jamais laisser la page vide.
const FALLBACK: Parcours = {
  intro:
    "Né en 1947. Diplômé des Beaux-Arts de Paris en 1970 (mention très bien), après quatre années dans les ateliers d’Étienne Martin, Robert Couturier, César et Collamarini.",
  reperes: [
    { year: "1970", body: "Diplôme des Beaux-Arts de Paris, mention très bien." },
    { year: "1970–", body: "Expositions et installations in situ, collectives et personnelles, en France et à l'étranger." },
    { year: "1972–2007", body: "Professeur d'Arts Plastiques et d'Infographie à l'École Alsacienne, Paris (35 ans)." },
    { year: "1984–1991", body: "Dessins de presse pour L'Écho Républicain (Chartres)." },
    { year: "1988–1990", body: "Co-directeur de la galerie Art Libre à Rambouillet." },
    { year: "1990–1992", body: "Directeur de l'espace d'art contemporain Confluences." },
    { year: "1990s–", body: "La Divine Comédie de Dante nourrit l'œuvre depuis sa relecture." },
    { year: "2007", body: "Installation en Vendée." },
    { year: "2008–2017", body: "Dessins de presse pour Ouest-France (Fontenay-le-Comte)." },
    { year: "2016", body: "Installation de l'atelier en Charente-Maritime, à Nieul-les-Saintes." },
  ],
  demarche:
    "L’œuvre fusionne depuis 1970 des tendances diverses — du figuratif à l’hyperréalisme, en passant par l’abstrait. Le cœur du travail est la condition humaine, ses contradictions, ses aberrations.\n\nLes séries (Siamoiserie, Humanoïdes, Cageots, Truelles, Greffes, Xynthia, Charnier / Mémoires englouties, Ouroboros, Antiportraits, Pariétal, Danse des ténèbres, Gribouillage génétique, Livres-objets) déploient une grammaire commune : agglomérats, recouvrements, coulures, dripping, code-barre, archéologies de surface.",
};

function paragraphs(text?: string): string[] {
  return (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export default async function ParcoursPage() {
  const data = (await sanityFetch<Parcours | null>(parcoursQuery, {}, FALLBACK)) ?? FALLBACK;
  const intro = data.intro?.trim() ? data.intro : FALLBACK.intro;
  const reperes = data.reperes?.length ? data.reperes : FALLBACK.reperes!;
  const demarche = data.demarche?.trim() ? data.demarche : FALLBACK.demarche;

  return (
    <div className="container-page py-16 md:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Parcours</p>
        <h1 className="heading-display mt-3 text-3xl md:text-5xl">Bernard Devisme</h1>
        {paragraphs(intro).map((p, i) => (
          <p key={i} className="mt-6 prose-art text-[color:var(--color-ink-muted)]">
            {p}
          </p>
        ))}
      </header>

      {reperes.length > 0 && (
        <section className="mt-16 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Repères</p>
          </div>
          <ol className="md:col-span-8 space-y-8 border-l border-[color:var(--color-rule)] pl-6">
            {reperes.map((r, i) => (
              <Item key={i} year={r.year} body={r.body} />
            ))}
          </ol>
        </section>
      )}

      {paragraphs(demarche).length > 0 && (
        <section className="mt-20 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Démarche</p>
          </div>
          <div className="md:col-span-8 prose-art">
            {paragraphs(demarche).map((p, i) => (
              <p key={i} className={i > 0 ? "mt-4" : undefined}>
                {p}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Item({ year, body }: { year?: string; body?: string }) {
  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute -left-[31px] top-2 h-2 w-2 rounded-full bg-[color:var(--color-ink)]"
      />
      {year && <p className="eyebrow">{year}</p>}
      {body && <p className="mt-1">{body}</p>}
    </li>
  );
}
