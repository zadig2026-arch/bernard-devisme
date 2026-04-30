import { ContactForm } from "./form";

export const metadata = {
  title: "Contact",
  description: "Contact, atelier, acquisition d'œuvre, demandes presse.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-16 md:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">Contact</p>
        <h1 className="heading-display mt-3 text-4xl md:text-6xl">Atelier &amp; représentation</h1>
        <p className="mt-6 prose-art text-[color:var(--color-ink-muted)]">
          Pour une visite d&rsquo;atelier, une acquisition, une exposition, une demande presse ou un projet
          d&rsquo;installation — écrivez-nous. Les demandes commerciales sont relayées à Bernadette,
          agente de l&rsquo;artiste.
        </p>
      </header>

      <div className="mt-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow">Atelier</p>
          <p className="heading-display mt-2 text-2xl italic">Nieul-les-Saintes</p>
          <p className="mt-2 text-[color:var(--color-ink-muted)]">
            17810 Nieul-les-Saintes
            <br />
            Charente-Maritime, France
          </p>
          <p className="mt-4">
            <a href="tel:+33630333271" className="underline underline-offset-4">
              06 30 33 32 71
            </a>
          </p>
          <p>
            <a href="mailto:bernarddevisme@orange.fr" className="underline underline-offset-4">
              bernarddevisme@orange.fr
            </a>
          </p>

          <p className="eyebrow mt-12">Représentation</p>
          <p className="mt-2">Bernadette — agente de l&rsquo;artiste.</p>
        </div>

        <div className="md:col-span-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
