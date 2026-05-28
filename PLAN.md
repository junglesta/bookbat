# PLAN

Working doc for in-flight and upcoming work. History lives in `CHANGELOG.md` / `apps/baobab/CHANGELOG.md`.

## Status — 2026-05-28

**Netlify → Cloudflare Workers migration: complete.**

- Both sites live on Cloudflare Workers (assets-only):
  - BOOK BAT → `bat.junglestar.org` — auto-deploys on push to `main` via **Workers Builds** (CI verified working).
  - BAOBAB → `baobab.junglestar.org` — manual `pnpm deploy:baobab` (ships the gitignored full library).
- DNS cut over via `custom_domain` routes; **Netlify fully decommissioned** (both sites deleted, no GitHub webhooks).
- Cloudflare Web Analytics on BAOBAB only; BOOK BAT intentionally untracked.
- Releases cut: `bookbat/v0.9.1`, `baobab/v0.4.2`.
- Issue #3 (scan → View in Library scroll) fixed + deployed.

## TODO — next

1. **Tighten the Cloudflare deploy token (least privilege + expiry).**
   CI + manual deploys currently use an over-scoped `Edit Cloudflare Workers` token (All zones, no expiry). Create a minimal **`junglestar-workers-deploy`** token:
   - `Account → Workers Scripts → Edit`
   - `Zone → Workers Routes → Edit`
   - `Account → Account Settings → Read`
   - Resources: Rokma account + `junglestar.org` zone · set a 90-day expiry

   Then: select it in **bookbat → Settings → Build → API token**, save it to the local deploy-token file, and delete the over-scoped `Edit Cloudflare Workers` token. Keep `shaman-blog build token` (other project). The Global API Key / Origin CA Key are built-in legacy keys — never use them.

2. **`favicon.svg`** — finish editing the BOOK BAT icon, then commit `apps/bookbat/src/public/favicon.svg`. (Re-minify before committing; the current working-tree copy is an un-minified Adobe export.)

3. *Optional:* visually verify the #3 scroll fix in a browser; confirm Workers Builds watch-path gating (a non-bookbat change to `main` should not trigger a bookbat build).
