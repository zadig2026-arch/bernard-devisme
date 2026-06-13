import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PersonJsonLd } from "../(jsonld)/person";

/**
 * Layout du site public : en-tête, contenu, pied de page. Le Studio (/studio)
 * est volontairement hors de ce groupe pour s'afficher seul, en plein écran.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PersonJsonLd />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
