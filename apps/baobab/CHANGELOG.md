# BAOBAB Changelog

Changelog for the `@bookbat/baobab` Astro display component. The sibling BOOK BAT webapp has its own changelog at the repo root (`/CHANGELOG.md`).

## 0.2.0 — 2026-05-20

- Renamed package from `@bookbat/astro-site` to `@bookbat/baobab` and moved directory from `apps/astro-site` to `apps/baobab`. Updated workspace scripts (`pnpm dev:baobab`, `pnpm build:baobab`), Netlify configs, and ignore scripts accordingly
- Added compact list view with toggleable card / list segmented control; list mode is now the default
- Added status filter tabs (All / To Read / Reading / Read) with live per-status counts
- Added Language filter (dropdown auto-populated from the dataset, with "(unspecified)" bucket)
- Extended sort options with Recent (by `dateAdded`) and Rating
- Added Expand all / Collapse all control above the list, with live state sync from individual card toggles
- Added per-book Share (Web Share API), Email (`mailto:` with subject = title), and Copy book info actions in each expanded card
- Added Synopsis rendering at the bottom of each expanded detail panel; long unbroken text now wraps correctly via `overflow-wrap: anywhere`
- Added cover thumbnail to the expanded detail panel in list mode so covers stay accessible when collapsed
- Hardened cover loading: removed `?default=false` from the Open Library URL (avoids 404s being cached as opaque entries in the service worker), detect 1×1 transparent placeholders via `naturalWidth`, and added load/error handlers to the detail-panel cover. Bumped thumb cache to `v3` so previously poisoned entries get evicted
- Raised idle-time cover prewarm cap to 500 entries for larger libraries
- Added `astro dev --open` so the dev server opens the browser automatically
- Layout polish: filter row puts status tabs + language + view toggle + expand toggle on a single line; status-tab count number is larger and lighter

## 0.1.1

- Polished footer copy and structure: clearer BAOBAB / BOOK BAT wording, improved line grouping, cleaner section flow
- Added version tags next to footer brand names and removed the redundant standalone version row
- Repositioned gray divider; moved BAOBAB-specific `data/library.json` usage guidance into the BAOBAB section
- Clarified footer attribution and links (`baobab.junglestar.org`, `junglestar.org`, repo, license)

## 0.1.0

- Initial Astro client scaffold with search / sort / book detail view
- Thumbnail service-worker caching for Open Library covers
- Configuration defaults in `src/config/bookbat-client.config.ts` (header/footer/export/load/unstyled toggles)
- Page-level preview controls to simulate component config from the frontend
- Export panel (JSON / CSV / Goodreads / LibraryThing) moved into its own standalone section below the grid
