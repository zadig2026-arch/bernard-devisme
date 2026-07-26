# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # local dev server on :3000 (also serves /studio)
npm run build        # production build (Next.js + embedded Sanity Studio)
npm run lint         # eslint via flat config (eslint.config.mjs)
```

After editing any file in `sanity/schemaTypes/`, redeploy the schema so MCP/queries see the change:

```bash
npx sanity@latest schema deploy
```

One-off migration / import scripts live in `scripts/` (run with `node scripts/<name>.mjs`). They read `.env.local` directly and require `SANITY_WRITE_TOKEN` in addition to the public env vars. `scrape.mjs` pulls content from the legacy e-monsite site (devismebernardpeintre.com); `import-to-sanity.mjs` pushes the scraped data into the dataset.

## Architecture

**Stack**: Next.js 16 (App Router, React 19, TS), Tailwind v4 via `@tailwindcss/postcss`, Sanity v5 with an embedded Studio at `/studio`, `next-sanity` 12.3.2 for GROQ.

**Sanity is the only content source.** `sanity/lib/fetch.ts` wraps every query with a 60s revalidate and — importantly — returns the caller-supplied fallback when `NEXT_PUBLIC_SANITY_PROJECT_ID` is missing or queries throw. This means pages render with empty states instead of crashing during build without credentials. Don't replace this with raw `client.fetch` unless you also handle that case.

**Schema types** (in `sanity/schemaTypes/`): `artwork`, `series`, `exhibition`, `journalEntry`, `press`, `page`, `siteSettings`. An `artwork` belongs to one `series` via reference; categories (Peinture / Sculpture / etc.) are NOT a Sanity type.

**Category → series**: membership lives in Sanity (`series.category`, editable by Bernard); `lib/categories.ts` only holds the historical *display order* inherited from the e-monsite, plus `albumNumber()`. Series titled "… album N" sort first in their category, N descending, so a new "peintures album 7" reaches the top on its own — don't re-add album slugs to the `slugs` lists. A series with no `category` falls into the "Autres" bucket. `getCategoryMeta` and `CATEGORY_IDS` are exported from `components/series-index.tsx` for routing use.

**Sub-series (groupes d'œuvres)**: a rubric can be split into titled groups. `series.subseries` is the ordered list (title + optional text); `artwork.subseries` stores the `_key` of its group and is edited through `SubseriesInput`, a radio list fed by the parent series. The series page renders one block per group, ungrouped works first, and the lightbox still walks the whole rubric. `scripts/harvest-legacy-texts-2026-07.mjs` + `apply-legacy-texts-2026-07.mjs` rebuilt these groups (and the rubric texts) from the Wayback Machine snapshots of the old e-monsite; the `PROTECTED` set in the apply script lists the rubrics Bernard wrote himself, never to be overwritten.

**Route discrimination at `/oeuvres/[slug]`**: a single dynamic segment handles both category pages (slug matches a `CATEGORY_IDS` value → renders `<SeriesIndex categoryId={...} />`) and individual artwork pages (slug matches a Sanity artwork → renders the detail view). This avoids a sibling-segment conflict with a separate `[category]` folder. `generateStaticParams` returns the union of both. Don't introduce an artwork slug that collides with a category id.

**Featured hero artwork**: driven by the `featured: boolean` flag on `artwork`. `homeQuery` filters by `featured == true`. To swap the hero, toggle the flag on the artworks (Sanity Studio or MCP) — there's no separate "featured" document.

**Site nav** (`components/site-header.tsx`): the top nav purposefully mirrors the original e-monsite's six rubrics (Peinture / Sculpture / Graphisme / Infographies / Livres-objets et plus / Parcours et CV). Expositions / Journal / Regards / Contact pages exist but are reachable only via internal links, not the top nav — this is deliberate per the artist's feedback ("voir la totalité des rubriques sans déroulant").

**Legacy URL redirects**: `next.config.ts` redirects old `/pages/...` paths from the e-monsite to their new equivalents. When restructuring routes, update this list to keep external links working.

**Sanity Studio** is mounted at `app/studio/[[...tool]]/page.tsx` and authenticates via the artist's `@orange.fr` email magic link. The studio runs inside the same Next.js app — `npm run build` produces both the public site and the Studio bundle.

## User-facing copy

This is the personal site of a 76-year-old painter, in French. Content is hand-written by Bernard. Don't introduce e-commerce / "marchand" language (prices, "Acquisition", "renseignements", etc.) — it has been explicitly stripped. Keep titles and metadata optional: many works have no title, and required fields beyond `images` are a friction point for the artist.
