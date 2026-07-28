import { buildLegacyTheme } from "sanity";

/**
 * Thème du Studio, calqué sur les couleurs du site (papier crème, encre,
 * terre de sienne).
 *
 * Demande de Bernard, 29/07/2026 : « la fenêtre de travail est très blanche et
 * j'ai un peu de mal à me repérer ». Le Studio par défaut empile des panneaux
 * blancs sur fond blanc, sans limite franche entre eux.
 *
 * On reste en thème CLAIR — à 76 ans, une bascule en sombre serait un
 * dépaysement de plus — mais :
 *  - le fond des panneaux passe du blanc pur au papier du site, donc les
 *    zones se distinguent ;
 *  - les gris sont réchauffés, ce qui épaissit visuellement les séparations ;
 *  - la barre du haut passe en encre foncée : un repère fixe, toujours au
 *    même endroit ;
 *  - la sélection et le focus prennent la terre de sienne du site, bien plus
 *    lisible que le bleu par défaut sur ce fond.
 *
 * `buildLegacyTheme` est l'API publique de personnalisation du Studio. Elle
 * est annoncée dépréciée pour une version majeure future : si elle disparaît,
 * refaire ces réglages avec le thème natif plutôt que de les abandonner.
 */

const PAPER = "#faf9f6";
const INK = "#111110";
const ACCENT = "#8a3a1e";

export const studioTheme = buildLegacyTheme({
  "--black": INK,
  "--white": "#ffffff",

  // Fond des panneaux et des champs : le papier du site, pas du blanc pur.
  "--component-bg": PAPER,
  "--component-text-color": INK,

  // Gris réchauffés : bordures et libellés se détachent mieux sur le papier.
  "--gray-base": "#75706a",
  "--gray": "#75706a",

  // Barre du haut en encre : le repère fixe de l'écran.
  "--main-navigation-color": INK,
  "--main-navigation-color--inverted": PAPER,

  // Sélection, boutons et anneau de focus dans la couleur d'accent du site.
  "--brand-primary": ACCENT,
  "--focus-color": ACCENT,
  "--default-button-primary-color": ACCENT,
});
