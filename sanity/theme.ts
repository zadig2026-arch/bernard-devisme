import { buildLegacyTheme } from "sanity";

/**
 * Lisibilité du Studio — demande de Bernard du 08/08/2026 :
 *
 *   « dans les pages de fabrication, les "icones" (+ ou … etc) sont très peu
 *     visibles. Il y a peu de cases colorées qui ressortent, la police est
 *     fine… Est-il possible de rendre plus visible les différentes fonctions ? »
 *
 * Attention à ne pas refaire l'erreur du 29/07 : on lui avait alors proposé un
 * fond papier crème, et il a répondu le 01/08 « je conserve l'affichage blanc ».
 * Le FOND RESTE DONC BLANC. Ce qu'on change ici, ce sont les COMMANDES : leur
 * couleur, leur contraste et leur contour, pour qu'un bouton se voie comme un
 * bouton. Les tailles de police et d'icônes sont traitées à côté, dans
 * `app/studio/lisibilite.css` (le thème ne gère que les couleurs).
 *
 * `buildLegacyTheme` est l'API publique de personnalisation. Elle est annoncée
 * dépréciée pour une future version majeure : si elle disparaît, refaire ces
 * réglages avec le thème natif plutôt que de les abandonner.
 */

const ENCRE = "#111110";
const ACCENT = "#8a3a1e"; // la terre de sienne du site

export const studioTheme = buildLegacyTheme({
  "--black": ENCRE,
  "--white": "#ffffff",

  // Fond blanc, texte franchement noir : c'est le contraste du TEXTE qui
  // répond au « la police est fine », pas un changement de fond.
  "--component-bg": "#ffffff",
  "--component-text-color": ENCRE,

  // Les gris par défaut du Studio sont très clairs : libellés et bordures s'y
  // effacent. On les assombrit pour que les séparations et les intitulés
  // secondaires restent lisibles sur du blanc.
  "--gray-base": "#5c5c5c",
  "--gray": "#5c5c5c",

  // La barre du haut devient un repère fixe et franc.
  "--main-navigation-color": ENCRE,
  "--main-navigation-color--inverted": "#ffffff",

  // Les commandes prennent la couleur du site : un « + », un « Publier » ou une
  // sélection deviennent des zones colorées, ce qu'il demande explicitement.
  "--brand-primary": ACCENT,
  "--focus-color": ACCENT,
  "--default-button-primary-color": ACCENT,
  "--default-button-success-color": ACCENT,
});
