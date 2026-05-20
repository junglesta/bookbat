---
name: preflight
description: Pre-deploy checklist for this static client app: format, lint, test, build, optional preview, version bump, changelog. Stops before commit.
---

# Preflight

Pre-deploy checklist for this repo (client-only static build). Run this before every production push.

## Monorepo Release Target (required first step)

Before running anything, identify release target:

- `bookbat` release (BOOKBAT app, Svelte/Vite): bump
  - `apps/bookbat/package.json`
  - `CHANGELOG.md` (root — this is the BOOKBAT changelog) with `0.8.x` entry
- `baobab` release (BAOBAB Astro component): bump
  - `apps/baobab/package.json`
  - do **not** bump `apps/bookbat/package.json` or root `CHANGELOG.md`
  - update `apps/baobab/CHANGELOG.md` instead

If user says only BAOBAB/Astro changed, treat it as `baobab` release by default.

## Steps

1. **Format** — `pnpm format`
2. **Lint** — `pnpm lint`
3. **Test** — `pnpm test`
4. **Build** — `pnpm build`
5. **Version bump** — update version only for selected release target package(s)
6. **Changelog** — update `CHANGELOG.md` with a short entry that matches selected target
7. **Stop** — report results and propose commit message. Do NOT commit or push. Wait for human approval.

## Commit message format

```
3.5.7 | PWA installability
```

Keep it short. Version number, pipe, what changed.

## Notes

- Always use `pnpm`, never npm/yarn
- This repo is static client-side (no Hono/server deploy checks in preflight)
- If `pnpm build` fails, re-run `pnpm test` and `pnpm build` separately and report the first failing command
- Check Netlify deploy status after push at the deploy_check URL
- Never bump `bookbat` version for BAOBAB-only copy/style changes (and vice versa)
