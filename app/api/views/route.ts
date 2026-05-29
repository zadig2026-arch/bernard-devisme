import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";

export const dynamic = "force-dynamic";

const token = process.env.SANITY_WRITE_TOKEN;

// Client serveur uniquement (le token n'est jamais exposé au navigateur).
const writeClient =
  projectId && token
    ? createClient({ projectId, dataset, apiVersion, token, useCdn: false })
    : null;

async function settingsId(): Promise<string | null> {
  if (!writeClient) return null;
  return writeClient.fetch<string | null>(`*[_type == "siteSettings"][0]._id`);
}

export async function GET() {
  if (!writeClient) return Response.json({ count: null });
  const count = await writeClient.fetch<number | null>(
    `*[_type == "siteSettings"][0].visitCount`,
  );
  return Response.json({ count: count ?? 0 });
}

export async function POST() {
  if (!writeClient) return Response.json({ count: null });
  const id = await settingsId();
  if (!id) return Response.json({ count: null });
  try {
    const updated = await writeClient
      .patch(id)
      .setIfMissing({ visitCount: 0 })
      .inc({ visitCount: 1 })
      .commit({ autoGenerateArrayKeys: false });
    return Response.json({ count: (updated as { visitCount?: number }).visitCount ?? null });
  } catch {
    return Response.json({ count: null });
  }
}
