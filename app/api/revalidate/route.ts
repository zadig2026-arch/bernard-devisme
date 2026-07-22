import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

/**
 * Revalidation à la demande, déclenchée par un webhook Sanity.
 *
 * À chaque publication de Bernard dans le Studio, Sanity envoie un POST signé
 * ici. On vérifie la signature (secret partagé `SANITY_REVALIDATE_SECRET`) puis
 * on invalide le tag « sanity » : toutes les requêtes de contenu passent par
 * `sanityFetch` qui les étiquette avec ce tag (sanity/lib/fetch.ts), donc un
 * seul appel rafraîchit tout le site en quelques secondes. Sans ça, le site ne
 * se met à jour que par le cache de temps (revalidate 60s), peu fiable en prod.
 */
export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
    );

    if (!isValidSignature) {
      return new Response("Signature invalide", { status: 401 });
    }

    // Next 16 : le 2e argument « max » est requis (invalidation complète du tag).
    revalidateTag("sanity", "max");

    return NextResponse.json({
      revalidated: true,
      type: body?._type ?? null,
    });
  } catch (err) {
    console.error("[revalidate] échec:", (err as Error).message);
    return new Response((err as Error).message, { status: 500 });
  }
}
