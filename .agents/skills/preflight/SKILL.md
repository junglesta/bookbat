---
name: preflight
description: Pre-deploy checklist for this static client app: format, lint, test, build, optional preview, version bump, changelog. Stops before commit.
---

# Preflight

Pre-deploy checklist for this repo (client-only static build). Run this before every production push.

## Monorepo Release Target (required first step)

Before running anything, identify release target:

- `webapp` release (BOOKBAT app): bump
  - `apps/webapp/package.json`
  - root `package.json` (workspace version mirror)
  - `CHANGELOG.md` with `0.8.x` entry
- `astro-site` release (BAOBAB component): bump
  - `apps/astro-site/package.json`
  - do **not** bump `apps/webapp/package.json`
  - do **not** bump root `package.json`
  - `CHANGELOG.md` entry must clearly say Astro/BAOBAB release (for example `0.1.x`)

If user says only BAOBAB/Astro changed, treat it as `astro-site` release by default.

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
- Never bump `webapp`/root version for Astro-only copy/style changes
