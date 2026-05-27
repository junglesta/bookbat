---
name: build-deployment
description: Build scripts, deployment config, and troubleshooting for this Svelte 5 + Vite static client app
---

# Build and Deployment — Books Freedom

## Package Manager

**pnpm only.** Never npm or yarn.

Lock file: `pnpm-lock.yaml` — never commit `package-lock.json` or `yarn.lock`.

## Scripts

```bash
pnpm dev:bookbat      # Vite dev server (seed dataset)
pnpm format           # Biome format src/
pnpm lint             # Biome check src/
pnpm test             # Vitest (run once)
pnpm build:bookbat    # Production build to dist/bookbat
pnpm build:baobab     # Astro build to apps/baobab/dist
```

## Build Output

- BOOK BAT (Vite): root `src`, output `dist/bookbat`
- BAOBAB (Astro): output `apps/baobab/dist`
- BOOK BAT SPA fallback handled by `not_found_handling: single-page-application` in `apps/bookbat/wrangler.jsonc`
- The `Permissions-Policy: camera=(self)` header ships via a `_headers` file in each app's public dir

## Deployment — Cloudflare Workers (Static Assets)

Both apps are assets-only Workers (no server script). Config lives in each app's `wrangler.jsonc`; `custom_domain` routes attach the subdomains on the `junglestar.org` zone.

- **BOOK BAT** → `bat.junglestar.org`, auto-deploy on push to `main` via Cloudflare Workers Builds. Manual fallback: `pnpm deploy:bookbat`.
- **BAOBAB** → `baobab.junglestar.org`, manual `pnpm deploy:baobab` (ships the gitignored full dataset, so it cannot be built in CI).

Both manual paths require `wrangler login` (or `CLOUDFLARE_API_TOKEN`).

## Pre-Deploy Command Set

Run this sequence before deployment:

```bash
pnpm format && pnpm lint && pnpm test && pnpm build
```

## Troubleshooting

```bash
pnpm lint                   # Catch style/type issues first
pnpm test                   # Validate library behavior
pnpm build                  # Confirm production bundle generation
```

## Key Principles

1. **pnpm Only** — never npm or yarn
2. **Client-Only Static App** — no server runtime
3. **Test Before Build** — run tests before release build
4. **Biome + Vitest Gate** — lint/test/build all pass before deploy
