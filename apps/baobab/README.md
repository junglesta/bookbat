# BAOBAB

The Astro static site / display component for the BOOK BAT library. Drop in a `library.json` and BAOBAB renders a searchable, sortable, filterable, exportable grid of books — no JavaScript framework runtime required at view time, no server, no database.

The sibling `BOOK BAT` app (`apps/bookbat`) is the editor: scan, organise, annotate, import/export. BAOBAB is the **publisher**: a public showcase of a curated library.

## Features

- Card and compact list view modes, swappable per visit
- Search across title, author, ISBN, publisher, and tags
- Sort by Recent, Title, Author, Publisher, Year, Rating with direction toggle
- Status filter tabs (All / To Read / Reading / Read) with live counts
- Language filter (auto-populated from the dataset)
- Expand-all / collapse-all control
- Per-book Share (Web Share API), Email (`mailto:`), and Copy-to-clipboard
- Cover thumbnails from Open Library with a service-worker thumb cache and idle-time prewarm
- Optional CSV / JSON / Goodreads / LibraryThing export
- Style switches via the page-level preview panel; component defaults in `src/config/bookbat-client.config.ts`

## Data source

BAOBAB reads from `src/data/library.json` (an auto-generated copy of the workspace seed `data/library.json`). Edit only `data/library.json` at the repo root — the sync script regenerates the per-app copy on every dev/build. See `.agents/skills/library-data-flow/SKILL.md` for the full rules.

## Commands (from the repo root)

```bash
pnpm dev:baobab           # dev server, seed dataset
pnpm dev:baobab:full      # dev server, full local dataset (data/library.full.json)
pnpm build:baobab         # production build using the seed
```

Or scoped through the workspace:

```bash
pnpm --filter @bookbat/baobab dev
pnpm --filter @bookbat/baobab build
```

## Data shape

```json
{
  "version": 1,
  "books": [
    {
      "id": "...",
      "title": "...",
      "authors": ["..."],
      "isbn13": "9780000000000",
      "publisher": "...",
      "publishYear": 1987,
      "pageCount": 149,
      "language": "eng",
      "status": "read",
      "rating": 4,
      "tags": ["..."],
      "synopsis": "...",
      "dateAdded": "2024-01-01T00:00:00.000Z",
      "dateRead": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Deploy

Netlify auto-deploys from `main` using `apps/baobab/netlify.toml`. The `ignore` script (`scripts/netlify-ignore-baobab.sh`) skips builds when only BOOKBAT files changed.

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md).
