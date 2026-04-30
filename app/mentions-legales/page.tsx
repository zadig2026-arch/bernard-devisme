export const metadata = { title: "Mentions légales" };

export default function MentionsPage() {
  return (
    <div className="container-page py-16 md:py-20 max-w-2xl">
      <h1 className="heading-display text-4xl">Mentions légales</h1>
      <div className="mt-8 prose-art space-y-4">
        <p>
          <strong>Éditeur</strong> — Bernard Devisme, atelier 17810 Nieul-les-Saintes, France.
          Téléphone : 06 30 33 32 71. Email : bernarddevisme@orange.fr.
        </p>
        <p>
          <strong>Hébergement</strong> — Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
        </p>
        <p>
          <strong>Propriété intellectuelle</strong> — L&rsquo;ensemble des œuvres reproduites sur ce site
          (peintures, sculptures, dessins, photographies, textes) est la propriété exclusive de Bernard
          Devisme. Toute reproduction, même partielle, est interdite sans autorisation écrite.
        </p>
        <p>
          <strong>Données personnelles</strong> — Le formulaire de contact collecte uniquement les
          informations nécessaires au traitement de votre demande. Aucune donnée n&rsquo;est partagée
          avec des tiers.
        </p>
      </div>
    </div>
  );
}
