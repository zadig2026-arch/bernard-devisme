import Link from "next/link";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";

type Settings = {
  agentInfo?: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    bio?: string;
  };
};

export const metadata = { title: "Agent" };

export default async function AgentPage() {
  const s = await sanityFetch<Settings>(settingsQuery, {}, {});
  const a = s.agentInfo ?? { name: "Bernadette", role: "Agente de l'artiste" };

  return (
    <div className="container-page py-16 md:py-20 max-w-3xl">
      <p className="eyebrow">Représentation</p>
      <h1 className="heading-display mt-3 text-4xl md:text-6xl italic">{a.name}</h1>
      <p className="mt-2 text-[color:var(--color-ink-muted)]">{a.role}</p>

      {a.bio && <p className="mt-8 prose-art">{a.bio}</p>}

      <div className="mt-10 border border-[color:var(--color-rule)] p-6">
        <p className="eyebrow">Contact direct</p>
        <dl className="mt-4 space-y-2 text-sm">
          {a.email && (
            <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
              <dt className="text-[color:var(--color-ink-muted)]">Email</dt>
              <dd>
                <a href={`mailto:${a.email}`} className="underline underline-offset-4">
                  {a.email}
                </a>
              </dd>
            </div>
          )}
          {a.phone && (
            <div className="flex justify-between border-b border-[color:var(--color-rule)] pb-2">
              <dt className="text-[color:var(--color-ink-muted)]">Téléphone</dt>
              <dd>{a.phone}</dd>
            </div>
          )}
        </dl>
        <Link
          href="/contact"
          className="mt-6 inline-block border border-[color:var(--color-ink)] px-4 py-2 text-sm hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)]"
        >
          Formulaire de contact
        </Link>
      </div>
    </div>
  );
}
