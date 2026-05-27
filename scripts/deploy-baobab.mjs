#!/usr/bin/env node
/**
 * deploy:baobab — manual production deploy of the BAOBAB Astro site to
 * baobab.junglestar.org (Cloudflare Worker, static assets) with the FULL
 * local library (data/library.full.json).
 *
 * Why manual instead of git-integration: production ships data/library.full.json,
 * which is gitignored / local-only, so a CI build cannot reproduce it. This runs
 * from the maintainer's machine.
 *
 * What this does:
 *   1. Cleans + builds BAOBAB with the full dataset
 *   2. Runs `wrangler deploy` against apps/baobab/wrangler.jsonc
 *
 * Requires `wrangler login` (or CLOUDFLARE_API_TOKEN) beforehand.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const BAOBAB_CONFIG = 'apps/baobab/wrangler.jsonc';

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
    p.on('error', rej);
  });
}

console.log('▸ build BAOBAB with full library');
await run('pnpm', ['build:baobab:full'], { cwd: REPO_ROOT });

console.log('▸ wrangler deploy');
await run('wrangler', ['deploy', '-c', BAOBAB_CONFIG], { cwd: REPO_ROOT });
