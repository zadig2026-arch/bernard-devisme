import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Revalidation à la demande, déclenchée par un webhook Sanity.
 *
 * À chaque publication de Bernard dans le Studio, Sanity envoie un POST ici.
 * On vérifie un secret partagé (`SANITY_REVALIDATE_SECRET`, transmis par le
 * webhook dans l'en-tête Authorization ou en query `?secret=`), puis on
 * invalide le tag « sanity ». Toutes les requêtes de contenu passent par
 * `sanityFetch` qui les étiquette avec ce tag (sanity/lib/fetch.ts), donc un
 * seul appel rafraîchit tout le site en quelques secondes. Sans ça, le site ne
 * se met à jour que par le cache de temps (revalidate 60s), peu fiable en prod.
 */
export async function POST(req: NextRequest) {
  const configured = process.env.SANITY_REVALIDATE_SECRET;
  if (!configured) {
    return new Response("Secret non configuré", { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const fromQuery = req.nextUrl.searchParams.get("secret") ?? "";
  const provided = bearer || fromQuery;

  if (provided !== configured) {
    return new Response("Secret invalide", { status: 401 });
  }

  revalidateTag("sanity", "max");

  return NextResponse.json({ revalidated: true });
}
