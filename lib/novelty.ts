/**
 * Signal « nouveautés » pour le visiteur (demande de Bernard, 26/10/2026 :
 * sur l'ancien e-monsite, le mot « news » s'affichait sur une rubrique qui
 * venait de recevoir des images).
 *
 * Une œuvre est « nouvelle » pendant NEW_DAYS jours après sa création dans le
 * Studio (`_createdAt`). Rien à cocher ni à décocher pour Bernard : le signal
 * apparaît tout seul quand il charge des images et s'éteint tout seul après.
 *
 * Le même seuil sert côté GROQ (compter les œuvres récentes d'une rubrique)
 * et côté React (marquer les vignettes dans la rubrique).
 */
export const NEW_DAYS = 30;

/** Fragment GROQ : filtre sur les œuvres créées il y a moins de NEW_DAYS jours. */
export const RECENT_ARTWORK_FILTER = `dateTime(_createdAt) > dateTime(now()) - 60*60*24*${NEW_DAYS}`;

export function isRecent(createdAt?: string, now: Date = new Date()): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t < NEW_DAYS * 24 * 60 * 60 * 1000;
}
