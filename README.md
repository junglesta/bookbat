

<a href="https://bat.junglestar.org">
  <img src="apps/bookbat/src/assets/startscreen.svg" alt="BOOK BAT" width="480">
</a>

> no account. no cloud. no tracking. scan it. shelve it. own your data.

<p>
  <a href="https://bat.junglestar.org"><img alt="BOOK BAT — live" src="https://img.shields.io/badge/BOOK_BAT-live-success?logo=cloudflare&logoColor=white"></a>
  <a href="https://baobab.junglestar.org"><img alt="BAOBAB — live" src="https://img.shields.io/badge/BAOBAB-live-success?logo=cloudflare&logoColor=white"></a>
  <a href="https://workers.cloudflare.com/"><img alt="Deploy: Cloudflare Workers" src="https://img.shields.io/badge/deploy-Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white"></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green.svg"></a>
</p>
<p>
  <a href="https://svelte.dev"><img alt="Svelte 5" src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white"></a>
  <a href="https://astro.build"><img alt="Astro 6" src="https://img.shields.io/badge/Astro-6-BC52EE?logo=astro&logoColor=white"></a>
  <a href="https://vite.dev"><img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white"></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white"></a>
  <a href="https://vitest.dev"><img alt="Vitest 4" src="https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white"></a>
  <a href="https://biomejs.dev"><img alt="Biome" src="https://img.shields.io/badge/Biome-2-60A5FA?logo=biome&logoColor=white"></a>
  <a href="https://pnpm.io"><img alt="pnpm 11" src="https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white"></a>
  <a href="https://web.dev/progressive-web-apps/"><img alt="PWA ready" src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white"></a>
</p>

## What This Repo Is

A two-headed library project:

- **`BOOK BAT`** (`apps/bookbat`) — a Svelte 5 app for **editing** your library: scan ISBN barcodes, organise, annotate, import / merge, export.
- **`BAOBAB`** (`apps/baobab`) — an Astro static site for **publishing** a library: searchable, sortable, filterable, exportable. Drop in JSON, get a public showcase.

The repo is fully client-side. No hosted app database. No user accounts. BOOK BAT keeps your library in browser `localStorage`; BAOBAB is build-time static. The shared library schema lives in `packages/library-core`.

## What BOOK BAT Does

- scan ISBN barcodes with camera or type ISBN manually
- fetch title, authors, publisher, cover, and other metadata
- backfill synopsis from book APIs when available
- organize books with status, rating, notes, tags, and language
- search, filter, and sort your library
- copy or share single-book info from the detail view
- export library data as JSON, CSV, Goodreads CSV, LibraryThing TSV, or Google Sheets webhook payload
- import library files and merge duplicate ISBNs safely
- work offline as a PWA

## What BAOBAB Does

- Card view (bento grid with covers) and compact list view; toggleable per visit
- Search across title / author / ISBN / publisher / tags — scoped to the active filter
- Sort by Recent, Title, Author, Publisher, Year, or Rating with direction toggle
- Status filter tabs (All / To Read / Reading / Read) with live counts
- Language filter, auto-populated from the dataset
- Expand-all / collapse-all control
- Per-book Share, Email, Copy-to-clipboard actions on each expanded card
- Optional CSV / JSON / Goodreads / LibraryThing export panel
- Open Library cover fetching with service-worker thumb cache + idle-time prewarm
- Configurable via `apps/baobab/src/config/bookbat-client.config.ts`; preview switches in the page header

## Import Merge Rules

Imports do not replace your whole library.

When you import a file:

- new ISBNs are appended as new books
- duplicate ISBNs are merged into the existing book
- personal fields are preserved and are not overwritten:
  - status
  - rating
  - notes
  - tags
  - date read
- missing metadata can be filled from the imported file:
  - authors when the current author is just `Unknown Author`
  - ISBN-10
  - publisher
  - publish date
  - publish year
  - page count
  - language
  - subjects
  - synopsis
  - cover URL

## Repo Structure

- `apps/bookbat` → `BOOK BAT` (the Svelte 5 + Vite app — scan, edit, organise, import/export)
- `apps/baobab` → `BAOBAB` (the Astro display site — public showcase of a curated library)
- `packages/library-core` → shared types and helpers
- `data/library.json` → **production seed** (small curated set, committed, what BOOK BAT ships to production)
- `data/library.full.json` → **full local dev dataset** (gitignored, your personal library)
- `data/library.dummy.json` → 3-book minimal set for tests / CI

Only the three files in `data/` are ever hand-edited. Each app has a per-app copy under `apps/*/library.json` that is auto-generated by `pnpm data:sync` and gitignored. See `.agents/skills/library-data-flow/SKILL.md` for full rules.

## Stack

- Svelte 5 (BOOK BAT)
- Astro 6 (BAOBAB)
- Vite 8
- TypeScript 6
- Vitest 4, jsdom
- Biome (format + lint)
- `html5-qrcode` (camera scanning)
- pnpm 11 (workspace / monorepo)
- Cloudflare Workers (static-assets hosting)

## Run Locally

```bash
pnpm install

# BOOK BAT (the editor)
pnpm dev:bookbat              # seed dataset (matches production)
pnpm dev:bookbat:full         # full local dataset

# BAOBAB (the display site)
pnpm dev:baobab               # seed dataset (matches production)
pnpm dev:baobab:full          # full local dataset
```

## HTTPS Dev For Camera Testing

```bash
pnpm certs:generate
pnpm dev:bookbat:https
```

Open `https://localhost:5173` or `https://<your-lan-ip>:5173`. Phone browsers may need to trust the local certificate before camera APIs behave as a secure context.

## Data Sync

```bash
pnpm data:sync           # source = data/library.json (seed)
pnpm data:sync:full      # source = data/library.full.json (full local)
pnpm data:sync:dummy     # source = data/library.dummy.json
pnpm data:apply ./my-export.json
```

Sync writes into the two destination files (gitignored, regenerated):

- `apps/bookbat/src/public/library.json` (BOOK BAT runtime fetch)
- `apps/baobab/src/data/library.json` (BAOBAB build-time import)

Expected shape:

```json
{ "version": 1, "books": [ /* … */ ] }
```

## Build

```bash
pnpm build:bookbat       # → dist/bookbat
pnpm build:baobab        # → apps/baobab/dist
```

## Quality Gates

```bash
pnpm format
pnpm lint
pnpm test
pnpm build
pnpm preflight           # full pre-release checklist (BOOK BAT)
```

## Deployment (Cloudflare Workers)

Both sites are static and served from **Cloudflare Workers with Static Assets** (assets-only Workers, no server script). The zone `junglestar.org` is on Cloudflare; each Worker attaches its subdomain via a `custom_domain` route declared in its `wrangler.jsonc`. The `_headers` file in each public dir carries the `Permissions-Policy: camera=(self)` header.

### BOOK BAT — auto-deploy via Workers Builds

`bat.junglestar.org`. Ships the committed seed (`data/library.json`), so it auto-deploys on push to `main` through Cloudflare Workers Builds (git integration). Config: `apps/bookbat/wrangler.jsonc` (`not_found_handling: single-page-application` for SPA routing).

Workers Builds settings:

- Root directory: repo root
- Build command: `pnpm install --frozen-lockfile && pnpm build:bookbat`
- Deploy command: `npx wrangler deploy -c apps/bookbat/wrangler.jsonc`
- Build watch paths: `apps/bookbat/**`, `packages/library-core/**`, `data/**`, `scripts/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`

Manual fallback: `pnpm deploy:bookbat` (requires `wrangler login`).

### BAOBAB — manual deploy

`baobab.junglestar.org`. Production ships the **full local library** (`data/library.full.json`), which is gitignored, so it can't be reproduced by CI — it is deployed from the maintainer's machine:

```bash
pnpm deploy:baobab        # builds with the full dataset, then wrangler deploy
```

Config: `apps/baobab/wrangler.jsonc`. Requires `wrangler login` (or `CLOUDFLARE_API_TOKEN`).

## Changelogs

- `CHANGELOG.md` (this directory) → BOOK BAT
- `apps/baobab/CHANGELOG.md` → BAOBAB

## Product URLs

- `BOOK BAT`: [https://bat.junglestar.org](https://bat.junglestar.org)
- `BAOBAB`: [https://baobab.junglestar.org](https://baobab.junglestar.org)

## License

[MIT](./LICENSE)

## Commercial

For SDK or commercial use, contact **info@junglestar.org**.
